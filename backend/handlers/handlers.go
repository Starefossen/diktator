package handlers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
	"github.com/starefossen/diktator/backend/internal/services/auth"
	"github.com/starefossen/diktator/backend/internal/services/db"
	"github.com/starefossen/diktator/backend/internal/services/xp"
)

var serviceManager *services.Manager

// InitializeServices initializes the service manager
func InitializeServices(manager *services.Manager) error {
	serviceManager = manager
	return nil
}

// CloseServices closes all services
func CloseServices() error {
	if serviceManager != nil {
		return serviceManager.Close()
	}
	return nil
}

// Helper function to safely extract string from gin context
func getContextString(c *gin.Context, key string) (string, error) {
	val, exists := c.Get(key)
	if !exists {
		return "", fmt.Errorf("%s not found in context", key)
	}
	str, ok := val.(string)
	if !ok {
		return "", fmt.Errorf("%s is not a string", key)
	}
	return str, nil
}

// HealthCheck returns the health status of the API.
//
// @Summary		Health Check
// @Description	Returns the health status of the API
// @Tags			health
// @Accept			json
// @Produce		json
// @Success		200	{object}	map[string]interface{}	"Health status"
// @Router			/health [get]
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "diktator-api",
		"time":    time.Now().UTC(),
	})
}

// GetServiceManager retrieves the service manager from context or returns the global one
func GetServiceManager(c *gin.Context) *services.Manager {
	if sm, exists := c.Get("serviceManager"); exists {
		if realSM, ok := sm.(*services.Manager); ok {
			return realSM
		}
	}
	return serviceManager
}

// @Summary		Get Word Sets
// @Description	Get word sets for the authenticated user's family
// @Tags			wordsets
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Word sets for the family"
// @Failure		401	{object}	models.APIResponse	"Family access validation required"
// @Failure		500	{object}	models.APIResponse	"Service unavailable or failed to retrieve word sets"
// @Security		BearerAuth
// @Router			/api/wordsets [get]
func GetWordSets(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
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

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}
	log.Default().Printf("User ID: %s", userID)
	log.Default().Printf("Family ID: %s", familyID)

	familyIDStr, ok := familyID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Invalid family ID",
		})
		return
	}

	wordSets, err := serviceManager.DB.GetWordSets(familyIDStr)
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

// @Summary		Get Curated Word Sets
// @Description	Get curated word sets available to all users (global/official word sets)
// @Tags			wordsets
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Curated word sets"
// @Failure		500	{object}	models.APIResponse	"Service unavailable or failed to retrieve word sets"
// @Security		BearerAuth
// @Router			/api/wordsets/curated [get]
func GetCuratedWordSets(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	wordSets, err := serviceManager.DB.GetGlobalWordSets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve curated word sets",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: wordSets,
	})
}

// CreateWordSet creates a new word set
//
//	@Summary		Create Word Set
//	@Description	Create a new word set for practice
//	@Tags			wordsets
//	@Accept			json
//	@Produce		json
//	@Param			request	body		models.CreateWordSetRequest	true	"Word set creation request"
//	@Success		201		{object}	models.APIResponse			"Word set created successfully"
//	@Failure		400		{object}	models.APIResponse			"Invalid request data"
//	@Failure		401		{object}	models.APIResponse			"User authentication required"
//	@Failure		500		{object}	models.APIResponse			"Failed to create word set"
//	@Security		BearerAuth
//	@Router			/api/wordsets [post]
func CreateWordSet(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	var req models.CreateWordSetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// Get authenticated user info from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	// Convert WordInput to WordItem structs
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

	// Create new word set
	familyIDStr, ok := familyID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	wordSet := &models.WordSet{
		ID:                uuid.New().String(),
		Name:              req.Name,
		FamilyID:          &familyIDStr,
		IsGlobal:          false,
		CreatedBy:         userIDStr,
		Language:          req.Language,
		TestConfiguration: req.TestConfiguration,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	// Convert Words manually to avoid type mismatch
	for _, w := range words {
		wordSet.Words = append(wordSet.Words, struct {
			Word         string               `json:"word"`
			Audio        models.WordAudio     `json:"audio,omitempty"`
			Definition   string               `json:"definition,omitempty"`
			Translations []models.Translation `json:"translations,omitempty"`
		}{
			Word:         w.Word,
			Audio:        w.Audio,
			Definition:   w.Definition,
			Translations: w.Translations,
		})
	}

	err := serviceManager.DB.CreateWordSet(wordSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create word set",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    wordSet,
		Message: "Word set created successfully. Audio is generated on-demand when needed.",
	})
}

// UpdateWordSet updates an existing word set
//
//	@Summary		Update Word Set
//	@Description	Update an existing word set name, words, and configuration. Audio will be regenerated automatically for new/changed words.
//	@Tags			wordsets
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string						true	"Word Set ID"
//	@Param			request	body		models.UpdateWordSetRequest	true	"Word set update request"
//	@Success		200		{object}	models.APIResponse			"Word set updated successfully"
//	@Failure		400		{object}	models.APIResponse			"Invalid request data or word set ID required"
//	@Failure		401		{object}	models.APIResponse			"User authentication required"
//	@Failure		404		{object}	models.APIResponse			"Word set not found"
//	@Failure		500		{object}	models.APIResponse			"Failed to update word set"
//	@Security		BearerAuth
//	@Router			/api/wordsets/{id} [put]
func UpdateWordSet(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	var req models.UpdateWordSetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// Get authenticated user info from context
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	_, exists = c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	// Get existing word set to check ownership and get current state
	existingWordSet, err := serviceManager.DB.GetWordSet(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "Word set not found",
		})
		return
	}

	// Prevent editing global (curated) word sets
	if existingWordSet.IsGlobal {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: "Cannot edit curated word sets",
		})
		return
	}

	// Verify family access
	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	if existingWordSet.FamilyID == nil || *existingWordSet.FamilyID != familyIDStr {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "Word set not found",
		})
		return
	}

	// Store original words for comparison
	originalWords := make(map[string]bool)
	for _, wordItem := range existingWordSet.Words {
		originalWords[wordItem.Word] = true
	}

	// Convert string words to WordItem structs, preserving existing audio for unchanged words
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

		// Preserve existing audio for unchanged words
		for _, existingWord := range existingWordSet.Words {
			if existingWord.Word == wordInput.Word {
				words[i].Audio = existingWord.Audio
				// Only preserve existing definition if new one is empty
				if wordInput.Definition == "" {
					words[i].Definition = existingWord.Definition
				}
				break
			}
		}
	}

	// Update the word set
	updatedWordSet := &models.WordSet{
		ID:                existingWordSet.ID,
		Name:              req.Name,
		FamilyID:          existingWordSet.FamilyID,
		CreatedBy:         existingWordSet.CreatedBy,
		Language:          req.Language,
		TestConfiguration: req.TestConfiguration,
		CreatedAt:         existingWordSet.CreatedAt,
		UpdatedAt:         time.Now(),
	}

	// Convert Words manually to avoid type mismatch
	for _, w := range words {
		updatedWordSet.Words = append(updatedWordSet.Words, struct {
			Word         string               `json:"word"`
			Audio        models.WordAudio     `json:"audio,omitempty"`
			Definition   string               `json:"definition,omitempty"`
			Translations []models.Translation `json:"translations,omitempty"`
		}{
			Word:         w.Word,
			Audio:        w.Audio,
			Definition:   w.Definition,
			Translations: w.Translations,
		})
	}

	// Audio is now generated on-demand, no pre-generation status tracking needed

	err = serviceManager.DB.UpdateWordSet(updatedWordSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to update word set",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    updatedWordSet,
		Message: "Word set updated successfully",
	})
}

