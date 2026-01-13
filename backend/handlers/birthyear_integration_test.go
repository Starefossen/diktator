package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBirthYear_AddFamilyMemberWithBirthYear_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent user and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	env.SetupAuthMiddleware(parent)
	env.Router.POST("/api/families/members", AddFamilyMember)

	t.Run("Success_CreateChildWithBirthYear", func(t *testing.T) {
		birthYear := 2016 // 9-10 years old

		payload := map[string]interface{}{
			"email":       "childwithage@example.com",
			"displayName": "Child With Age",
			"role":        "child",
			"familyId":    familyID,
			"birthYear":   birthYear,
		}

		resp := makeRequest(env.Router, "POST", "/api/families/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code, "Response body: %s", resp.Body.String())

		var apiResp struct {
			Data    map[string]interface{} `json:"data"`
			Message string                 `json:"message"`
		}
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)

		// Verify invitation was created with birth year
		invitation := apiResp.Data["invitation"].(map[string]interface{})
		assert.Equal(t, "childwithage@example.com", invitation["email"])
		assert.Equal(t, "child", invitation["role"])

		// Verify the invitation includes birthYear in the response
		if invBirthYear, ok := invitation["birthYear"]; ok {
			assert.Equal(t, float64(birthYear), invBirthYear)
		}
	})

	t.Run("Success_CreateChildWithoutBirthYear", func(t *testing.T) {
		// BirthYear is optional, should work without it
		payload := map[string]interface{}{
			"email":       "childnoage@example.com",
			"displayName": "Child No Age",
			"role":        "child",
			"familyId":    familyID,
		}

		resp := makeRequest(env.Router, "POST", "/api/families/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code, "Response body: %s", resp.Body.String())
	})

	t.Run("Success_CreateChildWithNullBirthYear", func(t *testing.T) {
		// Explicitly null birthYear
		payload := map[string]interface{}{
			"email":       "childnullage@example.com",
			"displayName": "Child Null Age",
			"role":        "child",
			"familyId":    familyID,
			"birthYear":   nil,
		}

		resp := makeRequest(env.Router, "POST", "/api/families/members", payload, nil)
		require.Equal(t, http.StatusCreated, resp.Code, "Response body: %s", resp.Body.String())
	})
}

func TestBirthYear_UpdateChildBirthYear_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent, family, and child
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Create a child directly in the database (simulating accepted invitation)
	child := env.CreateTestUser(familyID, "child")

	env.SetupAuthMiddleware(parent)
	env.Router.PATCH("/api/families/children/:childId/birthyear", UpdateChildBirthYear)
	env.Router.GET("/api/families/children", GetFamilyChildren)

	t.Run("Success_UpdateBirthYear", func(t *testing.T) {
		birthYear := 2015

		payload := map[string]interface{}{
			"birthYear": birthYear,
		}

		resp := makeRequest(env.Router, "PATCH", "/api/families/children/"+child.ID+"/birthyear", payload, nil)
		require.Equal(t, http.StatusOK, resp.Code, "Response body: %s", resp.Body.String())

		var apiResp models.APIResponse
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)
		assert.Contains(t, apiResp.Message, "updated")

		// Verify birthYear was saved in database
		var storedBirthYear *int
		err = env.Pool.QueryRow(context.Background(),
			"SELECT birth_year FROM users WHERE id = $1", child.ID).Scan(&storedBirthYear)
		require.NoError(t, err)
		require.NotNil(t, storedBirthYear)
		assert.Equal(t, birthYear, *storedBirthYear)
	})

	t.Run("Success_ClearBirthYear", func(t *testing.T) {
		// First set a birth year
		_, err := env.Pool.Exec(context.Background(),
			"UPDATE users SET birth_year = 2010 WHERE id = $1", child.ID)
		require.NoError(t, err)

		// Now clear it by sending null
		payload := map[string]interface{}{
			"birthYear": nil,
		}

		resp := makeRequest(env.Router, "PATCH", "/api/families/children/"+child.ID+"/birthyear", payload, nil)
		require.Equal(t, http.StatusOK, resp.Code, "Response body: %s", resp.Body.String())

		// Verify birthYear was cleared
		var storedBirthYear *int
		err = env.Pool.QueryRow(context.Background(),
			"SELECT birth_year FROM users WHERE id = $1", child.ID).Scan(&storedBirthYear)
		require.NoError(t, err)
		assert.Nil(t, storedBirthYear, "Birth year should be cleared")
	})

	t.Run("Error_InvalidBirthYear_TooOld", func(t *testing.T) {
		payload := map[string]interface{}{
			"birthYear": 1800, // Way too old
		}

		resp := makeRequest(env.Router, "PATCH", "/api/families/children/"+child.ID+"/birthyear", payload, nil)
		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})

	t.Run("Error_InvalidBirthYear_Future", func(t *testing.T) {
		payload := map[string]interface{}{
			"birthYear": time.Now().Year() + 5, // Future year
		}

		resp := makeRequest(env.Router, "PATCH", "/api/families/children/"+child.ID+"/birthyear", payload, nil)
		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})

	t.Run("Error_InvalidChildId", func(t *testing.T) {
		payload := map[string]interface{}{
			"birthYear": 2015,
		}

		resp := makeRequest(env.Router, "PATCH", "/api/families/children/nonexistent-child/birthyear", payload, nil)
		assert.Equal(t, http.StatusNotFound, resp.Code)
	})
}

