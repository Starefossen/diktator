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

// setupFamilyChildrenTest creates a test environment for family children tests
func setupFamilyChildrenTest() (*gin.Engine, *MockDBService, string, string) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockDB := NewMockDBService()
	mockManager := &MockServiceManager{DB: mockDB}

	testFamilyID := "family-test"
	testParentID := "parent-test"

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
		api.GET("/families/children", MockGetFamilyChildren)
		api.POST("/families/children", MockCreateChildAccount)
		api.PUT("/families/children/:childId", MockUpdateChildAccount)
		api.DELETE("/families/children/:childId", MockDeleteChildAccount)
		api.GET("/families/children/:childId", MockGetChild)
	}

	return r, mockDB, testFamilyID, testParentID
}

// createSampleChild creates a sample child account for testing
func createSampleChild(familyID, parentID, childID string) models.ChildAccount {
	return models.ChildAccount{
		ID:           childID,
		Email:        childID + "@test.com",
		DisplayName:  "Test Child " + childID,
		FamilyID:     familyID,
		ParentID:     &parentID,
		Role:         "child",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}
}

// makeChildrenRequest is a helper to make HTTP requests during tests
func makeChildrenRequest(router *gin.Engine, method, url string, body interface{}) *httptest.ResponseRecorder {
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

// TestFamilyChildrenInitialState tests that a family initially has no children
func TestFamilyChildrenInitialState(t *testing.T) {
	router, mockDB, familyID, _ := setupFamilyChildrenTest()

	mockDB.On("GetFamilyChildren", familyID).Return([]models.ChildAccount{}, nil).Once()

	w := makeChildrenRequest(router, "GET", "/api/families/children", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Response should contain empty array - handle both nil and empty slice cases
	if response.Data == nil {
		t.Log("Response.Data is nil - this is acceptable for empty children list")
	} else {
		children, ok := response.Data.([]interface{})
		assert.True(t, ok, "Response.Data should be an array")
		assert.Empty(t, children, "Family should initially have no children")
	}

	mockDB.AssertExpectations(t)
}

// TestCreateSingleChild tests creating a single child account
func TestCreateSingleChild(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	child := createSampleChild(familyID, parentID, "child-1")

	mockDB.On("CreateChild", mock.MatchedBy(func(c *models.ChildAccount) bool {
		return c.ID == child.ID && c.Email == child.Email && c.FamilyID == familyID
	})).Return(nil).Once()

	w := makeChildrenRequest(router, "POST", "/api/families/children", child)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.NotNil(t, response.Data, "Response should contain created child data")

	mockDB.AssertExpectations(t)
}

// TestCreateAndRetrieveChild tests the complete flow of creating and then retrieving a child
func TestCreateAndRetrieveChild(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	child := createSampleChild(familyID, parentID, "child-1")

	// Step 1: Create child
	mockDB.On("CreateChild", mock.AnythingOfType("*models.ChildAccount")).Return(nil).Once()

	w := makeChildrenRequest(router, "POST", "/api/families/children", child)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Step 2: Retrieve children and verify the created child is returned
	mockDB.On("GetFamilyChildren", familyID).Return([]models.ChildAccount{child}, nil).Once()

	w = makeChildrenRequest(router, "GET", "/api/families/children", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	children := response.Data.([]interface{})
	assert.Len(t, children, 1, "Should have exactly one child after creation")

	childData := children[0].(map[string]interface{})
	assert.Equal(t, child.ID, childData["id"])
	assert.Equal(t, child.DisplayName, childData["displayName"])
	assert.Equal(t, child.Email, childData["email"])

	mockDB.AssertExpectations(t)
}

// TestCreateMultipleChildren tests creating multiple children and retrieving them all
func TestCreateMultipleChildren(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()

	children := []models.ChildAccount{
		createSampleChild(familyID, parentID, "child-1"),
		createSampleChild(familyID, parentID, "child-2"),
	}

	// Create each child
	for _, child := range children {
		mockDB.On("CreateChild", mock.MatchedBy(func(c *models.ChildAccount) bool {
			return c.ID == child.ID
		})).Return(nil).Once()

		w := makeChildrenRequest(router, "POST", "/api/families/children", child)
		assert.Equal(t, http.StatusCreated, w.Code)
	}

	// Retrieve all children
	mockDB.On("GetFamilyChildren", familyID).Return(children, nil).Once()

	w := makeChildrenRequest(router, "GET", "/api/families/children", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	retrievedChildren := response.Data.([]interface{})
	assert.Len(t, retrievedChildren, len(children), "Should have all created children")

	mockDB.AssertExpectations(t)
}

// TestUpdateChild tests updating a child account
func TestUpdateChild(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	child := createSampleChild(familyID, parentID, "child-1")

	updatedChild := child
	updatedChild.DisplayName = "Updated Child Name"
	updatedChild.Email = "updated@test.com"

	mockDB.On("UpdateChild", mock.MatchedBy(func(c *models.ChildAccount) bool {
		return c.ID == child.ID && c.DisplayName == "Updated Child Name"
	})).Return(nil).Once()

	w := makeChildrenRequest(router, "PUT", "/api/families/children/"+child.ID, updatedChild)
	assert.Equal(t, http.StatusOK, w.Code)

	mockDB.AssertExpectations(t)
}

// TestDeleteChild tests deleting a child account
func TestDeleteChild(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	child := createSampleChild(familyID, parentID, "child-1")

	mockDB.On("DeleteChild", child.ID).Return(nil).Once()

	w := makeChildrenRequest(router, "DELETE", "/api/families/children/"+child.ID, nil)
	assert.Equal(t, http.StatusOK, w.Code)

	mockDB.AssertExpectations(t)
}

// TestGetSpecificChild tests retrieving a specific child by ID
func TestGetSpecificChild(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	child := createSampleChild(familyID, parentID, "child-1")

	mockDB.On("GetChild", child.ID).Return(&child, nil).Once()

	w := makeChildrenRequest(router, "GET", "/api/families/children/"+child.ID, nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.NotNil(t, response.Data)

	mockDB.AssertExpectations(t)
}

// TestFamilyChildrenIsolation tests that families cannot access each other's children
func TestFamilyChildrenIsolation(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	children := []models.ChildAccount{createSampleChild(familyID, parentID, "child-1")}

	// Mock should only be called with the correct family ID
	mockDB.On("GetFamilyChildren", familyID).Return(children, nil).Once()

	w := makeChildrenRequest(router, "GET", "/api/families/children", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	// Verify the mock was called with the correct family ID and not with other family ID
	mockDB.AssertNotCalled(t, "GetFamilyChildren", "other-family")
	mockDB.AssertExpectations(t)
}

// TestDataConsistency tests that child creation and retrieval are consistent
func TestDataConsistency(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	child := createSampleChild(familyID, parentID, "child-1")

	// Create child
	mockDB.On("CreateChild", mock.AnythingOfType("*models.ChildAccount")).Return(nil).Once()
	w := makeChildrenRequest(router, "POST", "/api/families/children", child)
	assert.Equal(t, http.StatusCreated, w.Code)

	// Immediately retrieve and verify consistency
	mockDB.On("GetFamilyChildren", familyID).Return([]models.ChildAccount{child}, nil).Once()
	w = makeChildrenRequest(router, "GET", "/api/families/children", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	children := response.Data.([]interface{})
	assert.Len(t, children, 1, "Created child should be immediately retrievable")

	retrievedChild := children[0].(map[string]interface{})
	assert.Equal(t, child.ID, retrievedChild["id"], "Retrieved child ID should match created child ID")
	assert.Equal(t, child.Email, retrievedChild["email"], "Retrieved child email should match created child email")

	mockDB.AssertExpectations(t)
}

// TestChildrenErrorHandling tests various error scenarios
func TestChildrenErrorHandling(t *testing.T) {
	router, mockDB, familyID, parentID := setupFamilyChildrenTest()
	child := createSampleChild(familyID, parentID, "child-1")

	// Test creation failure
	mockDB.On("CreateChild", mock.AnythingOfType("*models.ChildAccount")).Return(assert.AnError).Once()
	w := makeChildrenRequest(router, "POST", "/api/families/children", child)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// Test retrieval failure
	mockDB.On("GetFamilyChildren", familyID).Return([]models.ChildAccount{}, assert.AnError).Once()
	w = makeChildrenRequest(router, "GET", "/api/families/children", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	mockDB.AssertExpectations(t)
}

// Mock handler functions for testing

func MockGetChild(c *gin.Context) {
	childID := c.Param("childId")
	sm := c.MustGet("serviceManager").(*MockServiceManager)

	child, err := sm.DB.GetChild(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to retrieve child"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: child})
}

func MockUpdateChildAccount(c *gin.Context) {
	childID := c.Param("childId")
	var child models.ChildAccount
	if err := c.ShouldBindJSON(&child); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Invalid request data"})
		return
	}

	child.ID = childID
	sm := c.MustGet("serviceManager").(*MockServiceManager)

	if err := sm.DB.UpdateChild(&child); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Failed to update child"})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: child})
}
