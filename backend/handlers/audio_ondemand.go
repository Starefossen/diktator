package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
)

// @Summary		Stream Audio for Word
// @Description	Stream TTS audio for a specific word in a word set (generates on-demand, cached by browser)
// @Tags			wordsets
// @Accept			json
// @Produce		audio/ogg
// @Param			id		path		string	true	"Word Set ID"
// @Param			word	path		string	true	"Word to generate audio for"
// @Success		200		{file}		audio	"Audio file content (OGG Opus)"
// @Failure		400		{object}	models.APIResponse	"Invalid request"
// @Failure		404		{object}	models.APIResponse	"Word set not found"
// @Failure		500		{object}	models.APIResponse	"Failed to generate audio"
// @Router			/api/wordsets/{id}/words/{word}/audio [get]
func StreamWordAudio(c *gin.Context) {
	wordSetID := c.Param("id")
	word := c.Param("word")
	language := c.Query("lang") // Optional language parameter

	if wordSetID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word set ID is required",
		})
		return
	}

	if word == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word parameter is required",
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

	sm := serviceManager

	// If language not provided in query, fall back to fetching word set
	if language == "" {
		wordSet, err := sm.DB.GetWordSet(wordSetID)
		if err != nil {
			log.Printf("StreamWordAudio: Error getting word set '%s': %v", wordSetID, err)
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: "Word set not found",
			})
			return
		}

		// Verify the word exists in this word set
		wordExists := false
		for _, wordItem := range wordSet.Words {
			if wordItem.Word == word {
				wordExists = true
				break
			}
		}

		if !wordExists {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: fmt.Sprintf("Word '%s' not found in word set", word),
			})
			return
		}

		language = wordSet.Language
	}

	log.Printf("StreamWordAudio: Generating audio for word '%s' in language '%s'", word, language)

	// Generate audio using TTS service (with caching)
	audioData, audioFile, err := sm.TTS.GenerateAudio(word, language)
	if err != nil {
		log.Printf("StreamWordAudio: Error generating audio for word '%s': %v", word, err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: fmt.Sprintf("Failed to generate audio: %v", err),
		})
		return
	}

	log.Printf("StreamWordAudio: Successfully generated audio for word '%s', size: %d bytes", word, len(audioData))

	// Set aggressive caching headers - browser will cache this for the session
	c.Header("Content-Type", "audio/ogg; codecs=opus")
	c.Header("Cache-Control", "public, max-age=86400, immutable") // Cache for 24 hours, immutable
	c.Header("ETag", fmt.Sprintf(`"%s-%s-%s"`, wordSetID, word, language))
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", audioFile.ID))
	c.Header("X-Generated-On-Demand", "true")
	c.Header("Accept-Ranges", "bytes")           // Enable range requests for better browser compatibility
	c.Header("Access-Control-Allow-Origin", "*") // CORS for audio playback

	// Stream the audio data directly to the client
	c.Data(http.StatusOK, "audio/ogg", audioData)
}