// DeleteWordSet deletes a word set and all associated audio files
//
//	@Summary		Delete Word Set
//	@Description	Delete a word set by ID and all associated audio files from storage
//	@Tags			wordsets
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string	true	"Word Set ID"
//	@Success		200	{object}	models.APIResponse	"Word set and audio files deleted successfully"
//	@Failure		400	{object}	models.APIResponse	"Word set ID is required"
//	@Failure		404	{object}	models.APIResponse	"Word set not found"
//	@Failure		500	{object}	models.APIResponse	"Failed to delete word set"
//	@Security		BearerAuth
//	@Router			/api/wordsets/{id} [delete]
func DeleteWordSet(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	sm := GetServiceManager(c)
	if sm == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	// Check if word set is global (curated) - prevent deletion
	isGlobal, err := sm.DB.IsGlobalWordSet(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "Word set not found",
		})
		return
	}
	if isGlobal {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: "Cannot delete curated word sets",
		})
		return
	}

	err = sm.DB.DeleteWordSet(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to delete word set",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Word set deleted successfully",
	})
}

// @Summary		Assign Word Set to User
// @Description	Assign a word set to a child user (parent only)
// @Tags			wordsets
// @Accept			json
// @Produce		json
// @Param			id		path		string				true	"Word set ID"
// @Param			userId	path		string				true	"Child user ID"
// @Success		200		{object}	models.APIResponse	"Word set assigned successfully"
// @Failure		400		{object}	models.APIResponse	"Invalid request"
// @Failure		403		{object}	models.APIResponse	"Parent role required"
// @Failure		500		{object}	models.APIResponse	"Failed to assign word set"
// @Security		BearerAuth
// @Router			/api/wordsets/{id}/assignments/{userId} [post]
func AssignWordSetToUser(c *gin.Context) {
	wordSetID := c.Param("id")
	userID := c.Param("userId")

	if wordSetID == "" || userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID and user ID are required",
		})
		return
	}

	sm := GetServiceManager(c)
	if sm == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	// Get the authenticated user ID (parent making the assignment)
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	// Verify the child user is in the same family
	_, exists = c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	// Verify the child belongs to the family
	childUser, err := sm.DB.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Child user not found",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	if childUser.FamilyID != familyIDStr {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: "Child user not in your family",
		})
		return
	}

	assignedByStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	err = sm.DB.AssignWordSetToUser(wordSetID, userID, assignedByStr)
	if err != nil {
		// Check for specific error types to return appropriate status codes
		errMsg := err.Error()
		if errMsg == "user not found" || errMsg == "only children can be assigned to wordsets" {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: errMsg,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: fmt.Sprintf("Failed to assign word set: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Word set assigned successfully",
	})
}

// @Summary		Unassign Word Set from User
// @Description	Remove a word set assignment from a child user (parent only)
// @Tags			wordsets
// @Accept			json
// @Produce		json
// @Param			id		path		string				true	"Word set ID"
// @Param			userId	path		string				true	"Child user ID"
// @Success		200		{object}	models.APIResponse	"Word set unassigned successfully"
// @Failure		400		{object}	models.APIResponse	"Invalid request"
// @Failure		403		{object}	models.APIResponse	"Parent role required"
// @Failure		500		{object}	models.APIResponse	"Failed to unassign word set"
// @Security		BearerAuth
// @Router			/api/wordsets/{id}/assignments/{userId} [delete]
func UnassignWordSetFromUser(c *gin.Context) {
	wordSetID := c.Param("id")
	userID := c.Param("userId")

	if wordSetID == "" || userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID and user ID are required",
		})
		return
	}

	sm := GetServiceManager(c)
	if sm == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	// Verify the child user is in the same family
	_, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	childUser, err := sm.DB.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Child user not found",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	if childUser.FamilyID != familyIDStr {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: "Child user not in your family",
		})
		return
	}

	err = sm.DB.UnassignWordSetFromUser(wordSetID, userID)
	if err != nil {
		if err.Error() == "assignment not found" {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: "Assignment not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: fmt.Sprintf("Failed to unassign word set: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Word set unassigned successfully",
	})
}

// @Summary		Save Test Result
// @Description	Save a test result for the authenticated user
// @Tags			users
// @Accept			json
// @Produce		json
// @Param			request	body		models.SaveResultRequest	true	"Test result data"
// @Success		201		{object}	models.APIResponse			"Test result saved successfully"
// @Failure		400		{object}	models.APIResponse			"Invalid request data"
// @Failure		401		{object}	models.APIResponse			"User authentication required"
// @Failure		500		{object}	models.APIResponse			"Failed to save test result"
// @Security		BearerAuth
// @Router			/api/users/results [post]
func SaveResult(c *gin.Context) {
	var req models.SaveResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// Get userID from authenticated context
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	// Validate translation mode requirements
	if req.Mode == "translation" {
		// Get the wordset to check if translations exist
		wordSet, err := serviceManager.DB.GetWordSet(req.WordSetID)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: "Failed to validate wordset for translation mode",
			})
			return
		}

		// Check if any word has translations
		hasTranslations := false
		for _, word := range wordSet.Words {
			if len(word.Translations) > 0 {
				hasTranslations = true
				break
			}
		}

		if !hasTranslations {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: "Cannot save translation mode result: wordset has no translations",
			})
			return
		}
	}

	// Create test result
	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	result := &models.TestResult{
		ID:             uuid.New().String(),
		WordSetID:      req.WordSetID,
		UserID:         userIDStr,
		Score:          req.Score,
		TotalWords:     req.TotalWords,
		CorrectWords:   req.CorrectWords,
		Mode:           req.Mode,
		IncorrectWords: req.IncorrectWords, // Keep for backward compatibility
		Words:          req.Words,          // New detailed word information
		TimeSpent:      req.TimeSpent,
		CompletedAt:    time.Now(),
		CreatedAt:      time.Now(),
	}

	// Calculate and award XP before saving the result
	var xpInfo *models.XPInfo
	if serviceManager.XP != nil {
		xpResult, err := serviceManager.XP.AwardXP(userIDStr, result)
		if err != nil {
			log.Printf("[SaveResult] Warning: failed to award XP for user %s: %v", userIDStr, err)
			// Continue without XP - don't fail the whole request
		} else {
			result.XPAwarded = xpResult.Awarded
			xpInfo = &models.XPInfo{
				Awarded:        xpResult.Awarded,
				Total:          xpResult.Total,
				Level:          xpResult.Level,
				LevelName:      xpResult.LevelName,
				LevelNameNO:    xpResult.LevelNameNO,
				LevelIconPath:  xpResult.LevelIconPath,
				LevelUp:        xpResult.LevelUp,
				PreviousLevel:  xpResult.PreviousLevel,
				NextLevelXP:    xpResult.NextLevelXP,
				CurrentLevelXP: xpResult.CurrentLevelXP,
			}
		}
	}

	err = serviceManager.DB.SaveTestResult(result)
	if err != nil {
		log.Printf("[SaveResult] Error saving test result for user %s, wordset %s: %v", userIDStr, req.WordSetID, err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to save test result",
		})
		return
	}

	// Return response with XP info
	response := models.SaveResultResponse{
		TestResult: result,
		XP:         xpInfo,
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    response,
		Message: "Test result saved successfully",
	})
}

