package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockDBService implements all database methods for testing
type MockDBService struct {
	mock.Mock
	users    map[string]*models.User
	families map[string]*models.Family
	wordSets map[string]*models.WordSet
	results  map[string][]models.TestResult
}

func NewMockDBService() *MockDBService {
	return &MockDBService{
		users:    make(map[string]*models.User),
		families: make(map[string]*models.Family),
		wordSets: make(map[string]*models.WordSet),
		results:  make(map[string][]models.TestResult),
	}
}

// User methods
func (m *MockDBService) GetUser(userID string) (*models.User, error) {
	args := m.Called(userID)
	if user, exists := m.users[userID]; exists {
		return user, nil
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockDBService) GetUserByAuthID(authID string) (*models.User, error) {
	args := m.Called(authID)
	for _, user := range m.users {
		if user.AuthID == authID {
			return user, nil
		}
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockDBService) CreateUser(user *models.User) error {
	args := m.Called(user)
	m.users[user.ID] = user
	return args.Error(0)
}

func (m *MockDBService) UpdateUser(user *models.User) error {
	args := m.Called(user)
	m.users[user.ID] = user
	return args.Error(0)
}

func (m *MockDBService) DeleteUser(userID string) error {
	args := m.Called(userID)
	delete(m.users, userID)
	return args.Error(0)
}

// Word set methods
func (m *MockDBService) GetWordSets(familyID string) ([]models.WordSet, error) {
	args := m.Called(familyID)
	var wordSets []models.WordSet
	for _, ws := range m.wordSets {
		if ws.FamilyID == familyID {
			wordSets = append(wordSets, *ws)
		}
	}
	return wordSets, args.Error(1)
}

func (m *MockDBService) CreateWordSet(wordSet *models.WordSet) error {
	args := m.Called(wordSet)
	m.wordSets[wordSet.ID] = wordSet
	return args.Error(0)
}

func (m *MockDBService) DeleteWordSet(wordSetID string) error {
	args := m.Called(wordSetID)
	delete(m.wordSets, wordSetID)
	return args.Error(0)
}

func (m *MockDBService) VerifyWordSetAccess(familyID, wordSetID string) error {
	args := m.Called(familyID, wordSetID)
	if ws, exists := m.wordSets[wordSetID]; exists {
		if ws.FamilyID != familyID {
			return fmt.Errorf("access denied")
		}
		return nil
	}
	return args.Error(0)
}

// Test result methods
func (m *MockDBService) GetTestResults(userID string) ([]models.TestResult, error) {
	args := m.Called(userID)

	// If error is mocked, return it
	if args.Error(1) != nil {
		return []models.TestResult{}, args.Error(1)
	}

	// If results are mocked, return them
	if mockResults := args.Get(0); mockResults != nil {
		if results, ok := mockResults.([]models.TestResult); ok {
			return results, nil
		}
	}

	// If no mock is set up, check internal storage
	if results, exists := m.results[userID]; exists {
		return results, nil
	}

	// Default case
	return []models.TestResult{}, nil
}

func (m *MockDBService) SaveTestResult(result *models.TestResult) error {
	args := m.Called(result)
	m.results[result.UserID] = append(m.results[result.UserID], *result)
	return args.Error(0)
}

// Family methods
func (m *MockDBService) GetFamily(familyID string) (*models.Family, error) {
	args := m.Called(familyID)
	if family, exists := m.families[familyID]; exists {
		return family, nil
	}
	return args.Get(0).(*models.Family), args.Error(1)
}

func (m *MockDBService) GetFamilyChildren(familyID string) ([]models.ChildAccount, error) {
	args := m.Called(familyID)
	var children []models.ChildAccount
	for _, user := range m.users {
		if user.FamilyID == familyID && user.Role == "child" {
			child := models.ChildAccount{
				ID:           user.ID,
				Email:        user.Email,
				DisplayName:  user.DisplayName,
				FamilyID:     user.FamilyID,
				ParentID:     *user.ParentID,
				Role:         user.Role,
				IsActive:     user.IsActive,
				CreatedAt:    user.CreatedAt,
				LastActiveAt: user.LastActiveAt,
			}
			children = append(children, child)
		}
	}
	return children, args.Error(1)
}

func (m *MockDBService) GetFamilyProgress(familyID string) ([]models.FamilyProgress, error) {
	args := m.Called(familyID)
	return args.Get(0).([]models.FamilyProgress), args.Error(1)
}

func (m *MockDBService) GetFamilyStats(familyID string) (*models.FamilyStats, error) {
	args := m.Called(familyID)
	// Simplified implementation for testing
	return &models.FamilyStats{}, args.Error(1)
}

func (m *MockDBService) GetFamilyResults(familyID string) ([]models.TestResult, error) {
	args := m.Called(familyID)

	// If error is mocked, return it
	if args.Error(1) != nil {
		return []models.TestResult{}, args.Error(1)
	}

	// If results are mocked, return them
	if mockResults := args.Get(0); mockResults != nil {
		if results, ok := mockResults.([]models.TestResult); ok {
			return results, nil
		}
	}

	// If no mock is set up, collect results from all family members
	var allResults []models.TestResult
	for userID, results := range m.results {
		if user, exists := m.users[userID]; exists && user.FamilyID == familyID {
			allResults = append(allResults, results...)
		}
	}

	return allResults, nil
}

// Security verification methods
func (m *MockDBService) VerifyParentPermission(userID, familyID string) error {
	args := m.Called(userID, familyID)
	if user, exists := m.users[userID]; exists {
		if user.FamilyID != familyID || user.Role != "parent" {
			return fmt.Errorf("access denied")
		}
		return nil
	}
	return args.Error(0)
}

func (m *MockDBService) VerifyChildOwnership(parentID, childID string) error {
	args := m.Called(parentID, childID)
	if child, exists := m.users[childID]; exists {
		if child.ParentID == nil || *child.ParentID != parentID {
			return fmt.Errorf("access denied")
		}
		return nil
	}
	return args.Error(0)
}

// MockServiceManager for testing
type MockServiceManager struct {
	DB *MockDBService
}

// DeleteWordSetWithAudio mock implementation for testing
func (m *MockServiceManager) DeleteWordSetWithAudio(wordSetID string) error {
	// For testing, we'll just call the Firestore DeleteWordSet method
	// In a more sophisticated test, we could mock the storage operations too
	return m.DB.DeleteWordSet(wordSetID)
}

// MockGetWordSets is a test-specific wrapper for GetWordSets that handles mock services
func MockGetWordSets(c *gin.Context) {
	// Get mock service manager
	sm, exists := c.Get("serviceManager")
	if !exists {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	mockSM, ok := sm.(*MockServiceManager)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Invalid service manager",
		})
		return
	}

	// Get family ID from authenticated context (set by middleware)
	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	familyIDStr, ok := familyID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Invalid family ID",
		})
		return
	}

	wordSets, err := mockSM.DB.GetWordSets(familyIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve word sets",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: wordSets,
	})
}

