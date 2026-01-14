package main

import (
	"fmt"
	"testing"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/xp"
)

// TestCalculateXPForTest ensures the calculateXPForTest function works correctly
// and uses the XP service types properly
func TestCalculateXPForTest(t *testing.T) {
	tests := []struct {
		name            string
		score           float64
		mode            models.TestMode
		isFirstTime     bool
		repetitionCount int
		daysAgo         int
		wantXP          int
	}{
		{
			name:            "First time keyboard test with perfect score",
			score:           100.0,
			mode:            models.TestModeKeyboard,
			isFirstTime:     true,
			repetitionCount: 1,
			daysAgo:         0,
			wantXP:          150, // 25 * 2.0 * 3.0 * 1.0 = 150
		},
		{
			name:            "Third letterTiles test this week with 80% score",
			score:           80.0,
			mode:            models.TestModeLetterTiles,
			isFirstTime:     false,
			repetitionCount: 3,
			daysAgo:         2,
			wantXP:          2, // 10 * 1.0 * 1.0 * 0.25 = 2.5 → 2 (rounds down)
		},
		{
			name:            "Translation test after 8 days with 95% score",
			score:           95.0,
			mode:            models.TestModeTranslation,
			isFirstTime:     false,
			repetitionCount: 2,
			daysAgo:         8,
			wantXP:          30, // 20 * 1.5 * 1.0 * 1.0 = 30 (reset after 7 days)
		},
		{
			name:            "WordBank test with 50% score",
			score:           50.0,
			mode:            models.TestModeWordBank,
			isFirstTime:     false,
			repetitionCount: 1,
			daysAgo:         1,
			wantXP:          11, // 15 * 0.75 * 1.0 * 1.0 = 11.25 → 11
		},
		{
			name:            "MissingLetters test first time with 90% score",
			score:           90.0,
			mode:            models.TestModeMissingLetters,
			isFirstTime:     true,
			repetitionCount: 1,
			daysAgo:         0,
			wantXP:          90, // 20 * 1.5 * 3.0 * 1.0 = 90
		},
		{
			name:            "Flashcard test with 100% score",
			score:           100.0,
			mode:            models.TestModeFlashcard,
			isFirstTime:     false,
			repetitionCount: 1,
			daysAgo:         0,
			wantXP:          10, // 5 * 2.0 * 1.0 * 1.0 = 10
		},
		{
			name:            "LookCoverWrite test with 70% score",
			score:           70.0,
			mode:            models.TestModeLookCoverWrite,
			isFirstTime:     false,
			repetitionCount: 1,
			daysAgo:         0,
			wantXP:          20, // 20 * 1.0 * 1.0 * 1.0 = 20
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateXPForTest(tt.score, tt.mode, tt.isFirstTime, tt.repetitionCount, tt.daysAgo)
			if got != tt.wantXP {
				t.Errorf("calculateXPForTest() = %v, want %v", got, tt.wantXP)
			}
		})
	}
}

// TestAllTestModesHaveBaseXP ensures all TestMode constants have corresponding
// entries in the XP service's BaseXPByMode map
func TestAllTestModesHaveBaseXP(t *testing.T) {
	// List of all test modes that should be supported
	allModes := []models.TestMode{
		models.TestModeLetterTiles,
		models.TestModeWordBank,
		models.TestModeMissingLetters,
		models.TestModeTranslation,
		models.TestModeKeyboard,
		models.TestModeFlashcard,
		models.TestModeLookCoverWrite,
	}

	for _, mode := range allModes {
		t.Run(string(mode), func(t *testing.T) {
			baseXP, exists := xp.BaseXPByMode[string(mode)]
			if !exists {
				t.Errorf("TestMode %q not found in xp.BaseXPByMode map", mode)
			}
			if baseXP <= 0 {
				t.Errorf("BaseXP for mode %q is %d, expected positive value", mode, baseXP)
			}
		})
	}
}

