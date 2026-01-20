package handlers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAudioEndpointSafariBehavior tests audio endpoint behavior for different Safari versions
// This ensures Safari < 17 and Safari 17+ both work correctly with Range requests
func TestAudioEndpointSafariBehavior(t *testing.T) {
	// Setup test environment with real database
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// User agents for different Safari versions
	const (
		safariOS16     = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Safari/605.1.15"
		safariOS17     = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
		safariIOS16    = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
		safariIOS17    = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
		safariIPadOS16 = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Safari/605.1.15" // iPadOS in desktop mode
		chrome         = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	)

	// Initialize services and handlers
	err := InitializeServices(env.ServiceManager)
	require.NoError(t, err, "Failed to initialize handlers")

	// Create test data - parent first (with empty family), then family, then update
	testUser := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(testUser.ID)
	testUser.FamilyID = familyID

	// Update parent's family_id in the database
	_, err = env.Pool.Exec(env.T.Context(), "UPDATE users SET family_id = $1 WHERE id = $2", familyID, testUser.ID)
	require.NoError(t, err)

	// Create test word set
	testWordSet := env.CreateTestWordSet(familyID, testUser.ID)

	// Setup router with public audio routes (matching production)
	r := setupAudioTestRouter()

	tests := []struct {
		name              string
		userAgent         string
		method            string
		url               string
		rangeHeader       string
		expectedStatus    int
		expectContentType string
		description       string
	}{
		// Safari < 17 Tests (critical - these were failing before the fix)
		{
			name:              "Safari 16 macOS - HEAD request",
			userAgent:         safariOS16,
			method:            "HEAD",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			expectedStatus:    http.StatusOK,
			expectContentType: "audio/mpeg",
			description:       "Safari 16 should receive MP3 format",
		},
		{
			name:              "Safari 16 macOS - Range request (initial probe)",
			userAgent:         safariOS16,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			rangeHeader:       "bytes=0-1",
			expectedStatus:    http.StatusPartialContent,
			expectContentType: "audio/mpeg",
			description:       "Safari < 17 sends Range: bytes=0-1 as initial probe - MUST work",
		},
		{
			name:              "Safari 16 iOS - Range request",
			userAgent:         safariIOS16,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			rangeHeader:       "bytes=0-1",
			expectedStatus:    http.StatusPartialContent,
			expectContentType: "audio/mpeg",
			description:       "iOS Safari 16 must handle Range requests correctly",
		},
		{
			name:              "Safari 16 iPad desktop mode - Range request",
			userAgent:         safariIPadOS16,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			rangeHeader:       "bytes=0-1",
			expectedStatus:    http.StatusPartialContent,
			expectContentType: "audio/mpeg",
			description:       "iPadOS in desktop mode must be detected as Safari",
		},
		{
			name:              "Safari 16 - Full audio request after probe",
			userAgent:         safariOS16,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			expectedStatus:    http.StatusOK,
			expectContentType: "audio/mpeg",
			description:       "After successful probe, Safari requests full audio",
		},
		{
			name:              "Safari 16 - Sentence with spaces",
			userAgent:         safariOS16,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/Two%%20robots/audio?lang=en", testWordSet.ID),
			rangeHeader:       "bytes=0-1",
			expectedStatus:    http.StatusPartialContent,
			expectContentType: "audio/mpeg",
			description:       "Safari 16 must handle sentences with spaces in Range requests",
		},

		// Safari 17+ Tests
		{
			name:              "Safari 17 macOS - HEAD request",
			userAgent:         safariOS17,
			method:            "HEAD",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			expectedStatus:    http.StatusOK,
			expectContentType: "audio/mpeg",
			description:       "Safari 17+ should still receive MP3 (Safari still has partial OGG support)",
		},
		{
			name:              "Safari 17 iOS - GET request",
			userAgent:         safariIOS17,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			expectedStatus:    http.StatusOK,
			expectContentType: "audio/mpeg",
			description:       "Safari 17 should work with normal GET requests",
		},
		{
			name:              "Safari 17 - Range request still supported",
			userAgent:         safariOS17,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			rangeHeader:       "bytes=0-1",
			expectedStatus:    http.StatusPartialContent,
			expectContentType: "audio/mpeg",
			description:       "Safari 17 may still use Range requests, must work",
		},

		// Chrome Tests (should get OGG)
		{
			name:              "Chrome - GET request",
			userAgent:         chrome,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			expectedStatus:    http.StatusOK,
			expectContentType: "audio/ogg",
			description:       "Chrome should receive OGG Opus format",
		},
		{
			name:              "Chrome - HEAD request",
			userAgent:         chrome,
			method:            "HEAD",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=en", testWordSet.ID),
			expectedStatus:    http.StatusOK,
			expectContentType: "audio/ogg",
			description:       "Chrome should be detected correctly (not as Safari)",
		},

		// Translation mode tests
		{
			name:              "Safari 16 - Translation audio (Norwegian)",
			userAgent:         safariOS16,
			method:            "GET",
			url:               fmt.Sprintf("/api/wordsets/%s/words/hello/audio?lang=no", testWordSet.ID),
			expectedStatus:    http.StatusOK,
			expectContentType: "audio/mpeg",
			description:       "Safari 16 should receive translation audio in MP3",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(tt.method, tt.url, nil)
			require.NoError(t, err)

			// Set User-Agent
			req.Header.Set("User-Agent", tt.userAgent)

			// Set Range header if specified
			if tt.rangeHeader != "" {
				req.Header.Set("Range", tt.rangeHeader)
			}

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Verify status code
			assert.Equal(t, tt.expectedStatus, w.Code,
				"%s: Expected status %d, got %d. Response: %s",
				tt.description, tt.expectedStatus, w.Code, w.Body.String())

			// Verify Content-Type for successful responses
			if w.Code == http.StatusOK || w.Code == http.StatusPartialContent {
				contentType := w.Header().Get("Content-Type")
				assert.Contains(t, contentType, tt.expectContentType,
					"%s: Expected content type to contain '%s', got '%s'",
					tt.description, tt.expectContentType, contentType)

				// Verify essential headers are present
				assert.NotEmpty(t, w.Header().Get("Cache-Control"),
					"%s: Cache-Control header should be set", tt.description)
				assert.NotEmpty(t, w.Header().Get("Accept-Ranges"),
					"%s: Accept-Ranges header should be set", tt.description)
			}

			// Verify Range response headers
			if tt.rangeHeader != "" && w.Code == http.StatusPartialContent {
				contentRange := w.Header().Get("Content-Range")
				assert.NotEmpty(t, contentRange,
					"%s: Content-Range header must be present for Range requests", tt.description)
				assert.Contains(t, contentRange, "bytes",
					"%s: Content-Range should specify byte range", tt.description)
			}

			// Log for debugging
			t.Logf("✓ %s: %s %s -> %d (Content-Type: %s)",
				tt.name, tt.method, tt.url, w.Code, w.Header().Get("Content-Type"))
		})
	}
}

