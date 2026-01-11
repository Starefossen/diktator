package tts

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsSentence(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		expected bool
	}{
		{
			name:     "single word",
			text:     "katt",
			expected: false,
		},
		{
			name:     "single word with spaces",
			text:     "  katt  ",
			expected: false,
		},
		{
			name:     "two words",
			text:     "stor katt",
			expected: true,
		},
		{
			name:     "simple sentence",
			text:     "Katten sover på stolen.",
			expected: true,
		},
		{
			name:     "longer sentence",
			text:     "Sommerfuglen flyr over blomstene i hagen.",
			expected: true,
		},
		{
			name:     "empty string",
			text:     "",
			expected: false,
		},
		{
			name:     "only spaces",
			text:     "   ",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsSentence(tt.text)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetWordCount(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		expected int
	}{
		{
			name:     "single word",
			text:     "katt",
			expected: 1,
		},
		{
			name:     "single word with spaces",
			text:     "  katt  ",
			expected: 1,
		},
		{
			name:     "two words",
			text:     "stor katt",
			expected: 2,
		},
		{
			name:     "simple sentence",
			text:     "Katten sover på stolen.",
			expected: 4,
		},
		{
			name:     "longer sentence",
			text:     "Sommerfuglen flyr over blomstene i hagen.",
			expected: 6,
		},
		{
			name:     "sentence with punctuation",
			text:     "Hei, hvordan har du det?",
			expected: 5,
		},
		{
			name:     "empty string",
			text:     "",
			expected: 0,
		},
		{
			name:     "only spaces",
			text:     "   ",
			expected: 0,
		},
		{
			name:     "multiple spaces between words",
			text:     "ett   to   tre",
			expected: 3,
		},
		{
			name:     "max sentence words",
			text:     "ett to tre fire fem seks sju åtte ni ti elleve tolv tretten fjorten femten",
			expected: 15,
		},
		{
			name:     "over max sentence words",
			text:     "ett to tre fire fem seks sju åtte ni ti elleve tolv tretten fjorten femten seksten",
			expected: 16,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetWordCount(tt.text)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestConstants(t *testing.T) {
	// Verify constants match frontend config
	assert.Equal(t, 15, MaxSentenceWords, "MaxSentenceWords should match TTS_CONFIG.MAX_SENTENCE_WORDS")
	assert.Equal(t, 0.9, SentenceSpeakingRate, "SentenceSpeakingRate should match TTS_CONFIG.SENTENCE_RATE")
	assert.Equal(t, 0.8, SingleWordSpeakingRate, "SingleWordSpeakingRate should match TTS_CONFIG.SINGLE_WORD_RATE")
}