// @Summary		Get Test Results
// @Description	Get test results for the authenticated user
// @Tags			users
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Test results"
// @Failure		401	{object}	models.APIResponse	"User authentication required"
// @Failure		500	{object}	models.APIResponse	"Failed to retrieve test results"
// @Security		BearerAuth
// @Router			/api/users/results [get]
func GetResults(c *gin.Context) {
	// Get userID from authenticated context
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	results, err := serviceManager.DB.GetTestResults(userIDStr)
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

// Invitation handlers

// @Summary		Get Pending Invitations
// @Description	Get all pending invitations for the authenticated user's email
// @Tags			invitations
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Pending invitations retrieved"
// @Failure		500	{object}	models.APIResponse	"Failed to retrieve invitations"
// @Security		BearerAuth
// @Router			/api/invitations/pending [get]
func GetPendingInvitations(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	// Get email from identity context (works with OIDCBasicAuthMiddleware)
	identity, exists := c.Get("identity")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Authentication required",
		})
		return
	}

	authIdentity, ok := identity.(*auth.Identity)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Invalid identity data",
		})
		return
	}

	email := authIdentity.Email
	if email == "" {
		// Email not in token - return empty array instead of error
		// This allows the flow to continue to registration
		log.Printf("[GetPendingInvitations] Email not in token for auth_id=%s, returning empty invitations list", authIdentity.ID)
		c.JSON(http.StatusOK, models.APIResponse{
			Data: []models.FamilyInvitation{},
		})
		return
	}

	invitations, err := serviceManager.DB.GetPendingInvitationsByEmail(email)
	if err != nil {
		log.Printf("ERROR getting pending invitations: %v (email=%s)", err, email)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve invitations",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: invitations,
	})
}

// @Summary		Accept Invitation
// @Description	Accept a pending family invitation and join the family. For first-time users, this also links their OIDC identity to the family child account.
// @Tags			invitations
// @Accept			json
// @Produce		json
// @Param			invitationId	path		string				true	"Invitation ID"
// @Success		200				{object}	models.APIResponse	"Invitation accepted successfully"
// @Failure		400				{object}	models.APIResponse	"Invalid invitation ID"
// @Failure		404				{object}	models.APIResponse	"Invitation not found"
// @Failure		500				{object}	models.APIResponse	"Failed to accept invitation"
// @Security		BearerAuth
// @Router			/api/invitations/{invitationId}/accept [post]
func AcceptInvitation(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	invitationID := c.Param("invitationId")
	if invitationID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invitation ID required",
		})
		return
	}

	// Try to get existing userID (for users who already have an account)
	_, userExists := c.Get("userID")

	// If user doesn't exist yet, this is a first-time login accepting an invitation
	// We need to link their OIDC identity to the existing child account
	if !userExists {
		_, authExists := c.Get("authIdentityID")
		if !authExists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Authentication required",
			})
			return
		}

		identity, identityExists := c.Get("identity")
		if !identityExists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Identity information required",
			})
			return
		}

		authIdentity, ok := identity.(*auth.Identity)
		if !ok {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Invalid identity data",
			})
			return
		}

		// Get the invitation to find the existing child account
		invitations, err := serviceManager.DB.GetPendingInvitationsByEmail(authIdentity.Email)
		if err != nil || len(invitations) == 0 {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: "No pending invitations found for your email",
			})
			return
		}

		// Find the specific invitation
		var targetInvitation *models.FamilyInvitation
		for i := range invitations {
			if invitations[i].ID == invitationID {
				targetInvitation = &invitations[i]
				break
			}
		}

		if targetInvitation == nil {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: "Invitation not found",
			})
			return
		}

		// Check if user already exists (in case they were created before the code fix)
		existingUser, err := serviceManager.DB.GetUserByEmail(authIdentity.Email)
		if err != nil && err != db.ErrUserNotFound {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Failed to check user: " + err.Error(),
			})
			return
		}

		authIDStr, err := getContextString(c, "authIdentityID")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid auth identity ID"})
			return
		}

		var newUserID string

		if existingUser != nil {
			// User already exists (legacy flow) - just link the auth ID
			if err := serviceManager.DB.LinkUserToAuthID(existingUser.ID, authIDStr); err != nil {
				log.Printf("ERROR linking user to auth ID: %v (userID=%s, authID=%s)", err, existingUser.ID, authIDStr)
				c.JSON(http.StatusInternalServerError, models.APIResponse{
					Error: "Failed to link account: " + err.Error(),
				})
				return
			}
			newUserID = existingUser.ID
		} else {
			// Create new user with their auth ID as the user ID
			newUserID = authIDStr

			// Use email prefix as display name (user can update later)
			displayName := strings.Split(authIdentity.Email, "@")[0]

			newUser := &models.User{
				ID:           newUserID,
				AuthID:       newUserID,
				Email:        authIdentity.Email,
				DisplayName:  displayName,
				FamilyID:     targetInvitation.FamilyID,
				Role:         targetInvitation.Role,
				IsActive:     true,
				CreatedAt:    time.Now(),
				LastActiveAt: time.Now(),
			}

			// For child accounts, set the parent ID
			if targetInvitation.Role == "child" {
				parentID := targetInvitation.InvitedBy
				newUser.ParentID = &parentID
			}

			if err := serviceManager.DB.CreateUser(newUser); err != nil {
				log.Printf("ERROR creating user: %v (authID=%s, email=%s)", err, newUserID, authIdentity.Email)
				c.JSON(http.StatusInternalServerError, models.APIResponse{
					Error: "Failed to create account: " + err.Error(),
				})
				return
			}
		}

		// Now accept the invitation
		if err := serviceManager.DB.AcceptInvitation(invitationID, newUserID); err != nil {
			log.Printf("ERROR accepting invitation: %v (id=%s, user=%s)", err, invitationID, newUserID)
			// Clean up the user if we just created them
			if existingUser == nil {
				if delErr := serviceManager.DB.DeleteUser(newUserID); delErr != nil {
					log.Printf("Warning: failed to delete temporary user %s: %v", newUserID, delErr)
				}
			}
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Failed to accept invitation: " + err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, models.APIResponse{
			Message: "Invitation accepted successfully. Your account has been activated.",
			Data: map[string]interface{}{
				"userId":   newUserID,
				"familyId": targetInvitation.FamilyID,
			},
		})
		return
	}

	// User already exists - regular invitation acceptance flow
	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	err = serviceManager.DB.AcceptInvitation(invitationID, userIDStr)
	if err != nil {
		log.Printf("ERROR accepting invitation: %v (id=%s, user=%s)", err, invitationID, userIDStr)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to accept invitation: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Invitation accepted successfully",
	})
}

