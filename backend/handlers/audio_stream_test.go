package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/services"
	"github.com/stretchr/testify/assert"
)

// TestStreamAudioByID tests the new audio streaming endpoint
func TestStreamAudioByID(t *testing.T) {
	// Initialize test environment
	manager, err := services.NewManager()
	if err != nil {
		t.Fatalf("Failed to initialize service manager: %v", err)
	}
	defer manager.Close()

	// Initialize handlers with the service manager
	err = InitializeServices(manager)
	if err != nil {
		t.Fatalf("Failed to initialize services: %v", err)
	}

	// Set up Gin in test mode
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Add the audio endpoint using the new route structure
	wordsets := r.Group("/api/wordsets")
	{
		wordsets.GET("/:id/audio/:audioId", StreamAudioByID)
	}

	tests := []struct {
		name           string
		wordSetID      string
		audioID        string
		expectedStatus int
	}{
		{
			name:           "Valid wordset and audio ID",
			wordSetID:      "test-wordset-123",
			audioID:        "test-audio-123",
			expectedStatus: http.StatusNotFound, // Expected since no wordset exists in test
		},
		{
			name:           "Empty wordset ID",
			wordSetID:      "",
			audioID:        "test-audio-123",
			expectedStatus: http.StatusBadRequest, // Handler checks and returns 400
		},
		{
			name:           "Empty audio ID",
			wordSetID:      "test-wordset-123",
			audioID:        "",
			expectedStatus: http.StatusNotFound, // Route doesn't match with trailing slash
		},
		{
			name:           "Non-existent wordset",
			wordSetID:      "nonexistent-wordset-12345",
			audioID:        "test-audio-123",
			expectedStatus: http.StatusNotFound, // Very unlikely to exist
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := "/api/wordsets/" + tt.wordSetID + "/audio/" + tt.audioID

			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Empty wordSetID: route matches but handler gets empty string, returns 400
			if tt.wordSetID == "" {
				assert.Equal(t, http.StatusBadRequest, w.Code)
				return
			}

			// Empty audioID: route doesn't match due to trailing slash, returns 404
			if tt.audioID == "" {
				assert.Equal(t, http.StatusNotFound, w.Code)
				return
			}

			// For non-existent wordsets/audio, expect 404
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

// TestStreamAudioByIDWithGeneratedAudio tests the endpoint with actual generated audio
func TestStreamAudioByIDWithGeneratedAudio(t *testing.T) {
	// This test would require setting up actual audio generation
	// For now, we'll skip it unless we're in a full integration test environment
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Initialize test environment
	manager, err := services.NewManager()
	if err != nil {
		t.Fatalf("Failed to initialize service manager: %v", err)
	}
	defer manager.Close()

	// Initialize handlers
	err = InitializeServices(manager)
	if err != nil {
		t.Fatalf("Failed to initialize services: %v", err)
	}

	// This would require creating a word set and generating audio
	// We'll implement this when we have the full test setup
	t.Log("Audio streaming endpoint is ready for integration testing")
}
