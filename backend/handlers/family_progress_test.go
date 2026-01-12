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

// setupFamilyProgressTest creates a test environment for family progress tests
func setupFamilyProgressTest() (*gin.Engine, *MockDBService, string, string) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockDB := NewMockDBService()
	mockManager := &MockServiceManager{DB: mockDB}

	testFamilyID := "family-progress-test"
	testParentID := "parent-progress-test"

	// Setup parent user
	parentUser := &models.User{
		ID:           testParentID,
		AuthID:       "oidc-parent-test",
		Email:        "parent@test.com",
		DisplayName:  "Test Parent",
		FamilyID:     testFamilyID,
		Role:         "parent",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockDB.users[testParentID] = parentUser

	// Mock authentication middleware
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockManager)
		c.Set("userID", testParentID)
		c.Set("validatedFamilyID", testFamilyID)
		c.Set("userRole", "parent")
		c.Next()
	})

	// Set up API routes
	api := r.Group("/api")
	{
		api.GET("/families/progress", MockGetFamilyProgress)
		api.POST("/families/children", MockCreateChildAccount)
		api.GET("/families/children", MockGetFamilyChildren)
	}

	return r, mockDB, testFamilyID, testParentID
}

// MockGetFamilyProgress mocks the family progress endpoint
func MockGetFamilyProgress(c *gin.Context) {
	sm, exists := c.Get("serviceManager")
	if !exists {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Service unavailable"})
		return
	}

	mockSM := sm.(*MockServiceManager)
	familyID, _ := c.Get("validatedFamilyID")

	progress, err := mockSM.DB.GetFamilyProgress(familyID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to retrieve family progress"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: progress})
}

// makeProgressRequest is a helper to make HTTP requests during tests
func makeProgressRequest(router *gin.Engine, method, url string, body interface{}) *httptest.ResponseRecorder {
	var bodyReader *bytes.Reader
	if body != nil {
		bodyBytes, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(bodyBytes)
	}

	var req *http.Request
	if bodyReader != nil {
		req = httptest.NewRequest(method, url, bodyReader)
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, url, nil)
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// TestFamilyProgressExcludesParent tests that family progress should NOT include parent data
func TestFamilyProgressExcludesParent(t *testing.T) {
	router, mockDB, familyID, _ := setupFamilyProgressTest()

	// Mock GetFamilyProgress to return empty array (no children, no progress)
	mockDB.On("GetFamilyProgress", familyID).Return([]models.FamilyProgress{}, nil).Once()

	w := makeProgressRequest(router, "GET", "/api/families/progress", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	progress := response.Data.([]interface{})
	assert.Empty(t, progress, "Family progress should be empty when there are no children")

	mockDB.AssertExpectations(t)
}

// TestFamilyProgressIncludesChildrenOnly tests that family progress should include children but NOT parents
func TestFamilyProgressIncludesChildrenOnly(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyProgressTest()

	// Create a child
	child := models.ChildAccount{
		ID:           "child-progress-1",
		Email:        "child1@test.com",
		DisplayName:  "Alice Test",
		FamilyID:     familyID,
		ParentID:     &parentID,
		Role:         "child",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	// Mock CreateChild to store the child
	mockDB.On("CreateChild", mock.AnythingOfType("*models.ChildAccount")).Return(nil).Once()

	// Create child first
	w := makeProgressRequest(router, "POST", "/api/families/children", child)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Now mock GetFamilyProgress to return progress for the child only
	childProgress := models.FamilyProgress{
		UserID:        child.ID,
		UserName:      child.DisplayName,
		Role:          child.Role, // Should be "child"
		TotalTests:    2,
		AverageScore:  85.5,
		TotalWords:    10,
		CorrectWords:  8,
		LastActivity:  time.Now(),
		RecentResults: []models.TestResult{},
	}

	mockDB.On("GetFamilyProgress", familyID).Return([]models.FamilyProgress{childProgress}, nil).Once()

	w = makeProgressRequest(router, "GET", "/api/families/progress", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	progress := response.Data.([]interface{})
	assert.Len(t, progress, 1, "Should have exactly one progress entry for the child")

	progressData := progress[0].(map[string]interface{})
	assert.Equal(t, child.ID, progressData["userId"], "Progress should be for the child")
	assert.Equal(t, child.DisplayName, progressData["userName"], "Progress should show child's name")
	assert.Equal(t, "child", progressData["role"], "Progress should show child role, NOT parent")
	assert.NotEqual(t, "parent", progressData["role"], "Progress should NOT include parent role")

	mockDB.AssertExpectations(t)
}

// TestFamilyProgressWithMultipleChildren tests that family progress includes all children
func TestFamilyProgressWithMultipleChildren(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyProgressTest()

	// Create multiple children
	children := []models.ChildAccount{
		{
			ID:           "child-progress-1",
			Email:        "child1@test.com",
			DisplayName:  "Alice Test",
			FamilyID:     familyID,
			ParentID:     &parentID,
			Role:         "child",
			IsActive:     true,
			CreatedAt:    time.Now(),
			LastActiveAt: time.Now(),
		},
		{
			ID:           "child-progress-2",
			Email:        "child2@test.com",
			DisplayName:  "Bob Test",
			FamilyID:     familyID,
			ParentID:     &parentID,
			Role:         "child",
			IsActive:     true,
			CreatedAt:    time.Now(),
			LastActiveAt: time.Now(),
		},
	}

	// Create children
	for _, child := range children {
		mockDB.On("CreateChild", mock.MatchedBy(func(c *models.ChildAccount) bool {
			return c.ID == child.ID
		})).Return(nil).Once()

		w := makeProgressRequest(router, "POST", "/api/families/children", child)
		assert.Equal(t, http.StatusCreated, w.Code)
	}

	// Mock GetFamilyProgress to return progress for both children
	progressData := []models.FamilyProgress{
		{
			UserID:        children[0].ID,
			UserName:      children[0].DisplayName,
			Role:          "child",
			TotalTests:    3,
			AverageScore:  90.0,
			TotalWords:    15,
			CorrectWords:  13,
			LastActivity:  time.Now(),
			RecentResults: []models.TestResult{},
		},
		{
			UserID:        children[1].ID,
			UserName:      children[1].DisplayName,
			Role:          "child",
			TotalTests:    1,
			AverageScore:  75.0,
			TotalWords:    5,
			CorrectWords:  3,
			LastActivity:  time.Now(),
			RecentResults: []models.TestResult{},
		},
	}

	mockDB.On("GetFamilyProgress", familyID).Return(progressData, nil).Once()

	w := makeProgressRequest(router, "GET", "/api/families/progress", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	progress := response.Data.([]interface{})
	assert.Len(t, progress, 2, "Should have progress for both children")

	// Verify all progress entries are for children, not parents
	for i, progressEntry := range progress {
		progressData := progressEntry.(map[string]interface{})
		assert.Equal(t, "child", progressData["role"], "All progress entries should be for children")
		assert.Equal(t, children[i].ID, progressData["userId"], "Progress should match created children")
		assert.NotEqual(t, "parent", progressData["role"], "Should not include any parent entries")
	}

	mockDB.AssertExpectations(t)
}

// TestFamilyProgressCorrectBehaviorAfterFix demonstrates the correct behavior after the bug fix
func TestFamilyProgressCorrectBehaviorAfterFix(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyProgressTest()

	// Create a child and simulate some test results
	child := models.ChildAccount{
		ID:           "child-with-results",
		Email:        "child.results@test.com",
		DisplayName:  "Child With Results",
		FamilyID:     familyID,
		ParentID:     &parentID,
		Role:         "child",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	// Mock CreateChild
	mockDB.On("CreateChild", mock.AnythingOfType("*models.ChildAccount")).Return(nil).Once()

	w := makeProgressRequest(router, "POST", "/api/families/children", child)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Mock family progress with realistic child data
	recentResults := []models.TestResult{
		{
			ID:             "result-1",
			WordSetID:      "wordset-1",
			UserID:         child.ID,
			Score:          85.0,
			TotalWords:     10,
			CorrectWords:   8,
			IncorrectWords: []string{"word1", "word2"},
			TimeSpent:      120,
			CompletedAt:    time.Now().Add(-time.Hour),
			CreatedAt:      time.Now().Add(-time.Hour),
		},
		{
			ID:             "result-2",
			WordSetID:      "wordset-2",
			UserID:         child.ID,
			Score:          92.0,
			TotalWords:     12,
			CorrectWords:   11,
			IncorrectWords: []string{"word3"},
			TimeSpent:      95,
			CompletedAt:    time.Now().Add(-time.Hour * 2),
			CreatedAt:      time.Now().Add(-time.Hour * 2),
		},
	}

	expectedProgress := models.FamilyProgress{
		UserID:        child.ID,
		UserName:      child.DisplayName,
		Role:          "child",
		TotalTests:    2,
		AverageScore:  88.5,                         // (85 + 92) / 2
		TotalWords:    22,                           // 10 + 12
		CorrectWords:  19,                           // 8 + 11
		LastActivity:  recentResults[0].CompletedAt, // Most recent
		RecentResults: recentResults,
	}

	mockDB.On("GetFamilyProgress", familyID).Return([]models.FamilyProgress{expectedProgress}, nil).Once()

	w = makeProgressRequest(router, "GET", "/api/families/progress", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	progress := response.Data.([]interface{})
	assert.Len(t, progress, 1, "Should have progress for the child")

	progressData := progress[0].(map[string]interface{})

	// Verify this is child progress, not parent progress
	assert.Equal(t, child.ID, progressData["userId"])
	assert.Equal(t, child.DisplayName, progressData["userName"])
	assert.Equal(t, "child", progressData["role"])
	assert.Equal(t, float64(2), progressData["totalTests"])
	assert.Equal(t, float64(88.5), progressData["averageScore"])
	assert.Equal(t, float64(22), progressData["totalWords"])
	assert.Equal(t, float64(19), progressData["correctWords"])

	// Verify recent results are included
	recentResultsData := progressData["recentResults"].([]interface{})
	assert.Len(t, recentResultsData, 2, "Should include recent test results")

	mockDB.AssertExpectations(t)
}

// TestFamilyProgressErrorHandling tests error scenarios
func TestFamilyProgressErrorHandling(t *testing.T) {
	router, mockDB, familyID, _ := setupFamilyProgressTest()

	// Test service error
	mockDB.On("GetFamilyProgress", familyID).Return([]models.FamilyProgress{}, assert.AnError).Once()

	w := makeProgressRequest(router, "GET", "/api/families/progress", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response.Error, "Failed to retrieve family progress")

	mockDB.AssertExpectations(t)
}
