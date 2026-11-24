package auth

import (
	"context"
	"crypto/rsa"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/sync/singleflight"
)

// OIDCValidator validates JWT tokens against an OIDC provider
type OIDCValidator struct {
	httpClient  *http.Client
	jwks        *JWKS
	issuer      string
	audience    string
	userinfoURL string
	jwksURL     string
	jwksMutex   sync.RWMutex
	// minRefresh rate-limits forced JWKS refetches triggered by unknown kids
	minRefresh time.Duration
	// lastAttempt is stamped on every JWKS fetch, failed or not, so a down
	// provider is not hammered by unknown-kid tokens
	lastAttempt time.Time
	lastFailed  bool
	// fetches collapses concurrent downloads; callers without keys wait on it
	fetches singleflight.Group
}

// JWKS represents a JSON Web Key Set
type JWKS struct {
	FetchedAt time.Time `json:"-"`
	Keys      []JWK     `json:"keys"`
}

// JWK represents a JSON Web Key
type JWK struct {
	Kid string   `json:"kid"`
	Kty string   `json:"kty"`
	Alg string   `json:"alg"`
	Use string   `json:"use"`
	N   string   `json:"n"`
	E   string   `json:"e"`
	X5c []string `json:"x5c,omitempty"`
}

// OIDCDiscoveryDocument represents the OIDC discovery document
type OIDCDiscoveryDocument struct {
	Issuer                string `json:"issuer"`
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
	UserinfoEndpoint      string `json:"userinfo_endpoint"`
	JwksURI               string `json:"jwks_uri"`
	EndSessionEndpoint    string `json:"end_session_endpoint,omitempty"`
}

// OIDCConfig holds OIDC configuration
type OIDCConfig struct {
	// IssuerURL is the OIDC issuer URL (e.g., https://auth.example.com)
	IssuerURL string

	// Audience is the expected audience claim (usually the client ID)
	Audience string

	// SkipIssuerValidation skips issuer validation (not recommended for production)
	SkipIssuerValidation bool

	// InsecureSkipVerify skips TLS certificate verification (only for development!)
	InsecureSkipVerify bool
}

// NewOIDCValidator creates a new OIDC JWT validator
func NewOIDCValidator(cfg *OIDCConfig) (*OIDCValidator, error) {
	if cfg.IssuerURL == "" {
		return nil, fmt.Errorf("OIDC issuer URL is required")
	}
	if cfg.Audience == "" {
		return nil, fmt.Errorf("OIDC audience is required")
	}

	// Create HTTP client with optional TLS config
	httpClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Add insecure TLS config if requested (development only!)
	if cfg.InsecureSkipVerify {
		httpClient.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	}

	validator := &OIDCValidator{
		issuer:     strings.TrimSuffix(cfg.IssuerURL, "/"),
		audience:   cfg.Audience,
		httpClient: httpClient,
		minRefresh: 30 * time.Second,
	}

	// Discover JWKS URL from OIDC discovery document
	if err := validator.discoverJWKS(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to discover OIDC configuration: %w", err)
	}
	if err := validator.fetchJWKS(context.Background(), false); err != nil {
		log.Printf("[OIDC] Initial JWKS fetch failed, retrying on first request: %v", err)
	}

	return validator, nil
}

// discoverJWKS fetches the OIDC discovery document and extracts the JWKS URL
func (o *OIDCValidator) discoverJWKS(ctx context.Context) error {
	discoveryURL := o.issuer + "/.well-known/openid-configuration"

	req, err := http.NewRequestWithContext(ctx, "GET", discoveryURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create discovery request: %w", err)
	}

	resp, err := o.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to fetch discovery document: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("discovery document returned status %d", resp.StatusCode)
		}
		return fmt.Errorf("discovery document returned status %d: %s", resp.StatusCode, string(body))
	}

	var doc OIDCDiscoveryDocument
	if err := json.NewDecoder(resp.Body).Decode(&doc); err != nil {
		return fmt.Errorf("failed to decode discovery document: %w", err)
	}

	o.jwksURL = doc.JwksURI
	o.userinfoURL = doc.UserinfoEndpoint
	log.Printf("[OIDC] Discovered endpoints - JWKS: %s, Userinfo: %s", o.jwksURL, o.userinfoURL)
	return nil
}

