package xp

import (
	"math"
	"time"

	"github.com/starefossen/diktator/backend/internal/models"
)

// Level represents a level in the XP progression system
type Level struct {
	Name       string `json:"name"`
	NameNO     string `json:"nameNo"`
	IconPath   string `json:"iconPath"`
	Number     int    `json:"number"`
	XPRequired int    `json:"xpRequired"`
	TotalXP    int    `json:"totalXp"`
}

// Levels defines the Nordic-themed level progression
var Levels = []Level{
	{Number: 1, Name: "Snow Mouse", NameNO: "Snømus", XPRequired: 0, TotalXP: 0, IconPath: "/levels/level-01-snomus.svg"},
	{Number: 2, Name: "Arctic Fox", NameNO: "Fjellrev", XPRequired: 100, TotalXP: 100, IconPath: "/levels/level-02-fjellrev.svg"},
	{Number: 3, Name: "Arctic Hare", NameNO: "Snøhare", XPRequired: 200, TotalXP: 300, IconPath: "/levels/level-03-snohare.svg"},
	{Number: 4, Name: "Reindeer", NameNO: "Rein", XPRequired: 300, TotalXP: 600, IconPath: "/levels/level-04-rein.svg"},
	{Number: 5, Name: "Snowy Owl", NameNO: "Snøugle", XPRequired: 400, TotalXP: 1000, IconPath: "/levels/level-05-snougle.svg"},
	{Number: 6, Name: "Wolverine", NameNO: "Jerv", XPRequired: 500, TotalXP: 1500, IconPath: "/levels/level-06-jerv.svg"},
	{Number: 7, Name: "Wolf", NameNO: "Ulv", XPRequired: 600, TotalXP: 2100, IconPath: "/levels/level-07-ulv.svg"},
	{Number: 8, Name: "Polar Bear", NameNO: "Isbjørn", XPRequired: 700, TotalXP: 2800, IconPath: "/levels/level-08-isbjorn.svg"},
	{Number: 9, Name: "Northern Lights", NameNO: "Nordlys", XPRequired: 800, TotalXP: 3600, IconPath: "/levels/level-09-nordlys.svg"},
	{Number: 10, Name: "Midnight Sun", NameNO: "Midnattsol", XPRequired: 900, TotalXP: 4500, IconPath: "/levels/level-10-midnattsol.svg"},
}

// PolarExplorerLevel is used for levels beyond 10
var PolarExplorerLevel = Level{
	Name:     "Polar Explorer",
	NameNO:   "Polarforsker",
	IconPath: "/levels/level-11-polarforsker.svg",
}

// XPPerLevelBeyond10 is the XP required for each level after 10
const XPPerLevelBeyond10 = 1000

// BaseXPByMode defines base XP awarded for each test mode
var BaseXPByMode = map[string]int{
	"letterTiles":    10,
	"wordBank":       15,
	"missingLetters": 20,
	"translation":    20,
	"keyboard":       25,
	"flashcard":      5,
	"lookCoverWrite": 20,
}

// ScoreMultiplier returns the XP multiplier based on score percentage
func ScoreMultiplier(score float64) float64 {
	switch {
	case score >= 100:
		return 2.0
	case score >= 90:
		return 1.5
	case score >= 70:
		return 1.0
	case score >= 50:
		return 0.75
	default:
		return 0.5
	}
}

// RepetitionDecay returns the decay multiplier based on how many times
// this word set + mode combination has been completed in the last 7 days
func RepetitionDecay(completionCount int) float64 {
	switch completionCount {
	case 0, 1:
		return 1.0 // First time
	case 2:
		return 0.5 // Second time
	case 3:
		return 0.25 // Third time
	default:
		return 0.1 // Floor
	}
}

// XPResult contains the result of an XP calculation
type XPResult struct {
	LevelName       string  `json:"levelName"`
	LevelIconPath   string  `json:"levelIconPath"`
	LevelNameNO     string  `json:"levelNameNo"`
	CurrentLevelXP  int     `json:"currentLevelXp"`
	Level           int     `json:"level"`
	Total           int     `json:"total"`
	PreviousLevel   int     `json:"previousLevel,omitempty"`
	NextLevelXP     int     `json:"nextLevelXp"`
	Awarded         int     `json:"awarded"`
	BaseXP          int     `json:"baseXp"`
	ScoreMultiplier float64 `json:"scoreMultiplier"`
	FirstTimeBonus  float64 `json:"firstTimeBonus"`
	RepetitionDecay float64 `json:"repetitionDecay"`
	LevelUp         bool    `json:"levelUp"`
	IsFirstTime     bool    `json:"isFirstTime"`
}

// CalculateXP calculates XP awarded for a test result
func CalculateXP(mode string, score float64, isFirstTime bool, completionCount int) (int, *XPResult) {
	baseXP := BaseXPByMode[mode]
	if baseXP == 0 {
		baseXP = 10 // Default fallback
	}

	scoreMult := ScoreMultiplier(score)

	var firstTimeMult float64
	if isFirstTime {
		firstTimeMult = 3.0
	} else {
		firstTimeMult = 1.0
	}

	decayMult := RepetitionDecay(completionCount)

	rawXP := float64(baseXP) * scoreMult * firstTimeMult * decayMult
	awarded := int(math.Ceil(rawXP)) // Round up, never award 0

	if awarded < 1 {
		awarded = 1 // Minimum 1 XP
	}

	return awarded, &XPResult{
		Awarded:         awarded,
		IsFirstTime:     isFirstTime,
		BaseXP:          baseXP,
		ScoreMultiplier: scoreMult,
		FirstTimeBonus:  firstTimeMult,
		RepetitionDecay: decayMult,
	}
}

