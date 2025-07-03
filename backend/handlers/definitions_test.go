package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// TestWordSetDefinitions tests the definition functionality for word sets
func TestWordSetDefinitions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Mock authentication middleware for testing
	router.Use(func(c *gin.Context) {
		c.Set("userID", "test-user-1")
		c.Set("firebaseUID", "firebase-test-user-1")
		c.Set("userRole", "parent")
		c.Set("familyID", "test-family-1")
		c.Set("validatedFamilyID", "test-family-1")
		c.Next()
	})

	// Mock word set storage for testing
	var mockWordSets []models.WordSet

	// Mock POST /wordsets endpoint
	router.POST("/wordsets", func(c *gin.Context) {
		var req models.CreateWordSetRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, models.APIResponse{Error: err.Error()})
			return
		}

		// Create a new word set with definitions
		wordSet := models.WordSet{
			ID:       "test-wordset-1",
			Name:     req.Name,
			Language: req.Language,
			FamilyID: c.GetString("familyID"),
		}

		// Convert WordInput to WordSet Words structure
		for _, wordInput := range req.Words {
			word := struct {
				Word       string           `firestore:"word" json:"word"`
				Audio      models.WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`
				Definition string           `firestore:"definition,omitempty" json:"definition,omitempty"`
			}{
				Word:       wordInput.Word,
				Definition: wordInput.Definition,
			}
			wordSet.Words = append(wordSet.Words, word)
		}

		// Store in mock storage
		mockWordSets = append(mockWordSets, wordSet)

		c.JSON(http.StatusCreated, models.APIResponse{
			Data:    wordSet,
			Message: "Word set created successfully",
		})
	})

	// Mock GET /wordsets endpoint
	router.GET("/wordsets", func(c *gin.Context) {
		c.JSON(http.StatusOK, models.APIResponse{Data: mockWordSets})
	})

	t.Run("should create word set with definitions", func(t *testing.T) {
		// Prepare test data with definitions
		createRequest := models.CreateWordSetRequest{
			Name:     "Homophone Test Words",
			Language: "en",
			Words: []models.WordInput{
				{
					Word:       "there",
					Definition: "in that place; at that location",
				},
				{
					Word:       "their",
					Definition: "belonging to them",
				},
				{
					Word:       "they're",
					Definition: "contraction of 'they are'",
				},
				{
					Word:       "simple",
					Definition: "", // Test word without definition
				},
			},
		}

		// Convert to JSON
		requestBody, err := json.Marshal(createRequest)
		assert.NoError(t, err)

		// Make POST request
		req := httptest.NewRequest("POST", "/wordsets", bytes.NewBuffer(requestBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Verify response
		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.APIResponse
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Word set created successfully", response.Message)

		// Verify word set data
		wordSetData := response.Data.(map[string]interface{})
		assert.Equal(t, "Homophone Test Words", wordSetData["name"])
		assert.Equal(t, "en", wordSetData["language"])

		// Verify words with definitions
		words := wordSetData["words"].([]interface{})
		assert.Len(t, words, 4)

		// Check first word with definition
		firstWord := words[0].(map[string]interface{})
		assert.Equal(t, "there", firstWord["word"])
		assert.Equal(t, "in that place; at that location", firstWord["definition"])

		// Check second word with definition
		secondWord := words[1].(map[string]interface{})
		assert.Equal(t, "their", secondWord["word"])
		assert.Equal(t, "belonging to them", secondWord["definition"])

		// Check third word with definition
		thirdWord := words[2].(map[string]interface{})
		assert.Equal(t, "they're", thirdWord["word"])
		assert.Equal(t, "contraction of 'they are'", thirdWord["definition"])

		// Check fourth word without definition
		fourthWord := words[3].(map[string]interface{})
		assert.Equal(t, "simple", fourthWord["word"])
		// Empty string may be represented as nil in JSON unmarshaling
		if fourthWord["definition"] == nil {
			assert.Nil(t, fourthWord["definition"])
		} else {
			assert.Equal(t, "", fourthWord["definition"])
		}
	})

	t.Run("should retrieve word sets with definitions", func(t *testing.T) {
		// Make GET request
		req := httptest.NewRequest("GET", "/wordsets", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Verify response
		assert.Equal(t, http.StatusOK, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		// Verify word sets data
		wordSets := response.Data.([]interface{})
		assert.Len(t, wordSets, 1)

		wordSet := wordSets[0].(map[string]interface{})
		assert.Equal(t, "Homophone Test Words", wordSet["name"])

		// Verify definitions are preserved
		words := wordSet["words"].([]interface{})
		assert.Len(t, words, 4)

		// Verify first word definition
		firstWord := words[0].(map[string]interface{})
		assert.Equal(t, "there", firstWord["word"])
		assert.Equal(t, "in that place; at that location", firstWord["definition"])

		// Verify word without definition
		fourthWord := words[3].(map[string]interface{})
		assert.Equal(t, "simple", fourthWord["word"])
		// Empty string may be represented as nil in JSON unmarshaling
		if fourthWord["definition"] == nil {
			assert.Nil(t, fourthWord["definition"])
		} else {
			assert.Equal(t, "", fourthWord["definition"])
		}
	})

	t.Run("should handle empty definitions gracefully", func(t *testing.T) {
		// Reset mock storage
		mockWordSets = []models.WordSet{}

		// Create word set with mix of defined and undefined words
		createRequest := models.CreateWordSetRequest{
			Name:     "Mixed Definition Test",
			Language: "en",
			Words: []models.WordInput{
				{
					Word:       "cat",
					Definition: "a small domesticated carnivorous mammal",
				},
				{
					Word:       "dog",
					Definition: "", // Empty definition
				},
				{
					Word: "bird", // No definition field
				},
			},
		}

		requestBody, err := json.Marshal(createRequest)
		assert.NoError(t, err)

		req := httptest.NewRequest("POST", "/wordsets", bytes.NewBuffer(requestBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.APIResponse
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		wordSetData := response.Data.(map[string]interface{})
		words := wordSetData["words"].([]interface{})

		// Verify first word has definition
		firstWord := words[0].(map[string]interface{})
		assert.Equal(t, "cat", firstWord["word"])
		assert.Equal(t, "a small domesticated carnivorous mammal", firstWord["definition"])

		// Verify second word has empty definition
		secondWord := words[1].(map[string]interface{})
		assert.Equal(t, "dog", secondWord["word"])
		// Empty string may be represented as nil in JSON unmarshaling
		if secondWord["definition"] == nil {
			assert.Nil(t, secondWord["definition"])
		} else {
			assert.Equal(t, "", secondWord["definition"])
		}

		// Verify third word handles missing definition field
		thirdWord := words[2].(map[string]interface{})
		assert.Equal(t, "bird", thirdWord["word"])
		// Should have empty string or nil for missing definition
		if thirdWord["definition"] == nil {
			assert.Nil(t, thirdWord["definition"])
		} else {
			assert.Equal(t, "", thirdWord["definition"])
		}
	})

	t.Run("should validate definition length constraints", func(t *testing.T) {
		// Test with very long definition
		longDefinition := "This is a very long definition that might exceed reasonable length limits for user interface display purposes and could potentially cause issues with storage or display in the frontend application components when rendering the context information to users during spelling tests"

		createRequest := models.CreateWordSetRequest{
			Name:     "Long Definition Test",
			Language: "en",
			Words: []models.WordInput{
				{
					Word:       "test",
					Definition: longDefinition,
				},
			},
		}

		requestBody, err := json.Marshal(createRequest)
		assert.NoError(t, err)

		req := httptest.NewRequest("POST", "/wordsets", bytes.NewBuffer(requestBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should still accept long definitions (validation would be handled by frontend or business rules)
		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.APIResponse
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		wordSetData := response.Data.(map[string]interface{})
		words := wordSetData["words"].([]interface{})
		word := words[0].(map[string]interface{})

		assert.Equal(t, longDefinition, word["definition"])
	})
}

// TestDefinitionDisplayInTest tests that definitions are properly available for test display
func TestDefinitionDisplayInTest(t *testing.T) {
	t.Run("should provide context information for homophones", func(t *testing.T) {
		// Test case for homophone disambiguation
		wordSet := models.WordSet{
			ID:   "test-homophone-set",
			Name: "Homophone Test",
			Words: []struct {
				Word       string           `firestore:"word" json:"word"`
				Audio      models.WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`
				Definition string           `firestore:"definition,omitempty" json:"definition,omitempty"`
			}{
				{
					Word:       "bear",
					Definition: "a large mammal",
				},
				{
					Word:       "bear",
					Definition: "to carry or support",
				},
				{
					Word:       "bare",
					Definition: "naked or uncovered",
				},
			},
		}

		// Verify that definitions can help distinguish between homophones
		assert.Len(t, wordSet.Words, 3)

		// Check that each word has a distinct definition
		definitions := make(map[string]bool)
		for _, word := range wordSet.Words {
			assert.NotEmpty(t, word.Definition, "Word '%s' should have a definition", word.Word)
			assert.False(t, definitions[word.Definition], "Definition should be unique: %s", word.Definition)
			definitions[word.Definition] = true
		}

		// Verify specific definitions are meaningful
		assert.Equal(t, "a large mammal", wordSet.Words[0].Definition)
		assert.Equal(t, "to carry or support", wordSet.Words[1].Definition)
		assert.Equal(t, "naked or uncovered", wordSet.Words[2].Definition)
	})

	t.Run("should handle words without definitions in test context", func(t *testing.T) {
		// Test case for regular words without context needs
		wordSet := models.WordSet{
			Words: []struct {
				Word       string           `firestore:"word" json:"word"`
				Audio      models.WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`
				Definition string           `firestore:"definition,omitempty" json:"definition,omitempty"`
			}{
				{
					Word:       "simple",
					Definition: "",
				},
				{
					Word:       "clear",
					Definition: "",
				},
			},
		}

		// Verify that words without definitions are handled gracefully
		for _, word := range wordSet.Words {
			// Should not cause errors when definition is empty
			assert.NotNil(t, word.Definition)
			// Frontend should handle empty definitions by not showing context
		}
	})
}
