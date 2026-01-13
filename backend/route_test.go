package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGinRouteMatching(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.GET("/api/wordsets/:id/audio/:audioId", func(c *gin.Context) {
		id := c.Param("id")
		audioID := c.Param("audioId")
		c.JSON(200, gin.H{
			"id":          id,
			"audioId":     audioID,
			"id_empty":    id == "",
			"audio_empty": audioID == "",
		})
	})

	tests := []struct {
		name string
		url  string
	}{
		{"Empty ID", "/api/wordsets//audio/test"},
		{"Empty Audio", "/api/wordsets/test/audio/"},
		{"Both Empty", "/api/wordsets//audio/"},
		{"Normal", "/api/wordsets/test/audio/audio123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", tt.url, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			t.Logf("URL: %s, Status: %d, Body: %s", tt.url, w.Code, w.Body.String())
		})
	}
}
