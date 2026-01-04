package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/auth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetPendingInvitations_Integration tests the GET /api/invitations/pending endpoint
// This is the critical endpoint that children call when they first log in
func TestGetPendingInvitations_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Create parent and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	t.Run("Success_ChildFindsTheirInvitation", func(t *testing.T) {
		// Parent creates a child account
		childEmail := "child@example.com"
		childDisplayName := "Test Child"

		// First, create the invitation as parent would
		env.SetupAuthMiddleware(parent)
		env.Router.POST("/api/family/members", AddFamilyMember)

		payload := map[string]interface{}{
			"email":       childEmail,
			"displayName": childDisplayName,
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code)

		// Now simulate child logging in for the first time and checking for invitations
		// Setup router with OIDCBasicAuthMiddleware (simulating first-time login)
		gin.SetMode(gin.TestMode)
		childRouter := gin.New()
		childRouter.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			// Simulate OIDC identity for child (not yet in our database)
			c.Set("identity", &auth.Identity{
				ID:    "oidc-child-123", // OIDC subject
				Email: childEmail,
			})
			c.Next()
		})
		childRouter.GET("/api/invitations/pending", GetPendingInvitations)

		// Child calls the endpoint
		resp = makeRequest(childRouter, "GET", "/api/invitations/pending", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code, "Response: %s", resp.Body.String())

		// Verify response contains the invitation
		var apiResp struct {
			Data []models.FamilyInvitation `json:"data"`
		}
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)

		require.Len(t, apiResp.Data, 1, "Child should have exactly one invitation")
		invitation := apiResp.Data[0]
		assert.Equal(t, childEmail, invitation.Email)
		assert.Equal(t, "child", invitation.Role)
		assert.Equal(t, "pending", invitation.Status)
		assert.Equal(t, familyID, invitation.FamilyID)
	})

	t.Run("Success_NoInvitationsReturnsEmptyArray", func(t *testing.T) {
		// Setup router for a user with no invitations
		gin.SetMode(gin.TestMode)
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("identity", &auth.Identity{
				ID:    "oidc-nobody-123",
				Email: "nobody@example.com",
			})
			c.Next()
		})
		router.GET("/api/invitations/pending", GetPendingInvitations)

		resp := makeRequest(router, "GET", "/api/invitations/pending", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code)

		var apiResp struct {
			Data []models.FamilyInvitation `json:"data"`
		}
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)
		assert.Empty(t, apiResp.Data, "Should return empty array when no invitations")
	})

	t.Run("Success_MultipleInvitationsReturned", func(t *testing.T) {
		// Create invitations in multiple families for the same email
		childEmail := "popular@example.com"

		// Create second parent and family
		parent2 := env.CreateTestUser("", "parent")
		familyID2 := env.CreateTestFamily(parent2.ID)
		parent2.FamilyID = familyID2

		// Parent 1 invites child
		query := `INSERT INTO family_invitations (id, family_id, email, role, invited_by, status, created_at, expires_at)
				  VALUES (gen_random_uuid()::text, $1, $2, 'child', $3, 'pending', NOW(), NOW() + INTERVAL '30 days')`
		_, err := env.Pool.Exec(context.Background(), query, familyID, childEmail, parent.ID)
		require.NoError(t, err)

		// Parent 2 invites same child
		_, err = env.Pool.Exec(context.Background(), query, familyID2, childEmail, parent2.ID)
		require.NoError(t, err)

		// Child checks invitations
		gin.SetMode(gin.TestMode)
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("identity", &auth.Identity{
				ID:    "oidc-popular-123",
				Email: childEmail,
			})
			c.Next()
		})
		router.GET("/api/invitations/pending", GetPendingInvitations)

		resp := makeRequest(router, "GET", "/api/invitations/pending", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code)

		var apiResp struct {
			Data []models.FamilyInvitation `json:"data"`
		}
		err = json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)
		assert.Len(t, apiResp.Data, 2, "Should return all invitations for the email")
	})

	t.Run("Error_NoIdentityInContext", func(t *testing.T) {
		// Setup router without identity (authentication failure)
		gin.SetMode(gin.TestMode)
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			// No identity set
			c.Next()
		})
		router.GET("/api/invitations/pending", GetPendingInvitations)

		resp := makeRequest(router, "GET", "/api/invitations/pending", nil, nil)
		assert.Equal(t, http.StatusUnauthorized, resp.Code)
	})

	t.Run("Error_NoEmailInIdentity", func(t *testing.T) {
		// Setup router with identity but no email
		gin.SetMode(gin.TestMode)
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("identity", &auth.Identity{
				ID:    "oidc-noemail-123",
				Email: "", // Empty email
			})
			c.Next()
		})
		router.GET("/api/invitations/pending", GetPendingInvitations)

		resp := makeRequest(router, "GET", "/api/invitations/pending", nil, nil)
		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})
}

