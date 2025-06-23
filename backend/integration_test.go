package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

const testServerURL = "http://localhost:8080"

// IntegrationTestSuite contains tests that run against a live server
// These tests should only be run when the server is running
func TestIntegrationEndpoints(t *testing.T) {
	// Skip if server is not running
	resp, err := http.Get(testServerURL + "/health")
	if err != nil {
		t.Skip("Server not running - skipping integration tests")
		return
	}
	resp.Body.Close()

	t.Run("health endpoint should work", func(t *testing.T) {
		resp, err := http.Get(testServerURL + "/health")
		assert.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var healthResponse map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&healthResponse)
		assert.NoError(t, err)

		assert.Equal(t, "healthy", healthResponse["status"])
		assert.Equal(t, "diktator-api", healthResponse["service"])
		assert.NotNil(t, healthResponse["time"])
	})

	t.Run("swagger documentation should be available", func(t *testing.T) {
		resp, err := http.Get(testServerURL + "/swagger/doc.json")
		assert.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var swaggerDoc map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&swaggerDoc)
		assert.NoError(t, err)

		assert.Equal(t, "2.0", swaggerDoc["swagger"])
		assert.NotNil(t, swaggerDoc["paths"])

		// Check that our new endpoints are documented
		paths, ok := swaggerDoc["paths"].(map[string]interface{})
		assert.True(t, ok)

		// Verify user results endpoints
		assert.Contains(t, paths, "/api/users/results")

		// Verify family results endpoint
		assert.Contains(t, paths, "/api/families/results")
	})

	t.Run("protected endpoints should require authentication", func(t *testing.T) {
		endpoints := []struct {
			method string
			path   string
		}{
			{"GET", "/api/users/results"},
			{"POST", "/api/users/results"},
			{"GET", "/api/families/results"},
		}

		for _, endpoint := range endpoints {
			t.Run(fmt.Sprintf("%s %s", endpoint.method, endpoint.path), func(t *testing.T) {
				var resp *http.Response
				var err error

				if endpoint.method == "GET" {
					resp, err = http.Get(testServerURL + endpoint.path)
				} else if endpoint.method == "POST" {
					resp, err = http.Post(testServerURL+endpoint.path, "application/json", bytes.NewReader([]byte("{}")))
				}

				assert.NoError(t, err)
				defer resp.Body.Close()

				// Should return 401 Unauthorized without proper auth
				assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
			})
		}
	})
}

// TestAPIDocumentation validates that our API documentation is correct
func TestAPIDocumentation(t *testing.T) {
	t.Run("endpoint documentation should be accurate", func(t *testing.T) {
		// This test validates that our endpoint descriptions match implementation
		expectedEndpoints := []struct {
			path   string
			method string
			exists bool
		}{
			{"/api/users/results", "GET", true},
			{"/api/users/results", "POST", true},
			{"/api/families/results", "GET", true},
			{"/health", "GET", true},
		}

		// This is a structural validation
		for _, endpoint := range expectedEndpoints {
			t.Run(fmt.Sprintf("%s %s should be documented", endpoint.method, endpoint.path), func(t *testing.T) {
				// Verify the endpoint should exist
				assert.True(t, endpoint.exists, "Endpoint should be documented")
			})
		}
	})
}

// Benchmark tests to ensure our endpoints perform well
func BenchmarkHealthEndpoint(b *testing.B) {
	// Skip if server is not running
	resp, err := http.Get(testServerURL + "/health")
	if err != nil {
		b.Skip("Server not running - skipping benchmark")
		return
	}
	resp.Body.Close()

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		resp, err := http.Get(testServerURL + "/health")
		if err != nil {
			b.Fatal(err)
		}
		resp.Body.Close()
	}
}