// TestBaseXPByModeKeys ensures the XP service map only contains valid TestMode values
func TestBaseXPByModeKeys(t *testing.T) {
	validModes := map[string]bool{
		string(models.TestModeLetterTiles):    true,
		string(models.TestModeWordBank):       true,
		string(models.TestModeMissingLetters): true,
		string(models.TestModeTranslation):    true,
		string(models.TestModeKeyboard):       true,
		string(models.TestModeFlashcard):      true,
		string(models.TestModeLookCoverWrite): true,
	}

	for mode := range xp.BaseXPByMode {
		if !validModes[mode] {
			t.Errorf("Unknown mode %q in xp.BaseXPByMode - may be a typo or outdated entry", mode)
		}
	}
}

// TestScoreMultiplier validates the score multiplier logic matches spec
func TestScoreMultiplier(t *testing.T) {
	tests := []struct {
		score      float64
		wantMulti  float64
		wantReason string
	}{
		{100.0, 2.0, "perfect score"},
		{99.0, 1.5, "excellent"},
		{90.0, 1.5, "excellent"},
		{89.0, 1.0, "good"},
		{70.0, 1.0, "good"},
		{69.0, 0.75, "keep practicing"},
		{50.0, 0.75, "keep practicing"},
		{49.0, 0.5, "every mistake teaches"},
		{0.0, 0.5, "every mistake teaches"},
	}

	for _, tt := range tests {
		t.Run(tt.wantReason, func(t *testing.T) {
			got := xp.ScoreMultiplier(tt.score)
			if got != tt.wantMulti {
				t.Errorf("ScoreMultiplier(%v) = %v, want %v (%s)", tt.score, got, tt.wantMulti, tt.wantReason)
			}
		})
	}
}

// TestRepetitionDecay validates repetition decay logic
func TestRepetitionDecay(t *testing.T) {
	tests := []struct {
		name   string
		count  int
		expect float64
	}{
		{"first time", 1, 1.0},
		{"second time", 2, 0.5},
		{"third time", 3, 0.25},
		{"fourth time", 4, 0.10},
		{"fifth+ time", 5, 0.10},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := xp.RepetitionDecay(tt.count)
			if got != tt.expect {
				t.Errorf("RepetitionDecay(%d) = %v, want %v", tt.count, got, tt.expect)
			}
		})
	}
}

// TestModeConfigsUseValidTestModes ensures all modeConfigs entries use valid TestMode types
func TestModeConfigsUseValidTestModes(t *testing.T) {
	// These are the mode configs from main.go
	testModeConfigs := []struct {
		mode          models.TestMode
		unlocksAfter  int
		questionCount int
	}{
		{models.TestModeFlashcard, 0, 10},
		{models.TestModeLetterTiles, 1, 10},
		{models.TestModeWordBank, 2, 10},
		{models.TestModeMissingLetters, 3, 10},
		{models.TestModeTranslation, 3, 10},
		{models.TestModeKeyboard, 4, 10},
		{models.TestModeLookCoverWrite, 4, 10},
	}

	for _, config := range testModeConfigs {
		t.Run(string(config.mode), func(t *testing.T) {
			// Test that the mode can be converted to string and found in BaseXPByMode
			_, exists := xp.BaseXPByMode[string(config.mode)]
			if !exists {
				t.Errorf("Mode %q from modeConfigs not found in xp.BaseXPByMode", config.mode)
			}

			// Ensure calculateXPForTest can handle this mode
			xpResult := calculateXPForTest(100.0, config.mode, true, 1, 0)
			if xpResult <= 0 {
				t.Errorf("calculateXPForTest returned %d for mode %q, expected positive value", xpResult, config.mode)
			}
		})
	}
}

