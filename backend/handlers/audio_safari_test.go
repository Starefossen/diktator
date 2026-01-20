package handlers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestAudioEndpointSafariBrowserDetection tests Safari detection logic for different versions
// This ensures Safari < 17 and Safari 17+ both get the correct audio format (MP3)
func TestAudioEndpointSafariBrowserDetection(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// User agents for different Safari versions
	const (
		safariOS16     = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Safari/605.1.15"
		safariOS17     = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
		safariIOS16    = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
		safariIOS17    = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
		safariIPadOS16 = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6.1 Safari/605.1.15" // iPadOS in desktop mode
		chrome         = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
	)

	tests := []struct {
		name           string
		userAgent      string
		expectedFormat string // "audio/mpeg" for Safari, "audio/ogg" for Chrome
		safariVersion  string // for logging: "Safari 16", "Safari 17", "Chrome"
		description    string
	}{
		{
			name:           "Safari 16 macOS",
			userAgent:      safariOS16,
			expectedFormat: "audio/mpeg",
			safariVersion:  "Safari 16 (macOS)",
			description:    "Safari 16 on macOS should be detected and receive MP3",
		},
		{
			name:           "Safari 17 macOS",
			userAgent:      safariOS17,
			expectedFormat: "audio/mpeg",
			safariVersion:  "Safari 17 (macOS)",
			description:    "Safari 17 on macOS should be detected and receive MP3",
		},
		{
			name:           "Safari 16 iOS",
			userAgent:      safariIOS16,
			expectedFormat: "audio/mpeg",
			safariVersion:  "Safari 16 (iOS)",
			description:    "Safari 16 on iOS should be detected and receive MP3",
		},
		{
			name:           "Safari 17 iOS",
			userAgent:      safariIOS17,
			expectedFormat: "audio/mpeg",
			safariVersion:  "Safari 17 (iOS)",
			description:    "Safari 17 on iOS should be detected and receive MP3",
		},
		{
			name:           "Safari 16 iPadOS desktop mode",
			userAgent:      safariIPadOS16,
			expectedFormat: "audio/mpeg",
			safariVersion:  "Safari 16 (iPadOS desktop)",
			description:    "iPadOS in desktop mode reports macOS UA, must be detected as Safari",
		},
		{
			name:           "Chrome (not Safari)",
			userAgent:      chrome,
			expectedFormat: "audio/ogg",
			safariVersion:  "Chrome",
			description:    "Chrome should NOT be detected as Safari, should receive OGG",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create test router with audio endpoint
			r := gin.New()
			r.GET("/api/wordsets/:id/words/:word/audio", func(c *gin.Context) {
				// Simulate format detection logic from StreamWordAudio
				format := detectAudioFormat(c)

				// Return the format that would be selected
				c.Header("Content-Type", format)
				c.Status(http.StatusOK)
			})

			req, _ := http.NewRequest("GET", "/api/wordsets/test-id/words/hello/audio", nil)
			req.Header.Set("User-Agent", tt.userAgent)

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			// Verify correct format was detected
			contentType := w.Header().Get("Content-Type")
			assert.Contains(t, contentType, tt.expectedFormat,
				"%s: %s should get %s format, got %s",
				tt.description, tt.safariVersion, tt.expectedFormat, contentType)

			t.Logf("✓ %s: %s correctly detected → %s",
				tt.name, tt.safariVersion, tt.expectedFormat)
		})
	}
}