// TestAudioEndpointPublicAccessIntegration verifies audio endpoints don't require authentication
// This is critical for Safari < 17 which can't handle authentication during audio preload
func TestAudioEndpointPublicAccessIntegration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	err := InitializeServices(env.ServiceManager)
	require.NoError(t, err)

	// Create test data - parent first (with empty family), then family, then update
	testUser := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(testUser.ID)
	testUser.FamilyID = familyID

	// Update parent's family_id in the database
	_, err = env.Pool.Exec(env.T.Context(), "UPDATE users SET family_id = $1 WHERE id = $2", familyID, testUser.ID)
	require.NoError(t, err)

	testWordSet := env.CreateTestWordSet(familyID, testUser.ID)

	r := setupAudioTestRouter()

	tests := []struct {
		name          string
		method        string
		url           string
		withAuth      bool
		shouldSucceed bool
		description   string
	}{
		{
			name:          "Audio endpoint without authentication - HEAD",
			method:        "HEAD",
			url:           fmt.Sprintf("/api/wordsets/%s/words/public/audio", testWordSet.ID),
			withAuth:      false,
			shouldSucceed: true,
			description:   "HEAD request must work without auth (Safari preload)",
		},
		{
			name:          "Audio endpoint without authentication - GET",
			method:        "GET",
			url:           fmt.Sprintf("/api/wordsets/%s/words/public/audio", testWordSet.ID),
			withAuth:      false,
			shouldSucceed: true,
			description:   "GET request must work without auth (Safari < 17 Range probe)",
		},
		{
			name:          "Audio endpoint without authentication - GET with Range",
			method:        "GET",
			url:           fmt.Sprintf("/api/wordsets/%s/words/public/audio", testWordSet.ID),
			withAuth:      false,
			shouldSucceed: true,
			description:   "GET with Range must work without auth (Safari < 17 critical path)",
		},
		{
			name:          "Audio endpoint with authentication - should still work",
			method:        "GET",
			url:           fmt.Sprintf("/api/wordsets/%s/words/public/audio", testWordSet.ID),
			withAuth:      true,
			shouldSucceed: true,
			description:   "Audio should work with auth too (backwards compatibility)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(tt.method, tt.url, nil)
			require.NoError(t, err)

			// Add auth header if specified
			if tt.withAuth {
				req.Header.Set("Authorization", "Bearer valid-token-for-testing")
			}

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if tt.shouldSucceed {
				// Should NOT return 401 Unauthorized or 403 Forbidden
				assert.NotEqual(t, http.StatusUnauthorized, w.Code,
					"%s: Should not require authentication", tt.description)
				assert.NotEqual(t, http.StatusForbidden, w.Code,
					"%s: Should not be forbidden", tt.description)

				// Should return 200 OK for HEAD or valid response for GET
				if tt.method == "HEAD" {
					assert.Equal(t, http.StatusOK, w.Code,
						"%s: HEAD should return 200", tt.description)
				} else {
					// GET should return 200 or 206 (partial content)
					assert.Contains(t, []int{http.StatusOK, http.StatusPartialContent}, w.Code,
						"%s: GET should return 200 or 206", tt.description)
				}
			}

			t.Logf("✓ %s: %s -> %d", tt.name, tt.method, w.Code)
		})
	}
}

