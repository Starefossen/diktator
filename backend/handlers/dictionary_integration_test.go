package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
	"github.com/starefossen/diktator/backend/internal/services/dictionary"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupDictionaryTestRouter() (*gin.Engine, *services.Manager) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Use longer timeout for tests as the rate limiter may cause delays
	config := dictionary.DefaultConfig()
	config.TimeoutSeconds = 30
	dictService := dictionary.NewService(config)
	serviceManager := &services.Manager{
		Dictionary: dictService,
	}

	router.Use(func(c *gin.Context) {
		c.Set("serviceManager", serviceManager)
		c.Next()
	})

	// Dictionary routes (public, no auth required)
	dictGroup := router.Group("/api/dictionary")
	{
		dictGroup.GET("/validate", ValidateDictionaryWord)
		dictGroup.GET("/suggest", SuggestDictionaryWords)
		dictGroup.GET("/stats", GetDictionaryStats)
	}

	return router, serviceManager
}

func TestDictionaryValidate_ValidWord(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?w=katt&dict=bm", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data    *models.DictionaryWord `json:"data"`
		Message string                 `json:"message"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Word found in dictionary", response.Message)
	require.NotNil(t, response.Data)
	assert.Equal(t, "katt", response.Data.Lemma)
	assert.Equal(t, "NOUN", response.Data.WordClass)
	assert.Greater(t, len(response.Data.Inflections), 0)
	assert.Greater(t, response.Data.ArticleID, 0)
}

func TestDictionaryValidate_ValidWordNynorsk(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?w=katt&dict=nn", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data    *models.DictionaryWord `json:"data"`
		Message string                 `json:"message"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Word found in dictionary", response.Message)
	require.NotNil(t, response.Data)
	assert.Equal(t, "katt", response.Data.Lemma)
	// Nynorsk inflections differ: kattar, kattane vs katter, kattene
	assert.Contains(t, response.Data.Inflections, "kattar")
}

func TestDictionaryValidate_NonexistentWord(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?w=xyznonexistent123&dict=bm", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// API returns 200 with null data when word is not found (valid response, word just doesn't exist)
	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data    *models.DictionaryWord `json:"data"`
		Message string                 `json:"message"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Word not found in dictionary", response.Message)
	assert.Nil(t, response.Data)
}

func TestDictionaryValidate_MissingWord(t *testing.T) {
	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?dict=bm", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response struct {
		Error string `json:"error"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Word parameter 'w' is required", response.Error)
}

func TestDictionaryValidate_DefaultsToBokmaal(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	// Request without dict parameter should default to bm (Bokmål)
	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?w=hund", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data    *models.DictionaryWord `json:"data"`
		Message string                 `json:"message"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Word found in dictionary", response.Message)
	require.NotNil(t, response.Data)
	assert.Equal(t, "hund", response.Data.Lemma)
}

func TestDictionarySuggest_ReturnsResults(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/suggest?q=kat&dict=bm&n=5", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []models.DictionarySuggestion `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Greater(t, len(response.Data), 0)
	// Should include "katt" as one of the suggestions
	found := false
	for _, s := range response.Data {
		if s.Word == "katt" {
			found = true
			break
		}
	}
	assert.True(t, found, "Expected 'katt' in suggestions for query 'kat'")
}

func TestDictionarySuggest_RespectsLimit(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/suggest?q=h&dict=bm&n=3", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []models.DictionarySuggestion `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.LessOrEqual(t, len(response.Data), 3)
}

func TestDictionarySuggest_MissingQuery(t *testing.T) {
	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/suggest?dict=bm&n=5", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response struct {
		Error string `json:"error"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Query parameter 'q' is required", response.Error)
}

func TestDictionarySuggest_DefaultLimit(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	// Request without 'n' parameter should use default limit (5)
	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/suggest?q=sk&dict=bm", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []models.DictionarySuggestion `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Should return results with default limit
	assert.LessOrEqual(t, len(response.Data), 5)
}

func TestDictionaryStats_ReturnsHealthy(t *testing.T) {
	router, _ := setupDictionaryTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/stats", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data struct {
			Status string `json:"status"`
			Cache  struct {
				Items     int   `json:"items"`
				UsedBytes int64 `json:"usedBytes"`
				MaxBytes  int64 `json:"maxBytes"`
			} `json:"cache"`
		} `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "healthy", response.Data.Status)
	assert.Equal(t, int64(5*1024*1024), response.Data.Cache.MaxBytes) // 5MB default cache
}

func TestDictionaryCache_CachesResults(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, manager := setupDictionaryTestRouter()

	// First request - should hit the API
	req1 := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?w=sol&dict=bm", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Check cache stats after first request
	items1, _, _ := manager.Dictionary.CacheStats()

	// Second request for same word - should hit cache
	req2 := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?w=sol&dict=bm", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)

	// Cache should have at least one item
	items2, _, _ := manager.Dictionary.CacheStats()
	assert.GreaterOrEqual(t, items2, items1)

	// Both responses should be identical
	assert.Equal(t, w1.Body.String(), w2.Body.String())
}

func TestDictionaryValidate_InflectedForms(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test that requires network access")
	}

	router, _ := setupDictionaryTestRouter()

	// Test that we can look up an inflected form and get the base lemma
	req := httptest.NewRequest(http.MethodGet, "/api/dictionary/validate?w=katten&dict=bm", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// "katten" is the definite singular of "katt"
	// The API should find it through the articles lookup
	assert.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data    *models.DictionaryWord `json:"data"`
		Message string                 `json:"message"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Word found in dictionary", response.Message)
	require.NotNil(t, response.Data)
	// The lemma should be "katt" even though we searched for "katten"
	assert.Equal(t, "katt", response.Data.Lemma)
}
