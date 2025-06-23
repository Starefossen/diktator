package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// setupResultsTest creates a test router with mocked services
func setupResultsTest(t *testing.T) (*gin.Engine, *MockFirestoreService) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Create mock service
	mockFirestore := NewMockFirestoreService()
	mockServiceManager := &MockServiceManager{
		Firestore: mockFirestore,
	}

	// Add service manager to context
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockServiceManager)
		c.Next()
	})

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

		// Mock different users based on token
		switch authHeader {
		case "Bearer valid-parent-token":
			c.Set("userID", "parent-user-123")
			c.Set("firebaseUID", "firebase-parent-123")
			c.Set("userRole", "parent")
			c.Set("familyID", "family-123")
			c.Set("validatedFamilyID", "family-123")
		case "Bearer valid-child-token":
			c.Set("userID", "child-user-456")
			c.Set("firebaseUID", "firebase-child-456")
			c.Set("userRole", "child")
			c.Set("familyID", "family-123")
			c.Set("validatedFamilyID", "family-123")
		default:
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Invalid token",
			})
			c.Abort()
			return
		}

		c.Next()
	})

	// Set up routes with test-specific handlers
	r.GET("/api/users/results", testGetResults)
	r.POST("/api/users/results", testSaveResult)
	r.GET("/api/families/results", testGetFamilyResults)
	r.GET("/health", HealthCheck)

	return r, mockFirestore
}

// Test-specific handlers that work with MockServiceManager
func testGetResults(c *gin.Context) {
	// Get userID from authenticated context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	sm, exists := c.Get("serviceManager")
	if !exists {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	mockSM := sm.(*MockServiceManager)
	results, err := mockSM.Firestore.GetTestResults(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve test results",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: results,
	})
}

func testSaveResult(c *gin.Context) {
	// Get userID from authenticated context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	sm, exists := c.Get("serviceManager")
	if !exists {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	var result models.TestResult
	if err := c.ShouldBindJSON(&result); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// Set the user ID from the authenticated context
	result.UserID = userID.(string)

	mockSM := sm.(*MockServiceManager)
	err := mockSM.Firestore.SaveTestResult(&result)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to save test result",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Message: "Test result saved successfully",
	})
}

func testGetFamilyResults(c *gin.Context) {
	// Get familyID from authenticated context
	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	sm, exists := c.Get("serviceManager")
	if !exists {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	mockSM := sm.(*MockServiceManager)
	results, err := mockSM.Firestore.GetFamilyResults(familyID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve family results",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: results,
	})
}