// Family management handlers

// @Summary		Get Family Information
// @Description	Get information about the user's family
// @Tags			families
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Family information"
// @Failure		401	{object}	models.APIResponse	"Family access validation required"
// @Failure		500	{object}	models.APIResponse	"Service unavailable or failed to retrieve family"
// @Security		BearerAuth
// @Router			/api/families [get]
func GetFamily(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	_, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	family, err := serviceManager.DB.GetFamily(familyIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve family",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: family,
	})
}

// @Summary		Get Family Statistics
// @Description	Get statistical data for the authenticated user's family
// @Tags			families
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Family statistics"
// @Failure		401	{object}	models.APIResponse	"Family access validation required"
// @Failure		500	{object}	models.APIResponse	"Failed to retrieve family stats"
// @Security		BearerAuth
// @Router			/api/families/stats [get]
func GetFamilyStats(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	_, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	stats, err := serviceManager.DB.GetFamilyStats(familyIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve family stats",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: stats,
	})
}

// @Summary		Get Family Results
// @Description	Get test results for all members of the authenticated user's family
// @Tags			families
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Family test results"
// @Failure		401	{object}	models.APIResponse	"Family access validation required"
// @Failure		500	{object}	models.APIResponse	"Failed to retrieve family results"
// @Security		BearerAuth
// @Router			/api/families/results [get]
func GetFamilyResults(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	_, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	familyResults, err := serviceManager.DB.GetFamilyResults(familyIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve family results",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: familyResults,
	})
}

// @Summary		Get Family Children
// @Description	Get all children in the authenticated user's family
// @Tags			families
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"List of family children"
// @Failure		401	{object}	models.APIResponse	"Family access validation required"
// @Failure		500	{object}	models.APIResponse	"Failed to retrieve children"
// @Security		BearerAuth
// @Router			/api/families/children [get]
func GetFamilyChildren(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	_, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	children, err := serviceManager.DB.GetFamilyChildren(familyIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve children",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: children,
	})
}

// @Summary		Get Family Progress
// @Description	Get progress data for all family members
// @Tags			families
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Family progress data"
// @Failure		401	{object}	models.APIResponse	"Family access validation required"
// @Failure		500	{object}	models.APIResponse	"Failed to retrieve family progress"
// @Security		BearerAuth
// @Router			/api/families/progress [get]
func GetFamilyProgress(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	_, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	progress, err := serviceManager.DB.GetFamilyProgress(familyIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve family progress",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: progress,
	})
}

// @Summary		Add Family Member
// @Description	Add a parent or child to the family. For parents, creates an invitation.
// @Description	For children, creates a pending account linked when they log in.
// @Tags			families
// @Accept			json
// @Produce		json
// @Param			request	body		models.AddFamilyMemberRequest	true	"Family member details"
// @Success		201		{object}	models.APIResponse				"Member added or invited successfully"
// @Failure		400		{object}	models.APIResponse				"Invalid request data"
// @Failure		403		{object}	models.APIResponse				"Parent role required"
// @Failure		500		{object}	models.APIResponse				"Service unavailable or failed to add member"
// @Security		BearerAuth
// @Router			/api/families/members [post]
func AddFamilyMember(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	var req models.AddFamilyMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("ERROR AddFamilyMember: Invalid request data - %v. Request body: %+v", err, req)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data: " + err.Error(),
		})
		return
	}

	log.Printf("INFO AddFamilyMember: Processing request - email=%s, role=%s, displayName=%s, familyId=%s",
		req.Email, req.Role, req.DisplayName, req.FamilyID)

	// Validate displayName is provided for child role
	if req.Role == "child" && strings.TrimSpace(req.DisplayName) == "" {
		log.Printf("ERROR AddFamilyMember: DisplayName is required for child role")
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "DisplayName is required for child accounts",
		})
		return
	}

	// Handle parent invitation vs child creation based on role
	if req.Role == "parent" {
		// Create invitation for parent
		familyIDStr, err := getContextString(c, "validatedFamilyID")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
			return
		}
		userIDStr, err := getContextString(c, "userID")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
			return
		}
		expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days expiration
		invitation := &models.FamilyInvitation{
			ID:        uuid.New().String(),
			FamilyID:  familyIDStr,
			Email:     req.Email,
			Role:      "parent",
			InvitedBy: userIDStr,
			Status:    "pending",
			CreatedAt: time.Now(),
			ExpiresAt: &expiresAt,
		}

		if err := serviceManager.DB.CreateFamilyInvitation(invitation); err != nil {
			log.Printf("ERROR creating parent invitation: %v (email=%s, family=%s)", err, req.Email, familyIDStr)
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Failed to invite parent: " + err.Error(),
			})
			return
		}

		c.JSON(http.StatusAccepted, models.APIResponse{
			Data:    invitation,
			Message: "Parent invitation sent",
		})
		return
	}

	// Handle child creation (role == "child")

	// TODO: IMPLEMENT PROPER ZITADEL INTEGRATION
	// ==========================================
	// This current implementation creates a "pending" child record that will be
	// linked when the child logs in via OIDC for the first time.
	//
	// For proper integration, implement ONE of these approaches:
	//
	// OPTION 1: Zitadel Admin API - Create account directly
	// ------------------------------------------------------
	// 1. Use Zitadel Admin API to create user account:
	//    POST https://{instance}.zitadel.cloud/management/v1/users/human
	//    {
	//      "userName": req.Email,
	//      "profile": { "displayName": req.DisplayName },
	//      "email": { "email": req.Email, "isEmailVerified": false }
	//    }
	// 2. Get the user ID from the response
	// 3. Optionally send password reset email via Zitadel
	// 4. Store the Zitadel user ID as authID in our database
	//
	// OPTION 2: Invitation Link - Let Zitadel handle registration
	// -----------------------------------------------------------
	// 1. Generate an invitation code/token in your system
	// 2. Send email to child with registration link:
	//    https://yourapp.com/accept-invite?token=xxx
	// 3. When clicked, redirect to Zitadel registration with prefilled email
	// 4. After successful registration, link the authID from JWT to family
	//
	// OPTION 3: Email Matching - Current implementation (INTERIM)
	// -----------------------------------------------------------
	// 1. Parent adds child by email (no password)
	// 2. Create "pending" child record with placeholder authID
	// 3. When child logs in via OIDC, match by email and update authID
	// 4. This requires additional middleware to handle the linking
	//
	// RECOMMENDED: Use Option 1 (Admin API) for immediate account creation
	// or Option 2 (Invitation) for better UX and security.

	// Check if user already exists with this email
	existingUser, err := serviceManager.DB.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		c.JSON(http.StatusConflict, models.APIResponse{
			Error: "A user with this email already exists",
		})
		return
	}

	// Create invitation record - child user will be created when they accept the invitation
	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	expiresAt := time.Now().Add(30 * 24 * time.Hour) // 30 days for child invitations
	invitation := &models.FamilyInvitation{
		ID:        uuid.New().String(),
		FamilyID:  familyIDStr,
		Email:     req.Email,
		Role:      "child",
		InvitedBy: userIDStr,
		Status:    "pending",
		CreatedAt: time.Now(),
		ExpiresAt: &expiresAt,
	}

	if err := serviceManager.DB.CreateFamilyInvitation(invitation); err != nil {
		log.Printf("ERROR creating child invitation: %v (email=%s, family=%s)", err, req.Email, familyIDStr)
		// Check if error is due to duplicate invitation
		if strings.Contains(err.Error(), "invitation already exists") {
			c.JSON(http.StatusConflict, models.APIResponse{
				Error: "An invitation for this email already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create child invitation: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Message: "Invitation sent to " + req.Email,
		Data: map[string]interface{}{
			"email":      req.Email,
			"familyId":   familyIDStr,
			"invitation": invitation,
		},
	})
}

// @Summary		Get Family Invitations
// @Description	Get all invitations for the family (parent only)
// @Tags			families
// @Accept			json
// @Produce		json
// @Success		200		{object}	models.APIResponse	"Family invitations retrieved successfully"
// @Failure		500		{object}	models.APIResponse	"Failed to retrieve invitations"
// @Security		BearerAuth
// @Router			/api/families/invitations [get]
func GetFamilyInvitations(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	invitations, err := serviceManager.DB.GetFamilyInvitations(familyIDStr)
	if err != nil {
		log.Printf("ERROR getting family invitations: %v (family=%s)", err, familyIDStr)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve invitations",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: invitations,
	})
}

