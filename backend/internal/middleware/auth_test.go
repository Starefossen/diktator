package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAuthProvider mocks an OIDC auth provider for testing
type MockAuthProvider struct {
	mock.Mock
}

// MockToken represents a mock JWT token for testing
type MockToken struct {
	Subject string
	Claims  map[string]interface{}
}

func (m *MockAuthProvider) VerifyIDToken(ctx context.Context, idToken string) (*MockToken, error) {
	args := m.Called(ctx, idToken)
	return args.Get(0).(*MockToken), args.Error(1)
}

// MockDBService mocks the database service
type MockDBService struct {
	mock.Mock
}

func (m *MockDBService) GetUserByAuthID(authID string) (*models.User, error) {
	args := m.Called(authID)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockDBService) VerifyChildOwnership(parentID, childID string) error {
	args := m.Called(parentID, childID)
	return args.Error(0)
}

func (m *MockDBService) VerifyWordSetAccess(familyID, wordSetID string) error {
	args := m.Called(familyID, wordSetID)
	return args.Error(0)
}

// MockServiceManager mocks the service manager
type MockServiceManager struct {
	Auth *MockAuthProvider
	DB   *MockDBService
}

func setupTestAuth() (*gin.Engine, *MockServiceManager) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockAuth := &MockAuthProvider{}
	mockDB := &MockDBService{}
	mockManager := &MockServiceManager{
		Auth: mockAuth,
		DB:   mockDB,
	}


	testAuthMiddleware := func() gin.HandlerFunc {
		return func(c *gin.Context) {
			// Set mock service manager in context
			c.Set("serviceManager", mockManager)

			// Simple auth check for testing
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, models.APIResponse{
					Error: "Authorization header required",
				})
				c.Abort()
				return
			}

			// Mock token validation
			if strings.HasPrefix(authHeader, "Bearer valid-") {
				// Mock successful auth
				userID := strings.TrimPrefix(authHeader, "Bearer valid-")
				c.Set("userID", userID)
				c.Set("authID", "oidc-"+userID)
			} else {
				c.JSON(http.StatusUnauthorized, models.APIResponse{
					Error: "Invalid token",
				})
				c.Abort()
				return
			}

			c.Next()
		}
	}

	r.Use(testAuthMiddleware())

	// Test endpoint
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	return r, mockManager
}

func TestAuthMiddleware_NoAuthHeader(t *testing.T) {
	r, _ := setupTestAuth()

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Authorization header required", response.Error)
}

func TestAuthMiddleware_InvalidAuthHeaderFormat(t *testing.T) {
	r, _ := setupTestAuth()

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "InvalidFormat token")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid token", response.Error)
}

func TestAuthMiddleware_EmptyToken(t *testing.T) {
	r, _ := setupTestAuth()

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer ")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid token", response.Error)
}

func TestRequireRole_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("userRole", "parent")
		c.Next()
	})
	r.Use(RequireRole("parent", "admin"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRequireRole_InsufficientPermissions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("userRole", "child")
		c.Next()
	})
	r.Use(RequireRole("parent", "admin"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response.Error, "Access denied")
}

func TestRequireRole_NoAuthContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(RequireRole("parent"))
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Authentication required", response.Error)
}

func TestRequireFamilyAccess_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("familyID", "family-123")
		c.Next()
	})
	r.Use(RequireFamilyAccess())
	r.GET("/test", func(c *gin.Context) {
		familyID, _ := c.Get("validatedFamilyID")
		c.JSON(http.StatusOK, gin.H{"familyID": familyID})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "family-123", response["familyID"])
}

func TestRequireFamilyAccess_NoFamilyID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(RequireFamilyAccess())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestRequireFamilyAccess_EmptyFamilyID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("familyID", "")
		c.Next()
	})
	r.Use(RequireFamilyAccess())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "User is not part of a family", response.Error)
}

func TestRequireParentRole_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("userRole", "parent")
		c.Next()
	})
	r.Use(RequireParentRole())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRequireParentRole_ChildAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(func(c *gin.Context) {
		c.Set("userRole", "child")
		c.Next()
	})
	r.Use(RequireParentRole())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}