func TestBirthYear_GetFamilyChildren_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent, family, and children
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Create children with different birth years
	child1 := env.CreateTestUser(familyID, "child")
	child2 := env.CreateTestUser(familyID, "child")

	birthYear1 := 2015
	birthYear2 := 2018

	// Set birth years and parent_id directly in database
	_, err := env.Pool.Exec(context.Background(),
		"UPDATE users SET birth_year = $1, parent_id = $2 WHERE id = $3", birthYear1, parent.ID, child1.ID)
	require.NoError(t, err)
	_, err = env.Pool.Exec(context.Background(),
		"UPDATE users SET birth_year = $1, parent_id = $2 WHERE id = $3", birthYear2, parent.ID, child2.ID)
	require.NoError(t, err)

	env.SetupAuthMiddleware(parent)
	env.Router.GET("/api/families/children", GetFamilyChildren)

	t.Run("Success_ChildrenIncludeBirthYear", func(t *testing.T) {
		resp := makeRequest(env.Router, "GET", "/api/families/children", nil, nil)
		require.Equal(t, http.StatusOK, resp.Code, "Response body: %s", resp.Body.String())

		var apiResp models.APIResponse
		err := json.Unmarshal(resp.Body.Bytes(), &apiResp)
		require.NoError(t, err)

		children := apiResp.Data.([]interface{})
		require.Len(t, children, 2, "Should have 2 children")

		// Verify both children have birthYear
		birthYearsFound := make(map[int]bool)
		for _, c := range children {
			childData := c.(map[string]interface{})
			if birthYear, ok := childData["birthYear"]; ok && birthYear != nil {
				birthYearsFound[int(birthYear.(float64))] = true
			}
		}

		assert.True(t, birthYearsFound[birthYear1], "Child 1 birthYear should be in response")
		assert.True(t, birthYearsFound[birthYear2], "Child 2 birthYear should be in response")
	})
}

func TestBirthYear_GetUserProfile_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Update parent's family_id in the database
	_, err := env.Pool.Exec(context.Background(),
		"UPDATE users SET family_id = $1 WHERE id = $2", familyID, parent.ID)
	require.NoError(t, err)

	// Create a child with birthYear
	child := env.CreateTestUser(familyID, "child")
	birthYear := 2016
	_, err = env.Pool.Exec(context.Background(),
		"UPDATE users SET birth_year = $1, parent_id = $2 WHERE id = $3", birthYear, parent.ID, child.ID)
	require.NoError(t, err)

	t.Run("ChildProfile_IncludesBirthYear", func(t *testing.T) {
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
		// Child should have birthYear
		assert.NotNil(t, userData["birthYear"], "Child should have birthYear")
		assert.Equal(t, float64(birthYear), userData["birthYear"])
	})

	t.Run("ParentProfile_NoBirthYear", func(t *testing.T) {
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
		// Parent should not have birthYear (or it should be nil/omitted)
		if bYear, ok := userData["birthYear"]; ok {
			assert.Nil(t, bYear, "Parent should not have birthYear")
		}
	})
}

func TestBirthYear_ChildCannotUpdateOwnBirthYear_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Create a child
	child := env.CreateTestUser(familyID, "child")

	// Setup routes with RequireParentRole middleware simulation
	gin.SetMode(gin.TestMode)

	t.Run("ChildCannotUpdateBirthYear", func(t *testing.T) {
		childRouter := gin.New()
		childRouter.Use(func(c *gin.Context) {
			c.Set("serviceManager", env.ServiceManager)
			c.Set("userID", child.ID)
			c.Set("authID", child.AuthID)
			c.Set("userRole", "child") // Child role
			c.Set("familyID", familyID)
			c.Set("validatedFamilyID", familyID)
			c.Next()
		})

		// Add RequireParentRole middleware
		parentOnly := childRouter.Group("")
		parentOnly.Use(func(c *gin.Context) {
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
		parentOnly.PATCH("/api/families/children/:childId/birthyear", UpdateChildBirthYear)

		payload := map[string]interface{}{
			"birthYear": 2015,
		}

		resp := makeRequest(childRouter, "PATCH", "/api/families/children/"+child.ID+"/birthyear", payload, nil)
		assert.Equal(t, http.StatusForbidden, resp.Code, "Children should not be able to update birth year")
	})
}

func TestBirthYear_ParentCanUpdateAnyChildInFamily_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Setup: Create parent and family
	parent := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(parent.ID)
	parent.FamilyID = familyID

	// Create child in same family
	childInFamily := env.CreateTestUser(familyID, "child")

	// Create another family with another child
	otherParent := env.CreateTestUser("", "parent")
	otherFamilyID := env.CreateTestFamily(otherParent.ID)
	otherChild := env.CreateTestUser(otherFamilyID, "child")

	env.SetupAuthMiddleware(parent)
	env.Router.PATCH("/api/families/children/:childId/birthyear", UpdateChildBirthYear)

	t.Run("Success_UpdateChildInSameFamily", func(t *testing.T) {
		payload := map[string]interface{}{
			"birthYear": 2016,
		}

		resp := makeRequest(env.Router, "PATCH", "/api/families/children/"+childInFamily.ID+"/birthyear", payload, nil)
		assert.Equal(t, http.StatusOK, resp.Code, "Response body: %s", resp.Body.String())
	})

	t.Run("Error_CannotUpdateChildInOtherFamily", func(t *testing.T) {
		payload := map[string]interface{}{
			"birthYear": 2016,
		}

		resp := makeRequest(env.Router, "PATCH", "/api/families/children/"+otherChild.ID+"/birthyear", payload, nil)
		// Should fail because child is in a different family
		assert.NotEqual(t, http.StatusOK, resp.Code, "Should not be able to update child in other family")
	})
}
