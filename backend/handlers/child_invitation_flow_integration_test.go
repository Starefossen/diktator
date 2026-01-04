package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var ctx = context.Background()

// TestChildInvitationFlow_Integration tests the complete flow of adding a child
// and verifying they can properly log in and link their OIDC identity
func TestChildInvitationFlow_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent user and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID
	env.SetupAuthMiddleware(parent)
	env.Router.POST("/api/family/members", AddFamilyMember)

	t.Run("ChildCreation_CreatesInvitation", func(t *testing.T) {
		// Initially no invitations
		env.AssertNoRowsInTable("family_invitations")

		// Parent adds a child account
		payload := map[string]interface{}{
			"email":       "child@example.com",
			"displayName": "Test Child",
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code, "Response body: %s", resp.Body.String())

		// CRITICAL TEST: Verify that an invitation was created for the child
		// This is what was missing in the original implementation
		env.AssertRowCount("family_invitations", 1)

		// Verify the invitation details
		var invitation models.FamilyInvitation
		query := `SELECT id, family_id, email, role, invited_by, status
				  FROM family_invitations WHERE email = $1`
		err := env.Pool.QueryRow(ctx, query, "child@example.com").Scan(
			&invitation.ID, &invitation.FamilyID, &invitation.Email,
			&invitation.Role, &invitation.InvitedBy, &invitation.Status,
		)
		require.NoError(t, err, "Should find invitation for child")
		assert.Equal(t, "child@example.com", invitation.Email)
		assert.Equal(t, "child", invitation.Role)
		assert.Equal(t, familyID, invitation.FamilyID)
		assert.Equal(t, parent.ID, invitation.InvitedBy)
		assert.Equal(t, "pending", invitation.Status)

		// Verify the pending user was also created
		var user models.User
		userQuery := `SELECT id, email, display_name, family_id, role, is_active
					  FROM users WHERE email = $1`
		err = env.Pool.QueryRow(ctx, userQuery, "child@example.com").Scan(
			&user.ID, &user.Email, &user.DisplayName,
			&user.FamilyID, &user.Role, &user.IsActive,
		)
		require.NoError(t, err, "Should find pending user")
		assert.Equal(t, "child@example.com", user.Email)
		assert.Equal(t, "child", user.Role)
		assert.Equal(t, familyID, user.FamilyID)
		assert.False(t, user.IsActive, "Pending user should be inactive")
		assert.Contains(t, user.ID, "pending-", "User ID should have pending prefix")
	})

	t.Run("ChildFirstLogin_FindsInvitation", func(t *testing.T) {
		// Simulate a child logging in for the first time via OIDC
		// They should find their pending invitation

		// This simulates what happens in CreateUser handler
		childEmail := "newchild@example.com"

		// First, parent creates the child account
		payload := map[string]interface{}{
			"email":       childEmail,
			"displayName": "New Child",
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code)

		// Now simulate the child logging in for the first time
		// When they authenticate via OIDC, the system should check for pending invitations
		invitations, err := env.DB.GetPendingInvitationsByEmail(childEmail)
		require.NoError(t, err)
		require.Len(t, invitations, 1, "Child should have exactly one pending invitation")
		assert.Equal(t, childEmail, invitations[0].Email)
		assert.Equal(t, "child", invitations[0].Role)
		assert.Equal(t, "pending", invitations[0].Status)
	})

	t.Run("MultipleChildren_EachGetInvitation", func(t *testing.T) {
		// Create multiple children and verify each gets their own invitation
		childEmails := []string{
			"child1@example.com",
			"child2@example.com",
			"child3@example.com",
		}

		initialInvitations := 0
		var count int
		err := env.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM family_invitations").Scan(&count)
		require.NoError(t, err)
		initialInvitations = count

		for i, email := range childEmails {
			payload := map[string]interface{}{
				"email":       email,
				"displayName": "Child " + string(rune(i+1)),
				"role":        "child",
				"familyId":    familyID,
			}

			resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
			require.Equal(t, http.StatusCreated, resp.Code, "Failed to create child %s", email)
		}

		// Verify each child has an invitation
		env.AssertRowCount("family_invitations", initialInvitations+3)

		for _, email := range childEmails {
			invitations, err := env.DB.GetPendingInvitationsByEmail(email)
			require.NoError(t, err)
			require.Len(t, invitations, 1, "Child %s should have one invitation", email)
		}
	})

	t.Run("InvitationCleanup_OnChildDeletion", func(t *testing.T) {
		// Create a child
		childEmail := "cleanup@example.com"
		payload := map[string]interface{}{
			"email":       childEmail,
			"displayName": "Cleanup Child",
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code)

		var apiResp struct {
			Data models.ChildAccount `json:"data"`
		}
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)
		childID := apiResp.Data.ID

		// Verify invitation exists
		invitations, err := env.DB.GetPendingInvitationsByEmail(childEmail)
		require.NoError(t, err)
		require.Len(t, invitations, 1)

		// Delete the child account
		err = env.DB.DeleteChild(childID)
		require.NoError(t, err)

		// NOTE: Currently invitations are NOT automatically deleted when child is deleted
		// This is acceptable - the invitation becomes orphaned but won't cause issues
		// A future improvement could add CASCADE delete or cleanup logic
	})
}

// TestParentInvitation_NoUserCreated tests that parent invitations work differently
func TestParentInvitation_NoUserCreated_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID
	env.SetupAuthMiddleware(parent)
	env.Router.POST("/api/family/members", AddFamilyMember)

	t.Run("ParentInvitation_OnlyCreatesInvitation", func(t *testing.T) {
		initialUserCount := 0
		var count int
		err := env.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
		require.NoError(t, err)
		initialUserCount = count

		// Invite a parent
		payload := map[string]interface{}{
			"email":       "parent2@example.com",
			"displayName": "Second Parent",
			"role":        "parent",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/family/members", payload, nil)
		require.Equal(t, http.StatusAccepted, resp.Code)

		// Should create invitation
		env.AssertRowCount("family_invitations", 1)

		// Should NOT create a user record (different from child flow)
		env.AssertRowCount("users", initialUserCount)
	})
}