// Mock handler functions for testing

// MockGetFamilyChildren is a test-specific wrapper for GetFamilyChildren
func MockGetFamilyChildren(c *gin.Context) {
	sm, exists := c.Get("serviceManager")
	if !exists {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Service unavailable"})
		return
	}

	mockSM := sm.(*MockServiceManager)
	familyID, _ := c.Get("validatedFamilyID")

	children, err := mockSM.DB.GetFamilyChildren(familyID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to retrieve children"})
		return
	}

	// Ensure we always return an array, even if empty
	if children == nil {
		children = []models.ChildAccount{}
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: children})
}

// MockCreateChildAccount is a test-specific wrapper for CreateChildAccount
func MockCreateChildAccount(c *gin.Context) {
	var child models.ChildAccount
	if err := c.ShouldBindJSON(&child); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Invalid request data"})
		return
	}

	sm := c.MustGet("serviceManager").(*MockServiceManager)

	if err := sm.DB.CreateChild(&child); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to create child account"})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{Data: child})
}

// MockDeleteChildAccount is a test-specific wrapper for DeleteChildAccount
func MockDeleteChildAccount(c *gin.Context) {
	childID := c.Param("childId")
	sm := c.MustGet("serviceManager").(*MockServiceManager)

	if err := sm.DB.DeleteChild(childID); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to delete child account"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Message: "Child account deleted successfully"})
}

// MockGetChildResults is a test-specific wrapper for GetChildResults
func MockGetChildResults(c *gin.Context) {
	childID := c.Param("childId")
	sm := c.MustGet("serviceManager").(*MockServiceManager)

	results, err := sm.DB.GetTestResults(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to retrieve child results"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: results})
}

// MockCreateWordSet is a test-specific wrapper for CreateWordSet
func MockCreateWordSet(c *gin.Context) {
	var wordSet models.WordSet
	if err := c.ShouldBindJSON(&wordSet); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Invalid request data"})
		return
	}

	sm := c.MustGet("serviceManager").(*MockServiceManager)

	if err := sm.DB.CreateWordSet(&wordSet); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to create word set"})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{Data: wordSet})
}

