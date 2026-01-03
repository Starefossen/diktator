package handlers

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAssignWordSetToUser_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent user and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Create child user
	child := env.CreateTestUser(familyID, "child")

	// Create word set
	wordSet := env.CreateTestWordSet(familyID, parent.ID)

	// Setup auth middleware with parent user
	env.SetupAuthMiddleware(parent)

	// Setup routes
	env.Router.POST("/api/wordsets/:id/assignments/:userId", AssignWordSetToUser)

	t.Run("Success_AssignWordSetToChild", func(t *testing.T) {
		// Initially no assignments
		env.AssertNoRowsInTable("wordset_assignments")

		// Make request
		resp := makeRequest(env.Router, "POST", "/api/wordsets/"+wordSet.ID+"/assignments/"+child.ID, nil, nil)

		// Assert response
		assert.Equal(t, http.StatusOK, resp.Code)

		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "Word set assigned successfully", response["message"])

		// Assert database state - assignment was created
		env.AssertRowCount("wordset_assignments", 1)
	})

	t.Run("Error_CannotAssignToParent", func(t *testing.T) {
		// Create another parent
		parent2 := env.CreateTestUser(familyID, "parent")

		// Try to assign to parent (should fail)
		resp := makeRequest(env.Router, "POST", "/api/wordsets/"+wordSet.ID+"/assignments/"+parent2.ID, nil, nil)

		// Should get error
		assert.Equal(t, http.StatusBadRequest, resp.Code)

		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"], "only children can be assigned to wordsets")
	})

	t.Run("Error_DuplicateAssignment", func(t *testing.T) {
		// Setup: Create fresh child and wordset
		child2 := env.CreateTestUser(familyID, "child")
		wordSet2 := env.CreateTestWordSet(familyID, parent.ID)

		// First assignment should succeed
		resp := makeRequest(env.Router, "POST", "/api/wordsets/"+wordSet2.ID+"/assignments/"+child2.ID, nil, nil)
		assert.Equal(t, http.StatusOK, resp.Code)

		// Second assignment should also return 200 (idempotent due to ON CONFLICT DO NOTHING)
		// TODO: Update database to detect duplicates and return proper conflict error
		resp = makeRequest(env.Router, "POST", "/api/wordsets/"+wordSet2.ID+"/assignments/"+child2.ID, nil, nil)
		assert.Equal(t, http.StatusOK, resp.Code)

		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "Word set assigned successfully", response["message"])
	})
}

func TestUnassignWordSetFromUser_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent, family, child, and wordset
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID
	child := env.CreateTestUser(familyID, "child")
	wordSet := env.CreateTestWordSet(familyID, parent.ID)

	// Setup handler
	env.SetupAuthMiddleware(parent)
	env.Router.POST("/api/wordsets/:id/assignments/:userId", AssignWordSetToUser)
	env.Router.DELETE("/api/wordsets/:id/assignments/:userId", UnassignWordSetFromUser)

	t.Run("Success_UnassignWordSet", func(t *testing.T) {
		// First assign the wordset
		resp := makeRequest(env.Router, "POST", "/api/wordsets/"+wordSet.ID+"/assignments/"+child.ID, nil, nil)
		require.Equal(t, http.StatusOK, resp.Code)

		// Verify assignment exists
		env.AssertRowCount("wordset_assignments", 1)

		// Now unassign
		resp = makeRequest(env.Router, "DELETE", "/api/wordsets/"+wordSet.ID+"/assignments/"+child.ID, nil, nil)

		// Assert response
		assert.Equal(t, http.StatusOK, resp.Code)

		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "Word set unassigned successfully", response["message"])

		// Assert database state - assignment was removed
		env.AssertNoRowsInTable("wordset_assignments")
	})

	t.Run("Error_UnassignNonexistent", func(t *testing.T) {
		// Try to unassign when no assignment exists
		child2 := env.CreateTestUser(familyID, "child")
		wordSet2 := env.CreateTestWordSet(familyID, parent.ID)

		resp := makeRequest(env.Router, "DELETE", "/api/wordsets/"+wordSet2.ID+"/assignments/"+child2.ID, nil, nil)

		// Should get not found error
		assert.Equal(t, http.StatusNotFound, resp.Code)

		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"], "not found")
	})
}

func TestWordSetAssignment_PopulationInGetWordSets_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent, family, and child
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID
	child := env.CreateTestUser(familyID, "child")

	// Create two word sets
	wordSet1 := env.CreateTestWordSet(familyID, parent.ID)
	wordSet2 := env.CreateTestWordSet(familyID, parent.ID)

	// Assign only wordSet1 to child
	env.SetupAuthMiddleware(parent)
	env.Router.POST("/api/wordsets/:id/assignments/:userId", AssignWordSetToUser)
	env.Router.GET("/api/wordsets", GetWordSets)

	resp := makeRequest(env.Router, "POST", "/api/wordsets/"+wordSet1.ID+"/assignments/"+child.ID, nil, nil)
	require.Equal(t, http.StatusOK, resp.Code)

	t.Run("ParentSeesAssignedUserIDs", func(t *testing.T) {
		// Get word sets as parent
		resp := makeRequest(env.Router, "GET", "/api/wordsets", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code)

		var apiResp struct {
			Data []models.WordSet `json:"data"`
		}
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)
		require.Len(t, apiResp.Data, 2)

		// Find wordSet1 and verify it has assignedUserIDs
		var ws1 *models.WordSet
		for i := range apiResp.Data {
			if apiResp.Data[i].ID == wordSet1.ID {
				ws1 = &apiResp.Data[i]
				break
			}
		}
		require.NotNil(t, ws1, "wordSet1 should be in response")
		require.Len(t, ws1.AssignedUserIDs, 1)
		assert.Equal(t, child.ID, ws1.AssignedUserIDs[0])

		// Verify wordSet2 has no assignments
		var ws2 *models.WordSet
		for i := range apiResp.Data {
			if apiResp.Data[i].ID == wordSet2.ID {
				ws2 = &apiResp.Data[i]
				break
			}
		}
		require.NotNil(t, ws2, "wordSet2 should be in response")
		assert.Empty(t, ws2.AssignedUserIDs)
	})
}
