package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// OIDCValidator validates JWT tokens against an OIDC provider
type OIDCValidator struct {
	issuer     string
	audience   string
	httpClient *http.Client

	// JWKS caching
	jwks      *JWKS
	jwksMutex sync.RWMutex
	jwksURL   string
}

// JWKS represents a JSON Web Key Set
type JWKS struct {
	Keys      []JWK     `json:"keys"`
	FetchedAt time.Time `json:"-"`
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
}

// NewOIDCValidator creates a new OIDC JWT validator
func NewOIDCValidator(cfg *OIDCConfig) (*OIDCValidator, error) {
	if cfg.IssuerURL == "" {
		return nil, fmt.Errorf("OIDC issuer URL is required")
	}

	validator := &OIDCValidator{
		issuer:   strings.TrimSuffix(cfg.IssuerURL, "/"),
		audience: cfg.Audience,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}

	// Discover JWKS URL from OIDC discovery document
	if err := validator.discoverJWKS(); err != nil {
		return nil, fmt.Errorf("failed to discover OIDC configuration: %w", err)
	}

	return validator, nil
}

// discoverJWKS fetches the OIDC discovery document and extracts the JWKS URL
func (o *OIDCValidator) discoverJWKS() error {
	discoveryURL := o.issuer + "/.well-known/openid-configuration"

	resp, err := o.httpClient.Get(discoveryURL)
	if err != nil {
		return fmt.Errorf("failed to fetch discovery document: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("discovery document returned status %d: %s", resp.StatusCode, string(body))
	}

	var doc OIDCDiscoveryDocument
	if err := json.NewDecoder(resp.Body).Decode(&doc); err != nil {
		return fmt.Errorf("failed to decode discovery document: %w", err)
	}

	o.jwksURL = doc.JwksURI
	return nil
}

// fetchJWKS fetches the JSON Web Key Set from the OIDC provider
func (o *OIDCValidator) fetchJWKS() error {
	o.jwksMutex.Lock()
	defer o.jwksMutex.Unlock()

	// Check if we have a recent cache
	if o.jwks != nil && time.Since(o.jwks.FetchedAt) < 5*time.Minute {
		return nil
	}

	resp, err := o.httpClient.Get(o.jwksURL)
	if err != nil {
		return fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("JWKS returned status %d: %s", resp.StatusCode, string(body))
	}

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return fmt.Errorf("failed to decode JWKS: %w", err)
	}

	jwks.FetchedAt = time.Now()
	o.jwks = &jwks
	return nil
}

// getKey retrieves the signing key for a given key ID
func (o *OIDCValidator) getKey(kid string) (*JWK, error) {
	if err := o.fetchJWKS(); err != nil {
		return nil, err
	}

	o.jwksMutex.RLock()
	defer o.jwksMutex.RUnlock()

	for _, key := range o.jwks.Keys {
		if key.Kid == kid {
			return &key, nil
		}
	}

	// Key not found, force refresh and try again
	o.jwksMutex.RUnlock()
	o.jwksMutex.Lock()
	o.jwks = nil // Force refresh
	o.jwksMutex.Unlock()
	o.jwksMutex.RLock()

	if err := o.fetchJWKS(); err != nil {
		return nil, err
	}

	for _, key := range o.jwks.Keys {
		if key.Kid == kid {
			return &key, nil
		}
	}

	return nil, fmt.Errorf("key with kid %s not found in JWKS", kid)
}

// ValidateSession validates a JWT token (implements SessionValidator interface)
func (o *OIDCValidator) ValidateSession(ctx context.Context, tokenString string) (*Identity, error) {
	return o.validateToken(tokenString)
}

// ValidateSessionFromCookie validates a JWT token from a cookie
func (o *OIDCValidator) ValidateSessionFromCookie(ctx context.Context, cookieValue string) (*Identity, error) {
	return o.validateToken(cookieValue)
}

// validateToken parses and validates a JWT token
func (o *OIDCValidator) validateToken(tokenString string) (*Identity, error) {
	if tokenString == "" {
		return nil, ErrInvalidSession
	}

	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Get the key ID
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("token missing kid header")
		}

		// Get the signing key
		jwk, err := o.getKey(kid)
		if err != nil {
			return nil, err
		}

		// Convert JWK to RSA public key
		return jwkToRSAPublicKey(jwk)
	})

	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidSession, err)
	}

	if !token.Valid {
		return nil, ErrInvalidSession
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Validate issuer
	if iss, ok := claims["iss"].(string); !ok || iss != o.issuer {
		return nil, fmt.Errorf("%w: invalid issuer", ErrInvalidSession)
	}

	// Validate audience if configured
	if o.audience != "" {
		audValid := false
		switch aud := claims["aud"].(type) {
		case string:
			audValid = aud == o.audience
		case []interface{}:
			for _, a := range aud {
				if aStr, ok := a.(string); ok && aStr == o.audience {
					audValid = true
					break
				}
			}
		}
		if !audValid {
			return nil, fmt.Errorf("%w: invalid audience", ErrInvalidSession)
		}
	}

	// Validate expiration
	if exp, ok := claims["exp"].(float64); ok {
		if time.Unix(int64(exp), 0).Before(time.Now()) {
			return nil, fmt.Errorf("%w: token expired", ErrInvalidSession)
		}
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

// Ensure OIDCValidator implements SessionValidator
var _ SessionValidator = (*OIDCValidator)(nil)