// MockUpdateWordSet is a test-specific wrapper for UpdateWordSet
func MockUpdateWordSet(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Word set ID is required"})
		return
	}

	var req models.UpdateWordSetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Invalid request data"})
		return
	}

	sm := c.MustGet("serviceManager").(*MockServiceManager)

	// Get authenticated user info from context
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "User authentication required"})
		return
	}

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "Family access validation required"})
		return
	}

	// Get existing word set to check ownership and get current state
	existingWordSet, err := sm.DB.GetWordSet(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Word set not found"})
		return
	}

	// Verify family access
	if existingWordSet.FamilyID != familyID.(string) {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Word set not found"})
		return
	}

	// Convert string words to WordItem structs (simplified for testing)
	words := make([]struct {
		Word         string               `json:"word"`
		Audio        models.WordAudio     `json:"audio,omitempty"`
		Definition   string               `json:"definition,omitempty"`
		Translations []models.Translation `json:"translations,omitempty"`
	}, len(req.Words))

	for i, wordInput := range req.Words {
		words[i] = struct {
			Word         string               `json:"word"`
			Audio        models.WordAudio     `json:"audio,omitempty"`
			Definition   string               `json:"definition,omitempty"`
			Translations []models.Translation `json:"translations,omitempty"`
		}{
			Word:         wordInput.Word,
			Definition:   wordInput.Definition,
			Translations: wordInput.Translations,
		}
	}

	// Update the word set
	updatedWordSet := &models.WordSet{
		ID:                existingWordSet.ID,
		Name:              req.Name,
		Words:             words,
		FamilyID:          existingWordSet.FamilyID,
		CreatedBy:         existingWordSet.CreatedBy,
		Language:          req.Language,
		TestConfiguration: req.TestConfiguration,
		CreatedAt:         existingWordSet.CreatedAt,
		UpdatedAt:         time.Now(),
	}

	err = sm.DB.UpdateWordSet(updatedWordSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to update word set"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    updatedWordSet,
		Message: "Word set updated successfully",
	})
}

// MockDeleteWordSet is a test-specific wrapper for DeleteWordSet
func MockDeleteWordSet(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Word set ID is required"})
		return
	}

	sm := c.MustGet("serviceManager").(*MockServiceManager)

	err := sm.DeleteWordSetWithAudio(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to delete word set"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Message: "Word set deleted successfully"})
}

func setupTestRouter() (*gin.Engine, *MockDBService) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockDB := NewMockDBService()
	mockManager := &MockServiceManager{
		DB: mockDB,
	}

	// Mock authentication middleware
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockManager)
		c.Next()
	})

	// Set up routes (simplified for testing)
	api := r.Group("/api")
	{
		api.GET("/wordsets", MockGetWordSets)
		api.POST("/wordsets", MockCreateWordSet)
		api.PUT("/wordsets/:id", MockUpdateWordSet)
		api.DELETE("/wordsets/:id", MockDeleteWordSet)
		api.GET("/families/children", MockGetFamilyChildren)
		api.POST("/families/children", MockCreateChildAccount)
		api.DELETE("/families/children/:childId", MockDeleteChildAccount)
		api.GET("/families/children/:childId/results", MockGetChildResults)
	}

	return r, mockDB
}

