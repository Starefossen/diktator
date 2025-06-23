package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupAudioTestRouter creates a test router with initialized services for audio endpoints
func setupAudioTestRouter(t *testing.T) *gin.Engine {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Initialize service manager for testing
	manager, err := services.NewManager()
	require.NoError(t, err, "Failed to initialize service manager")

	// Initialize handlers with the service manager
	err = InitializeServices(manager)
	require.NoError(t, err, "Failed to initialize handlers")

	// Create router
	r := gin.New()

	// Add test routes
	api := r.Group("/api")
	{
		wordsets := api.Group("/wordsets")
		{
			wordsets.POST("/:id/generate-audio", GenerateAudio)
			wordsets.GET("/voices", ListVoices)
		}
	}

	return r
}

// TestGenerateAudio tests the generate audio endpoint
func TestGenerateAudio(t *testing.T) {
	router := setupAudioTestRouter(t)

	tests := []struct {
		name           string
		wordSetID      string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Valid word set ID",
			wordSetID:      "test-wordset-123",
			expectedStatus: http.StatusAccepted,
			expectedError:  "",
		},
		{
			name:           "Empty word set ID",
			wordSetID:      "",
			expectedStatus: http.StatusBadRequest, // Handler returns 400 for empty ID
			expectedError:  "Word set ID is required",
		},
		{
			name:           "UUID format word set ID",
			wordSetID:      "9dda0c04-20fa-46d7-a9d1-0e0627406663",
			expectedStatus: http.StatusAccepted,
			expectedError:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			url := "/api/wordsets/" + tt.wordSetID + "/generate-audio"
			req, err := http.NewRequest("POST", url, nil)
			require.NoError(t, err)

			// Create response recorder
			w := httptest.NewRecorder()

			// Perform request
			router.ServeHTTP(w, req)

			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Parse response for both success and error cases
			if tt.expectedStatus == http.StatusAccepted || tt.expectedStatus == http.StatusBadRequest {
				var response models.APIResponse
				err = json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)

				if tt.expectedError != "" {
					assert.Equal(t, tt.expectedError, response.Error)
				} else {
					assert.Empty(t, response.Error)
					assert.Equal(t, "Audio generation started", response.Message)
				}
			}
		})
	}
}

// TestListVoices tests the list voices endpoint
func TestListVoices(t *testing.T) {
	router := setupAudioTestRouter(t)

	tests := []struct {
		name     string
		language string
	}{
		{
			name:     "Default language (English)",
			language: "",
		},
		{
			name:     "Norwegian language",
			language: "nb-NO",
		},
		{
			name:     "English US",
			language: "en-US",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			url := "/api/wordsets/voices"
			if tt.language != "" {
				url += "?language=" + tt.language
			}

			req, err := http.NewRequest("GET", url, nil)
			require.NoError(t, err)

			// Create response recorder
			w := httptest.NewRecorder()

			// Perform request
			router.ServeHTTP(w, req)

			// Parse response
			var response models.APIResponse
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			// The endpoint should return 200 if TTS API is enabled, or 500 if API is disabled
			if w.Code == http.StatusOK {
				// Success case - TTS service is available
				assert.NotEmpty(t, response.Message)
				assert.Contains(t, response.Message, "Found")
				assert.Contains(t, response.Message, "voices")
				assert.NotNil(t, response.Data)
			} else if w.Code == http.StatusInternalServerError {
				// Expected when TTS API is not enabled or other service issues
				assert.NotEmpty(t, response.Error)
				assert.Contains(t, response.Error, "Failed to retrieve voices")
				// Log the specific error for debugging
				t.Logf("TTS service error (expected if API not enabled): %s", response.Error)
			} else {
				// Unexpected status code
				t.Errorf("Unexpected status code: %d, response: %+v", w.Code, response)
			}
		})
	}
}

// TestGenerateAudioWithoutServiceManager tests error handling when services are not initialized
func TestGenerateAudioWithoutServiceManager(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Store the current service manager
	originalManager := serviceManager
	defer func() {
		// Restore the original service manager
		serviceManager = originalManager
	}()

	// Clear the service manager to simulate uninitialized state
	serviceManager = nil

	// Create router without initializing services
	r := gin.New()
	api := r.Group("/api")
	{
		wordsets := api.Group("/wordsets")
		{
			wordsets.POST("/:id/generate-audio", GenerateAudio)
		}
	}

	// Create request
	req, err := http.NewRequest("POST", "/api/wordsets/test-id/generate-audio", nil)
	require.NoError(t, err)

	// Create response recorder
	w := httptest.NewRecorder()

	// Perform request
	r.ServeHTTP(w, req)

	// Should return 500 Internal Server Error
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// Parse response
	var response models.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Service manager not initialized", response.Error)
}

// TestServiceManagerAudioInitialization tests the service manager initialization for audio endpoints
func TestServiceManagerAudioInitialization(t *testing.T) {
	// Store original state
	originalManager := serviceManager
	defer func() {
		// Restore original state
		serviceManager = originalManager
	}()

	// Test that InitializeServices works correctly
	manager, err := services.NewManager()
	require.NoError(t, err)

	err = InitializeServices(manager)
	assert.NoError(t, err)

	// Test that serviceManager is now set
	assert.NotNil(t, serviceManager)

	// Clean up
	err = CloseServices()
	assert.NoError(t, err)
}

// BenchmarkGenerateAudio benchmarks the generate audio endpoint
func BenchmarkGenerateAudio(b *testing.B) {
	gin.SetMode(gin.TestMode)

	// Initialize services
	manager, err := services.NewManager()
	if err != nil {
		b.Fatalf("Failed to initialize service manager: %v", err)
	}

	err = InitializeServices(manager)
	if err != nil {
		b.Fatalf("Failed to initialize handlers: %v", err)
	}
	defer CloseServices()

	router := gin.New()
	api := router.Group("/api")
	{
		wordsets := api.Group("/wordsets")
		{
			wordsets.POST("/:id/generate-audio", GenerateAudio)
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/api/wordsets/test-wordset/generate-audio", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}
