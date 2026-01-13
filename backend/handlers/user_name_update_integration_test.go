package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestUpdateUserDisplayName_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Create a test parent user and family using helper methods
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID
	// Update user in database with family ID
	err := env.DB.UpdateUser(parent)
	assert.NoError(t, err)

	// Setup auth middleware and routes
	env.SetupAuthMiddleware(parent)
	env.Router.PATCH("/api/users/me/name", UpdateUserDisplayName)

	tests := []struct {
		name           string
		displayName    string
		expectedError  string
		expectedStatus int
	}{
		{
			name:           "Valid name update",
			displayName:    "New Name",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Name with whitespace (should be trimmed)",
			displayName:    "  Trimmed Name  ",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "UTF-8 name (should work)",
			displayName:    "Søren Ødegård",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Empty name",
			displayName:    "",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "displayName",
		},
		{
			name:           "Name with only whitespace",
			displayName:    "   ",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "displayName",
		},
		{
			name:           "Name too long",
			displayName:    string(make([]byte, 101)),
			expectedStatus: http.StatusBadRequest,
			expectedError:  "displayName",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Prepare request
			body := models.DisplayNameUpdateRequest{
				DisplayName: tt.displayName,
			}
			jsonBody, _ := json.Marshal(body)

			req := httptest.NewRequest(http.MethodPatch, "/api/users/me/name", bytes.NewReader(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-User-ID", parent.ID)
			req.Header.Set("X-User-Email", parent.Email)
			req.Header.Set("X-User-Role", parent.Role)
			req.Header.Set("X-Family-ID", parent.FamilyID)

			w := httptest.NewRecorder()
			env.Router.ServeHTTP(w, req)

			// Verify status code
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Parse response
			var resp models.APIResponse
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)

			if tt.expectedError != "" {
				assert.NotEmpty(t, resp.Error)
			} else {
				assert.Empty(t, resp.Error)
				assert.NotNil(t, resp.Data)

				// Verify the name was actually updated in the database
				updatedUser, err := env.DB.GetUser(parent.ID)
				assert.NoError(t, err)
				assert.NotNil(t, updatedUser)
				// Handle whitespace trimming
				expectedName := tt.displayName
				if tt.displayName != "" {
					expectedName = strings.TrimSpace(tt.displayName)
				}
				assert.Equal(t, expectedName, updatedUser.DisplayName)
			}
		})
	}
}

func TestUpdateChildDisplayName_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Create test parent user, family, and child using helper methods
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID
	// Update user in database with family ID
	err := env.DB.UpdateUser(parent)
	assert.NoError(t, err)

	otherParent := env.CreateTestUser(familyID, "parent")

	child := &models.ChildAccount{
		FamilyID:    familyID,
		DisplayName: "Original Child Name",
		ParentID:    &parent.ID,
	}
	err = env.DB.CreateChild(child)
	assert.NoError(t, err)

	// Setup auth middleware and routes
	env.SetupAuthMiddleware(parent)
	env.Router.PUT("/api/families/children/:childId", UpdateChildAccount)

	tests := []struct {
		name           string
		childID        string
		displayName    string
		userID         string
		expectedError  string
		expectedStatus int
	}{
		{
			name:           "Valid child name update",
			childID:        child.ID,
			displayName:    "Updated Child Name",
			userID:         parent.ID,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "UTF-8 child name",
			childID:        child.ID,
			displayName:    "Åse Marie",
			userID:         parent.ID,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Empty child name",
			childID:        child.ID,
			displayName:    "",
			userID:         parent.ID,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "displayName",
		},
		{
			name:           "Child name too long",
			childID:        child.ID,
			displayName:    string(make([]byte, 101)),
			userID:         parent.ID,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "displayName",
		},
		{
			name:           "Other parent can update child",
			childID:        child.ID,
			displayName:    "Updated by Other Parent",
			userID:         otherParent.ID,
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Prepare request
			body := models.DisplayNameUpdateRequest{
				DisplayName: tt.displayName,
			}
			jsonBody, _ := json.Marshal(body)

			req := httptest.NewRequest(http.MethodPut, "/api/families/children/"+tt.childID, bytes.NewReader(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-User-ID", tt.userID)
			req.Header.Set("X-Family-ID", familyID)

			w := httptest.NewRecorder()
			env.Router.ServeHTTP(w, req)

			// Verify status code
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Parse response
			var resp models.APIResponse
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)

			if tt.expectedError != "" {
				assert.NotEmpty(t, resp.Error)
			} else {
				assert.Empty(t, resp.Error)

				// Verify the name was actually updated in the database
				updatedChild, err := env.DB.GetChild(tt.childID)
				assert.NoError(t, err)
				assert.NotNil(t, updatedChild)
				expectedName := strings.TrimSpace(tt.displayName)
				assert.Equal(t, expectedName, updatedChild.DisplayName)
			}
		})
	}
}