// fetchJWKS fetches the JSON Web Key Set from the OIDC provider. With force,
// the cache is bypassed unless a fetch was attempted within minRefresh.
// Concurrent callers share one download; cached-key lookups never wait on a
// forced refetch. Without keys, only a recent failed attempt is rate-limited.
func (o *OIDCValidator) fetchJWKS(ctx context.Context, force bool) error {
	o.jwksMutex.Lock()
	haveKeys := o.jwks != nil
	if haveKeys && !force && time.Since(o.jwks.FetchedAt) < 5*time.Minute {
		o.jwksMutex.Unlock()
		return nil
	}
	if time.Since(o.lastAttempt) < o.minRefresh {
		if haveKeys {
			o.jwksMutex.Unlock()
			return nil
		}
		if o.lastFailed {
			o.jwksMutex.Unlock()
			return fmt.Errorf("JWKS fetch rate-limited after recent failure")
		}
	}
	o.jwksMutex.Unlock()

	_, err, _ := o.fetches.Do("jwks", func() (interface{}, error) {
		o.jwksMutex.Lock()
		o.lastAttempt = time.Now()
		o.jwksMutex.Unlock()
		jwks, err := o.downloadJWKS(ctx)
		o.jwksMutex.Lock()
		defer o.jwksMutex.Unlock()
		o.lastFailed = err != nil
		if err == nil {
			o.jwks = jwks
		}
		return nil, err
	})
	if err != nil && haveKeys && !force {
		log.Printf("[OIDC] JWKS refresh failed, using cached keys: %v", err)
		return nil
	}
	return err
}

func (o *OIDCValidator) downloadJWKS(ctx context.Context) (*JWKS, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", o.jwksURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create JWKS request: %w", err)
	}

	resp, err := o.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("JWKS returned status %d: %s", resp.StatusCode, string(body))
	}

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("failed to decode JWKS: %w", err)
	}

	jwks.FetchedAt = time.Now()
	return &jwks, nil
}

// getKey retrieves the signing key for a given key ID, refetching the JWKS
// at most once when the kid is unknown.
func (o *OIDCValidator) getKey(ctx context.Context, kid string) (*JWK, error) {
	if err := o.fetchJWKS(ctx, false); err != nil {
		return nil, err
	}
	if key := o.findKey(kid); key != nil {
		return key, nil
	}
	if err := o.fetchJWKS(ctx, true); err != nil {
		return nil, err
	}
	if key := o.findKey(kid); key != nil {
		return key, nil
	}
	return nil, fmt.Errorf("key with kid %s not found in JWKS", kid)
}

func (o *OIDCValidator) findKey(kid string) *JWK {
	o.jwksMutex.RLock()
	defer o.jwksMutex.RUnlock()
	if o.jwks == nil {
		return nil
	}
	for _, key := range o.jwks.Keys {
		if key.Kid == kid {
			return &key
		}
	}
	return nil
}

// ValidateSession validates a JWT token (implements SessionValidator interface)
func (o *OIDCValidator) ValidateSession(ctx context.Context, tokenString string) (*Identity, error) {
	return o.validateToken(ctx, tokenString)
}

// ValidateSessionFromCookie validates a JWT token from a cookie
func (o *OIDCValidator) ValidateSessionFromCookie(ctx context.Context, cookieValue string) (*Identity, error) {
	return o.validateToken(ctx, cookieValue)
}