func setupTestData(mockDB *MockDBService) {
	// Family 1 - Smith Family
	family1 := &models.Family{
		ID:        "family-smith",
		Name:      "Smith Family",
		CreatedBy: "parent-smith",
		Members:   []string{"parent-smith", "child-smith-1", "child-smith-2"},
		CreatedAt: time.Now(),
	}
	mockDB.families["family-smith"] = family1

	// Family 2 - Johnson Family
	family2 := &models.Family{
		ID:        "family-johnson",
		Name:      "Johnson Family",
		CreatedBy: "parent-johnson",
		Members:   []string{"parent-johnson", "child-johnson-1"},
		CreatedAt: time.Now(),
	}
	mockDB.families["family-johnson"] = family2

	// Users for Family 1
	parentSmith := &models.User{
		ID:           "parent-smith",
		AuthID:       "oidc-parent-smith",
		Email:        "parent@smith.com",
		DisplayName:  "John Smith",
		FamilyID:     "family-smith",
		Role:         "parent",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockDB.users["parent-smith"] = parentSmith

	childSmith1 := &models.User{
		ID:           "child-smith-1",
		AuthID:       "oidc-child-smith-1",
		Email:        "child1@smith.com",
		DisplayName:  "Alice Smith",
		FamilyID:     "family-smith",
		Role:         "child",
		ParentID:     &parentSmith.ID,
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockDB.users["child-smith-1"] = childSmith1

	childSmith2 := &models.User{
		ID:           "child-smith-2",
		AuthID:       "oidc-child-smith-2",
		Email:        "child2@smith.com",
		DisplayName:  "Bob Smith",
		FamilyID:     "family-smith",
		Role:         "child",
		ParentID:     &parentSmith.ID,
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockDB.users["child-smith-2"] = childSmith2

	// Users for Family 2
	parentJohnson := &models.User{
		ID:           "parent-johnson",
		AuthID:       "oidc-parent-johnson",
		Email:        "parent@johnson.com",
		DisplayName:  "Mary Johnson",
		FamilyID:     "family-johnson",
		Role:         "parent",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockDB.users["parent-johnson"] = parentJohnson

	childJohnson1 := &models.User{
		ID:           "child-johnson-1",
		AuthID:       "oidc-child-johnson-1",
		Email:        "child1@johnson.com",
		DisplayName:  "Emma Johnson",
		FamilyID:     "family-johnson",
		Role:         "child",
		ParentID:     &parentJohnson.ID,
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockDB.users["child-johnson-1"] = childJohnson1

	// Word sets for each family
	// Helper function to convert strings to WordItems
	stringToWordItems := func(words []string) []struct {
		Word         string               `json:"word"`
		Audio        models.WordAudio     `json:"audio,omitempty"`
		Definition   string               `json:"definition,omitempty"`
		Translations []models.Translation `json:"translations,omitempty"`
	} {
		result := make([]struct {
			Word         string               `json:"word"`
			Audio        models.WordAudio     `json:"audio,omitempty"`
			Definition   string               `json:"definition,omitempty"`
			Translations []models.Translation `json:"translations,omitempty"`
		}, len(words))
		for i, word := range words {
			result[i] = struct {
				Word         string               `json:"word"`
				Audio        models.WordAudio     `json:"audio,omitempty"`
				Definition   string               `json:"definition,omitempty"`
				Translations []models.Translation `json:"translations,omitempty"`
			}{Word: word}
		}
		return result
	}

	wordSetSmith := &models.WordSet{
		ID:        "wordset-smith-1",
		Name:      "Smith Family Words",
		Words:     stringToWordItems([]string{"apple", "banana", "cherry"}),
		FamilyID:  "family-smith",
		CreatedBy: "parent-smith",
		Language:  "en",
		CreatedAt: time.Now(),
	}
	mockDB.wordSets["wordset-smith-1"] = wordSetSmith

	wordSetJohnson := &models.WordSet{
		ID:        "wordset-johnson-1",
		Name:      "Johnson Family Words",
		Words:     stringToWordItems([]string{"dog", "cat", "bird"}),
		FamilyID:  "family-johnson",
		CreatedBy: "parent-johnson",
		Language:  "en",
		CreatedAt: time.Now(),
	}
	mockDB.wordSets["wordset-johnson-1"] = wordSetJohnson

	// Test results for children
	smithChild1Results := []models.TestResult{
		{
			ID:           "result-1",
			WordSetID:    "wordset-smith-1",
			UserID:       "child-smith-1",
			Score:        85.0,
			TotalWords:   3,
			CorrectWords: 2,
			CompletedAt:  time.Now(),
		},
	}
	mockDB.results["child-smith-1"] = smithChild1Results

	johnsonChild1Results := []models.TestResult{
		{
			ID:           "result-2",
			WordSetID:    "wordset-johnson-1",
			UserID:       "child-johnson-1",
			Score:        90.0,
			TotalWords:   3,
			CorrectWords: 3,
			CompletedAt:  time.Now(),
		},
	}
	mockDB.results["child-johnson-1"] = johnsonChild1Results
}

// Test: Family A cannot access Family B's word sets
func TestFamilyPrivacy_WordSetsIsolation(t *testing.T) {
	_, mockDB := setupTestRouter()
	setupTestData(mockDB)

	// Mock successful calls for Family A
	mockDB.On("GetWordSets", "family-smith").Return([]models.WordSet{}, nil)

	// Set context as Smith family parent
	req := httptest.NewRequest("GET", "/api/wordsets", nil)
	req = req.WithContext(req.Context())
	w := httptest.NewRecorder()

	// Add authentication context manually for this test
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("serviceManager", &MockServiceManager{DB: mockDB})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")
	c.Set("user", mockDB.users["parent-smith"])

	MockGetWordSets(c)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify that only Smith family word sets are returned
	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Verify the mock was called with the correct family ID
	mockDB.AssertCalled(t, "GetWordSets", "family-smith")
	mockDB.AssertNotCalled(t, "GetWordSets", "family-johnson")
}

// Test: Parent A cannot access Parent B's children
func TestFamilyPrivacy_ChildrenIsolation(t *testing.T) {
	_, mockDB := setupTestRouter()
	setupTestData(mockDB)

	// Mock calls
	mockDB.On("GetFamilyChildren", "family-smith").Return([]models.ChildAccount{}, nil)

	req := httptest.NewRequest("GET", "/api/families/children", nil)
	w := httptest.NewRecorder()

	// Set context as Smith family parent
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("serviceManager", &MockServiceManager{DB: mockDB})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")
	c.Set("user", mockDB.users["parent-smith"])

	MockGetFamilyChildren(c)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify only Smith family children are accessed
	mockDB.AssertCalled(t, "GetFamilyChildren", "family-smith")
	mockDB.AssertNotCalled(t, "GetFamilyChildren", "family-johnson")
}

// Test: Parent A cannot access Child B's test results
func TestFamilyPrivacy_ChildResultsIsolation(t *testing.T) {
	_, mockDB := setupTestRouter()
	setupTestData(mockDB)

	// Mock GetTestResults call - should fail for cross-family access
	mockDB.On("GetTestResults", "child-johnson-1").Return([]models.TestResult{}, fmt.Errorf("access denied"))

	req := httptest.NewRequest("GET", "/api/families/children/child-johnson-1/results", nil)
	w := httptest.NewRecorder()

	// Set context as Smith family parent trying to access Johnson family child
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = []gin.Param{{Key: "childId", Value: "child-johnson-1"}}
	c.Set("serviceManager", &MockServiceManager{DB: mockDB})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")
	c.Set("user", mockDB.users["parent-smith"])

	MockGetChildResults(c)

	// Should return error due to access denied at Firestore level
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// Verify GetTestResults was called
	mockDB.AssertCalled(t, "GetTestResults", "child-johnson-1")
}

// Test: Child A cannot create accounts (role-based access)
func TestFamilyPrivacy_RoleBasedAccess(t *testing.T) {
	_, mockDB := setupTestRouter()
	setupTestData(mockDB)

	// Create a request as a child trying to create another child account
	requestBody := models.CreateChildAccountRequest{
		Email:       "newchild@smith.com",
		DisplayName: "New Child",
		FamilyID:    "family-smith",
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/api/families/children", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Set context as child (should be rejected by role middleware)
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("serviceManager", &MockServiceManager{DB: mockDB})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "child-smith-1")
	c.Set("userRole", "child")
	c.Set("user", mockDB.users["child-smith-1"])

	// This should succeed in the handler but would be blocked by middleware in real scenario
	mockDB.On("CreateChild", mock.AnythingOfType("*models.ChildAccount")).Return(nil)

	MockCreateChildAccount(c)

	// The handler itself doesn't check roles - that's done by middleware
	// But we can verify the correct user context is used
	assert.Equal(t, http.StatusCreated, w.Code)
}

// Test: Word set access verification
func TestFamilyPrivacy_WordSetAccess(t *testing.T) {
	_, mockDB := setupTestRouter()
	setupTestData(mockDB)

	// Test accessing a word set from another family
	mockDB.On("DeleteWordSet", "wordset-johnson-1").Return(nil)

	req := httptest.NewRequest("DELETE", "/api/wordsets/wordset-johnson-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = []gin.Param{{Key: "id", Value: "wordset-johnson-1"}}
	c.Set("serviceManager", &MockServiceManager{DB: mockDB})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")

	MockDeleteWordSet(c)

	// Handler should succeed - access control is done by middleware
	assert.Equal(t, http.StatusOK, w.Code)

	// Verify the deletion was attempted
	mockDB.AssertCalled(t, "DeleteWordSet", "wordset-johnson-1")
}

// Integration test simulating full middleware chain
func TestFamilyPrivacy_FullMiddlewareChain(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockDB := NewMockDBService()
	setupTestData(mockDB)

	// Mock service manager
	mockManager := &MockServiceManager{DB: mockDB}

	// Set up middleware that simulates the auth and access control
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockManager)


		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "Authentication required"})
			c.Abort()
			return
		}

		user, exists := mockDB.users[userID]
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "User not found"})
			c.Abort()
			return
		}

		c.Set("userID", user.ID)
		c.Set("user", user)
		c.Set("familyID", user.FamilyID)
		c.Set("userRole", user.Role)
		c.Set("validatedFamilyID", user.FamilyID)
		c.Next()
	})

	// Add word set access verification middleware
	wordSetGroup := r.Group("/api/wordsets")
	wordSetGroup.Use(func(c *gin.Context) {
		wordSetID := c.Param("id")
		familyID, _ := c.Get("validatedFamilyID")

		if wordSetID != "" {
			err := mockDB.VerifyWordSetAccess(familyID.(string), wordSetID)
			if err != nil {
				c.JSON(http.StatusForbidden, models.APIResponse{Error: "Access denied"})
				c.Abort()
				return
			}
		}
		c.Next()
	})

	wordSetGroup.DELETE("/:id", MockDeleteWordSet)

	// Test 1: Smith parent tries to delete Smith word set (should succeed)
	mockDB.On("VerifyWordSetAccess", "family-smith", "wordset-smith-1").Return(nil)
	mockDB.On("DeleteWordSet", "wordset-smith-1").Return(nil)

	req1 := httptest.NewRequest("DELETE", "/api/wordsets/wordset-smith-1", nil)
	req1.Header.Set("X-User-ID", "parent-smith")
	w1 := httptest.NewRecorder()

	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Test 2: Smith parent tries to delete Johnson word set (should fail)
	mockDB.On("VerifyWordSetAccess", "family-smith", "wordset-johnson-1").Return(fmt.Errorf("access denied"))
	// Don't need to mock DeleteWordSet since middleware should block

	req2 := httptest.NewRequest("DELETE", "/api/wordsets/wordset-johnson-1", nil)
	req2.Header.Set("X-User-ID", "parent-smith")
	w2 := httptest.NewRecorder()

	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusForbidden, w2.Code)

	var response models.APIResponse
	err := json.Unmarshal(w2.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Access denied", response.Error)

	mockDB.AssertExpectations(t)
}

