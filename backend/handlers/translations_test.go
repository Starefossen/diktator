package handlers

import (
	"testing"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// TestTranslationStructure tests that the Translation struct is properly defined
func TestTranslationStructure(t *testing.T) {
	translation := models.Translation{
		Language: "es",
		Text:     "hola",
	}

	assert.Equal(t, "es", translation.Language)
	assert.Equal(t, "hola", translation.Text)
}

// TestWordInputWithTranslations tests that WordInput can hold translations
func TestWordInputWithTranslations(t *testing.T) {
	wordInput := models.WordInput{
		Word: "hello",
		Translations: []models.Translation{
			{Language: "es", Text: "hola"},
			{Language: "fr", Text: "bonjour"},
		},
	}

	assert.Equal(t, "hello", wordInput.Word)
	assert.Equal(t, 2, len(wordInput.Translations))
	assert.Equal(t, "es", wordInput.Translations[0].Language)
	assert.Equal(t, "hola", wordInput.Translations[0].Text)
	assert.Equal(t, "fr", wordInput.Translations[1].Language)
	assert.Equal(t, "bonjour", wordInput.Translations[1].Text)
}

// TestCreateWordSetRequestWithMode tests creating a wordset with mode configuration
func TestCreateWordSetRequestWithMode(t *testing.T) {
	req := models.CreateWordSetRequest{
		Name:     "Translation Test",
		Language: "en",
		Words: []models.WordInput{
			{
				Word: "hello",
				Translations: []models.Translation{
					{Language: "es", Text: "hola"},
				},
			},
		},
		TestConfiguration: &map[string]interface{}{
			"defaultMode":    "translation",
			"targetLanguage": "es",
			"maxAttempts":    float64(3),
		},
	}

	assert.Equal(t, "Translation Test", req.Name)
	assert.Equal(t, "en", req.Language)
	assert.Equal(t, 1, len(req.Words))
	assert.NotNil(t, req.TestConfiguration)

	config := *req.TestConfiguration
	assert.Equal(t, "translation", config["defaultMode"])
	assert.Equal(t, "es", config["targetLanguage"])
	assert.Equal(t, float64(3), config["maxAttempts"])
}

// TestSaveResultRequestWithMode tests saving a result with mode
func TestSaveResultRequestWithMode(t *testing.T) {
	req := models.SaveResultRequest{
		WordSetID:    "1",
		Mode:         "translation",
		Score:        100.0,
		TotalWords:   1,
		CorrectWords: 1,
		Words: []models.WordTestResult{
			{
				Word:        "hello",
				Correct:     true,
				Attempts:    1,
				FinalAnswer: "hola",
				TimeSpent:   5,
			},
		},
		TimeSpent: 5,
	}

	assert.Equal(t, "1", req.WordSetID)
	assert.Equal(t, "translation", req.Mode)
	assert.Equal(t, 1, len(req.Words))
	assert.True(t, req.Words[0].Correct)
}

// TestTestResultWithMode tests that TestResult includes mode field
func TestTestResultWithMode(t *testing.T) {
	result := models.TestResult{
		ID:        "1",
		WordSetID: "wordset-1",
		UserID:    "user-1",
		Mode:      "keyboard",
		Score:     100.0,
	}

	assert.Equal(t, "1", result.ID)
	assert.Equal(t, "wordset-1", result.WordSetID)
	assert.Equal(t, "keyboard", result.Mode)
}

// TestModeValidation tests mode validation logic
func TestModeValidation(t *testing.T) {
	tests := []struct {
		name            string
		mode            string
		hasTranslations bool
		shouldBeValid   bool
	}{
		{"letterTiles mode always valid", "letterTiles", false, true},
		{"wordBank mode always valid", "wordBank", false, true},
		{"keyboard mode always valid", "keyboard", false, true},
		{"translation mode with translations", "translation", true, true},
		{"translation mode without translations", "translation", false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Simulate validation logic
			isValid := true
			if tt.mode == "translation" && !tt.hasTranslations {
				isValid = false
			}

			assert.Equal(t, tt.shouldBeValid, isValid, "Mode validation failed for %s", tt.name)
		})
	}
}
