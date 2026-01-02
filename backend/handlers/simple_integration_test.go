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

func TestSimpleIntegration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Create mock service
	mockDB := NewMockDBService()
	mockServiceManager := &MockServiceManager{
		DB: mockDB,
	}

	// Add service manager to context
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockServiceManager)
		c.Set("userID", "test-user-123")
		c.Set("validatedFamilyID", "test-family-123")
		c.Next()
	})

	// Simple test endpoint
	r.GET("/test", func(c *gin.Context) {
		sm, exists := c.Get("serviceManager")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No service manager"})
			return
		}

		mockSM := sm.(*MockServiceManager)
		userID := c.GetString("userID")

		// Set up mock expectation
		expectedResults := []models.TestResult{
			{ID: "test-result-1", UserID: userID},
		}
		mockSM.DB.On("GetTestResults", userID).Return(expectedResults, nil)

		// Call the mock
		results, err := mockSM.DB.GetTestResults(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, models.APIResponse{Data: results})
	})

	// Test the endpoint
	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	resultsData, ok := response.Data.([]interface{})
	assert.True(t, ok)
	assert.Len(t, resultsData, 1)

	// Verify mock was called
	mockDB.AssertCalled(t, "GetTestResults", "test-user-123")
}