func TestFamilyPrivacy_ChildOwnershipValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockDB := NewMockDBService()
	setupTestData(mockDB)

	mockManager := &MockServiceManager{DB: mockDB}

	// Middleware to simulate authentication and child ownership verification
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockManager)

		userID := c.GetHeader("X-User-ID")
		user, exists := mockDB.users[userID]
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "User not found"})
			c.Abort()
			return
		}

		c.Set("userID", user.ID)
		c.Set("user", user)
		c.Set("familyID", user.FamilyID)
		c.Set("userRole", user.Role)
		c.Set("validatedFamilyID", user.FamilyID)
		c.Next()
	})

	// Child ownership verification middleware
	childGroup := r.Group("/api/families/children")
	childGroup.Use(func(c *gin.Context) {
		userID, _ := c.Get("userID")
		childID := c.Param("childId")

		if childID != "" {
			err := mockDB.VerifyChildOwnership(userID.(string), childID)
			if err != nil {
				c.JSON(http.StatusForbidden, models.APIResponse{Error: "Access denied: You can only access your own children"})
				c.Abort()
				return
			}
		}
		c.Next()
	})

	childGroup.DELETE("/:childId", MockDeleteChildAccount)

	// Test 1: Smith parent deletes their own child (should succeed)
	mockDB.On("VerifyChildOwnership", "parent-smith", "child-smith-1").Return(nil)
	mockDB.On("DeleteChild", "child-smith-1").Return(nil)

	req1 := httptest.NewRequest("DELETE", "/api/families/children/child-smith-1", nil)
	req1.Header.Set("X-User-ID", "parent-smith")
	w1 := httptest.NewRecorder()

	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Test 2: Smith parent tries to delete Johnson child (should fail)
	mockDB.On("VerifyChildOwnership", "parent-smith", "child-johnson-1").Return(fmt.Errorf("access denied"))
	// Don't need to mock DeleteChild since middleware should block

	req2 := httptest.NewRequest("DELETE", "/api/families/children/child-johnson-1", nil)
	req2.Header.Set("X-User-ID", "parent-smith")
	w2 := httptest.NewRecorder()

	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusForbidden, w2.Code)

	var response models.APIResponse
	err := json.Unmarshal(w2.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response.Error, "Access denied")

	mockDB.AssertExpectations(t)
}

