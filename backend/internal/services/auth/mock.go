package auth

import (
	"context"
)

// MockValidator provides a mock session validator for local development and testing
type MockValidator struct {
	identities map[string]*Identity // Map of user IDs to identities
	defaultID  string               // Default identity ID to use
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

// MockChildIdentities returns mock child identities for development
func MockChildIdentities() map[string]*Identity {
	return map[string]*Identity{
		"mock-child-1": {
			ID:    "mock-child-1",
			Email: "child1@dev.localhost",
			Traits: map[string]string{
				"email":      "child1@dev.localhost",
				"name":       "Alex Dev",
				"first_name": "Alex",
				"last_name":  "Dev",
			},
			SessionID: "mock-session-child-1",
			Verified:  true,
			Active:    true,
		},
		"mock-child-2": {
			ID:    "mock-child-2",
			Email: "child2@dev.localhost",
			Traits: map[string]string{
				"email":      "child2@dev.localhost",
				"name":       "Sam Dev",
				"first_name": "Sam",
				"last_name":  "Dev",
			},
			SessionID: "mock-session-child-2",
			Verified:  true,
			Active:    true,
		},
	}
}

// NewMockValidator creates a new mock session validator
// If identity is nil, uses DefaultMockIdentity()
func NewMockValidator(identity *Identity) *MockValidator {
	if identity == nil {
		identity = DefaultMockIdentity()
	}

	// Build identity map with parent and children
	identities := map[string]*Identity{
		identity.ID: identity,
	}

	// Add child identities
	for id, childIdentity := range MockChildIdentities() {
		identities[id] = childIdentity
	}

	return &MockValidator{
		identities: identities,
		defaultID:  identity.ID,
	}
}

// ValidateSession returns the identity matching the token, or default if not found
// In mock mode, the token can be a user ID to switch users, or any string for default
func (m *MockValidator) ValidateSession(ctx context.Context, sessionToken string) (*Identity, error) {
	if sessionToken == "" {
		return nil, ErrInvalidSession
	}

	// Check if token matches a known user ID (for user switching)
	if identity, ok := m.identities[sessionToken]; ok {
		return identity, nil
	}

	// Otherwise return the default identity
	return m.identities[m.defaultID], nil
}

// ValidateSessionFromCookie always returns the configured mock identity
func (m *MockValidator) ValidateSessionFromCookie(ctx context.Context, cookieValue string) (*Identity, error) {
	if cookieValue == "" {
		return nil, ErrInvalidSession
	}

	// Check if cookie matches a known user ID (for user switching)
	if identity, ok := m.identities[cookieValue]; ok {
		return identity, nil
	}

	return m.identities[m.defaultID], nil
}

// Close is a no-op for mock validator
func (m *MockValidator) Close() error {
	return nil
}

// SetIdentity allows updating the mock identity at runtime (useful for tests)
func (m *MockValidator) SetIdentity(identity *Identity) {
	m.identities[identity.ID] = identity
	m.defaultID = identity.ID
}

// Ensure MockValidator implements SessionValidator
var _ SessionValidator = (*MockValidator)(nil)