func TestGetUserResults(t *testing.T) {
	r, mockFirestore := setupResultsTest(t)

	t.Run("should return user results successfully", func(t *testing.T) {
		// Mock data
		expectedResults := []models.TestResult{
			{
				ID:             "result-1",
				UserID:         "parent-user-123",
				WordSetID:      "wordset-1",
				Score:          85.5,
				TotalWords:     10,
				CorrectWords:   8,
				IncorrectWords: []string{"word1", "word2"},
				TimeSpent:      120,
				CompletedAt:    time.Now(),
				CreatedAt:      time.Now(),
			},
			{
				ID:             "result-2",
				UserID:         "parent-user-123",
				WordSetID:      "wordset-2",
				Score:          92.0,
				TotalWords:     5,
				CorrectWords:   5,
				IncorrectWords: []string{},
				TimeSpent:      60,
				CompletedAt:    time.Now().Add(-time.Hour),
				CreatedAt:      time.Now().Add(-time.Hour),
			},
		}

		mockFirestore.On("GetTestResults", "parent-user-123").Return(expectedResults, nil)

		// Create request
		req, _ := http.NewRequest("GET", "/api/users/results", nil)
		req.Header.Set("Authorization", "Bearer valid-parent-token")

		// Execute request
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusOK, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		// Verify the response contains our results
		resultsData, ok := response.Data.([]interface{})
		assert.True(t, ok)
		assert.Len(t, resultsData, 2)

		mockFirestore.AssertExpectations(t)
	})

	t.Run("should return 401 when no authorization header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/users/results", nil)

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("should return 401 when invalid token", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/users/results", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestSaveUserResult(t *testing.T) {
	r, mockFirestore := setupResultsTest(t)

	t.Run("should save user result successfully", func(t *testing.T) {
		// Prepare request data
		saveRequest := models.SaveResultRequest{
			WordSetID:      "wordset-123",
			Score:          88.5,
			TotalWords:     10,
			CorrectWords:   9,
			IncorrectWords: []string{"difficult"},
			TimeSpent:      95,
		}

		mockFirestore.On("SaveTestResult", mock.AnythingOfType("*models.TestResult")).Return(nil)

		// Create request
		jsonData, _ := json.Marshal(saveRequest)
		req, _ := http.NewRequest("POST", "/api/users/results", bytes.NewBuffer(jsonData))
		req.Header.Set("Authorization", "Bearer valid-parent-token")
		req.Header.Set("Content-Type", "application/json")

		// Execute request
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Test result saved successfully", response.Message)

		mockFirestore.AssertExpectations(t)
	})

	t.Run("should return 400 when invalid request data", func(t *testing.T) {
		invalidData := map[string]interface{}{
			"wordSetId": "",        // Missing required field
			"score":     "invalid", // Wrong type
		}

		jsonData, _ := json.Marshal(invalidData)
		req, _ := http.NewRequest("POST", "/api/users/results", bytes.NewBuffer(jsonData))
		req.Header.Set("Authorization", "Bearer valid-parent-token")
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestGetFamilyResults(t *testing.T) {
	t.Run("should return family results successfully", func(t *testing.T) {
		r, mockFirestore := setupResultsTest(t)
		// Mock data - results from multiple family members
		expectedResults := []models.TestResult{
			{
				ID:             "result-parent-1",
				UserID:         "parent-user-123",
				WordSetID:      "wordset-1",
				Score:          85.5,
				TotalWords:     10,
				CorrectWords:   8,
				IncorrectWords: []string{"word1", "word2"},
				TimeSpent:      120,
				CompletedAt:    time.Now(),
				CreatedAt:      time.Now(),
			},
			{
				ID:             "result-child-1",
				UserID:         "child-user-456",
				WordSetID:      "wordset-1",
				Score:          78.0,
				TotalWords:     10,
				CorrectWords:   7,
				IncorrectWords: []string{"word3", "word4", "word5"},
				TimeSpent:      180,
				CompletedAt:    time.Now().Add(-time.Hour),
				CreatedAt:      time.Now().Add(-time.Hour),
			},
		}

		mockFirestore.On("GetFamilyResults", "family-123").Return(expectedResults, nil)

		// Create request
		req, _ := http.NewRequest("GET", "/api/families/results", nil)
		req.Header.Set("Authorization", "Bearer valid-parent-token")

		// Execute request
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusOK, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		// Verify the response contains family results
		resultsData, ok := response.Data.([]interface{})
		assert.True(t, ok)
		assert.Len(t, resultsData, 2)

		mockFirestore.AssertExpectations(t)
	})

	t.Run("should work for child users too", func(t *testing.T) {
		r, mockFirestore := setupResultsTest(t)

		expectedResults := []models.TestResult{
			{
				ID:     "result-family-1",
				UserID: "parent-user-123",
				Score:  90.0,
			},
		}

		mockFirestore.On("GetFamilyResults", "family-123").Return(expectedResults, nil)

		req, _ := http.NewRequest("GET", "/api/families/results", nil)
		req.Header.Set("Authorization", "Bearer valid-child-token")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockFirestore.AssertExpectations(t)
	})

	t.Run("should return empty array when no results found", func(t *testing.T) {
		r, mockFirestore := setupResultsTest(t)

		mockFirestore.On("GetFamilyResults", "family-123").Return([]models.TestResult{}, nil)

		req, _ := http.NewRequest("GET", "/api/families/results", nil)
		req.Header.Set("Authorization", "Bearer valid-parent-token")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		resultsData, ok := response.Data.([]interface{})
		assert.True(t, ok)
		assert.Len(t, resultsData, 0)

		mockFirestore.AssertExpectations(t)
	})
}

func TestHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/health", HealthCheck)

	t.Run("should return healthy status", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "healthy", response["status"])
		assert.Equal(t, "diktator-api", response["service"])
		assert.NotNil(t, response["time"])
	})
}
