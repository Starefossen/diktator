package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
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

	wordSets, err := serviceManager.Firestore.GetWordSets(familyIDStr)
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

	// Convert string words to WordItem structs
	words := make([]struct {
		Word       string           `firestore:"word" json:"word"`
		Audio      models.WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`
		Definition string           `firestore:"definition,omitempty" json:"definition,omitempty"`
	}, len(req.Words))

	for i, word := range req.Words {
		words[i] = struct {
			Word       string           `firestore:"word" json:"word"`
			Audio      models.WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`
			Definition string           `firestore:"definition,omitempty" json:"definition,omitempty"`
		}{
			Word: word,
		}
	}

	// Create new word set
	wordSet := &models.WordSet{
		ID:                uuid.New().String(),
		Name:              req.Name,
		Words:             words,
		FamilyID:          familyID.(string),
		CreatedBy:         userID.(string),
		Language:          req.Language,
		AudioProcessing:   "pending", // Mark as pending for audio generation
		TestConfiguration: req.TestConfiguration,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	err := serviceManager.Firestore.CreateWordSet(wordSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create word set",
		})
		return
	}

	// Start audio generation in background
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Panic in audio generation goroutine for wordset %s: %v", wordSet.ID, r)
			}
		}()

		if serviceManager == nil {
			log.Printf("Error: Service manager is nil in goroutine for wordset %s", wordSet.ID)
			return
		}

		err := serviceManager.GenerateAudioForWordSet(wordSet.ID)
		if err != nil {
			log.Printf("Error generating audio for word set %s: %v", wordSet.ID, err)
		} else {
			log.Printf("Successfully completed audio generation for word set %s", wordSet.ID)
		}
	}()

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    wordSet,
		Message: "Word set created successfully. Audio generation started in background.",
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

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	// Get existing word set to check ownership and get current state
	existingWordSet, err := serviceManager.Firestore.GetWordSet(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "Word set not found",
		})
		return
	}

	// Verify family access
	if existingWordSet.FamilyID != familyID.(string) {
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
		Word       string           `firestore:"word" json:"word"`
		Audio      models.WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`
		Definition string           `firestore:"definition,omitempty" json:"definition,omitempty"`
	}, len(req.Words))

	hasNewWords := false
	for i, word := range req.Words {
		words[i] = struct {
			Word       string           `firestore:"word" json:"word"`
			Audio      models.WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`
			Definition string           `firestore:"definition,omitempty" json:"definition,omitempty"`
		}{
			Word: word,
		}

		// Check if this is a new word or if audio needs regeneration
		if !originalWords[word] {
			hasNewWords = true
		} else {
			// Preserve existing audio for unchanged words
			for _, existingWord := range existingWordSet.Words {
				if existingWord.Word == word {
					words[i].Audio = existingWord.Audio
					words[i].Definition = existingWord.Definition
					break
				}
			}
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

	// Set audio processing status if there are new words or language changed
	if hasNewWords || req.Language != existingWordSet.Language {
		updatedWordSet.AudioProcessing = "pending"
		updatedWordSet.AudioProcessedAt = nil
	} else {
		updatedWordSet.AudioProcessing = existingWordSet.AudioProcessing
		updatedWordSet.AudioProcessedAt = existingWordSet.AudioProcessedAt
	}

	err = serviceManager.Firestore.UpdateWordSet(updatedWordSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to update word set",
		})
		return
	}

	// Generate audio for new words in background if needed
	if hasNewWords || req.Language != existingWordSet.Language {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Panic in audio generation goroutine for updated wordset %s: %v", updatedWordSet.ID, r)
				}
			}()

			if serviceManager == nil {
				log.Printf("Error: Service manager is nil in goroutine for updated wordset %s", updatedWordSet.ID)
				return
			}

			err := serviceManager.GenerateAudioForWordSet(updatedWordSet.ID)
			if err != nil {
				log.Printf("Error generating audio for updated word set %s: %v", updatedWordSet.ID, err)
			} else {
				log.Printf("Successfully completed audio generation for updated word set %s", updatedWordSet.ID)
			}
		}()
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

	err := sm.DeleteWordSetWithAudio(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to delete word set",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Word set and associated audio files deleted successfully",
	})
}