// @Summary		Delete Family Invitation
// @Description	Cancel/delete a pending invitation (parent only)
// @Tags			families
// @Accept			json
// @Produce		json
// @Param			invitationId	path		string				true	"Invitation ID"
// @Success		200				{object}	models.APIResponse	"Invitation deleted successfully"
// @Failure		404				{object}	models.APIResponse	"Invitation not found"
// @Failure		500				{object}	models.APIResponse	"Failed to delete invitation"
// @Security		BearerAuth
// @Router			/api/families/invitations/{invitationId} [delete]
func DeleteFamilyInvitation(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	invitationID := c.Param("invitationId")
	if invitationID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invitation ID required",
		})
		return
	}

	if err := serviceManager.DB.DeleteInvitation(invitationID); err != nil {
		log.Printf("ERROR deleting invitation: %v (id=%s)", err, invitationID)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to delete invitation",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Invitation deleted successfully",
	})
}

// @Summary		Remove Family Member
// @Description	Remove a parent or child from the family (parent only, cannot remove created_by parent)
// @Tags			families
// @Accept			json
// @Produce		json
// @Param			userId	path		string				true	"User ID"
// @Success		200		{object}	models.APIResponse	"Member removed successfully"
// @Failure		400		{object}	models.APIResponse	"Invalid request or cannot remove creator"
// @Failure		404		{object}	models.APIResponse	"Member not found"
// @Failure		500		{object}	models.APIResponse	"Failed to remove member"
// @Security		BearerAuth
// @Router			/api/families/members/{userId} [delete]
func RemoveFamilyMember(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	userIDToRemove := c.Param("userId")
	if userIDToRemove == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "User ID required",
		})
		return
	}

	// Get family to check created_by
	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	family, err := serviceManager.DB.GetFamily(familyIDStr)
	if err != nil {
		log.Printf("ERROR getting family: %v (family=%s)", err, familyIDStr)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve family",
		})
		return
	}

	// Prevent removal of created_by parent
	if userIDToRemove == family.CreatedBy {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Cannot remove the family creator",
		})
		return
	}

	// TODO: Implement actual member removal
	// This should:
	// 1. Remove from family_members table
	// 2. Set user's family_id to NULL
	// 3. For children, also delete child account
	// 4. Handle cleanup of user's data (tests, results, etc.)

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Member removed successfully (not yet implemented)",
	})
}