// GetLevelForXP returns the level info for a given total XP
func GetLevelForXP(totalXP int) Level {
	// Check standard levels (1-10)
	for i := len(Levels) - 1; i >= 0; i-- {
		if totalXP >= Levels[i].TotalXP {
			return Levels[i]
		}
	}
	return Levels[0] // Default to level 1
}

// GetLevelNumber returns just the level number for a given total XP
func GetLevelNumber(totalXP int) int {
	// Check if beyond level 10
	if totalXP >= Levels[len(Levels)-1].TotalXP {
		// Calculate levels beyond 10
		xpBeyond10 := totalXP - Levels[len(Levels)-1].TotalXP
		extraLevels := xpBeyond10 / XPPerLevelBeyond10
		return 10 + extraLevels
	}

	return GetLevelForXP(totalXP).Number
}

// GetNextLevelXP returns the XP required to reach the next level
func GetNextLevelXP(currentLevel int) int {
	if currentLevel < 10 {
		return Levels[currentLevel].TotalXP // Levels array is 0-indexed
	}
	// Beyond level 10, each level needs 1000 more XP
	return Levels[9].TotalXP + (currentLevel-9)*XPPerLevelBeyond10
}

// GetCurrentLevelXP returns the XP threshold for the current level
func GetCurrentLevelXP(currentLevel int) int {
	if currentLevel <= 10 {
		return Levels[currentLevel-1].TotalXP
	}
	return Levels[9].TotalXP + (currentLevel-10)*XPPerLevelBeyond10
}

// GetLevelInfo returns full level information including name for levels beyond 10
func GetLevelInfo(level int) Level {
	if level <= 10 {
		return Levels[level-1]
	}
	// Beyond level 10
	return Level{
		Number:     level,
		Name:       PolarExplorerLevel.Name,
		NameNO:     PolarExplorerLevel.NameNO,
		XPRequired: XPPerLevelBeyond10,
		TotalXP:    GetCurrentLevelXP(level),
		IconPath:   PolarExplorerLevel.IconPath,
	}
}

// Repository defines database operations needed for XP calculations
type Repository interface {
	// GetRecentCompletions returns how many times a user has completed a word set + mode
	// combination in the specified time window
	GetRecentCompletions(userID, wordSetID, mode string, since time.Time) (int, error)

	// IsFirstCompletion checks if this is the user's first completion of this word set + mode
	IsFirstCompletion(userID, wordSetID, mode string) (bool, error)

	// UpdateUserXP updates the user's total XP and level
	UpdateUserXP(userID string, xpAwarded, newTotalXP, newLevel int) error

	// GetUserXP returns the user's current XP and level
	GetUserXP(userID string) (totalXP int, level int, err error)
}

// Service handles XP calculations and updates
type Service struct {
	repo Repository
}

// NewService creates a new XP service
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// AwardXP calculates and awards XP for a completed test
func (s *Service) AwardXP(userID string, result *models.TestResult) (*XPResult, error) {
	// Check if this is a first-time completion for this word set + mode
	isFirstTime, err := s.repo.IsFirstCompletion(userID, result.WordSetID, result.Mode)
	if err != nil {
		return nil, err
	}

	// Get recent completions for decay calculation (within 7 days)
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	completionCount, err := s.repo.GetRecentCompletions(userID, result.WordSetID, result.Mode, sevenDaysAgo)
	if err != nil {
		return nil, err
	}

	// Calculate XP
	awarded, xpResult := CalculateXP(result.Mode, result.Score, isFirstTime, completionCount)

	// Get current user XP
	currentXP, currentLevel, err := s.repo.GetUserXP(userID)
	if err != nil {
		return nil, err
	}

	// Calculate new totals
	newTotalXP := currentXP + awarded
	newLevel := GetLevelNumber(newTotalXP)

	// Update user XP in database
	err = s.repo.UpdateUserXP(userID, awarded, newTotalXP, newLevel)
	if err != nil {
		return nil, err
	}

	// Fill in remaining result fields
	levelInfo := GetLevelInfo(newLevel)
	xpResult.Awarded = awarded
	xpResult.Total = newTotalXP
	xpResult.Level = newLevel
	xpResult.LevelName = levelInfo.Name
	xpResult.LevelNameNO = levelInfo.NameNO
	xpResult.LevelIconPath = levelInfo.IconPath
	xpResult.LevelUp = newLevel > currentLevel
	if xpResult.LevelUp {
		xpResult.PreviousLevel = currentLevel
	}
	xpResult.NextLevelXP = GetNextLevelXP(newLevel)
	xpResult.CurrentLevelXP = GetCurrentLevelXP(newLevel)

	return xpResult, nil
}
