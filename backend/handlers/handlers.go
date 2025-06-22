package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
)

var serviceManager *services.Manager

// InitializeServices initializes the service manager
func InitializeServices() error {
	var err error
	serviceManager, err = services.NewManager()
	return err
}

// CloseServices closes all services
func CloseServices() error {
	if serviceManager != nil {
		return serviceManager.Close()
	}
	return nil
}

// HealthCheck returns a simple health check response
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "diktator-api",
		"time":    time.Now().UTC(),
	})
}

// GetWordSets returns word sets for the user's family
func GetWordSets(c *gin.Context) {
	// TODO: Get familyID from authenticated user
	familyID := c.Query("familyId")
	if familyID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "familyId is required",
		})
		return
	}

	wordSets, err := serviceManager.Firestore.GetWordSets(familyID)
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
func CreateWordSet(c *gin.Context) {
	var req models.CreateWordSetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// TODO: Get familyID and userID from authenticated user
	familyID := c.Query("familyId")
	userID := c.Query("userId")
	if familyID == "" || userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "familyId and userId are required",
		})
		return
	}

	// Create new word set
	wordSet := &models.WordSet{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Words:     req.Words,
		FamilyID:  familyID,
		CreatedBy: userID,
		Language:  req.Language,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := serviceManager.Firestore.CreateWordSet(wordSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Failed to create word set",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    wordSet,
		Message: "Word set created successfully",
	})
}

// DeleteWordSet deletes a word set
func DeleteWordSet(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	err := serviceManager.Firestore.DeleteWordSet(id)
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

// GenerateAudio generates TTS audio for all words in a set
func GenerateAudio(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	// Start audio generation in background
	go func() {
		err := serviceManager.GenerateAudioForWordSet(id)
		if err != nil {
			// Log error but don't fail the request since it's async
			// In a production app, you might want to use a job queue
			// and provide status updates to the client
			c.Header("X-Generation-Error", err.Error())
		}
	}()

	c.JSON(http.StatusAccepted, models.APIResponse{
		Message: "Audio generation started",
	})
}

// SaveResult saves a test result
func SaveResult(c *gin.Context) {
	var req models.SaveResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Invalid request data",
		})
		return
	}

	// TODO: Get userID from authenticated user
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "userId is required",
		})
		return
	}

	// Create test result
	result := &models.TestResult{
		ID:             uuid.New().String(),
		WordSetID:      req.WordSetID,
		UserID:         userID,
		Score:          req.Score,
		TotalWords:     req.TotalWords,
		CorrectWords:   req.CorrectWords,
		IncorrectWords: req.IncorrectWords,
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

// GetResults returns test results for the user
func GetResults(c *gin.Context) {
	// TODO: Get userID from authenticated user
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "userId is required",
		})
		return
	}

	results, err := serviceManager.Firestore.GetTestResults(userID)
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