// @Summary		Generate Audio
// @Description	Generate TTS audio for all words in a word set
// @Tags			wordsets
// @Accept			json
// @Produce		json
// @Param			id	path		string	true	"Word Set ID"
// @Success		202	{object}	models.APIResponse	"Audio generation started"
// @Failure		400	{object}	models.APIResponse	"Word set ID is required"
// @Failure		404	{object}	models.APIResponse	"Word set not found"
// @Failure		500	{object}	models.APIResponse	"Failed to start audio generation"
// @Security		BearerAuth
// @Router			/api/wordsets/{id}/generate-audio [post]
func GenerateAudio(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	// Check if serviceManager is properly initialized
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not initialized",
		})
		return
	}

	// Capture serviceManager in closure to avoid nil pointer issues
	manager := serviceManager

	// Start audio generation in background
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Panic in audio generation goroutine: %v", r)
			}
		}()

		if manager == nil {
			log.Printf("Error: Service manager is nil in goroutine")
			return
		}

		err := manager.GenerateAudioForWordSet(id)
		if err != nil {
			log.Printf("Error generating audio for word set %s: %v", id, err)
		} else {
			log.Printf("Successfully completed audio generation for word set %s", id)
		}
	}()

	c.JSON(http.StatusAccepted, models.APIResponse{
		Message: "Audio generation started",
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
	userID, exists := c.Get("userID")
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

	// Create test result
	result := &models.TestResult{
		ID:             uuid.New().String(),
		WordSetID:      req.WordSetID,
		UserID:         userID.(string),
		Score:          req.Score,
		TotalWords:     req.TotalWords,
		CorrectWords:   req.CorrectWords,
		IncorrectWords: req.IncorrectWords, // Keep for backward compatibility
		Words:          req.Words,          // New detailed word information
		TimeSpent:      req.TimeSpent,
		CompletedAt:    time.Now(),
		CreatedAt:      time.Now(),
	}

	err := serviceManager.Firestore.SaveTestResult(result)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to save test result",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    result,
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
	userID, exists := c.Get("userID")
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

	results, err := serviceManager.Firestore.GetTestResults(userID.(string))
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

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	family, err := serviceManager.Firestore.GetFamily(familyID.(string))
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

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	stats, err := serviceManager.Firestore.GetFamilyStats(familyID.(string))
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

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	familyResults, err := serviceManager.Firestore.GetFamilyResults(familyID.(string))
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

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	children, err := serviceManager.Firestore.GetFamilyChildren(familyID.(string))
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

	familyID, exists := c.Get("validatedFamilyID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Family access validation required",
		})
		return
	}

	progress, err := serviceManager.Firestore.GetFamilyProgress(familyID.(string))
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

// @Summary		Create Child Account
// @Description	Create a new child account (parent only)
// @Tags			children
// @Accept			json
// @Produce		json
// @Param			request	body		models.CreateChildAccountRequest	true	"Child account creation request"
// @Success		201		{object}	models.APIResponse					"Child account created successfully"
// @Failure		400		{object}	models.APIResponse					"Invalid request data"
// @Failure		403		{object}	models.APIResponse					"Parent role required"
// @Failure		500		{object}	models.APIResponse					"Service unavailable or failed to create child account"
// @Security		BearerAuth
// @Router			/api/families/children [post]
func CreateChildAccount(c *gin.Context) {
	serviceManager := GetServiceManager(c)
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service unavailable",
		})
		return
	}

	var req models.CreateChildAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data: " + err.Error(),
		})
		return
	}

	userID, _ := c.Get("userID")
	familyID, _ := c.Get("validatedFamilyID")

	// Create child account using Firebase Auth
	createRequest := (&auth.UserToCreate{}).
		Email(req.Email).
		DisplayName(req.DisplayName).
		Password(req.Password)

	firebaseUserRecord, err := serviceManager.Auth.CreateUser(context.Background(), createRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create Firebase user: " + err.Error(),
		})
		return
	}

	// Create child record in our database
	child := &models.ChildAccount{
		ID:           firebaseUserRecord.UID,
		Email:        req.Email,
		DisplayName:  req.DisplayName,
		FamilyID:     familyID.(string),
		ParentID:     userID.(string),
		Role:         "child",
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	if err := serviceManager.Firestore.CreateChild(child); err != nil {
		// If database creation fails, clean up Firebase user
		_ = serviceManager.Auth.DeleteUser(context.Background(), firebaseUserRecord.UID)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create child account",
		})
		return
	}

	// IMPORTANT: Also create a User record so the child can log in
	childUser := &models.User{
		ID:           firebaseUserRecord.UID,
		FirebaseUID:  firebaseUserRecord.UID,
		Email:        req.Email,
		DisplayName:  req.DisplayName,
		FamilyID:     familyID.(string),
		Role:         "child",
		ParentID:     &[]string{userID.(string)}[0], // Convert string to *string
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	if err := serviceManager.Firestore.CreateUser(childUser); err != nil {
		// If user creation fails, clean up both child account and Firebase user
		_ = serviceManager.Firestore.DeleteChild(firebaseUserRecord.UID)
		_ = serviceManager.Auth.DeleteUser(context.Background(), firebaseUserRecord.UID)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create child user record",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Data: child,
	})
}

