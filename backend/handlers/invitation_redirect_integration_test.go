package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/auth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestInvitationRedirectFlow_Integration tests the complete flow of invitation handling
// and verifies that the frontend receives the correct signals to redirect users.
func TestInvitationRedirectFlow_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Parent user creates a family
	parent1 := env.CreateTestUser("", "parent")
	parent1FamilyID := env.CreateTestFamily(parent1.ID)
	parent1.FamilyID = parent1FamilyID

	// Create invitation directly in the database
	newParentEmail := "newparent@example.com"
	invitationID := uuid.New().String()
	query := `INSERT INTO family_invitations (id, family_id, email, role, invited_by, status, expires_at)
			  VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '7 days')`
	_, err := env.Pool.Exec(context.Background(), query, invitationID, parent1FamilyID, newParentEmail, "parent", parent1.ID)
	require.NoError(t, err)

	t.Run("User with pending invitation gets hasPendingInvites flag", func(t *testing.T) {
		// Setup router with auth middleware that simulates OIDC auth
		router := gin.New()
		router.Use(func(c *gin.Context) {
			// Simulate authenticated user who doesn't exist in DB yet
			c.Set("authIdentityID", "auth-newparent-123")
			c.Set("identity", &auth.Identity{
				ID:    "auth-newparent-123",
				Email: newParentEmail,
			})
			c.Set("serviceManager", env.ServiceManager)
			c.Next()
		})
		router.GET("/api/users/profile", GetUserProfile)

		// Make request to get user profile
		req, _ := http.NewRequest("GET", "/api/users/profile", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Should return 200 with hasPendingInvites=true
		assert.Equal(t, http.StatusOK, w.Code, "Response body: %s", w.Body.String())

		var response models.APIResponse
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		data := response.Data.(map[string]interface{})
		assert.True(t, data["hasPendingInvites"].(bool), "Should have hasPendingInvites=true")
		assert.NotNil(t, data["pendingInvitations"], "Should include pendingInvitations array")

		invitations := data["pendingInvitations"].([]interface{})
		assert.Len(t, invitations, 1, "Should have 1 pending invitation")
	})

	t.Run("After accepting invitation, hasPendingInvites becomes false", func(t *testing.T) {
		// Accept the invitation via HTTP endpoint (like frontend would)
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("authIdentityID", "auth-newparent-123")
			c.Set("identity", &auth.Identity{
				ID:    "auth-newparent-123",
				Email: newParentEmail,
			})
			c.Set("serviceManager", env.ServiceManager)
			c.Next()
		})
		router.POST("/api/invitations/:invitationId/accept", AcceptInvitation)

		// Call the AcceptInvitation endpoint
		req, _ := http.NewRequest("POST", "/api/invitations/"+invitationID+"/accept", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Should succeed
		require.Equal(t, http.StatusOK, w.Code, "Response body: %s", w.Body.String())

		// Get the newly created user
		newParent, err := env.DB.GetUserByAuthID("auth-newparent-123")
		require.NoError(t, err)
		require.NotNil(t, newParent)

		// Setup router with the new user in context
		profileRouter := gin.New()
		profileRouter.Use(func(c *gin.Context) {
			c.Set("user", newParent)
			c.Set("authIdentityID", "auth-newparent-123")
			c.Set("serviceManager", env.ServiceManager)
			c.Next()
		})
		profileRouter.GET("/api/users/profile", GetUserProfile)

		// Make request to get user profile
		req, _ = http.NewRequest("GET", "/api/users/profile", nil)
		w = httptest.NewRecorder()
		profileRouter.ServeHTTP(w, req)

		// Should return 200 with user data, NOT hasPendingInvites
		assert.Equal(t, http.StatusOK, w.Code, "Response body: %s", w.Body.String())

		var response models.APIResponse
		err = json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		data := response.Data.(map[string]interface{})
		assert.Nil(t, data["hasPendingInvites"], "Should NOT have hasPendingInvites key")
		assert.Nil(t, data["pendingInvitations"], "Should NOT have pendingInvitations key")
		assert.Equal(t, newParent.ID, data["id"], "Should have user ID")
		assert.Equal(t, parent1FamilyID, data["familyId"], "Should be in the family")
	})

	t.Run("Invitation is deleted after acceptance", func(t *testing.T) {
		// Verify invitation no longer exists in database (properly cleaned up)
		var count int
		query := `SELECT COUNT(*) FROM family_invitations WHERE id = $1`
		err := env.Pool.QueryRow(context.Background(), query, invitationID).Scan(&count)
		require.NoError(t, err)
		assert.Equal(t, 0, count, "Invitation should be deleted after acceptance for proper cleanup")
	})

	t.Run("User with needsRegistration gets needsRegistration flag", func(t *testing.T) {
		// Setup router for completely new user with no invitations
		newUserEmail := "brandnewuser@example.com"
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("authIdentityID", "auth-brandnew-123")
			c.Set("identity", &auth.Identity{
				ID:    "auth-brandnew-123",
				Email: newUserEmail,
			})
			c.Set("serviceManager", env.ServiceManager)
			c.Next()
		})
		router.GET("/api/users/profile", GetUserProfile)

		req, _ := http.NewRequest("GET", "/api/users/profile", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Should return 404 with needsRegistration=true
		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		data := response.Data.(map[string]interface{})
		assert.True(t, data["needsRegistration"].(bool), "Should have needsRegistration=true")
		assert.Nil(t, data["hasPendingInvites"], "Should NOT have hasPendingInvites")
	})
}

