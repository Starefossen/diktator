// Package handlers implements HTTP request handlers for the Diktator API.
package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/tts"
)

// @Summary		Stream Audio for Word or Sentence
// @Description	Stream TTS audio for a specific word or sentence in a word set (generates on-demand, cached by browser). Automatically uses appropriate speaking rate for single words (0.8x) vs sentences (0.9x).
// @Tags			wordsets
// @Accept			json
// @Produce		audio/ogg
// @Param			id		path		string	true	"Word Set ID"
// @Param			word	path		string	true	"Word or sentence to generate audio for"
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

	// Validate sentence length if it's a sentence
	if tts.IsSentence(word) {
		wordCount := tts.GetWordCount(word)
		if wordCount > tts.MaxSentenceWords {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: fmt.Sprintf("Sentence exceeds maximum word limit of %d (has %d words)", tts.MaxSentenceWords, wordCount),
			})
			return
		}
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

	isSentence := tts.IsSentence(word)
	if isSentence {
		log.Printf("StreamWordAudio: Generating sentence audio (%d words) in language '%s'", tts.GetWordCount(word), language)
	} else {
		log.Printf("StreamWordAudio: Generating word audio for '%s' in language '%s'", word, language)
	}

	// Generate audio using TTS service - automatically detects sentence vs word
	audioData, audioFile, err := sm.TTS.GenerateTextAudio(word, language)
	if err != nil {
		log.Printf("StreamWordAudio: Error generating audio: %v", err)

		// Check if it's a permission error from Google Cloud
		errStr := err.Error()
		if strings.Contains(errStr, "PermissionDenied") || strings.Contains(errStr, "serviceusage.serviceUsageConsumer") {
			c.JSON(http.StatusServiceUnavailable, models.APIResponse{
				Error:   "Audio generation temporarily unavailable due to service configuration. Please try again later.",
				Details: errStr,
			})
			return
		}

		// For other errors, return 500 with details
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error:   "Failed to generate audio",
			Details: errStr,
		})
		return
	}

	log.Printf("StreamWordAudio: Successfully generated audio, size: %d bytes", len(audioData))

	// Set aggressive caching headers - browser will cache this for the session
	c.Header("Content-Type", "audio/ogg; codecs=opus")
	c.Header("Cache-Control", "public, max-age=86400, immutable") // Cache for 24 hours, immutable
	c.Header("ETag", fmt.Sprintf(`"%s-%s-%s"`, wordSetID, word, language))
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", audioFile.ID))
	c.Header("X-Generated-On-Demand", "true")
	c.Header("X-Is-Sentence", fmt.Sprintf("%t", isSentence))
	c.Header("Accept-Ranges", "bytes")           // Enable range requests for better browser compatibility
	c.Header("Access-Control-Allow-Origin", "*") // CORS for audio playback

	// Stream the audio data directly to the client
	c.Data(http.StatusOK, "audio/ogg", audioData)
}
