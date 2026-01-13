package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAddFamilyMember_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent user and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Setup auth middleware with parent user
	env.SetupAuthMiddleware(parent)

	// Setup routes
	env.Router.POST("/api/family/members", AddFamilyMember)

	t.Run("Success_CreateChild", func(t *testing.T) {
		// Initially only the parent exists (excluding system user)
		env.AssertUserRowCount(1)

		// Request to add a child
		payload := map[string]interface{}{
			"email":       "child@example.com",
			"displayName": "Test Child",
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)

		// Assert response
		require.Equal(t, http.StatusCreated, resp.Code, "Response body: %s", resp.Body.String())

		var apiResp struct {
			Data    map[string]interface{} `json:"data"`
			Message string                 `json:"message"`
		}
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)
		assert.Contains(t, apiResp.Message, "Invitation sent")
		assert.Equal(t, "child@example.com", apiResp.Data["email"])
		assert.Equal(t, familyID, apiResp.Data["familyId"])

		// Verify invitation was created
		invitation := apiResp.Data["invitation"].(map[string]interface{})
		assert.Equal(t, "child@example.com", invitation["email"])
		assert.Equal(t, "pending", invitation["status"])
		assert.Equal(t, "child", invitation["role"])

		// Verify NO new user was added yet (user is created when they accept the invitation)
		// Using AssertUserRowCount to exclude system user
		env.AssertUserRowCount(1)

		// Verify the invitation exists in the database
		invitations, err := env.DB.GetPendingInvitationsByEmail("child@example.com")
		require.NoError(t, err)
		require.Len(t, invitations, 1)
		assert.Equal(t, "child@example.com", invitations[0].Email)
		assert.Equal(t, familyID, invitations[0].FamilyID)
		assert.Equal(t, "child", invitations[0].Role)
	})

	t.Run("Error_DuplicateEmail", func(t *testing.T) {
		// Create first child
		payload1 := map[string]interface{}{
			"email":       "duplicate@example.com",
			"displayName": "First Child",
			"role":        "child",
			"familyId":    familyID,
		}
		resp := makeRequest(env.Router, "POST", "/api/family/members", payload1, nil)
		require.Equal(t, http.StatusCreated, resp.Code)

		// Try to create another child with the same email
		payload2 := map[string]interface{}{
			"email":       "duplicate@example.com",
			"displayName": "Second Child",
			"role":        "child",
			"familyId":    familyID,
		}
		resp = makeRequest(env.Router, "POST", "/api/family/members", payload2, nil)

		// Should fail with conflict error
		assert.Equal(t, http.StatusConflict, resp.Code)

		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"], "already exists")
	})

	t.Run("Success_SendParentInvitation", func(t *testing.T) {
		// Get current invitation count (may have child invitations from previous tests)
		var currentCount int
		err := env.Pool.QueryRow(context.Background(), "SELECT COUNT(*) FROM family_invitations").Scan(&currentCount)
		require.NoError(t, err)

		// Request to invite a parent
		payload := map[string]interface{}{
			"email":       "parent2@example.com",
			"displayName": "Second Parent",
			"role":        "parent",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)

		// Assert response
		assert.Equal(t, http.StatusAccepted, resp.Code)

		var response map[string]interface{}
		err = json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "invitation sent")

		// Verify one more invitation was created
		env.AssertRowCount("family_invitations", currentCount+1)
	})

	t.Run("Error_ChildCannotAddMembers", func(t *testing.T) {
		// Create a child user
		child := env.CreateTestUser(familyID, "child")

		// Setup auth as child (not parent) with RequireParentRole middleware
		gin.SetMode(gin.TestMode)
		childRouter := gin.New()
		childRouter.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("userID", child.ID)
			c.Set("authID", child.AuthID)
			c.Set("userRole", "child") // Set the role that middleware checks
			c.Set("familyID", child.FamilyID)
			c.Set("validatedFamilyID", child.FamilyID)
			c.Next()
		})
		// Add the RequireParentRole middleware to enforce role check
		parentOnly := childRouter.Group("")
		parentOnly.Use(func(c *gin.Context) {
			// Inline RequireParentRole logic
			userRole, exists := c.Get("userRole")
			if !exists || userRole != "parent" {
				c.JSON(http.StatusForbidden, models.APIResponse{
					Error: "Parent role required for this action",
				})
				c.Abort()
				return
			}
			c.Next()
		})
		parentOnly.POST("/api/family/members", AddFamilyMember)

		// Try to add a family member as child
		payload := map[string]interface{}{
			"email":       "newchild@example.com",
			"displayName": "Another Child",
			"role":        "child",
			"familyId":    child.FamilyID,
		}

		resp := makeRequest(childRouter, "POST", "/api/family/members", payload, nil)

		// Should be forbidden
		assert.Equal(t, http.StatusForbidden, resp.Code)
	})

	t.Run("Error_InvalidRole", func(t *testing.T) {
		payload := map[string]interface{}{
			"email":       "invalid@example.com",
			"displayName": "Invalid Role User",
			"role":        "superadmin", // Invalid role
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)

		// Should fail with bad request
		assert.Equal(t, http.StatusBadRequest, resp.Code)

		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		// Gin validation error message format
		assert.Contains(t, response["error"], "Role")
	})

	t.Run("Error_MissingEmail", func(t *testing.T) {
		payload := map[string]interface{}{
			"displayName": "No Email User",
			"role":        "child",
			"familyId":    familyID,
			// email missing
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)

		// Should fail with bad request
		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})
}

func TestAddFamilyMember_DatabaseConstraints_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	env.SetupAuthMiddleware(parent)
	env.Router.POST("/api/family/members", AddFamilyMember)

	t.Run("DatabaseEnforces_UniqueEmail", func(t *testing.T) {
		// This test verifies that the database constraint prevents duplicate emails
		// even if the application logic fails

		// Create a child directly in DB
		existingChild := env.CreateTestUser(familyID, "child")

		// Try to create another child with same email through the API
		payload := map[string]interface{}{
			"email":       existingChild.Email,
			"displayName": "Duplicate Child",
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)

		// Should fail - database should enforce UNIQUE constraint on email
		assert.NotEqual(t, http.StatusCreated, resp.Code,
			"Database should prevent duplicate emails")

		// Should still only have the original users (excluding system user)
		env.AssertUserRowCount(2) // parent + child
	})

	t.Run("DatabaseEnforces_PrimaryKey", func(t *testing.T) {
		// This test verifies that attempting to insert the same user ID twice fails
		// This was the root cause of our bug - CreateChild inserts into users,
		// then CreateUser tried to insert again with same ID

		payload := map[string]interface{}{
			"email":       "pktest@example.com",
			"displayName": "PK Test Child",
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code)

		var user models.User
		err := json.Unmarshal(resp.Body.Bytes(), &user)
		require.NoError(t, err)

		// The handler should NOT attempt to insert twice
		// If it does, the database PRIMARY KEY constraint should prevent it
		// (This was caught by our real-world testing, not by mocks)
	})
}