// @Summary		Update Child Account
// @Description	Update an existing child account (parent only)
// @Tags			children
// @Accept			json
// @Produce		json
// @Param			childId	path		string				true	"Child ID"
// @Param			request	body		models.ChildAccount	true	"Updated child account data"
// @Success		200		{object}	models.APIResponse	"Child account updated successfully"
// @Failure		400		{object}	models.APIResponse	"Invalid request data"
// @Failure		401		{object}	models.APIResponse	"Parent access required"
// @Failure		404		{object}	models.APIResponse	"Child not found"
// @Failure		500		{object}	models.APIResponse	"Failed to update child account"
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
	var child models.ChildAccount
	if err := c.ShouldBindJSON(&child); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	child.ID = childID

	if err := serviceManager.Firestore.UpdateChild(&child); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to update child account",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: child,
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

	// First delete from Firebase Auth
	if err := serviceManager.Auth.DeleteUser(context.Background(), childID); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to delete child from Firebase Auth: " + err.Error(),
		})
		return
	}

	// Delete child record from our database
	if err := serviceManager.Firestore.DeleteChild(childID); err != nil {
		// Firebase user is already deleted, but log the database error
		log.Printf("Warning: Failed to delete child record from database after Firebase deletion: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Child deleted from authentication but failed to remove from database",
		})
		return
	}

	// Delete user record from our database
	if err := serviceManager.Firestore.DeleteUser(childID); err != nil {
		// Child and Firebase user are already deleted, but log the database error
		log.Printf("Warning: Failed to delete user record from database: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Child account partially deleted - authentication removed but user record cleanup failed",
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

	progress, err := serviceManager.Firestore.GetUserProgress(childID)
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

	results, err := serviceManager.Firestore.GetTestResults(childID)
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
// @Description	Create a new user account after Firebase authentication
// @Tags			users
// @Accept			json
// @Produce		json
// @Param			request	body		object{displayName=string,role=string}	true	"User creation request"
// @Success		201		{object}	models.APIResponse						"User created successfully"
// @Failure		400		{object}	models.APIResponse						"Invalid request data"
// @Failure		401		{object}	models.APIResponse						"Firebase UID not found in token"
// @Failure		500		{object}	models.APIResponse						"Internal server error"
// @Security		BearerAuth
// @Router			/api/users [post]
func CreateUser(c *gin.Context) {
	var req struct {
		DisplayName string `json:"displayName" binding:"required"`
		Role        string `json:"role" binding:"required,oneof=parent child"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data: " + err.Error(),
		})
		return
	}

	// Get Firebase user info from middleware context
	firebaseUID, exists := c.Get("firebaseUID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Firebase UID not found in token",
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

	// Get user record from Firebase to get email
	userRecord, err := serviceManager.Auth.GetUser(context.Background(), firebaseUID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to get user information from Firebase",
		})
		return
	}
	email := userRecord.Email

	// Create family for parent users
	var familyID string
	if req.Role == "parent" {
		family := &models.Family{
			ID:        "family-" + firebaseUID.(string),
			Name:      req.DisplayName + "'s Family",
			CreatedBy: firebaseUID.(string),
			Members:   []string{firebaseUID.(string)},
			CreatedAt: time.Now(),
		}

		if err := serviceManager.Firestore.CreateFamily(family); err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Failed to create family",
			})
			return
		}
		familyID = family.ID
	}

	// Create user
	newUser := &models.User{
		ID:           firebaseUID.(string),
		FirebaseUID:  firebaseUID.(string),
		Email:        email,
		DisplayName:  req.DisplayName,
		FamilyID:     familyID,
		Role:         req.Role,
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	if err := serviceManager.Firestore.CreateUser(newUser); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create user",
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
	// Check if user exists in context from BasicAuthMiddleware
	user, exists := c.Get("user")
	if !exists {
		// User doesn't exist in our database yet, try to get from Firebase
		firebaseUID, exists := c.Get("firebaseUID")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "User not authenticated",
			})
			return
		}

		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "User not found in system. Please complete registration.",
			Data: map[string]interface{}{
				"firebaseUID":       firebaseUID,
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

	c.JSON(http.StatusOK, models.APIResponse{
		Data: map[string]interface{}{
			"id":           userData.ID,
			"email":        userData.Email,
			"displayName":  userData.DisplayName,
			"familyId":     userData.FamilyID,
			"role":         userData.Role,
			"parentId":     userData.ParentID,
			"isActive":     userData.IsActive,
			"createdAt":    userData.CreatedAt.Format(time.RFC3339),
			"lastActiveAt": userData.LastActiveAt.Format(time.RFC3339),
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
		SampleRate   int32    `json:"sampleRate"`
		Languages    []string `json:"supportedLanguages"`
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

// @Summary		Stream Audio File by ID
// @Description	Stream audio file for a specific audio ID within a wordset
// @Tags			wordsets
// @Accept			json
// @Produce		audio/mpeg
// @Param			id			path		string	true	"WordSet ID"
// @Param			audioId		path		string	true	"Audio ID to stream"
// @Success		200			{file}		audio	"Audio file content"
// @Failure		400			{object}	models.APIResponse	"Invalid request"
// @Failure		404			{object}	models.APIResponse	"Audio file not found"
// @Failure		500			{object}	models.APIResponse	"Internal server error"
// @Security		BearerAuth
// @Router			/api/wordsets/{id}/audio/{audioId} [get]
func StreamAudioByID(c *gin.Context) {
	wordSetID := c.Param("id")
	audioID := c.Param("audioId")

	if wordSetID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "WordSet ID parameter is required",
		})
		return
	}

	if audioID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Audio ID parameter is required",
		})
		return
	}

	// Check if serviceManager is properly initialized
	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not initialized",
		})
		return
	}

	// Use the global service manager for public endpoints
	sm := serviceManager

	// Get the wordset to verify access and find the audio
	wordSet, err := sm.Firestore.GetWordSet(wordSetID)
	if err != nil {
		log.Printf("StreamAudioByID: Error getting wordset '%s': %v", wordSetID, err)
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "WordSet not found",
		})
		return
	}

	log.Printf("StreamAudioByID: Found wordset '%s' with %d words", wordSet.Name, len(wordSet.Words))

	// Find the audio file in the wordset
	var audioFile *models.WordAudio
	var word string
	for i, wordItem := range wordSet.Words {
		log.Printf("StreamAudioByID: Checking word %d: '%s', audioID='%s'", i, wordItem.Word, wordItem.Audio.AudioID)
		if wordItem.Audio.AudioID == audioID {
			audioFile = &wordItem.Audio
			word = wordItem.Word
			log.Printf("StreamAudioByID: Found matching audio for word '%s'", word)
			break
		}
	}

	if audioFile == nil || audioFile.AudioID == "" {
		log.Printf("StreamAudioByID: Audio file with ID '%s' not found in wordset", audioID)
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: fmt.Sprintf("Audio file with ID '%s' not found in wordset", audioID),
		})
		return
	}

	// Get the audio file data from storage using the audioId (which is the filename)
	storagePath := fmt.Sprintf("audio/%s", audioID)
	log.Printf("StreamAudioByID: Attempting to get audio data from storage path: '%s'", storagePath)
	audioData, err := sm.Storage.GetAudioData(storagePath)
	if err != nil {
		log.Printf("StreamAudioByID: Error getting audio data for audio ID '%s' from path '%s': %v", audioID, storagePath, err)
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: fmt.Sprintf("Audio file not found in storage for ID '%s'", audioID),
		})
		return
	}

	log.Printf("StreamAudioByID: Successfully retrieved audio data, size: %d bytes", len(audioData))

	// Determine content type based on file extension
	contentType := "audio/mpeg" // Default to MP3

	// Set appropriate headers
	c.Header("Content-Type", contentType)
	c.Header("Cache-Control", "public, max-age=3600") // Cache for 1 hour
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s_%s.mp3\"", word, wordSet.Language))

	// Stream the audio data
	c.Data(http.StatusOK, contentType, audioData)
}