// TestAcceptInvitation_Integration tests the POST /api/invitations/:invitationId/accept endpoint
func TestAcceptInvitation_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Create parent and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	t.Run("Success_ChildAcceptsInvitationAndLinksAccount", func(t *testing.T) {
		// Parent creates a child account
		childEmail := "newchild@example.com"
		childDisplayName := "New Child"

		env.SetupAuthMiddleware(parent)
		env.Router.POST("/api/family/members", AddFamilyMember)

		payload := map[string]interface{}{
			"email":       childEmail,
			"displayName": childDisplayName,
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code)

		// Get the invitation ID
		var invitations []models.FamilyInvitation
		query := `SELECT id, family_id, email, role, invited_by, status
				  FROM family_invitations WHERE email = $1`
		rows, err := env.Pool.Query(context.Background(), query, childEmail)
		require.NoError(t, err)
		defer rows.Close()

		for rows.Next() {
			var inv models.FamilyInvitation
			err := rows.Scan(&inv.ID, &inv.FamilyID, &inv.Email, &inv.Role, &inv.InvitedBy, &inv.Status)
			require.NoError(t, err)
			invitations = append(invitations, inv)
		}
		require.Len(t, invitations, 1)
		invitationID := invitations[0].ID

		// Child logs in for the first time and accepts invitation
		gin.SetMode(gin.TestMode)
		childRouter := gin.New()
		childOIDCID := "oidc-child-first-time-123"
		childRouter.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("authIdentityID", childOIDCID) // Set the auth ID
			c.Set("identity", &auth.Identity{
				ID:    childOIDCID,
				Email: childEmail,
			})
			c.Next()
		})
		childRouter.POST("/api/invitations/:invitationId/accept", AcceptInvitation)

		// Accept the invitation
		resp = makeRequest(childRouter, "POST", "/api/invitations/"+invitationID+"/accept", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code, "Response: %s", resp.Body.String())

		// Verify the pending user was updated with the OIDC ID
		var user models.User
		userQuery := `SELECT id, auth_id, email, is_active, family_id, role
					  FROM users WHERE email = $1`
		err = env.Pool.QueryRow(context.Background(), userQuery, childEmail).Scan(
			&user.ID, &user.AuthID, &user.Email, &user.IsActive, &user.FamilyID, &user.Role,
		)
		require.NoError(t, err)

		assert.Equal(t, childOIDCID, user.AuthID, "Auth ID should be updated to OIDC ID")
		assert.True(t, user.IsActive, "User should be activated")
		assert.Equal(t, "child", user.Role)
		assert.Equal(t, familyID, user.FamilyID)

		// Verify invitation status was updated
		var invStatus string
		err = env.Pool.QueryRow(context.Background(),
			"SELECT status FROM family_invitations WHERE id = $1", invitationID).Scan(&invStatus)
		require.NoError(t, err)
		assert.Equal(t, "accepted", invStatus)
	})

	t.Run("Error_InvitationNotFound", func(t *testing.T) {
		gin.SetMode(gin.TestMode)
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("authIdentityID", "oidc-somebody-123")
			c.Set("identity", &auth.Identity{
				ID:    "oidc-somebody-123",
				Email: "somebody@example.com",
			})
			c.Next()
		})
		router.POST("/api/invitations/:invitationId/accept", AcceptInvitation)

		resp := makeRequest(router, "POST", "/api/invitations/nonexistent-id/accept", nil, nil)
		assert.Equal(t, http.StatusNotFound, resp.Code)
	})

	t.Run("Error_WrongEmailTryingToAccept", func(t *testing.T) {
		// Create invitation for one email
		targetEmail := "intended@example.com"
		query := `INSERT INTO family_invitations (id, family_id, email, role, invited_by, status, created_at, expires_at)
				  VALUES ('test-inv-123', $1, $2, 'child', $3, 'pending', NOW(), NOW() + INTERVAL '30 days')`
		_, err := env.Pool.Exec(context.Background(), query, familyID, targetEmail, parent.ID)
		require.NoError(t, err)

		// Different user tries to accept
		gin.SetMode(gin.TestMode)
		router := gin.New()
		router.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("authIdentityID", "oidc-wrong-123")
			c.Set("identity", &auth.Identity{
				ID:    "oidc-wrong-123",
				Email: "wrong@example.com", // Different email
			})
			c.Next()
		})
		router.POST("/api/invitations/:invitationId/accept", AcceptInvitation)

		resp := makeRequest(router, "POST", "/api/invitations/test-inv-123/accept", nil, nil)
		assert.Equal(t, http.StatusNotFound, resp.Code, "Should not find invitation for different email")
	})
}

