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

func TestXP_GetUserProfile_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Update parent's family_id in the database (level defaults to 1, XP defaults to 0)
	_, err := env.Pool.Exec(context.Background(),
		"UPDATE users SET family_id = $1 WHERE id = $2",
		familyID, parent.ID)
	require.NoError(t, err)

	// Create a child with XP and level
	child := env.CreateTestUser(familyID, "child")
	birthYear := 2016
	totalXP := 150
	level := 2

	// Update child with XP, level, birth year, and parent
	_, err = env.Pool.Exec(context.Background(),
		"UPDATE users SET birth_year = $1, parent_id = $2, total_xp = $3, level = $4 WHERE id = $5",
		birthYear, parent.ID, totalXP, level, child.ID)
	require.NoError(t, err)

	// Verify the update was successful
	var verifyXP, verifyLevel int
	err = env.Pool.QueryRow(context.Background(),
		"SELECT total_xp, level FROM users WHERE id = $1", child.ID).Scan(&verifyXP, &verifyLevel)
	require.NoError(t, err)
	require.Equal(t, totalXP, verifyXP, "XP should be updated in database")
	require.Equal(t, level, verifyLevel, "Level should be updated in database")

	t.Run("ChildProfile_IncludesXPAndLevel", func(t *testing.T) {
		// Create a new router with child auth for this test
		childRouter := gin.New()
		childRouter.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("userID", child.ID)
			c.Set("authIdentityID", child.AuthID)
			c.Set("userRole", "child")
			c.Set("familyID", familyID)
			c.Set("validatedFamilyID", familyID)
			c.Next()
		})
		childRouter.GET("/api/users/profile", GetUserProfile)

		resp := makeRequest(childRouter, "GET", "/api/users/profile", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code, "Response body: %s", resp.Body.String())

		var apiResp models.APIResponse
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)

		userData := apiResp.Data.(map[string]interface{})

		// Verify XP and level are present
		assert.NotNil(t, userData["totalXp"], "Child profile should include totalXp")
		assert.NotNil(t, userData["level"], "Child profile should include level")

		// Verify XP and level values
		assert.Equal(t, float64(totalXP), userData["totalXp"], "totalXp should match")
		assert.Equal(t, float64(level), userData["level"], "level should match")
	})

	t.Run("Profile_IncludesXPConfig", func(t *testing.T) {
		childRouter := gin.New()
		childRouter.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("userID", child.ID)
			c.Set("authIdentityID", child.AuthID)
			c.Set("userRole", "child")
			c.Set("familyID", familyID)
			c.Set("validatedFamilyID", familyID)
			c.Next()
		})
		childRouter.GET("/api/users/profile", GetUserProfile)

		resp := makeRequest(childRouter, "GET", "/api/users/profile", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code)

		var apiResp models.APIResponse
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)

		userData := apiResp.Data.(map[string]interface{})
		assert.NotNil(t, userData["xpConfig"], "Profile should include xpConfig")
		
		xpConfig, ok := userData["xpConfig"].(map[string]interface{})
		require.True(t, ok, "xpConfig should be a map")
		assert.Greater(t, len(xpConfig), 0, "xpConfig should not be empty")
		assert.NotNil(t, xpConfig["keyboard"], "xpConfig should contain keyboard mode")
	})

	t.Run("ParentProfile_IncludesXPAndLevel", func(t *testing.T) {
		// Create a new router with parent auth for this test
		parentRouter := gin.New()
		parentRouter.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("userID", parent.ID)
			c.Set("authIdentityID", parent.AuthID)
			c.Set("userRole", "parent")
			c.Set("familyID", familyID)
			c.Set("validatedFamilyID", familyID)
			c.Next()
		})
		parentRouter.GET("/api/users/profile", GetUserProfile)

		resp := makeRequest(parentRouter, "GET", "/api/users/profile", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code, "Response body: %s", resp.Body.String())

		var apiResp models.APIResponse
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)

		userData := apiResp.Data.(map[string]interface{})

		// Verify XP and level are present
		assert.NotNil(t, userData["totalXp"], "Parent profile should include totalXp")
		assert.NotNil(t, userData["level"], "Parent profile should include level")

		// CreateUser doesn't insert XP/level, so database defaults apply (0, 1)
		assert.Equal(t, float64(0), userData["totalXp"], "Parent should have 0 XP (database default)")
		assert.Equal(t, float64(1), userData["level"], "Parent should have level 1 (database default)")
	})
}
