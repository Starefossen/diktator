package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetCuratedWordSets_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	// Create a test user (needed for authentication)
	user := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(user.ID)
	user.FamilyID = familyID
	env.SetupAuthMiddleware(user)

	// Setup route
	env.Router.GET("/api/wordsets/curated", GetCuratedWordSets)

	t.Run("Returns_GlobalWordSets", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/wordsets/curated", nil)
		req.Header.Set("Authorization", "Bearer test-token")
		w := httptest.NewRecorder()
		env.Router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.APIResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Verify response structure
		assert.Empty(t, response.Error, "Should have no error")
		assert.NotNil(t, response.Data)

		// Data should be an array of word sets
		wordSets, ok := response.Data.([]interface{})
		require.True(t, ok, "Data should be an array")

		// Should have at least 6 curated word sets from migration
		assert.GreaterOrEqual(t, len(wordSets), 6, "Should have at least 6 curated word sets")

		// Verify structure of first word set
		if len(wordSets) > 0 {
			ws := wordSets[0].(map[string]interface{})
			assert.NotEmpty(t, ws["id"])
			assert.NotEmpty(t, ws["name"])
			assert.True(t, ws["isGlobal"].(bool), "Word set should be marked as global")
			assert.Nil(t, ws["familyId"], "Global word sets should have nil familyId")

			// Verify words are included
			words, hasWords := ws["words"].([]interface{})
			assert.True(t, hasWords, "Word set should have words")
			assert.Greater(t, len(words), 0, "Word set should have at least one word")
		}
	})

	t.Run("CuratedWordSets_HaveCorrectStructure", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/wordsets/curated", nil)
		req.Header.Set("Authorization", "Bearer test-token")
		w := httptest.NewRecorder()
		env.Router.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Data []models.WordSet `json:"data"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check expected word set names
		expectedNames := map[string]bool{
			"Dobbelt konsonant": false,
			"Stumme bokstaver":  false,
			"Sammensatte ord":   false,
			"Diftonger":         false,
			"Skj-lyden":         false,
			"Æ, Ø og Å":         false,
		}

		for _, ws := range response.Data {
			if _, exists := expectedNames[ws.Name]; exists {
				expectedNames[ws.Name] = true

				// Verify each word set has correct properties
				assert.True(t, ws.IsGlobal, "Word set %s should be global", ws.Name)
				assert.Nil(t, ws.FamilyID, "Word set %s should have nil familyId", ws.Name)
				assert.Equal(t, "no", ws.Language, "Word set %s should have Norwegian language", ws.Name)
				assert.Equal(t, "system", ws.CreatedBy, "Word set %s should be created by system", ws.Name)
				assert.Len(t, ws.Words, 10, "Word set %s should have 10 words", ws.Name)
			}
		}

		// Verify all expected word sets were found
		for name, found := range expectedNames {
			assert.True(t, found, "Expected word set '%s' not found", name)
		}
	})

	t.Run("CuratedWordSets_HaveTranslations", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/wordsets/curated", nil)
		req.Header.Set("Authorization", "Bearer test-token")
		w := httptest.NewRecorder()
		env.Router.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Data []models.WordSet `json:"data"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		for _, ws := range response.Data {
			if !ws.IsGlobal {
				continue
			}

			for _, word := range ws.Words {
				// Each word should have at least one translation
				assert.Greater(t, len(word.Translations), 0,
					"Word '%s' in '%s' should have translations", word.Word, ws.Name)

				// Check that English translation exists
				hasEnglish := false
				for _, tr := range word.Translations {
					if tr.Language == "en" {
						hasEnglish = true
						assert.NotEmpty(t, tr.Text,
							"English translation for '%s' should not be empty", word.Word)
					}
				}
				assert.True(t, hasEnglish,
					"Word '%s' in '%s' should have English translation", word.Word, ws.Name)
			}
		}
	})

	t.Run("CuratedWordSets_HaveDefinitions", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/wordsets/curated", nil)
		req.Header.Set("Authorization", "Bearer test-token")
		w := httptest.NewRecorder()
		env.Router.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Data []models.WordSet `json:"data"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		for _, ws := range response.Data {
			if !ws.IsGlobal {
				continue
			}

			for _, word := range ws.Words {
				assert.NotEmpty(t, word.Definition,
					"Word '%s' in '%s' should have a definition", word.Word, ws.Name)
			}
		}
	})
}

func TestCuratedWordSets_CanBeUsedForTests_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	user := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(user.ID)
	user.FamilyID = familyID
	env.SetupAuthMiddleware(user)

	env.Router.GET("/api/wordsets/curated", GetCuratedWordSets)
	env.Router.POST("/api/users/results", SaveResult)

	// First get a curated word set
	req, _ := http.NewRequest("GET", "/api/wordsets/curated", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	w := httptest.NewRecorder()
	env.Router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	var curatedResponse struct {
		Data []models.WordSet `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &curatedResponse)
	require.NoError(t, err)
	require.Greater(t, len(curatedResponse.Data), 0)

	curatedWordSet := curatedResponse.Data[0]

	t.Run("StandardMode", func(t *testing.T) {
		resultPayload := map[string]interface{}{
			"wordSetId":    curatedWordSet.ID,
			"score":        80.0,
			"totalWords":   10,
			"correctWords": 8,
			"mode":         "standard",
			"timeSpent":    120,
			"words": []map[string]interface{}{
				{
					"word":        curatedWordSet.Words[0].Word,
					"correct":     true,
					"attempts":    1,
					"finalAnswer": curatedWordSet.Words[0].Word,
					"userAnswers": []string{curatedWordSet.Words[0].Word},
					"timeSpent":   10,
					"errorTypes":  []string{},
				},
			},
		}

		resp := makeRequest(env.Router, "POST", "/api/users/results", resultPayload, nil)
		assert.Equal(t, http.StatusCreated, resp.Code,
			"Should be able to save standard mode result for curated word set: %s", resp.Body.String())
	})

	t.Run("DictationMode", func(t *testing.T) {
		resultPayload := map[string]interface{}{
			"wordSetId":    curatedWordSet.ID,
			"score":        90.0,
			"totalWords":   10,
			"correctWords": 9,
			"mode":         "dictation",
			"timeSpent":    150,
			"words": []map[string]interface{}{
				{
					"word":           curatedWordSet.Words[0].Word,
					"correct":        true,
					"attempts":       1,
					"finalAnswer":    curatedWordSet.Words[0].Word,
					"userAnswers":    []string{curatedWordSet.Words[0].Word},
					"timeSpent":      12,
					"audioPlayCount": 2,
					"errorTypes":     []string{},
				},
			},
		}

		resp := makeRequest(env.Router, "POST", "/api/users/results", resultPayload, nil)
		assert.Equal(t, http.StatusCreated, resp.Code,
			"Should be able to save dictation mode result for curated word set: %s", resp.Body.String())
	})

	t.Run("TranslationMode", func(t *testing.T) {
		// Find a word with translations
		var wordWithTranslation struct {
			Word         string
			Translations []models.Translation
		}
		for _, word := range curatedWordSet.Words {
			if len(word.Translations) > 0 {
				wordWithTranslation.Word = word.Word
				wordWithTranslation.Translations = word.Translations
				break
			}
		}
		require.NotEmpty(t, wordWithTranslation.Word, "Curated word set should have words with translations")

		resultPayload := map[string]interface{}{
			"wordSetId":    curatedWordSet.ID,
			"score":        70.0,
			"totalWords":   10,
			"correctWords": 7,
			"mode":         "translation",
			"timeSpent":    180,
			"words": []map[string]interface{}{
				{
					"word":        wordWithTranslation.Word,
					"correct":     true,
					"attempts":    1,
					"finalAnswer": wordWithTranslation.Translations[0].Text,
					"userAnswers": []string{wordWithTranslation.Translations[0].Text},
					"timeSpent":   15,
					"errorTypes":  []string{},
				},
			},
		}

		resp := makeRequest(env.Router, "POST", "/api/users/results", resultPayload, nil)
		assert.Equal(t, http.StatusCreated, resp.Code,
			"Should be able to save translation mode result for curated word set: %s", resp.Body.String())
	})
}