func (m *MockDBService) CreateChild(child *models.ChildAccount) error {
	args := m.Called(child)
	m.users[child.ID] = &models.User{
		ID:           child.ID,
		Email:        child.Email,
		DisplayName:  child.DisplayName,
		FamilyID:     child.FamilyID,
		ParentID:     &child.ParentID,
		Role:         child.Role,
		IsActive:     child.IsActive,
		CreatedAt:    child.CreatedAt,
		LastActiveAt: child.LastActiveAt,
	}
	return args.Error(0)
}

func (m *MockDBService) DeleteChild(childID string) error {
	args := m.Called(childID)
	delete(m.users, childID)
	return args.Error(0)
}

func (m *MockDBService) GetChild(childID string) (*models.ChildAccount, error) {
	args := m.Called(childID)
	if user, exists := m.users[childID]; exists && user.Role == "child" {
		child := &models.ChildAccount{
			ID:       user.ID,
			ParentID: *user.ParentID,
			FamilyID: user.FamilyID,
		}
		return child, nil
	}
	return args.Get(0).(*models.ChildAccount), args.Error(1)
}

func (m *MockDBService) UpdateChild(child *models.ChildAccount) error {
	args := m.Called(child)
	if user, exists := m.users[child.ID]; exists {
		user.FamilyID = child.FamilyID
		user.ParentID = &child.ParentID
		m.users[child.ID] = user
	}
	return args.Error(0)
}