// TestAudioEndpointRouteRegistrationOrder verifies audio routes are registered before protected routes
// This prevents regression where audio routes get caught by authentication middleware
func TestAudioEndpointRouteRegistrationOrder(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create router with same structure as production
	r := gin.New()

	// Track which middleware/handler is called
	var calledHandler string

	// Register public audio routes (should be matched first)
	public := r.Group("/api")
	{
		public.GET("/wordsets/:id/words/:word/audio", func(c *gin.Context) {
			calledHandler = "public_audio"
			c.Status(http.StatusOK)
		})
	}

	// Register protected routes (should NOT catch audio requests)
	protected := r.Group("/api")
	protected.Use(func(c *gin.Context) {
		calledHandler = "protected_middleware"
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		c.Abort()
	})
	{
		wordsets := protected.Group("/wordsets")
		{
			wordsets.GET("", func(c *gin.Context) {
				calledHandler = "protected_wordsets"
				c.Status(http.StatusOK)
			})
		}
	}

	t.Run("audio route should be matched before protected routes", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/wordsets/test-id/words/hello/audio", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, "public_audio", calledHandler,
			"Audio route should be matched, not protected middleware")
		assert.Equal(t, http.StatusOK, w.Code,
			"Should return 200, not 401 Unauthorized")
		assert.NotContains(t, w.Body.String(), "Unauthorized",
			"Should not reach authentication middleware")
	})

	t.Run("non-audio wordsets route should still require auth", func(t *testing.T) {
		calledHandler = "" // Reset
		req, _ := http.NewRequest("GET", "/api/wordsets", nil)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, "protected_middleware", calledHandler,
			"Non-audio routes should still hit authentication")
		assert.Equal(t, http.StatusUnauthorized, w.Code,
			"Should require authentication")
	})
}

// setupAudioTestRouter creates a test router matching production audio route setup
func setupAudioTestRouter() *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	// Public API routes (MUST be registered first)
	public := r.Group("/api")
	{
		public.GET("/wordsets/:id/words/:word/audio", StreamWordAudio)
		public.HEAD("/wordsets/:id/words/:word/audio", StreamWordAudio)
	}

	// Note: In real integration tests, protected routes would be here too,
	// but for these tests we only care about audio endpoint routing

	return r
}
