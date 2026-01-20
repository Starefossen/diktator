package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// TestAudioEndpointPublicAccess verifies that audio endpoints are accessible without authentication
// This is critical for Safari < 17 which makes Range requests before loading audio
func TestAudioEndpointPublicAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("audio endpoint should be accessible without authentication", func(t *testing.T) {
		// Create a test router with the same structure as main.go
		r := gin.New()

		// Public API routes (no authentication required) - MUST be registered first
		public := r.Group("/api")
		{
			public.GET("/wordsets/:id/words/:word/audio", StreamWordAudio)
			public.HEAD("/wordsets/:id/words/:word/audio", StreamWordAudio)
		}

		// Simulate protected routes that would normally catch /api/wordsets/* paths
		protected := r.Group("/api")
		protected.Use(func(c *gin.Context) {
			// Simulate auth middleware - this should NOT catch audio routes
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Unauthorized - should not reach here for audio routes",
			})
			c.Abort()
		})
		{
			wordsets := protected.Group("/wordsets")
			{
				wordsets.GET("", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{"message": "protected"})
				})
			}
		}

		tests := []struct {
			name             string
			method           string
			url              string
			headers          map[string]string
			expectedStatus   int
			shouldNotContain string
		}{
			{
				name:             "GET audio request without auth should work",
				method:           "GET",
				url:              "/api/wordsets/test-id/words/hello/audio",
				expectedStatus:   http.StatusInternalServerError, // 500 from handler (service manager not initialized in test), not 401 from auth
				shouldNotContain: "Unauthorized",
			},
			{
				name:             "HEAD audio request without auth should work",
				method:           "HEAD",
				url:              "/api/wordsets/test-id/words/hello/audio",
				expectedStatus:   http.StatusOK, // HEAD returns 200 OK with headers
				shouldNotContain: "Unauthorized",
			},
			{
				name:   "GET with Range header (Safari < 17 behavior)",
				method: "GET",
				url:    "/api/wordsets/test-id/words/hello/audio",
				headers: map[string]string{
					"Range":      "bytes=0-1",
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Safari/605.1.15",
				},
				expectedStatus:   http.StatusInternalServerError, // Handler response, not auth middleware
				shouldNotContain: "Unauthorized",
			},
			{
				name:             "GET with sentence (spaces in URL)",
				method:           "GET",
				url:              "/api/wordsets/test-id/words/Two%20robots/audio?lang=en",
				expectedStatus:   http.StatusInternalServerError, // Handler response, not auth middleware
				shouldNotContain: "Unauthorized",
			},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				req, _ := http.NewRequest(tt.method, tt.url, nil)
				for key, value := range tt.headers {
					req.Header.Set(key, value)
				}

				w := httptest.NewRecorder()
				r.ServeHTTP(w, req)

				assert.Equal(t, tt.expectedStatus, w.Code,
					"Status code mismatch for %s %s", tt.method, tt.url)

				if tt.shouldNotContain != "" {
					assert.NotContains(t, w.Body.String(), tt.shouldNotContain,
						"Response should not contain '%s' - indicates auth middleware incorrectly intercepted public route",
						tt.shouldNotContain)
				}

				// Log for debugging
				t.Logf("%s %s -> %d: %s", tt.method, tt.url, w.Code, w.Body.String())
			})
		}
	})

	t.Run("audio routes should be registered before protected routes", func(t *testing.T) {
		// This test ensures route registration order is correct
		// If audio routes are registered after protected /api/wordsets/* routes,
		// they will be caught by authentication middleware

		r := gin.New()

		// Track which handler is called
		var handlerCalled string

		// Register audio route first (correct order)
		r.GET("/api/wordsets/:id/words/:word/audio", func(c *gin.Context) {
			handlerCalled = "audio"
			c.Status(http.StatusOK)
		})

		// Register protected route after
		protected := r.Group("/api")
		protected.Use(func(c *gin.Context) {
			handlerCalled = "protected"
			c.Status(http.StatusUnauthorized)
			c.Abort()
		})
		{
			protected.GET("/wordsets/:id", func(c *gin.Context) {
				handlerCalled = "wordsets"
				c.Status(http.StatusOK)
			})
		}

		// Test that audio route is matched first
		req, _ := http.NewRequest("GET", "/api/wordsets/test-id/words/hello/audio", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, "audio", handlerCalled,
			"Audio handler should be called, not protected middleware")
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

// TestAudioEndpointHTTPMethods verifies both GET and HEAD methods work
func TestAudioEndpointHTTPMethods(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Register audio endpoints
	r.GET("/api/wordsets/:id/words/:word/audio", StreamWordAudio)
	r.HEAD("/api/wordsets/:id/words/:word/audio", StreamWordAudio)

	tests := []struct {
		name   string
		method string
	}{
		{"GET method", "GET"},
		{"HEAD method", "HEAD"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest(tt.method, "/api/wordsets/test-id/words/hello/audio", nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Should not return 405 Method Not Allowed
			assert.NotEqual(t, http.StatusMethodNotAllowed, w.Code,
				"%s method should be allowed", tt.method)

			t.Logf("%s -> %d", tt.method, w.Code)
		})
	}
}