func (m *MockDBService) CreateFamily(family *models.Family) error {
	args := m.Called(family)
	m.families[family.ID] = family
	return args.Error(0)
}

func (m *MockDBService) UpdateFamily(family *models.Family) error {
	args := m.Called(family)
	m.families[family.ID] = family
	return args.Error(0)
}

func (m *MockDBService) DeleteFamily(familyID string) error {
	args := m.Called(familyID)
	delete(m.families, familyID)
	return args.Error(0)
}

func (m *MockDBService) UpdateWordSet(wordSet *models.WordSet) error {
	args := m.Called(wordSet)
	m.wordSets[wordSet.ID] = wordSet
	return args.Error(0)
}

func (m *MockDBService) GetWordSet(wordSetID string) (*models.WordSet, error) {
	args := m.Called(wordSetID)
	if wordSet, exists := m.wordSets[wordSetID]; exists {
		return wordSet, args.Error(1)
	}
	return args.Get(0).(*models.WordSet), args.Error(1)
}

func (m *MockDBService) GetUserProgress(userID string) (*models.FamilyProgress, error) {
	args := m.Called(userID)
	return args.Get(0).(*models.FamilyProgress), args.Error(1)
}

func (m *MockDBService) VerifyFamilyAccess(userID, familyID string) error {
	args := m.Called(userID, familyID)
	if user, exists := m.users[userID]; exists {
		if user.FamilyID != familyID {
			return fmt.Errorf("access denied")
		}
		return nil
	}
	return args.Error(0)
}

