package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// setupIntegrationTest creates a test router with authentication and authorization middleware
func setupIntegrationTest(t *testing.T) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Mock authentication middleware
	r.Use(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Authorization header required",
			})
			c.Abort()
			return
		}

		// Mock token validation - extract user info from token
		if authHeader == "Bearer valid-parent-smith" {
			c.Set("userID", "parent-smith")
			c.Set("authID", "oidc-parent-smith")
			c.Set("userRole", "parent")
			c.Set("familyID", "family-smith")
			c.Set("validatedFamilyID", "family-smith")
		} else if authHeader == "Bearer valid-parent-johnson" {
			c.Set("userID", "parent-johnson")
			c.Set("authID", "oidc-parent-johnson")
			c.Set("userRole", "parent")
			c.Set("familyID", "family-johnson")
			c.Set("validatedFamilyID", "family-johnson")
		} else if authHeader == "Bearer valid-child-smith" {
			c.Set("userID", "child-smith-1")
			c.Set("authID", "oidc-child-smith-1")
			c.Set("userRole", "child")
			c.Set("familyID", "family-smith")
			c.Set("validatedFamilyID", "family-smith")
		} else {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Invalid token",
			})
			c.Abort()
			return
		}

		c.Next()
	})

	// Role-based access middleware
	requireParentRole := func() gin.HandlerFunc {
		return func(c *gin.Context) {
			role, exists := c.Get("userRole")
			if !exists || role != "parent" {
				c.JSON(http.StatusForbidden, models.APIResponse{
					Error: "Access denied: Parent role required",
				})
				c.Abort()
				return
			}
			c.Next()
		}
	}

	// Set up API routes
	api := r.Group("/api")
	{
		// Word sets - family scoped
		api.GET("/wordsets", func(c *gin.Context) {
			familyID, _ := c.Get("validatedFamilyID")
			famIDStr := familyID.(string)
			// Mock response with family-scoped word sets
			wordSets := []models.WordSet{
				{
					ID:       "wordset-" + famIDStr + "-1",
					Name:     "Family Words",
					FamilyID: &famIDStr,
				},
			}
			c.JSON(http.StatusOK, models.APIResponse{Data: wordSets})
		})

		// Children management - parent only
		api.GET("/families/children", requireParentRole(), func(c *gin.Context) {
			familyID, _ := c.Get("validatedFamilyID")
			// Mock response with family-scoped children
			userID := c.GetString("userID")
			children := []models.ChildAccount{
				{
					ID:       "child-" + familyID.(string) + "-1",
					FamilyID: familyID.(string),
					ParentID: &userID,
				},
			}
			c.JSON(http.StatusOK, models.APIResponse{Data: children})
		})

		// Child-specific data - with ownership verification
		api.GET("/children/:childId/results", func(c *gin.Context) {
			childID := c.Param("childId")
			userID := c.GetString("userID")
			userRole := c.GetString("userRole")

			// Verify parent ownership of child
			if userRole == "parent" {
				// Mock check: parent can only access their own family's children
				if (userID == "parent-smith" && childID == "child-smith-1") ||
					(userID == "parent-johnson" && childID == "child-johnson-1") {
					// Access allowed
				} else {
					c.JSON(http.StatusForbidden, models.APIResponse{
						Error: "Access denied: You can only access your own children",
					})
					return
				}
			} else if userRole == "child" && userID != childID {
				c.JSON(http.StatusForbidden, models.APIResponse{
					Error: "Access denied: Children can only access their own data",
				})
				return
			}

			// Mock response
			results := []models.TestResult{
				{
					ID:        "result-" + childID + "-1",
					UserID:    childID,
					WordSetID: "wordset-1",
				},
			}
			c.JSON(http.StatusOK, models.APIResponse{Data: results})
		})
	}

	return r
}

func TestFamilyIsolation_WordSets(t *testing.T) {
	r := setupIntegrationTest(t)

	// Test Smith family access
	req := httptest.NewRequest("GET", "/api/wordsets", nil)
	req.Header.Set("Authorization", "Bearer valid-parent-smith")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	wordSets := response.Data.([]interface{})
	assert.Len(t, wordSets, 1)
	wordSet := wordSets[0].(map[string]interface{})
	assert.Equal(t, "family-smith", wordSet["familyId"])

	// Test Johnson family access (should get different data)
	req = httptest.NewRequest("GET", "/api/wordsets", nil)
	req.Header.Set("Authorization", "Bearer valid-parent-johnson")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	wordSets = response.Data.([]interface{})
	assert.Len(t, wordSets, 1)
	wordSet = wordSets[0].(map[string]interface{})
	assert.Equal(t, "family-johnson", wordSet["familyId"])
}

func TestRoleBasedAccess_ParentOnly(t *testing.T) {
	r := setupIntegrationTest(t)

	// Parent should have access
	req := httptest.NewRequest("GET", "/api/families/children", nil)
	req.Header.Set("Authorization", "Bearer valid-parent-smith")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Child should be denied access
	req = httptest.NewRequest("GET", "/api/families/children", nil)
	req.Header.Set("Authorization", "Bearer valid-child-smith")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response.Error, "Parent role required")
}

func TestChildOwnershipVerification(t *testing.T) {
	r := setupIntegrationTest(t)

	// Parent Smith should access their own child
	req := httptest.NewRequest("GET", "/api/children/child-smith-1/results", nil)
	req.Header.Set("Authorization", "Bearer valid-parent-smith")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Parent Smith should NOT access Johnson family child
	req = httptest.NewRequest("GET", "/api/children/child-johnson-1/results", nil)
	req.Header.Set("Authorization", "Bearer valid-parent-smith")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response.Error, "You can only access your own children")
}

func TestChildSelfAccess(t *testing.T) {
	r := setupIntegrationTest(t)

	// Child should access their own data
	req := httptest.NewRequest("GET", "/api/children/child-smith-1/results", nil)
	req.Header.Set("Authorization", "Bearer valid-child-smith")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAuthenticationRequired(t *testing.T) {
	r := setupIntegrationTest(t)

	// No auth header
	req := httptest.NewRequest("GET", "/api/wordsets", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Authorization header required", response.Error)

	// Invalid token
	req = httptest.NewRequest("GET", "/api/wordsets", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
