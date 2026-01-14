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

func TestFamilyChildren_IncludesXPAndLevel_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Create parent and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	_, err := env.Pool.Exec(context.Background(),
		"UPDATE users SET family_id = $1 WHERE id = $2",
		familyID, parent.ID)
	require.NoError(t, err)

	// Create two children
	child1 := env.CreateTestUser(familyID, "child")
	child2 := env.CreateTestUser(familyID, "child")

	// Update children with XP, level, birth year, and parent
	birthYear1 := 2015
	birthYear2 := 2018
	ctx := context.Background()

	_, err = env.Pool.Exec(ctx,
		`UPDATE users SET total_xp = $1, level = $2, birth_year = $3, parent_id = $4 WHERE id = $5`,
		250, 2, birthYear1, parent.ID, child1.ID)
	require.NoError(t, err)

	_, err = env.Pool.Exec(ctx,
		`UPDATE users SET total_xp = $1, level = $2, birth_year = $3, parent_id = $4 WHERE id = $5`,
		450, 3, birthYear2, parent.ID, child2.ID)
	require.NoError(t, err)

	// Verify database has correct values
	var dbXP1, dbLevel1, dbXP2, dbLevel2 int
	err = env.Pool.QueryRow(ctx,
		`SELECT total_xp, level FROM users WHERE id = $1`, child1.ID).
		Scan(&dbXP1, &dbLevel1)
	require.NoError(t, err, "Failed to verify child1 XP in database")
	assert.Equal(t, 250, dbXP1, "Database should have 250 XP for child1")
	assert.Equal(t, 2, dbLevel1, "Database should have level 2 for child1")

	err = env.Pool.QueryRow(ctx,
		`SELECT total_xp, level FROM users WHERE id = $1`, child2.ID).
		Scan(&dbXP2, &dbLevel2)
	require.NoError(t, err, "Failed to verify child2 XP in database")
	assert.Equal(t, 450, dbXP2, "Database should have 450 XP for child2")
	assert.Equal(t, 3, dbLevel2, "Database should have level 3 for child2")

	// Setup Gin router with middleware
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("serviceManager", env.ServiceManager)
		c.Set("userID", parent.ID)
		c.Set("authIdentityID", parent.AuthID)
		c.Set("userRole", "parent")
		c.Set("familyID", familyID)
		c.Set("validatedFamilyID", familyID)
		c.Next()
	})
	router.GET("/api/families/children", GetFamilyChildren)

	// Make request
	resp := makeRequest(router, "GET", "/api/families/children", nil, nil)
	require.Equal(t, http.StatusOK, resp.Code, "Response body: %s", resp.Body.String())

	var apiResp models.APIResponse
	err = json.Unmarshal(resp.Body.Bytes(), &apiResp)
	require.NoError(t, err, "Response should be valid JSON")

	children, ok := apiResp.Data.([]interface{})
	require.True(t, ok, "Data should be an array")
	require.Len(t, children, 2, "Should return 2 children")

	// Check first child (created first, should be first in response)
	child1Data := children[0].(map[string]interface{})
	assert.NotNil(t, child1Data["totalXp"], "Child1 should include totalXp field")
	assert.NotNil(t, child1Data["level"], "Child1 should include level field")
	assert.Equal(t, float64(250), child1Data["totalXp"], "Child1 should have 250 XP")
	assert.Equal(t, float64(2), child1Data["level"], "Child1 should have level 2")

	// Check second child
	child2Data := children[1].(map[string]interface{})
	assert.NotNil(t, child2Data["totalXp"], "Child2 should include totalXp field")
	assert.NotNil(t, child2Data["level"], "Child2 should include level field")
	assert.Equal(t, float64(450), child2Data["totalXp"], "Child2 should have 450 XP")
	assert.Equal(t, float64(3), child2Data["level"], "Child2 should have level 3")
}