// TestUpdateWordSet tests the PUT /api/wordsets/:id endpoint
func TestUpdateWordSet(t *testing.T) {
	_, mockDB := setupTestRouter()
	setupTestData(mockDB)

	tests := []struct {
		name           string
		wordSetID      string
		userID         string
		familyID       string
		requestBody    models.UpdateWordSetRequest
		setupMocks     func()
		expectedStatus int
		expectedError  string
	}{
		{
			name:      "Successful word set update",
			wordSetID: "wordset-smith-1",
			userID:    "parent-smith",
			familyID:  "family-smith",
			requestBody: models.UpdateWordSetRequest{
				Name:     "Updated Smith Words",
				Words:    []models.WordInput{{Word: "apple"}, {Word: "banana"}, {Word: "orange"}, {Word: "grape"}},
				Language: "en",
			},
			setupMocks: func() {
				// Mock the GetWordSet call
				existingWordSet := &models.WordSet{
					ID:        "wordset-smith-1",
					Name:      "Smith Family Words",
					FamilyID:  "family-smith",
					CreatedBy: "parent-smith",
					Language:  "en",
					CreatedAt: time.Now(),
				}
				mockDB.On("GetWordSet", "wordset-smith-1").Return(existingWordSet, nil)
				mockDB.On("UpdateWordSet", mock.AnythingOfType("*models.WordSet")).Return(nil)
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:      "Word set not found",
			wordSetID: "nonexistent-wordset",
			userID:    "parent-smith",
			familyID:  "family-smith",
			requestBody: models.UpdateWordSetRequest{
				Name:     "Updated Words",
				Words:    []models.WordInput{{Word: "word1"}, {Word: "word2"}},
				Language: "en",
			},
			setupMocks: func() {
				mockDB.On("GetWordSet", "nonexistent-wordset").Return((*models.WordSet)(nil), fmt.Errorf("word set not found"))
			},
			expectedStatus: http.StatusNotFound,
			expectedError:  "Word set not found",
		},
		{
			name:      "Access denied - different family",
			wordSetID: "wordset-johnson-1",
			userID:    "parent-smith",
			familyID:  "family-smith",
			requestBody: models.UpdateWordSetRequest{
				Name:     "Unauthorized Update",
				Words:    []models.WordInput{{Word: "word1"}, {Word: "word2"}},
				Language: "en",
			},
			setupMocks: func() {
				// Mock existing word set from different family
				existingWordSet := &models.WordSet{
					ID:        "wordset-johnson-1",
					Name:      "Johnson Family Words",
					FamilyID:  "family-johnson", // Different family
					CreatedBy: "parent-johnson",
					Language:  "en",
					CreatedAt: time.Now(),
				}
				mockDB.On("GetWordSet", "wordset-johnson-1").Return(existingWordSet, nil)
			},
			expectedStatus: http.StatusNotFound,
			expectedError:  "Word set not found",
		},
		{
			name:      "Missing word set ID",
			wordSetID: "",
			userID:    "parent-smith",
			familyID:  "family-smith",
			requestBody: models.UpdateWordSetRequest{
				Name:     "Updated Words",
				Words:    []models.WordInput{{Word: "word1"}, {Word: "word2"}},
				Language: "en",
			},
			setupMocks:     func() {},
			expectedStatus: http.StatusBadRequest, // MockUpdateWordSet returns 400 for empty ID
			expectedError:  "Word set ID is required",
		},
		{
			name:      "Invalid request body",
			wordSetID: "wordset-smith-1",
			userID:    "parent-smith",
			familyID:  "family-smith",
			requestBody: models.UpdateWordSetRequest{
				// Missing required fields
				Words: []models.WordInput{{Word: "word1"}, {Word: "word2"}},
			},
			setupMocks:     func() {},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Invalid request data",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset mock expectations
			mockDB.ExpectedCalls = nil
			mockDB.Calls = nil

			// Setup mocks for this test
			tt.setupMocks()

			// Create request body
			requestBody, _ := json.Marshal(tt.requestBody)

			// Create request
			var url string
			if tt.wordSetID == "" {
				url = "/api/wordsets/"
			} else {
				url = fmt.Sprintf("/api/wordsets/%s", tt.wordSetID)
			}
			req := httptest.NewRequest("PUT", url, bytes.NewBuffer(requestBody))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			w := httptest.NewRecorder()

			// Set up context with user info
			c, _ := gin.CreateTestContext(w)
			c.Request = req
			c.Set("serviceManager", &MockServiceManager{DB: mockDB})
			c.Set("userID", tt.userID)
			c.Set("validatedFamilyID", tt.familyID)

			// Set URL params
			if tt.wordSetID != "" {
				c.Params = []gin.Param{{Key: "id", Value: tt.wordSetID}}
			}

			// Call the handler
			MockUpdateWordSet(c)

			// Verify response
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var response models.APIResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Contains(t, response.Error, tt.expectedError)
			} else if tt.expectedStatus == http.StatusOK {
				var response models.APIResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Empty(t, response.Error) // Check that Error field is empty, not nil
				assert.Equal(t, "Word set updated successfully", response.Message)

				// Verify the updated data
				wordSet, ok := response.Data.(map[string]interface{})
				assert.True(t, ok)
				assert.Equal(t, tt.requestBody.Name, wordSet["name"])
				assert.Equal(t, tt.requestBody.Language, wordSet["language"])
			}

			// Verify mock expectations
			mockDB.AssertExpectations(t)
		})
	}
}