// @Summary		Update Child Account
// @Description	Update a child account's display name (parent only)
// @Tags			children
// @Accept			json
// @Produce		json
// @Param			childId	path		string	true	"Child ID"
// @Param			body	body		models.DisplayNameUpdateRequest	true	"Display name update request"
// @Success		200	{object}	models.APIResponse	"Child account updated successfully"
// @Failure		400	{object}	models.APIResponse	"Invalid request data"
// @Failure		401	{object}	models.APIResponse	"Parent access required"
// @Failure		403	{object}	models.APIResponse	"Not authorized to update this child"
// @Failure		500	{object}	models.APIResponse	"Failed to update child account"
// @Security		BearerAuth
// @Router			/api/families/children/{childId} [put]
func UpdateChildAccount(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	childID := c.Param("childId")
	var req models.DisplayNameUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// Trim whitespace
	displayName := strings.TrimSpace(req.DisplayName)

	// Validate length
	if len(displayName) < 1 || len(displayName) > 100 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Display name must be between 1 and 100 characters",
		})
		return
	}

	if err := serviceManager.DB.UpdateChildDisplayName(childID, displayName); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to update child account",
		})
		return
	}

	// Get updated child data
	child, err := serviceManager.DB.GetChild(childID)
	if err != nil {
		// Still return success even if we can't fetch updated data
		c.JSON(http.StatusOK, models.APIResponse{
			Message: "Child account updated successfully",
			Data: map[string]interface{}{
				"displayName": displayName,
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Child account updated successfully",
		Data:    child,
	})
}

// @Summary		Update Child Birth Year
// @Description	Update a child account's birth year (parent only)
// @Tags			children
// @Accept			json
// @Produce		json
// @Param			childId	path		string	true	"Child ID"
// @Param			body	body		models.UpdateChildBirthYearRequest	true	"Birth year update request"
// @Success		200	{object}	models.APIResponse	"Child birth year updated successfully"
// @Failure		400	{object}	models.APIResponse	"Invalid request data"
// @Failure		401	{object}	models.APIResponse	"Parent access required"
// @Failure		403	{object}	models.APIResponse	"Not authorized to update this child"
// @Failure		500	{object}	models.APIResponse	"Failed to update child birth year"
// @Security		BearerAuth
// @Router			/api/families/children/{childId}/birthyear [patch]
func UpdateChildBirthYear(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	// Get the authenticated user's family ID
	_, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	childID := c.Param("childId")

	// First, verify the child belongs to the same family
	child, err := serviceManager.DB.GetChild(childID)
	if err != nil {
		if errors.Is(err, db.ErrChildNotFound) {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: "Child not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to verify child",
		})
		return
	}

	// Ensure child belongs to the parent's family
	familyIDStr, err := getContextString(c, "validatedFamilyID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid family ID"})
		return
	}
	if child.FamilyID != familyIDStr {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: "Cannot update child from another family",
		})
		return
	}

	var req models.UpdateChildBirthYearRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// Validate birth year if provided
	if req.BirthYear != nil {
		currentYear := time.Now().Year()
		if *req.BirthYear < 1900 || *req.BirthYear > currentYear {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: "Birth year must be between 1900 and the current year",
			})
			return
		}
	}

	if err := serviceManager.DB.UpdateChildBirthYear(childID, req.BirthYear); err != nil {
		if errors.Is(err, db.ErrChildNotFound) {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: "Child not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to update child birth year",
		})
		return
	}

	// Get updated child data
	updatedChild, err := serviceManager.DB.GetChild(childID)
	if err != nil {
		c.JSON(http.StatusOK, models.APIResponse{
			Message: "Child birth year updated successfully",
			Data: map[string]interface{}{
				"birthYear": req.BirthYear,
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Child birth year updated successfully",
		Data:    updatedChild,
	})
}

// @Summary		Delete Child Account
// @Description	Delete a child account (parent only)
// @Tags			children
// @Accept			json
// @Produce		json
// @Param			childId	path		string	true	"Child ID"
// @Success		200		{object}	models.APIResponse	"Child account deleted successfully"
// @Failure		401		{object}	models.APIResponse	"Parent access required"
// @Failure		404		{object}	models.APIResponse	"Child not found"
// @Failure		500		{object}	models.APIResponse	"Failed to delete child account"
// @Security		BearerAuth
// @Router			/api/families/children/{childId} [delete]
func DeleteChildAccount(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	childID := c.Param("childId")

	// TODO: In full OIDC setup, also delete from identity provider (Zitadel)
	// For now, we only delete from our database
	// The child's OIDC account (if it exists) can be cleaned up separately via Zitadel admin

	// First delete from users table

	// Delete child record from our database
	if err := serviceManager.DB.DeleteChild(childID); err != nil {
		log.Printf("Warning: Failed to delete child record from database: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to delete child from database",
		})
		return
	}

	// Delete user record from our database
	if err := serviceManager.DB.DeleteUser(childID); err != nil {
		log.Printf("Warning: Failed to delete user record from database: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Child account partially deleted - child record removed but user record cleanup failed",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Child account deleted successfully",
	})
}

// @Summary		Get Child Progress
// @Description	Get progress data for a specific child
// @Tags			children
// @Accept			json
// @Produce		json
// @Param			childId	path		string	true	"Child ID"
// @Success		200		{object}	models.APIResponse	"Child progress data"
// @Failure		401		{object}	models.APIResponse	"Parent access required"
// @Failure		404		{object}	models.APIResponse	"Child not found"
// @Failure		500		{object}	models.APIResponse	"Failed to retrieve child progress"
// @Security		BearerAuth
// @Router			/api/families/children/{childId}/progress [get]
func GetChildProgress(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	childID := c.Param("childId")

	progress, err := serviceManager.DB.GetUserProgress(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve child progress",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: progress,
	})
}

// @Summary		Get Child Results
// @Description	Get test results for a specific child
// @Tags			children
// @Accept			json
// @Produce		json
// @Param			childId	path		string	true	"Child ID"
// @Success		200		{object}	models.APIResponse	"Child test results"
// @Failure		401		{object}	models.APIResponse	"Parent access required"
// @Failure		404		{object}	models.APIResponse	"Child not found"
// @Failure		500		{object}	models.APIResponse	"Failed to retrieve child results"
// @Security		BearerAuth
// @Router			/api/families/children/{childId}/results [get]
func GetChildResults(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	childID := c.Param("childId")

	results, err := serviceManager.DB.GetTestResults(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve child results",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: results,
	})
}

// User management handlers

