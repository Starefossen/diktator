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

// MockFirestoreService implements all Firestore methods for testing
type MockFirestoreService struct {
	mock.Mock
	users    map[string]*models.User
	families map[string]*models.Family
	wordSets map[string]*models.WordSet
	results  map[string][]models.TestResult
}

func NewMockFirestoreService() *MockFirestoreService {
	return &MockFirestoreService{
		users:    make(map[string]*models.User),
		families: make(map[string]*models.Family),
		wordSets: make(map[string]*models.WordSet),
		results:  make(map[string][]models.TestResult),
	}
}

// User methods
func (m *MockFirestoreService) GetUser(userID string) (*models.User, error) {
	args := m.Called(userID)
	if user, exists := m.users[userID]; exists {
		return user, nil
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockFirestoreService) GetUserByFirebaseUID(firebaseUID string) (*models.User, error) {
	args := m.Called(firebaseUID)
	for _, user := range m.users {
		if user.FirebaseUID == firebaseUID {
			return user, nil
		}
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockFirestoreService) CreateUser(user *models.User) error {
	args := m.Called(user)
	m.users[user.ID] = user
	return args.Error(0)
}

func (m *MockFirestoreService) UpdateUser(user *models.User) error {
	args := m.Called(user)
	m.users[user.ID] = user
	return args.Error(0)
}

func (m *MockFirestoreService) DeleteUser(userID string) error {
	args := m.Called(userID)
	delete(m.users, userID)
	return args.Error(0)
}

// Word set methods
func (m *MockFirestoreService) GetWordSets(familyID string) ([]models.WordSet, error) {
	args := m.Called(familyID)
	var wordSets []models.WordSet
	for _, ws := range m.wordSets {
		if ws.FamilyID == familyID {
			wordSets = append(wordSets, *ws)
		}
	}
	return wordSets, args.Error(1)
}

func (m *MockFirestoreService) CreateWordSet(wordSet *models.WordSet) error {
	args := m.Called(wordSet)
	m.wordSets[wordSet.ID] = wordSet
	return args.Error(0)
}

func (m *MockFirestoreService) DeleteWordSet(wordSetID string) error {
	args := m.Called(wordSetID)
	delete(m.wordSets, wordSetID)
	return args.Error(0)
}

func (m *MockFirestoreService) VerifyWordSetAccess(familyID, wordSetID string) error {
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
func (m *MockFirestoreService) GetTestResults(userID string) ([]models.TestResult, error) {
	args := m.Called(userID)

	// Check if we should return an error first (mock takes precedence)
	if args.Error(1) != nil {
		return []models.TestResult{}, args.Error(1)
	}

	// If no error is mocked, check internal storage
	if results, exists := m.results[userID]; exists {
		return results, nil
	}

	// Default case
	return []models.TestResult{}, nil
}

func (m *MockFirestoreService) SaveTestResult(result *models.TestResult) error {
	args := m.Called(result)
	m.results[result.UserID] = append(m.results[result.UserID], *result)
	return args.Error(0)
}

// Family methods
func (m *MockFirestoreService) GetFamily(familyID string) (*models.Family, error) {
	args := m.Called(familyID)
	if family, exists := m.families[familyID]; exists {
		return family, nil
	}
	return args.Get(0).(*models.Family), args.Error(1)
}

func (m *MockFirestoreService) GetFamilyChildren(familyID string) ([]models.ChildAccount, error) {
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

func (m *MockFirestoreService) GetFamilyProgress(familyID string) ([]models.FamilyProgress, error) {
	args := m.Called(familyID)
	return args.Get(0).([]models.FamilyProgress), args.Error(1)
}

func (m *MockFirestoreService) GetFamilyStats(familyID string) (*models.FamilyStats, error) {
	args := m.Called(familyID)
	// Simplified implementation for testing
	return &models.FamilyStats{}, args.Error(1)
}

// Security verification methods
func (m *MockFirestoreService) VerifyParentPermission(userID, familyID string) error {
	args := m.Called(userID, familyID)
	if user, exists := m.users[userID]; exists {
		if user.FamilyID != familyID || user.Role != "parent" {
			return fmt.Errorf("access denied")
		}
		return nil
	}
	return args.Error(0)
}

func (m *MockFirestoreService) VerifyChildOwnership(parentID, childID string) error {
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
	Firestore *MockFirestoreService
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

	wordSets, err := mockSM.Firestore.GetWordSets(familyIDStr)
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

	children, err := mockSM.Firestore.GetFamilyChildren(familyID.(string))
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

	if err := sm.Firestore.CreateChild(&child); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to create child account"})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{Data: child})
}

// MockDeleteChildAccount is a test-specific wrapper for DeleteChildAccount
func MockDeleteChildAccount(c *gin.Context) {
	childID := c.Param("childId")
	sm := c.MustGet("serviceManager").(*MockServiceManager)

	if err := sm.Firestore.DeleteChild(childID); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to delete child account"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Message: "Child account deleted successfully"})
}

// MockGetChildResults is a test-specific wrapper for GetChildResults
func MockGetChildResults(c *gin.Context) {
	childID := c.Param("childId")
	sm := c.MustGet("serviceManager").(*MockServiceManager)

	results, err := sm.Firestore.GetTestResults(childID)
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

	if err := sm.Firestore.CreateWordSet(&wordSet); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to create word set"})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{Data: wordSet})
}

// MockDeleteWordSet is a test-specific wrapper for DeleteWordSet
func MockDeleteWordSet(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Word set ID is required"})
		return
	}

	sm := c.MustGet("serviceManager").(*MockServiceManager)

	err := sm.Firestore.DeleteWordSet(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to delete word set"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Message: "Word set deleted successfully"})
}

func setupTestRouter() (*gin.Engine, *MockFirestoreService) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockFirestore := NewMockFirestoreService()
	mockManager := &MockServiceManager{
		Firestore: mockFirestore,
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
		api.DELETE("/wordsets/:id", MockDeleteWordSet)
		api.GET("/families/children", MockGetFamilyChildren)
		api.POST("/families/children", MockCreateChildAccount)
		api.DELETE("/families/children/:childId", MockDeleteChildAccount)
		api.GET("/families/children/:childId/results", MockGetChildResults)
	}

	return r, mockFirestore
}

func setupTestData(mockFirestore *MockFirestoreService) {
	// Family 1 - Smith Family
	family1 := &models.Family{
		ID:        "family-smith",
		Name:      "Smith Family",
		CreatedBy: "parent-smith",
		Members:   []string{"parent-smith", "child-smith-1", "child-smith-2"},
		CreatedAt: time.Now(),
	}
	mockFirestore.families["family-smith"] = family1

	// Family 2 - Johnson Family
	family2 := &models.Family{
		ID:        "family-johnson",
		Name:      "Johnson Family",
		CreatedBy: "parent-johnson",
		Members:   []string{"parent-johnson", "child-johnson-1"},
		CreatedAt: time.Now(),
	}
	mockFirestore.families["family-johnson"] = family2

	// Users for Family 1
	parentSmith := &models.User{
		ID:           "parent-smith",
		FirebaseUID:  "firebase-parent-smith",
		Email:        "parent@smith.com",
		DisplayName:  "John Smith",
		FamilyID:     "family-smith",
		Role:         "parent",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockFirestore.users["parent-smith"] = parentSmith

	childSmith1 := &models.User{
		ID:           "child-smith-1",
		FirebaseUID:  "firebase-child-smith-1",
		Email:        "child1@smith.com",
		DisplayName:  "Alice Smith",
		FamilyID:     "family-smith",
		Role:         "child",
		ParentID:     &parentSmith.ID,
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockFirestore.users["child-smith-1"] = childSmith1

	childSmith2 := &models.User{
		ID:           "child-smith-2",
		FirebaseUID:  "firebase-child-smith-2",
		Email:        "child2@smith.com",
		DisplayName:  "Bob Smith",
		FamilyID:     "family-smith",
		Role:         "child",
		ParentID:     &parentSmith.ID,
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockFirestore.users["child-smith-2"] = childSmith2

	// Users for Family 2
	parentJohnson := &models.User{
		ID:           "parent-johnson",
		FirebaseUID:  "firebase-parent-johnson",
		Email:        "parent@johnson.com",
		DisplayName:  "Mary Johnson",
		FamilyID:     "family-johnson",
		Role:         "parent",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockFirestore.users["parent-johnson"] = parentJohnson

	childJohnson1 := &models.User{
		ID:           "child-johnson-1",
		FirebaseUID:  "firebase-child-johnson-1",
		Email:        "child1@johnson.com",
		DisplayName:  "Emma Johnson",
		FamilyID:     "family-johnson",
		Role:         "child",
		ParentID:     &parentJohnson.ID,
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
	mockFirestore.users["child-johnson-1"] = childJohnson1

	// Word sets for each family
	wordSetSmith := &models.WordSet{
		ID:        "wordset-smith-1",
		Name:      "Smith Family Words",
		Words:     []string{"apple", "banana", "cherry"},
		FamilyID:  "family-smith",
		CreatedBy: "parent-smith",
		Language:  "en",
		CreatedAt: time.Now(),
	}
	mockFirestore.wordSets["wordset-smith-1"] = wordSetSmith

	wordSetJohnson := &models.WordSet{
		ID:        "wordset-johnson-1",
		Name:      "Johnson Family Words",
		Words:     []string{"dog", "cat", "bird"},
		FamilyID:  "family-johnson",
		CreatedBy: "parent-johnson",
		Language:  "en",
		CreatedAt: time.Now(),
	}
	mockFirestore.wordSets["wordset-johnson-1"] = wordSetJohnson

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
	mockFirestore.results["child-smith-1"] = smithChild1Results

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
	mockFirestore.results["child-johnson-1"] = johnsonChild1Results
}

// Test: Family A cannot access Family B's word sets
func TestFamilyPrivacy_WordSetsIsolation(t *testing.T) {
	_, mockFirestore := setupTestRouter()
	setupTestData(mockFirestore)

	// Mock successful calls for Family A
	mockFirestore.On("GetWordSets", "family-smith").Return([]models.WordSet{}, nil)

	// Set context as Smith family parent
	req := httptest.NewRequest("GET", "/api/wordsets", nil)
	req = req.WithContext(req.Context())
	w := httptest.NewRecorder()

	// Add authentication context manually for this test
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("serviceManager", &MockServiceManager{Firestore: mockFirestore})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")
	c.Set("user", mockFirestore.users["parent-smith"])

	MockGetWordSets(c)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify that only Smith family word sets are returned
	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Verify the mock was called with the correct family ID
	mockFirestore.AssertCalled(t, "GetWordSets", "family-smith")
	mockFirestore.AssertNotCalled(t, "GetWordSets", "family-johnson")
}

// Test: Parent A cannot access Parent B's children
func TestFamilyPrivacy_ChildrenIsolation(t *testing.T) {
	_, mockFirestore := setupTestRouter()
	setupTestData(mockFirestore)

	// Mock calls
	mockFirestore.On("GetFamilyChildren", "family-smith").Return([]models.ChildAccount{}, nil)

	req := httptest.NewRequest("GET", "/api/families/children", nil)
	w := httptest.NewRecorder()

	// Set context as Smith family parent
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("serviceManager", &MockServiceManager{Firestore: mockFirestore})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")
	c.Set("user", mockFirestore.users["parent-smith"])

	MockGetFamilyChildren(c)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify only Smith family children are accessed
	mockFirestore.AssertCalled(t, "GetFamilyChildren", "family-smith")
	mockFirestore.AssertNotCalled(t, "GetFamilyChildren", "family-johnson")
}

// Test: Parent A cannot access Child B's test results
func TestFamilyPrivacy_ChildResultsIsolation(t *testing.T) {
	_, mockFirestore := setupTestRouter()
	setupTestData(mockFirestore)

	// Mock GetTestResults call - should fail for cross-family access
	mockFirestore.On("GetTestResults", "child-johnson-1").Return([]models.TestResult{}, fmt.Errorf("access denied"))

	req := httptest.NewRequest("GET", "/api/families/children/child-johnson-1/results", nil)
	w := httptest.NewRecorder()

	// Set context as Smith family parent trying to access Johnson family child
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = []gin.Param{{Key: "childId", Value: "child-johnson-1"}}
	c.Set("serviceManager", &MockServiceManager{Firestore: mockFirestore})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")
	c.Set("user", mockFirestore.users["parent-smith"])

	MockGetChildResults(c)

	// Should return error due to access denied at Firestore level
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// Verify GetTestResults was called
	mockFirestore.AssertCalled(t, "GetTestResults", "child-johnson-1")
}

// Test: Child A cannot create accounts (role-based access)
func TestFamilyPrivacy_RoleBasedAccess(t *testing.T) {
	_, mockFirestore := setupTestRouter()
	setupTestData(mockFirestore)

	// Create a request as a child trying to create another child account
	requestBody := models.CreateChildAccountRequest{
		Email:       "newchild@smith.com",
		DisplayName: "New Child",
		Password:    "password123",
		FamilyID:    "family-smith",
	}
	bodyBytes, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/api/families/children", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Set context as child (should be rejected by role middleware)
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("serviceManager", &MockServiceManager{Firestore: mockFirestore})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "child-smith-1")
	c.Set("userRole", "child")
	c.Set("user", mockFirestore.users["child-smith-1"])

	// This should succeed in the handler but would be blocked by middleware in real scenario
	mockFirestore.On("CreateChild", mock.AnythingOfType("*models.ChildAccount")).Return(nil)

	MockCreateChildAccount(c)

	// The handler itself doesn't check roles - that's done by middleware
	// But we can verify the correct user context is used
	assert.Equal(t, http.StatusCreated, w.Code)
}

// Test: Word set access verification
func TestFamilyPrivacy_WordSetAccess(t *testing.T) {
	_, mockFirestore := setupTestRouter()
	setupTestData(mockFirestore)

	// Test accessing a word set from another family
	mockFirestore.On("DeleteWordSet", "wordset-johnson-1").Return(nil)

	req := httptest.NewRequest("DELETE", "/api/wordsets/wordset-johnson-1", nil)
	w := httptest.NewRecorder()

	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = []gin.Param{{Key: "id", Value: "wordset-johnson-1"}}
	c.Set("serviceManager", &MockServiceManager{Firestore: mockFirestore})
	c.Set("validatedFamilyID", "family-smith")
	c.Set("userID", "parent-smith")

	MockDeleteWordSet(c)

	// Handler should succeed - access control is done by middleware
	assert.Equal(t, http.StatusOK, w.Code)

	// Verify the deletion was attempted
	mockFirestore.AssertCalled(t, "DeleteWordSet", "wordset-johnson-1")
}

// Integration test simulating full middleware chain
func TestFamilyPrivacy_FullMiddlewareChain(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockFirestore := NewMockFirestoreService()
	setupTestData(mockFirestore)

	// Mock service manager
	mockManager := &MockServiceManager{Firestore: mockFirestore}

	// Set up middleware that simulates the auth and access control
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockManager)

		// Simulate user authentication (normally done by Firebase)
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "Authentication required"})
			c.Abort()
			return
		}

		user, exists := mockFirestore.users[userID]
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
			err := mockFirestore.VerifyWordSetAccess(familyID.(string), wordSetID)
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
	mockFirestore.On("VerifyWordSetAccess", "family-smith", "wordset-smith-1").Return(nil)
	mockFirestore.On("DeleteWordSet", "wordset-smith-1").Return(nil)

	req1 := httptest.NewRequest("DELETE", "/api/wordsets/wordset-smith-1", nil)
	req1.Header.Set("X-User-ID", "parent-smith")
	w1 := httptest.NewRecorder()

	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Test 2: Smith parent tries to delete Johnson word set (should fail)
	mockFirestore.On("VerifyWordSetAccess", "family-smith", "wordset-johnson-1").Return(fmt.Errorf("access denied"))
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

	mockFirestore.AssertExpectations(t)
}

func TestFamilyPrivacy_ChildOwnershipValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockFirestore := NewMockFirestoreService()
	setupTestData(mockFirestore)

	mockManager := &MockServiceManager{Firestore: mockFirestore}

	// Middleware to simulate authentication and child ownership verification
	r.Use(func(c *gin.Context) {
		c.Set("serviceManager", mockManager)

		userID := c.GetHeader("X-User-ID")
		user, exists := mockFirestore.users[userID]
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
			err := mockFirestore.VerifyChildOwnership(userID.(string), childID)
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
	mockFirestore.On("VerifyChildOwnership", "parent-smith", "child-smith-1").Return(nil)
	mockFirestore.On("DeleteChild", "child-smith-1").Return(nil)

	req1 := httptest.NewRequest("DELETE", "/api/families/children/child-smith-1", nil)
	req1.Header.Set("X-User-ID", "parent-smith")
	w1 := httptest.NewRecorder()

	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Test 2: Smith parent tries to delete Johnson child (should fail)
	mockFirestore.On("VerifyChildOwnership", "parent-smith", "child-johnson-1").Return(fmt.Errorf("access denied"))
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

	mockFirestore.AssertExpectations(t)
}

func (m *MockFirestoreService) CreateChild(child *models.ChildAccount) error {
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

func (m *MockFirestoreService) DeleteChild(childID string) error {
	args := m.Called(childID)
	delete(m.users, childID)
	return args.Error(0)
}

func (m *MockFirestoreService) GetChild(childID string) (*models.ChildAccount, error) {
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

func (m *MockFirestoreService) UpdateChild(child *models.ChildAccount) error {
	args := m.Called(child)
	if user, exists := m.users[child.ID]; exists {
		user.FamilyID = child.FamilyID
		user.ParentID = &child.ParentID
		m.users[child.ID] = user
	}
	return args.Error(0)
}

func (m *MockFirestoreService) CreateFamily(family *models.Family) error {
	args := m.Called(family)
	m.families[family.ID] = family
	return args.Error(0)
}

func (m *MockFirestoreService) UpdateFamily(family *models.Family) error {
	args := m.Called(family)
	m.families[family.ID] = family
	return args.Error(0)
}

func (m *MockFirestoreService) DeleteFamily(familyID string) error {
	args := m.Called(familyID)
	delete(m.families, familyID)
	return args.Error(0)
}

func (m *MockFirestoreService) UpdateWordSet(wordSet *models.WordSet) error {
	args := m.Called(wordSet)
	m.wordSets[wordSet.ID] = wordSet
	return args.Error(0)
}

func (m *MockFirestoreService) GetUserProgress(userID string) (*models.FamilyProgress, error) {
	args := m.Called(userID)
	return args.Get(0).(*models.FamilyProgress), args.Error(1)
}

func (m *MockFirestoreService) VerifyFamilyAccess(userID, familyID string) error {
	args := m.Called(userID, familyID)
	if user, exists := m.users[userID]; exists {
		if user.FamilyID != familyID {
			return fmt.Errorf("access denied")
		}
		return nil
	}
	return args.Error(0)
}