// TestMultiplePendingInvitations_Integration tests handling multiple pending invitations
func TestMultiplePendingInvitations_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Create two families
	parent1 := env.CreateTestUser("", "parent")
	family1ID := env.CreateTestFamily(parent1.ID)

	parent2 := env.CreateTestUser("", "parent")
	family2ID := env.CreateTestFamily(parent2.ID)

	// Both families invite the same email
	invitedEmail := "popular@example.com"
	inviteQuery := `INSERT INTO family_invitations (id, family_id, email, role, invited_by, status, expires_at)
			  VALUES ($1, $2, $3, 'parent', $4, 'pending', NOW() + INTERVAL '7 days')`
	invite1ID := uuid.New().String()
	invite2ID := uuid.New().String()
	_, err := env.Pool.Exec(context.Background(), inviteQuery, invite1ID, family1ID, invitedEmail, parent1.ID)
	require.NoError(t, err)
	_, err = env.Pool.Exec(context.Background(), inviteQuery, invite2ID, family2ID, invitedEmail, parent2.ID)
	require.NoError(t, err)

	t.Run("User sees all pending invitations", func(t *testing.T) {
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("authIdentityID", "auth-popular-123")
			c.Set("identity", &auth.Identity{
				ID:    "auth-popular-123",
				Email: invitedEmail,
			})
			c.Set("serviceManager", env.ServiceManager)
			c.Next()
		})
		router.GET("/api/users/profile", GetUserProfile)

		req, _ := http.NewRequest("GET", "/api/users/profile", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		data := response.Data.(map[string]interface{})
		assert.True(t, data["hasPendingInvites"].(bool))

		invitations := data["pendingInvitations"].([]interface{})
		assert.Len(t, invitations, 2, "Should have 2 pending invitations from different families")
	})

	t.Run("Accepting one invitation deletes only that invitation", func(t *testing.T) {
		// Accept the first invitation
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("authIdentityID", "auth-popular-123")
			c.Set("identity", &auth.Identity{
				ID:    "auth-popular-123",
				Email: invitedEmail,
			})
			c.Set("serviceManager", env.ServiceManager)
			c.Next()
		})
		router.POST("/api/invitations/:invitationId/accept", AcceptInvitation)

		req, _ := http.NewRequest("POST", "/api/invitations/"+invite1ID+"/accept", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code, "Response body: %s", w.Body.String())

		// Verify first invitation is deleted
		var count int
		err := env.Pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM family_invitations WHERE id = $1`, invite1ID).Scan(&count)
		require.NoError(t, err)
		assert.Equal(t, 0, count, "Accepted invitation should be deleted")

		// Verify second invitation still exists
		err = env.Pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM family_invitations WHERE id = $1`, invite2ID).Scan(&count)
		require.NoError(t, err)
		assert.Equal(t, 1, count, "Other pending invitations should remain")
	})
}