func TestCuratedWordSets_AreReadOnly_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	user := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(user.ID)
	user.FamilyID = familyID
	env.SetupAuthMiddleware(user)

	env.Router.GET("/api/wordsets/curated", GetCuratedWordSets)
	env.Router.PUT("/api/wordsets/:id", UpdateWordSet)
	env.Router.DELETE("/api/wordsets/:id", DeleteWordSet)

	// Get a curated word set ID
	req, _ := http.NewRequest("GET", "/api/wordsets/curated", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	w := httptest.NewRecorder()
	env.Router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []models.WordSet `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	require.Greater(t, len(response.Data), 0)

	curatedID := response.Data[0].ID

	t.Run("CannotUpdate_CuratedWordSet", func(t *testing.T) {
		updatePayload := map[string]interface{}{
			"name": "Modified Name",
		}

		resp := makeRequest(env.Router, "PUT", "/api/wordsets/"+curatedID, updatePayload, nil)

		// Should fail - either 403 Forbidden or 404 Not Found (user doesn't own it)
		assert.NotEqual(t, http.StatusOK, resp.Code,
			"Should not be able to update curated word set")
	})

	t.Run("CannotDelete_CuratedWordSet", func(t *testing.T) {
		req, _ := http.NewRequest("DELETE", "/api/wordsets/"+curatedID, nil)
		req.Header.Set("Authorization", "Bearer test-token")
		w := httptest.NewRecorder()
		env.Router.ServeHTTP(w, req)

		// Should fail - either 403 Forbidden or 404 Not Found (user doesn't own it)
		assert.NotEqual(t, http.StatusOK, w.Code,
			"Should not be able to delete curated word set")
	})
}

func TestCuratedWordSets_SpecificCategories_Integration(t *testing.T) {
	env := SetupIntegrationTest(t)
	defer env.Cleanup()

	user := env.CreateTestUser("", "parent")
	familyID := env.CreateTestFamily(user.ID)
	user.FamilyID = familyID
	env.SetupAuthMiddleware(user)

	env.Router.GET("/api/wordsets/curated", GetCuratedWordSets)

	req, _ := http.NewRequest("GET", "/api/wordsets/curated", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	w := httptest.NewRecorder()
	env.Router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)

	var response struct {
		Data []models.WordSet `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Create a map for easy lookup
	wordSetsByName := make(map[string]models.WordSet)
	for _, ws := range response.Data {
		wordSetsByName[ws.Name] = ws
	}

	t.Run("DobbeltKonsonant_HasDoubleConsonantWords", func(t *testing.T) {
		ws, exists := wordSetsByName["Dobbelt konsonant"]
		require.True(t, exists, "Dobbelt konsonant word set should exist")

		expectedWords := []string{"takk", "katt", "redd", "gutt", "blikk", "stopp", "hopp", "troll", "gress", "klaff"}
		actualWords := make(map[string]bool)
		for _, word := range ws.Words {
			actualWords[word.Word] = true
		}

		for _, expected := range expectedWords {
			assert.True(t, actualWords[expected],
				"Word '%s' should be in Dobbelt konsonant set", expected)
		}
	})

	t.Run("StummeBokstaver_HasSilentLetterWords", func(t *testing.T) {
		ws, exists := wordSetsByName["Stumme bokstaver"]
		require.True(t, exists, "Stumme bokstaver word set should exist")

		// These words have silent h in hj, gj, kj, hv combinations
		silentLetterWords := []string{"hjerte", "gjerne", "kjøre", "hvit", "hvem", "hjelp"}
		actualWords := make(map[string]bool)
		for _, word := range ws.Words {
			actualWords[word.Word] = true
		}

		for _, expected := range silentLetterWords {
			assert.True(t, actualWords[expected],
				"Word '%s' should be in Stumme bokstaver set", expected)
		}
	})

	t.Run("SammensatteOrd_HasCompoundWords", func(t *testing.T) {
		ws, exists := wordSetsByName["Sammensatte ord"]
		require.True(t, exists, "Sammensatte ord word set should exist")

		// Compound words
		compoundWords := []string{"sommerfugl", "barnehage", "sjokoladekake", "solbriller"}
		actualWords := make(map[string]bool)
		for _, word := range ws.Words {
			actualWords[word.Word] = true
		}

		for _, expected := range compoundWords {
			assert.True(t, actualWords[expected],
				"Word '%s' should be in Sammensatte ord set", expected)
		}
	})

	t.Run("Diftonger_HasDiphthongWords", func(t *testing.T) {
		ws, exists := wordSetsByName["Diftonger"]
		require.True(t, exists, "Diftonger word set should exist")

		// Words with ei, øy, au diphthongs
		diphthongWords := []string{"hei", "nei", "øye", "høy", "sau", "tau"}
		actualWords := make(map[string]bool)
		for _, word := range ws.Words {
			actualWords[word.Word] = true
		}

		for _, expected := range diphthongWords {
			assert.True(t, actualWords[expected],
				"Word '%s' should be in Diftonger set", expected)
		}
	})

	t.Run("SkjLyden_HasSkjSoundWords", func(t *testing.T) {
		ws, exists := wordSetsByName["Skj-lyden"]
		require.True(t, exists, "Skj-lyden word set should exist")

		// Words with skj, sj, sk sounds
		skjWords := []string{"skjorte", "skje", "sjø", "ski", "sjokolade"}
		actualWords := make(map[string]bool)
		for _, word := range ws.Words {
			actualWords[word.Word] = true
		}

		for _, expected := range skjWords {
			assert.True(t, actualWords[expected],
				"Word '%s' should be in Skj-lyden set", expected)
		}
	})

	t.Run("NorwegianLetters_HasAeOeAaWords", func(t *testing.T) {
		ws, exists := wordSetsByName["Æ, Ø og Å"]
		require.True(t, exists, "Æ, Ø og Å word set should exist")

		// Words with æ, ø, å
		specialLetterWords := []string{"bær", "ørn", "søt", "grønn", "båt", "blå", "måne"}
		actualWords := make(map[string]bool)
		for _, word := range ws.Words {
			actualWords[word.Word] = true
		}

		for _, expected := range specialLetterWords {
			assert.True(t, actualWords[expected],
				"Word '%s' should be in Æ, Ø og Å set", expected)
		}
	})
}