// TestXPCalculationDoesNotPanic ensures calculateXPForTest handles all modes without panicking
func TestXPCalculationDoesNotPanic(t *testing.T) {
	modes := []models.TestMode{
		models.TestModeLetterTiles,
		models.TestModeWordBank,
		models.TestModeMissingLetters,
		models.TestModeTranslation,
		models.TestModeKeyboard,
		models.TestModeFlashcard,
		models.TestModeLookCoverWrite,
	}

	defer func() {
		if r := recover(); r != nil {
			t.Errorf("calculateXPForTest panicked: %v", r)
		}
	}()

	for _, mode := range modes {
		// Test various scenarios
		calculateXPForTest(100.0, mode, true, 1, 0)
		calculateXPForTest(50.0, mode, false, 2, 3)
		calculateXPForTest(0.0, mode, false, 4, 10)
	}
}

// TestGetLevelForXP ensures level calculation works correctly
func TestGetLevelForXP(t *testing.T) {
	tests := []struct {
		totalXP    int
		wantLevel  int
		wantName   string
		wantNameNO string
	}{
		{0, 1, "Snow Mouse", "Snømus"},
		{99, 1, "Snow Mouse", "Snømus"},
		{100, 2, "Arctic Fox", "Fjellrev"},
		{299, 2, "Arctic Fox", "Fjellrev"},
		{300, 3, "Arctic Hare", "Snøhare"},
		{599, 3, "Arctic Hare", "Snøhare"},
		{600, 4, "Reindeer", "Rein"},
		{2800, 8, "Polar Bear", "Isbjørn"},
		{3600, 9, "Northern Lights", "Nordlys"},
		{4499, 9, "Northern Lights", "Nordlys"},
		{4500, 10, "Midnight Sun", "Midnattsol"},
		{5499, 10, "Midnight Sun", "Midnattsol"},
	}

	for _, tt := range tests {
		t.Run(tt.wantName, func(t *testing.T) {
			level := xp.GetLevelForXP(tt.totalXP)
			if level.Number != tt.wantLevel {
				t.Errorf("GetLevelForXP(%d).Number = %d, want %d", tt.totalXP, level.Number, tt.wantLevel)
			}
			if level.Name != tt.wantName {
				t.Errorf("GetLevelForXP(%d).Name = %q, want %q", tt.totalXP, level.Name, tt.wantName)
			}
			if level.NameNO != tt.wantNameNO {
				t.Errorf("GetLevelForXP(%d).NameNO = %q, want %q", tt.totalXP, level.NameNO, tt.wantNameNO)
			}
		})
	}
}

// TestGetLevelNumber ensures level number calculation works for levels beyond 10
func TestGetLevelNumber(t *testing.T) {
	tests := []struct {
		totalXP   int
		wantLevel int
	}{
		{0, 1},
		{99, 1},
		{100, 2},
		{4499, 9},
		{4500, 10},
		{5499, 10},
		{5500, 11},
		{6499, 11},
		{6500, 12},
		{7500, 13},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("XP_%d", tt.totalXP), func(t *testing.T) {
			got := xp.GetLevelNumber(tt.totalXP)
			if got != tt.wantLevel {
				t.Errorf("GetLevelNumber(%d) = %d, want %d", tt.totalXP, got, tt.wantLevel)
			}
		})
	}
}

// TestGetLevelInfo ensures level info works for levels beyond 10
func TestGetLevelInfo(t *testing.T) {
	tests := []struct {
		level      int
		wantName   string
		wantNameNO string
	}{
		{1, "Snow Mouse", "Snømus"},
		{10, "Midnight Sun", "Midnattsol"},
		{11, "Polar Explorer", "Polarforsker"},
		{15, "Polar Explorer", "Polarforsker"},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("Level_%d", tt.level), func(t *testing.T) {
			info := xp.GetLevelInfo(tt.level)
			if info.Name != tt.wantName {
				t.Errorf("GetLevelInfo(%d).Name = %q, want %q", tt.level, info.Name, tt.wantName)
			}
			if info.NameNO != tt.wantNameNO {
				t.Errorf("GetLevelInfo(%d).NameNO = %q, want %q", tt.level, info.NameNO, tt.wantNameNO)
			}
		})
	}
}