// @Summary		Create User
// @Description	Create a new user account after OIDC authentication
// @Tags			users
// @Accept			json
// @Produce		json
// @Param			request	body		object{displayName=string,role=string,email=string,familyName=string}	true	"User creation request"
// @Success		201		{object}	models.APIResponse						"User created successfully"
// @Failure		400		{object}	models.APIResponse						"Invalid request data"
// @Failure		401		{object}	models.APIResponse						"Auth identity not found in token"
// @Failure		500		{object}	models.APIResponse						"Internal server error"
// @Security		BearerAuth
// @Router			/api/users [post]
func CreateUser(c *gin.Context) {
	var req struct {
		DisplayName string `json:"displayName" binding:"required"`
		Role        string `json:"role"`
		Email       string `json:"email"` // Email can come from request or identity claims
		FamilyName  string `json:"familyName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data: " + err.Error(),
		})
		return
	}

	// Trim and validate inputs
	displayName := strings.TrimSpace(req.DisplayName)
	email := strings.TrimSpace(req.Email)
	familyName := strings.TrimSpace(req.FamilyName)

	if displayName == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Display name is required",
		})
		return
	}

	// Get identity info from OIDC middleware context
	authID, err := getContextString(c, "authIdentityID")
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Auth identity not found in token",
		})
		return
	}

	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not available",
		})
		return
	}

	// Only parents can self-register via this endpoint
	if req.Role != "" && req.Role != "parent" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Only parent registration is supported",
		})
		return
	}

	// Get email from request or from identity claims
	if email == "" {
		if identity, exists := c.Get("identity"); exists {
			if id, ok := identity.(*auth.Identity); ok {
				email = strings.TrimSpace(id.Email)
			}
		}
	}
	if email == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Email is required",
		})
		return
	}

	// Check for pending invitations before creating new family
	pendingInvitations, err := serviceManager.DB.GetPendingInvitationsByEmail(email)
	if err != nil {
		log.Printf("ERROR checking pending invitations: %v", err)
		// Continue with registration even if invitation check fails
		pendingInvitations = nil
	}

	// If there are pending invitations, return them to the user
	if len(pendingInvitations) > 0 {
		c.JSON(http.StatusOK, models.APIResponse{
			Data: map[string]interface{}{
				"pendingInvitations": pendingInvitations,
				"requiresChoice":     true,
			},
			Message: "You have pending family invitations. Please accept an invitation or create a new family.",
		})
		return
	}

	// Create user first (without family, will be updated after family creation)
	newUser := &models.User{
		ID:           authID,
		AuthID:       authID,
		Email:        email,
		DisplayName:  displayName,
		FamilyID:     "",
		Role:         "parent",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	if err := serviceManager.DB.CreateUser(newUser); err != nil {
		log.Printf("ERROR creating user: %v", err)
		status := http.StatusInternalServerError
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			status = http.StatusConflict
		}
		c.JSON(status, models.APIResponse{Error: "Failed to create user"})
		return
	}

	if familyName == "" {
		familyName = displayName + "'s Family"
	}

	// Create family for parent users and update user with family ID
	family := &models.Family{
		ID:        "family-" + authID,
		Name:      familyName,
		CreatedBy: newUser.ID,
		Members:   []string{newUser.ID},
		CreatedAt: time.Now(),
	}

	if err := serviceManager.DB.CreateFamily(family); err != nil {
		log.Printf("ERROR creating family: %v", err)
		if delErr := serviceManager.DB.DeleteUser(newUser.ID); delErr != nil {
			log.Printf("Warning: failed to delete user during cleanup: %v", delErr)
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create family",
		})
		return
	}

	newUser.FamilyID = family.ID
	if err := serviceManager.DB.UpdateUser(newUser); err != nil {
		log.Printf("ERROR updating user with family ID: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to update user with family",
		})
		return
	}

	// Return user data
	c.JSON(http.StatusCreated, models.APIResponse{
		Data: map[string]interface{}{
			"id":           newUser.ID,
			"email":        newUser.Email,
			"displayName":  newUser.DisplayName,
			"familyId":     newUser.FamilyID,
			"role":         newUser.Role,
			"isActive":     newUser.IsActive,
			"createdAt":    newUser.CreatedAt.Format(time.RFC3339),
			"lastActiveAt": newUser.LastActiveAt.Format(time.RFC3339),
		},
	})
}

// @Summary		Get User Profile
// @Description	Get the current user's profile information
// @Tags			users
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"User profile data"
// @Failure		401	{object}	models.APIResponse	"User not authenticated"
// @Failure		404	{object}	models.APIResponse	"User not found - needs registration"
// @Failure		500	{object}	models.APIResponse	"Internal server error"
// @Security		BearerAuth
// @Router			/api/users/profile [get]
func GetUserProfile(c *gin.Context) {
	// Check if user exists in context from OIDCAuthMiddleware
	user, exists := c.Get("user")
	if !exists {
		// User not in context, try to lookup by authIdentityID
		authID, err := getContextString(c, "authIdentityID")
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "User not authenticated",
			})
			return
		}

		// Get service manager and try to lookup user
		serviceManager := GetServiceManager(c)
		if serviceManager != nil {
			userData, err := serviceManager.DB.GetUserByAuthID(authID)
			if err == nil && userData != nil {
				// Get family name if user has a family
				var familyName string
				if userData.FamilyID != "" {
					family, err := serviceManager.DB.GetFamily(userData.FamilyID)
					if err == nil && family != nil {
						familyName = family.Name
					}
				}

				// User found, return profile
				c.JSON(http.StatusOK, models.APIResponse{
					Data: map[string]interface{}{
						"id":           userData.ID,
						"email":        userData.Email,
						"displayName":  userData.DisplayName,
						"familyId":     userData.FamilyID,
						"familyName":   familyName,
						"role":         userData.Role,
						"parentId":     userData.ParentID,
						"birthYear":    userData.BirthYear,
						"isActive":     userData.IsActive,
						"createdAt":    userData.CreatedAt.Format(time.RFC3339),
						"totalXp":      userData.TotalXP,
						"level":        userData.Level,
						"lastActiveAt": userData.LastActiveAt.Format(time.RFC3339),
						"xpConfig":     xp.BaseXPByMode,
					},
				})
				return
			}
		}

		// User doesn't exist by auth_id, check for pending invitations by email
		if serviceManager != nil {
			// Get email from identity context
			identity, exists := c.Get("identity")
			if exists {
				if authIdentity, ok := identity.(*auth.Identity); ok {
					email := authIdentity.Email
					if email != "" {
						// Check for pending invitations
						invitations, err := serviceManager.DB.GetPendingInvitationsByEmail(email)
						if err == nil && len(invitations) > 0 {
							// User has pending invitations
							c.JSON(http.StatusOK, models.APIResponse{
								Data: map[string]interface{}{
									"authId":             authID,
									"email":              email,
									"hasPendingInvites":  true,
									"pendingInvitations": invitations,
								},
							})
							return
						}
					}
				}
			}
		}

		// User doesn't exist in our database yet
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "User not found in system. Please complete registration.",
			Data: map[string]interface{}{
				"authId":            authID,
				"needsRegistration": true,
			},
		})
		return
	}

	userData, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Invalid user data",
		})
		return
	}

	// Get family name if user has a family
	var familyName string
	if userData.FamilyID != "" {
		serviceManager := GetServiceManager(c)
		if serviceManager != nil {
			family, err := serviceManager.DB.GetFamily(userData.FamilyID)
			if err == nil && family != nil {
				familyName = family.Name
			}
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: map[string]interface{}{
			"id":           userData.ID,
			"email":        userData.Email,
			"displayName":  userData.DisplayName,
			"familyId":     userData.FamilyID,
			"familyName":   familyName,
			"role":         userData.Role,
			"parentId":     userData.ParentID,
			"birthYear":    userData.BirthYear,
			"isActive":     userData.IsActive,
			"createdAt":    userData.CreatedAt.Format(time.RFC3339),
			"lastActiveAt": userData.LastActiveAt.Format(time.RFC3339),
			"xpConfig":     xp.BaseXPByMode,
		},
	})
}

// @Summary		Update User Display Name
// @Description	Update the current user's display name
// @Tags			users
// @Accept			json
// @Produce		json
// @Param			body	body		models.DisplayNameUpdateRequest	true	"Display name update request"
// @Success		200	{object}	models.APIResponse	"Display name updated successfully"
// @Failure		400	{object}	models.APIResponse	"Invalid request data or display name validation failed"
// @Failure		401	{object}	models.APIResponse	"User not authenticated"
// @Failure		500	{object}	models.APIResponse	"Failed to update display name"
// @Security		BearerAuth
// @Router			/api/users/me/name [patch]
func UpdateUserDisplayName(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User not authenticated",
		})
		return
	}

	var req models.DisplayNameUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// Trim whitespace
	displayName := strings.TrimSpace(req.DisplayName)

	// Validate length (already validated by binding, but double-check)
	if len(displayName) < 1 || len(displayName) > 100 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Display name must be between 1 and 100 characters",
		})
		return
	}

	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	if err := serviceManager.DB.UpdateUserDisplayName(userIDStr, displayName); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to update display name",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Display name updated successfully",
		Data: map[string]interface{}{
			"displayName": displayName,
		},
	})
}

// ListVoices godoc
// @Summary		List available TTS voices
// @Description	Get a list of available Text-to-Speech voices for a specific language
// @Tags			wordsets
// @Accept			json
// @Produce		json
// @Param			language	query		string	false	"Language code (e.g., 'en', 'nb-NO')"
// @Success		200			{object}	models.APIResponse{data=[]interface{}}	"List of available voices"
// @Failure		500			{object}	models.APIResponse						"Failed to retrieve voices"
// @Security		BearerAuth
// @Router			/api/wordsets/voices [get]
func ListVoices(c *gin.Context) {
	language := c.Query("language")
	if language == "" {
		language = "en-US" // Default to English
	}

	// Get available voices for the language
	voices, err := serviceManager.TTS.GetChildFriendlyVoices(language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: fmt.Sprintf("Failed to retrieve voices: %v", err),
		})
		return
	}

	// Convert to a more user-friendly format
	type VoiceInfo struct {
		Name         string   `json:"name"`
		LanguageCode string   `json:"languageCode"`
		Gender       string   `json:"gender"`
		Type         string   `json:"type"`
		Languages    []string `json:"supportedLanguages"`
		SampleRate   int32    `json:"sampleRate"`
	}

	var voiceList []VoiceInfo
	for _, voice := range voices {
		var genderStr string
		switch voice.SsmlGender {
		case 1:
			genderStr = "male"
		case 2:
			genderStr = "female"
		default:
			genderStr = "neutral"
		}

		var voiceType string
		if strings.Contains(voice.Name, "Neural2") {
			voiceType = "neural2"
		} else if strings.Contains(voice.Name, "Wavenet") {
			voiceType = "wavenet"
		} else if strings.Contains(voice.Name, "Studio") {
			voiceType = "studio"
		} else {
			voiceType = "standard"
		}

		voiceInfo := VoiceInfo{
			Name:         voice.Name,
			LanguageCode: voice.LanguageCodes[0], // Primary language
			Gender:       genderStr,
			Type:         voiceType,
			SampleRate:   voice.NaturalSampleRateHertz,
			Languages:    voice.LanguageCodes,
		}
		voiceList = append(voiceList, voiceInfo)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: fmt.Sprintf("Found %d voices for language %s", len(voiceList), language),
		Data:    voiceList,
	})
}

// ============================================================================
// Word Mastery Handlers
// ============================================================================

// GetWordSetMastery godoc
// @Summary		Get mastery for word set
// @Description	Get mastery progress for all words in a word set for the authenticated user
// @Tags			mastery
// @Accept			json
// @Produce		json
// @Param			wordSetId	path		string	true	"Word Set ID"
// @Success		200			{object}	models.APIResponse{data=[]models.WordMastery}	"Mastery records"
// @Failure		401			{object}	models.APIResponse								"User authentication required"
// @Failure		500			{object}	models.APIResponse								"Failed to retrieve mastery"
// @Security		BearerAuth
// @Router			/api/mastery/{wordSetId} [get]
func GetWordSetMastery(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	wordSetID := c.Param("wordSetId")
	if wordSetID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	mastery, err := serviceManager.DB.GetWordSetMastery(userIDStr, wordSetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve mastery data",
		})
		return
	}

	// Return empty array instead of null if no records
	if mastery == nil {
		mastery = []models.WordMastery{}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: mastery,
	})
}

// GetWordMastery godoc
// @Summary		Get mastery for specific word
// @Description	Get mastery progress for a specific word in a word set
// @Tags			mastery
// @Accept			json
// @Produce		json
// @Param			wordSetId	path		string	true	"Word Set ID"
// @Param			word		path		string	true	"Word text"
// @Success		200			{object}	models.APIResponse{data=models.WordMastery}	"Mastery record"
// @Failure		401			{object}	models.APIResponse							"User authentication required"
// @Failure		500			{object}	models.APIResponse							"Failed to retrieve mastery"
// @Security		BearerAuth
// @Router			/api/mastery/{wordSetId}/word/{word} [get]
func GetWordMastery(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	wordSetID := c.Param("wordSetId")
	word := c.Param("word")

	if wordSetID == "" || word == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID and word are required",
		})
		return
	}

	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	mastery, err := serviceManager.DB.GetWordMastery(userIDStr, wordSetID, word)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to retrieve mastery data",
		})
		return
	}

	// Return default mastery if no record exists
	if mastery == nil {
		mastery = &models.WordMastery{
			UserID:             userIDStr,
			WordSetID:          wordSetID,
			Word:               word,
			LetterTilesCorrect: 0,
			WordBankCorrect:    0,
			KeyboardCorrect:    0,
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: mastery,
	})
}

// IncrementMasteryRequest represents the request body for incrementing mastery
type IncrementMasteryRequest struct {
	Word      string `json:"word" binding:"required"`
	InputMode string `json:"inputMode" binding:"required"` // "letterTiles", "wordBank", or "keyboard"
}

// IncrementMastery godoc
// @Summary		Increment mastery for a word
// @Description	Increment the mastery counter for a specific word and input mode
// @Tags			mastery
// @Accept			json
// @Produce		json
// @Param			wordSetId	path		string						true	"Word Set ID"
// @Param			body		body		IncrementMasteryRequest		true	"Increment request"
// @Success		200			{object}	models.APIResponse{data=models.WordMastery}	"Updated mastery record"
// @Failure		400			{object}	models.APIResponse							"Invalid request"
// @Failure		401			{object}	models.APIResponse							"User authentication required"
// @Failure		500			{object}	models.APIResponse							"Failed to increment mastery"
// @Security		BearerAuth
// @Router			/api/mastery/{wordSetId}/increment [post]
func IncrementMastery(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "User authentication required",
		})
		return
	}

	wordSetID := c.Param("wordSetId")
	if wordSetID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	var req IncrementMasteryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data: word and inputMode are required",
		})
		return
	}

	// Convert input mode string to TestMode type
	// Only the three progressive input modes have mastery tracking
	var inputMode models.TestMode
	switch req.InputMode {
	case "letterTiles":
		inputMode = models.TestModeLetterTiles
	case "wordBank":
		inputMode = models.TestModeWordBank
	case "keyboard":
		inputMode = models.TestModeKeyboard
	default:
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid inputMode: must be 'letterTiles', 'wordBank', or 'keyboard'",
		})
		return
	}

	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	userIDStr, err := getContextString(c, "userID")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}
	mastery, err := serviceManager.DB.IncrementMastery(userIDStr, wordSetID, req.Word, inputMode)
	if err != nil {
		log.Printf("[IncrementMastery] Error: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to increment mastery",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    mastery,
		Message: "Mastery incremented successfully",
	})
}

// @Summary		Stream Audio File by ID
// @Description	Stream audio file for a specific audio ID within a wordset
// @Tags			wordsets
