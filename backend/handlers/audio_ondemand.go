// Package handlers implements HTTP request handlers for the Diktator API.
package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/mileusna/useragent"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/tts"
)

// @Summary		Stream Audio for Word, Sentence, or Translation
// @Description	Stream TTS audio for a specific word, sentence, or translation in a word set (generates on-demand, cached by browser). If lang parameter matches the wordset's language, plays the word itself. If lang differs, looks up and plays the translation in that language. Used by all test modes including translation and listeningTranslation modes. Automatically uses appropriate speaking rate for single words (0.8x) vs sentences (0.9x). Supports both GET and HEAD methods for iOS Safari compatibility.
// @Tags			wordsets
// @Accept			json
// @Produce		audio/ogg
// @Param			id		path		string	true	"Word Set ID"
// @Param			word	path		string	true	"Word or sentence to generate audio for"
// @Param			lang	query		string	false	"Target language code (e.g., 'no' for Norwegian, 'en' for English). If omitted or matches wordset language, plays the word. If different, plays the translation."
// @Success		200		{file}		audio	"Audio file content (OGG Opus or MP3 for iOS)"
// @Failure		400		{object}	models.APIResponse	"Invalid request"
// @Failure		404		{object}	models.APIResponse	"Word set, word, or translation not found"
// @Failure		500		{object}	models.APIResponse	"Failed to generate audio"
// @Router			/api/wordsets/{id}/words/{word}/audio [get]
// @Router			/api/wordsets/{id}/words/{word}/audio [head]
func StreamWordAudio(c *gin.Context) {
	wordSetID := c.Param("id")
	word := c.Param("word")
	requestedLang := c.Query("lang") // Optional language parameter
	isHeadRequest := c.Request.Method == "HEAD"

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

	// For HEAD requests, just validate and return headers without generating audio
	if isHeadRequest {
		ua := useragent.Parse(c.GetHeader("User-Agent"))
		// Safari on all platforms (iOS, iPadOS, macOS) doesn't fully support OGG Opus, requires MP3
		isSafari := ua.IsSafari()

		contentType := "audio/ogg; codecs=opus"
		if isSafari {
			contentType = "audio/mpeg"
		}

		c.Header("Content-Type", contentType)
		c.Header("Cache-Control", "public, max-age=86400, immutable")
		c.Header("Accept-Ranges", "bytes")
		c.Header("Access-Control-Allow-Origin", "*")
		c.Status(http.StatusOK)
		return
	}

	if serviceManager == nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Service manager not initialized",
		})
		return
	}

	sm := serviceManager

	// Fetch word set to determine language and find word/translation
	wordSet, err := sm.DB.GetWordSet(wordSetID)
	if err != nil {
		log.Printf("StreamWordAudio: Error getting word set '%s': %v", wordSetID, err)
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: "Word set not found",
		})
		return
	}

	// Find the word in this word set
	var wordIdx = -1
	for i := range wordSet.Words {
		if wordSet.Words[i].Word == word {
			wordIdx = i
			break
		}
	}

	if wordIdx < 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Error: fmt.Sprintf("Word '%s' not found in word set", word),
		})
		return
	}
	wordItem := wordSet.Words[wordIdx]

	// Determine what text to generate audio for:
	// - If no lang specified or lang matches wordset language: play the word itself
	// - If lang differs: look up translation and play that
	var textToSpeak string
	var language string
	var isTranslation bool

	if requestedLang == "" || requestedLang == wordSet.Language {
		// Play the word itself in the wordset's language
		textToSpeak = word
		language = wordSet.Language
		isTranslation = false
	} else {
		// Look up translation in the requested language
		for _, translation := range wordItem.Translations {
			if translation.Language == requestedLang {
				textToSpeak = translation.Text
				language = requestedLang
				isTranslation = true
				break
			}
		}

		if textToSpeak == "" {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Error: fmt.Sprintf("Translation for word '%s' in language '%s' not found", word, requestedLang),
			})
			return
		}
	}

	// Validate sentence length if it's a sentence
	if tts.IsSentence(textToSpeak) {
		wordCount := tts.GetWordCount(textToSpeak)
		if wordCount > tts.MaxSentenceWords {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: fmt.Sprintf("Sentence exceeds maximum word limit of %d (has %d words)", tts.MaxSentenceWords, wordCount),
			})
			return
		}
	}

	// Detect if client is Safari (requires MP3, not OGG Opus)
	// Safari on all platforms (iOS, iPadOS, macOS) has only partial support for OGG Opus
	ua := useragent.Parse(c.GetHeader("User-Agent"))
	isSafari := ua.IsSafari()

	isSentence := tts.IsSentence(textToSpeak)
	if isTranslation {
		log.Printf("StreamWordAudio: Generating translation audio for '%s' -> '%s' in language '%s' for %s (v%s)",
			word, textToSpeak, language, ua.Name, ua.Version)
	} else if isSentence {
		log.Printf("StreamWordAudio: Generating sentence audio (%d words) in language '%s' for %s (v%s)",
			tts.GetWordCount(textToSpeak), language, ua.Name, ua.Version)
	} else {
		log.Printf("StreamWordAudio: Generating word audio for '%s' in language '%s' for %s (v%s)",
			textToSpeak, language, ua.Name, ua.Version)
	}

	// Generate audio using TTS service - automatically detects sentence vs word
	// Safari requires MP3 format (only partial OGG Opus support)
	audioData, audioFile, contentType, err := sm.TTS.GenerateTextAudioWithFormat(textToSpeak, language, isSafari)
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

	log.Printf("StreamWordAudio: Successfully generated audio, size: %d bytes, type: %s", len(audioData), contentType)

	// Set aggressive caching headers - browser will cache this for the session
	c.Header("Content-Type", contentType)
	c.Header("Content-Length", fmt.Sprintf("%d", len(audioData)))
	c.Header("Cache-Control", "public, max-age=86400, immutable") // Cache for 24 hours, immutable
	c.Header("ETag", fmt.Sprintf(`"%s-%s-%s"`, wordSetID, word, language))
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", audioFile.ID))
	c.Header("X-Generated-On-Demand", "true")
	c.Header("X-Is-Sentence", fmt.Sprintf("%t", isSentence))
	c.Header("X-Is-Translation", fmt.Sprintf("%t", isTranslation))
	if isTranslation {
		c.Header("X-Translation-Source", word)
		c.Header("X-Translation-Target", textToSpeak)
	}
	c.Header("Accept-Ranges", "bytes")           // Enable range requests for better browser compatibility
	c.Header("Access-Control-Allow-Origin", "*") // CORS for audio playback

	// Handle Range requests for iOS Safari compatibility
	rangeHeader := c.GetHeader("Range")
	if rangeHeader != "" {
		// Parse range header (e.g., "bytes=0-1023")
		var start, end int64
		_, err := fmt.Sscanf(rangeHeader, "bytes=%d-%d", &start, &end)
		if err != nil || start < 0 || start >= int64(len(audioData)) {
			// Invalid range, return full content
			c.Data(http.StatusOK, contentType, audioData)
			return
		}

		// Adjust end if not specified or out of bounds
		if end <= 0 || end >= int64(len(audioData)) {
			end = int64(len(audioData)) - 1
		}

		// Return partial content
		c.Header("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, len(audioData)))
		c.Header("Content-Length", fmt.Sprintf("%d", end-start+1))
		c.Data(http.StatusPartialContent, contentType, audioData[start:end+1])
		return
	}

	// Stream the full audio data directly to the client
	c.Data(http.StatusOK, contentType, audioData)
}