// validateToken parses and validates a JWT token
func (o *OIDCValidator) validateToken(ctx context.Context, tokenString string) (*Identity, error) {
	if tokenString == "" {
		log.Printf("[OIDC] Token validation failed: empty token")
		return nil, ErrInvalidSession
	}

	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			log.Printf("[OIDC] Token validation failed: unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Get the key ID
		kid, ok := token.Header["kid"].(string)
		if !ok {
			log.Printf("[OIDC] Token validation failed: missing kid header")
			return nil, fmt.Errorf("token missing kid header")
		}

		// Get the signing key
		jwk, err := o.getKey(ctx, kid)
		if err != nil {
			log.Printf("[OIDC] Token validation failed: key lookup error for kid=%s: %v", kid, err)
			return nil, err
		}

		// Convert JWK to RSA public key
		return jwkToRSAPublicKey(jwk)
	},
		jwt.WithIssuer(o.issuer),
		jwt.WithAudience(o.audience),
		jwt.WithExpirationRequired(),
		jwt.WithLeeway(30*time.Second),
		jwt.WithValidMethods([]string{"RS256", "RS384", "RS512"}),
	)

	if err != nil {
		log.Printf("[OIDC] Token parsing failed: %v", err)
		return nil, fmt.Errorf("%w: %v", ErrInvalidSession, err)
	}

	if !token.Valid {
		log.Printf("[OIDC] Token validation failed: token marked as invalid")
		return nil, ErrInvalidSession
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Extract identity information
	identity := &Identity{
		Traits:   make(map[string]string),
		Active:   true,
		Verified: true, // OIDC tokens from trusted issuers are considered verified
	}

	// Subject is the user ID
	if sub, ok := claims["sub"].(string); ok {
		identity.ID = sub
	} else {
		return nil, fmt.Errorf("token missing sub claim")
	}

	// Extract email from various claim names
	for _, emailClaim := range []string{"email", "mail", "preferred_username"} {
		if email, ok := claims[emailClaim].(string); ok && email != "" {
			identity.Email = email
			identity.Traits["email"] = email
			break
		}
	}

	// If email is missing from token, fetch from userinfo endpoint
	if identity.Email == "" && o.userinfoURL != "" {
		log.Printf("[OIDC] Email missing from ID token for subject %s, fetching from userinfo endpoint", identity.ID)
		if err := o.enrichIdentityFromUserinfo(ctx, tokenString, identity); err != nil {
			log.Printf("[OIDC] WARNING: Failed to fetch userinfo: %v. Subject: %s", err, identity.ID)
		}
	}

	// Log warning if email is still missing after userinfo fetch
	if identity.Email == "" {
		log.Printf("[OIDC] WARNING: Email not found in token or userinfo. Subject: %s", identity.ID)
	}

	// Check email_verified claim
	if emailVerified, ok := claims["email_verified"].(bool); ok {
		identity.Verified = emailVerified
	}

	// Extract name from various claim names
	for _, nameClaim := range []string{"name", "preferred_username", "given_name"} {
		if name, ok := claims[nameClaim].(string); ok && name != "" {
			identity.Traits["name"] = name
			break
		}
	}

	// Extract session ID if present (jti claim)
	if jti, ok := claims["jti"].(string); ok {
		identity.SessionID = jti
	}

	return identity, nil
}

// Close releases resources held by the validator
func (o *OIDCValidator) Close() error {
	o.httpClient.CloseIdleConnections()
	return nil
}

// jwkToRSAPublicKey converts a JWK to an RSA public key
func jwkToRSAPublicKey(jwk *JWK) (interface{}, error) {
	if jwk.Kty != "RSA" {
		return nil, fmt.Errorf("unsupported key type: %s", jwk.Kty)
	}

	// Decode the modulus (n) and exponent (e)
	nBytes, err := base64URLDecode(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus: %w", err)
	}

	eBytes, err := base64URLDecode(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent: %w", err)
	}

	// Convert exponent bytes to int
	var e int
	for _, b := range eBytes {
		e = e<<8 + int(b)
	}

	n := new(big.Int).SetBytes(nBytes)
	return &rsa.PublicKey{N: n, E: e}, nil
}

// base64URLDecode decodes a base64url encoded string
func base64URLDecode(s string) ([]byte, error) {
	// Add padding if needed
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}

	return base64.URLEncoding.DecodeString(s)
}

// enrichIdentityFromUserinfo fetches user information from the userinfo endpoint
// and enriches the identity with missing claims like email
func (o *OIDCValidator) enrichIdentityFromUserinfo(ctx context.Context, accessToken string, identity *Identity) error {
	if o.userinfoURL == "" {
		return fmt.Errorf("userinfo endpoint not configured")
	}

	req, err := http.NewRequestWithContext(ctx, "GET", o.userinfoURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create userinfo request: %w", err)
	}

	// Use the access token (Bearer token) for userinfo request
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := o.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to fetch userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("jwks endpoint returned status %d", resp.StatusCode)
		}
		return fmt.Errorf("userinfo endpoint returned status %d: %s", resp.StatusCode, string(body))
	}

	var userinfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&userinfo); err != nil {
		return fmt.Errorf("failed to decode userinfo response: %w", err)
	}

	log.Printf("[OIDC] Userinfo response for subject %s: %v", identity.ID, userinfo)

	// Extract email from userinfo
	if email, ok := userinfo["email"].(string); ok && email != "" && identity.Email == "" {
		identity.Email = email
		identity.Traits["email"] = email
		log.Printf("[OIDC] Enriched identity with email from userinfo: %s", email)
	}

	// Extract name if missing
	if name, ok := userinfo["name"].(string); ok && name != "" {
		if _, hasName := identity.Traits["name"]; !hasName {
			identity.Traits["name"] = name
		}
	}

	// Check email_verified from userinfo
	if emailVerified, ok := userinfo["email_verified"].(bool); ok {
		identity.Verified = emailVerified
	}

	return nil
}

// Ensure OIDCValidator implements SessionValidator
var _ SessionValidator = (*OIDCValidator)(nil)
