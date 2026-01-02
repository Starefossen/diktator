package auth

import (
	"context"
	"errors"
)

// Common errors
var (
	ErrInvalidSession   = errors.New("invalid or expired session")
	ErrSessionNotFound  = errors.New("session not found")
	ErrIdentityInactive = errors.New("identity is inactive")
)

// Identity represents an authenticated user identity from the auth provider
type Identity struct {
	ID        string            // Unique identity ID from auth provider (subject claim in JWT)
	Email     string            // User's email address
	Traits    map[string]string // Additional identity traits/attributes
	SessionID string            // Session ID or JWT ID (jti claim)
	Verified  bool              // Whether the email is verified
	Active    bool              // Whether the identity is active
}

// SessionValidator defines the interface for validating authentication sessions.
// This abstraction allows for different auth implementations (OIDC, mock, etc.)
type SessionValidator interface {
	// ValidateSession validates an authentication token and returns the identity.
	// For OIDC: validates JWT token against the issuer's JWKS.
	// For Mock: returns a configured test identity.
	ValidateSession(ctx context.Context, token string) (*Identity, error)

	// ValidateSessionFromCookie validates a session from HTTP cookie value.
	// This is used when the token is stored in a cookie.
	ValidateSessionFromCookie(ctx context.Context, cookieValue string) (*Identity, error)

	// Close releases any resources held by the validator
	Close() error
}

// Config holds authentication service configuration
type Config struct {
	// Mode determines which auth implementation to use: "oidc" or "mock"
	Mode string

	// OIDC configuration
	OIDCIssuerURL          string // OIDC issuer URL (e.g., https://auth.example.com)
	OIDCAudience           string // Expected audience (usually client ID)
	OIDCInsecureSkipVerify bool   // Skip TLS verification (development only!)

	// MockIdentity is used in mock mode to return a predefined identity
	MockIdentity *Identity
}

// NewSessionValidator creates a new session validator based on the configuration
func NewSessionValidator(cfg *Config) (SessionValidator, error) {
	switch cfg.Mode {
	case "oidc":
		if cfg.OIDCIssuerURL == "" {
			return nil, errors.New("OIDC_ISSUER_URL is required when AUTH_MODE=oidc")
		}
		return NewOIDCValidator(&OIDCConfig{
			IssuerURL:          cfg.OIDCIssuerURL,
			Audience:           cfg.OIDCAudience,
			InsecureSkipVerify: cfg.OIDCInsecureSkipVerify,
		})
	case "mock", "":
		return NewMockValidator(cfg.MockIdentity), nil
	default:
		return nil, errors.New("invalid AUTH_MODE: must be 'oidc' or 'mock'")
	}
}
