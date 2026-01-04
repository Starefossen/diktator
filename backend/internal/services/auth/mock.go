package auth

import (
	"context"
)

// MockValidator provides a mock session validator for local development and testing
type MockValidator struct {
	identity *Identity
}

// DefaultMockIdentity returns a default identity for development
func DefaultMockIdentity() *Identity {
	return &Identity{
		ID:    "mock-user-12345",
		Email: "dev@localhost",
		Traits: map[string]string{
			"email":      "dev@localhost",
			"name":       "Development User",
			"first_name": "Dev",
			"last_name":  "User",
		},
		SessionID: "mock-session-12345",
		Verified:  true,
		Active:    true,
	}
}

// NewMockValidator creates a new mock session validator
// If identity is nil, uses DefaultMockIdentity()
func NewMockValidator(identity *Identity) *MockValidator {
	if identity == nil {
		identity = DefaultMockIdentity()
	}
	return &MockValidator{identity: identity}
}

// ValidateSession always returns the configured mock identity
func (m *MockValidator) ValidateSession(ctx context.Context, sessionToken string) (*Identity, error) {
	// In mock mode, any non-empty token is valid
	if sessionToken == "" {
		return nil, ErrInvalidSession
	}
	return m.identity, nil
}

// ValidateSessionFromCookie always returns the configured mock identity
func (m *MockValidator) ValidateSessionFromCookie(ctx context.Context, cookieValue string) (*Identity, error) {
	// In mock mode, any non-empty cookie is valid
	if cookieValue == "" {
		return nil, ErrInvalidSession
	}
	return m.identity, nil
}

// Close is a no-op for mock validator
func (m *MockValidator) Close() error {
	return nil
}

// SetIdentity allows updating the mock identity at runtime (useful for tests)
func (m *MockValidator) SetIdentity(identity *Identity) {
	m.identity = identity
}

// Ensure MockValidator implements SessionValidator
var _ SessionValidator = (*MockValidator)(nil)