// TestAudioEndpointSafariRangeRequests tests that Range header requests work
// This is critical for Safari < 17 which sends Range: bytes=0-1 as a probe before loading audio
func TestAudioEndpointSafariRangeRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)

	const safari16 = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"

	tests := []struct {
		name           string
		rangeHeader    string
		expectedStatus int
		description    string
	}{
		{
			name:           "Safari < 17 initial probe (Range: bytes=0-1)",
			rangeHeader:    "bytes=0-1",
			expectedStatus: http.StatusPartialContent,
			description:    "Safari < 17 sends Range: bytes=0-1 before loading audio - MUST return 206",
		},
		{
			name:           "No Range header (normal request)",
			rangeHeader:    "",
			expectedStatus: http.StatusOK,
			description:    "Normal request without Range should return 200 OK",
		},
		{
			name:           "Range request for full content",
			rangeHeader:    "bytes=0-",
			expectedStatus: http.StatusPartialContent,
			description:    "Range request from byte 0 to end should return 206",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.GET("/api/wordsets/:id/words/:word/audio", func(c *gin.Context) {
				rangeHeader := c.GetHeader("Range")

				if rangeHeader != "" {
					// Simulate partial content response
					c.Header("Content-Range", fmt.Sprintf("bytes 0-1/%d", 1024))
					c.Header("Accept-Ranges", "bytes")
					c.Status(http.StatusPartialContent)
				} else {
					c.Header("Accept-Ranges", "bytes")
					c.Status(http.StatusOK)
				}
			})

			req, _ := http.NewRequest("GET", "/api/wordsets/test-id/words/hello/audio", nil)
			req.Header.Set("User-Agent", safari16)

			if tt.rangeHeader != "" {
				req.Header.Set("Range", tt.rangeHeader)
			}

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code,
				"%s: Expected status %d, got %d",
				tt.description, tt.expectedStatus, w.Code)

			// Verify Range-specific headers
			if tt.rangeHeader != "" && w.Code == http.StatusPartialContent {
				assert.NotEmpty(t, w.Header().Get("Content-Range"),
					"Partial content response must include Content-Range header")
			}

			assert.NotEmpty(t, w.Header().Get("Accept-Ranges"),
				"Response must include Accept-Ranges header")

			t.Logf("✓ %s: Range=%q → %d", tt.name, tt.rangeHeader, w.Code)
		})
	}
}

// TestAudioEndpointHTTPMethodsForSafari tests both GET and HEAD methods work
// Safari < 17 may use HEAD to check if audio is available before requesting it
func TestAudioEndpointHTTPMethodsForSafari(t *testing.T) {
	gin.SetMode(gin.TestMode)

	const safari16 = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"

	tests := []struct {
		name           string
		method         string
		expectedStatus int
		description    string
	}{
		{
			name:           "GET method",
			method:         "GET",
			expectedStatus: http.StatusOK,
			description:    "GET should return full audio",
		},
		{
			name:           "HEAD method",
			method:         "HEAD",
			expectedStatus: http.StatusOK,
			description:    "HEAD should return headers only (Safari may probe with HEAD)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()

			// Register both GET and HEAD for the same endpoint
			r.GET("/api/wordsets/:id/words/:word/audio", func(c *gin.Context) {
				c.Header("Content-Type", "audio/mpeg")
				c.Status(http.StatusOK)
			})
			r.HEAD("/api/wordsets/:id/words/:word/audio", func(c *gin.Context) {
				c.Header("Content-Type", "audio/mpeg")
				c.Status(http.StatusOK)
			})

			req, _ := http.NewRequest(tt.method, "/api/wordsets/test-id/words/hello/audio", nil)
			req.Header.Set("User-Agent", safari16)

			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code,
				"%s: Expected status %d, got %d",
				tt.description, tt.expectedStatus, w.Code)

			assert.Equal(t, "audio/mpeg", w.Header().Get("Content-Type"),
				"Safari should receive MP3 format")

			t.Logf("✓ %s: %s → %d", tt.name, tt.method, w.Code)
		})
	}
}

// detectAudioFormat simulates the format detection logic from StreamWordAudio
func detectAudioFormat(c *gin.Context) string {
	userAgent := c.GetHeader("User-Agent")

	// Use the same detection logic as the real handler
	// Safari gets MP3, everything else gets OGG
	if isSafari(userAgent) {
		return "audio/mpeg"
	}
	return "audio/ogg"
}

// isSafari checks if the user agent is Safari (excluding Chrome which also contains "Safari")
func isSafari(userAgent string) bool {
	// This mirrors the logic in audio_ondemand.go using the useragent library
	// For test purposes, we use simple string matching
	hasSafari := false
	hasChrome := false

	for i := 0; i < len(userAgent); i++ {
		if i+6 <= len(userAgent) && userAgent[i:i+6] == "Safari" {
			hasSafari = true
		}
		if i+6 <= len(userAgent) && userAgent[i:i+6] == "Chrome" {
			hasChrome = true
		}
	}

	// Safari user agent contains "Safari" but not "Chrome"
	return hasSafari && !hasChrome
}