// TestInvitationEndToEndFlow_Integration tests the complete flow from parent creating
// a child account to child logging in and accepting the invitation
func TestInvitationEndToEndFlow_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Step 1: Parent creates account and family
	parentOIDCID := "oidc-parent-e2e-123"
	parentEmail := "parent@e2e.com"
	gin.SetMode(gin.TestMode)

	// Parent registration
	parentRegRouter := gin.New()
	parentRegRouter.Use(func(c *gin.Context) {
		c.Set("serviceManager", env.ServiceManager)
		c.Set("authIdentityID", parentOIDCID)
		c.Set("identity", &auth.Identity{
			ID:    parentOIDCID,
			Email: parentEmail,
		})
		c.Next()
	})
	parentRegRouter.POST("/api/users", CreateUser)

	regPayload := map[string]interface{}{
		"email":       parentEmail,
		"displayName": "E2E Parent",
		"familyName":  "E2E Family",
	}
	resp := makeRequest(parentRegRouter, "POST", "/api/users", regPayload, nil)
	require.Equal(t, http.StatusCreated, resp.Code, "Parent registration failed: %s", resp.Body.String())

	var parentData struct {
		Data struct {
			ID       string `json:"id"`
			FamilyID string `json:"familyId"`
		} `json:"data"`
	}
	err := json.Unmarshal(resp.Body.Bytes(), &parentData)
	require.NoError(t, err)
	parentID := parentData.Data.ID
	familyID := parentData.Data.FamilyID

	// Step 2: Parent creates child account
	childEmail := "child@e2e.com"
	childDisplayName := "E2E Child"

	parentRouter := gin.New()
	parentRouter.Use(func(c *gin.Context) {
		c.Set("serviceManager", env.ServiceManager)
		c.Set("userID", parentID)
		c.Set("userRole", "parent")
		c.Set("familyID", familyID)
		c.Set("validatedFamilyID", familyID)
		c.Next()
	})
	parentRouter.POST("/api/family/members", AddFamilyMember)

	childPayload := map[string]interface{}{
		"email":       childEmail,
		"displayName": childDisplayName,
		"role":        "child",
		"familyId":    familyID,
	}
	resp = makeRequest(parentRouter, "POST", "/api/family/members", childPayload, nil)
	require.Equal(t, http.StatusCreated, resp.Code, "Child creation failed: %s", resp.Body.String())

	// Step 3: Child logs in for the first time and checks for invitations
	childOIDCID := "oidc-child-e2e-123"
	childRouter := gin.New()
	childRouter.Use(func(c *gin.Context) {
		c.Set("serviceManager", env.ServiceManager)
		c.Set("authIdentityID", childOIDCID)
		c.Set("identity", &auth.Identity{
			ID:    childOIDCID,
			Email: childEmail,
		})
		c.Next()
	})
	childRouter.GET("/api/invitations/pending", GetPendingInvitations)
	childRouter.POST("/api/invitations/:invitationId/accept", AcceptInvitation)

	// Check for pending invitations
	resp = makeRequest(childRouter, "GET", "/api/invitations/pending", nil, nil)
	require.Equal(t, http.StatusOK, resp.Code, "Get pending invitations failed: %s", resp.Body.String())

	var invitationsResp struct {
		Data []models.FamilyInvitation `json:"data"`
	}
	err = json.Unmarshal(resp.Body.Bytes(), &invitationsResp)
	require.NoError(t, err)
	require.Len(t, invitationsResp.Data, 1, "Child should have one pending invitation")

	invitationID := invitationsResp.Data[0].ID

	// Step 4: Child accepts invitation
	resp = makeRequest(childRouter, "POST", "/api/invitations/"+invitationID+"/accept", nil, nil)
	require.Equal(t, http.StatusOK, resp.Code, "Accept invitation failed: %s", resp.Body.String())

	// Step 5: Verify child can now authenticate and access the system
	// The child should now be able to get their profile
	childAuthRouter := gin.New()
	var childUser models.User
	err = env.Pool.QueryRow(context.Background(),
		`SELECT id, auth_id, email, family_id, role, is_active FROM users WHERE email = $1`,
		childEmail).Scan(&childUser.ID, &childUser.AuthID, &childUser.Email,
		&childUser.FamilyID, &childUser.Role, &childUser.IsActive)
	require.NoError(t, err)

	childAuthRouter.Use(func(c *gin.Context) {
		c.Set("serviceManager", env.ServiceManager)
		c.Set("userID", childUser.ID)
		c.Set("user", &childUser)
		c.Set("familyID", childUser.FamilyID)
		c.Set("userRole", childUser.Role)
		c.Next()
	})
	childAuthRouter.GET("/api/users/profile", GetUserProfile)

	resp = makeRequest(childAuthRouter, "GET", "/api/users/profile", nil, nil)
	require.Equal(t, http.StatusOK, resp.Code, "Get profile failed: %s", resp.Body.String())

	var profileResp struct {
		Data models.User `json:"data"`
	}
	err = json.Unmarshal(resp.Body.Bytes(), &profileResp)
	require.NoError(t, err)
	assert.Equal(t, childEmail, profileResp.Data.Email)
	assert.Equal(t, familyID, profileResp.Data.FamilyID)
	assert.Equal(t, "child", profileResp.Data.Role)
	assert.True(t, profileResp.Data.IsActive)

	t.Logf("✅ Complete E2E flow successful: Parent created child → Child found invitation → Child accepted → Child authenticated")
}
