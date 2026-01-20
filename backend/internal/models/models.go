package models

import (
	"time"
)

// SystemUserID is the user ID used for system-created content (e.g., curated word sets)
// When displaying this in the UI, show "Stavle" instead of a user name
const SystemUserID = "system"

// User represents a user in the system - Enhanced for family management
type User struct {
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	LastActiveAt time.Time `json:"lastActiveAt" db:"last_active_at"`
	ParentID     *string   `json:"parentId,omitempty" db:"parent_id"`
	BirthYear    *int      `json:"birthYear,omitempty" db:"birth_year"`
	ID           string    `json:"id" db:"id"`
	AuthID       string    `json:"authId" db:"auth_id"`
	Email        string    `json:"email" db:"email"`
	DisplayName  string    `json:"displayName" db:"display_name"`
	FamilyID     string    `json:"familyId" db:"family_id"`
	Role         string    `json:"role" db:"role"`
	Children     []string  `json:"children,omitempty" db:"-"`
	IsActive     bool      `json:"isActive" db:"is_active"`
	TotalXP      int       `json:"totalXp" db:"total_xp"`
	Level        int       `json:"level" db:"level"`
}

// WordMastery tracks progressive challenge unlocking per word per user
type WordMastery struct {
	CreatedAt                   time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt                   time.Time `json:"updatedAt" db:"updated_at"`
	ID                          string    `json:"id" db:"id"`
	UserID                      string    `json:"userId" db:"user_id"`
	WordSetID                   string    `json:"wordSetId" db:"word_set_id"`
	Word                        string    `json:"word" db:"word"`
	LetterTilesCorrect          int       `json:"letterTilesCorrect" db:"letter_tiles_correct"`
	WordBankCorrect             int       `json:"wordBankCorrect" db:"word_bank_correct"`
	KeyboardCorrect             int       `json:"keyboardCorrect" db:"keyboard_correct"`
	MissingLettersCorrect       int       `json:"missingLettersCorrect" db:"missing_letters_correct"`
	TranslationCorrect          int       `json:"translationCorrect" db:"translation_correct"`
	ListeningTranslationCorrect int       `json:"listeningTranslationCorrect" db:"listening_translation_correct"`
}

// TestMode represents the unified test/input mode
// These modes combine what were previously separate "test modes" and "input methods"
type TestMode string

const (
	TestModeLetterTiles          TestMode = "letterTiles"          // Build It: arrange scrambled letters
	TestModeWordBank             TestMode = "wordBank"             // Pick Words: tap words to build sentence
	TestModeKeyboard             TestMode = "keyboard"             // Type It: full spelling production
	TestModeMissingLetters       TestMode = "missingLetters"       // Fill the Gap: complete the blanks
	TestModeFlashcard            TestMode = "flashcard"            // Quick Look: see word, countdown, self-check
	TestModeLookCoverWrite       TestMode = "lookCoverWrite"       // Memory Spell: see, hide, type from memory
	TestModeTranslation          TestMode = "translation"          // Switch Languages: type in other language
	TestModeListeningTranslation TestMode = "listeningTranslation" // Listen & Translate: hear word, type translation
)

// ValidTestModes returns all valid test mode values for validation
func ValidTestModes() []TestMode {
	return []TestMode{
		TestModeLetterTiles,
		TestModeWordBank,
		TestModeKeyboard,
		TestModeMissingLetters,
		TestModeFlashcard,
		TestModeLookCoverWrite,
		TestModeTranslation,
		TestModeListeningTranslation,
	}
}

// IsValidTestMode checks if a string is a valid test mode
func IsValidTestMode(mode string) bool {
	for _, m := range ValidTestModes() {
		if string(m) == mode {
			return true
		}
	}
	return false
}

// GetCurrentChallengeMode returns the appropriate test mode based on mastery
// Returns letterTiles for beginners, wordBank after mastering tiles, keyboard after mastering both
func (m *WordMastery) GetCurrentChallengeMode(letterTilesRequired, wordBankRequired int) TestMode {
	if m.LetterTilesCorrect < letterTilesRequired {
		return TestModeLetterTiles
	}
	if m.WordBankCorrect < wordBankRequired {
		return TestModeWordBank
	}
	return TestModeKeyboard
}

// WordAudio represents audio information for a word
type WordAudio struct {
	CreatedAt time.Time `json:"createdAt"`
	Word      string    `json:"word"`
	AudioURL  string    `json:"audioUrl"`
	AudioID   string    `json:"audioId"`
	VoiceID   string    `json:"voiceId"`
}

// Translation represents a word translation in another language
type Translation struct {
	AudioURL *string `json:"audioUrl,omitempty"`
	AudioID  *string `json:"audioId,omitempty"`
	VoiceID  *string `json:"voiceId,omitempty"`
	Language string  `json:"language"`
	Text     string  `json:"text"`
}

// GradeLevel represents Norwegian school grade levels (LK20 curriculum)
type GradeLevel string

const (
	GradeLevel12 GradeLevel = "1-2" // Ages 5-7, basic spelling
	GradeLevel34 GradeLevel = "3-4" // Ages 8-9, compounds and inflection
	GradeLevel57 GradeLevel = "5-7" // Ages 10-12, advanced spelling rules
)

// DifficultyLevel represents content difficulty for progressive challenges
type DifficultyLevel string

const (
	DifficultyBeginner     DifficultyLevel = "beginner"
	DifficultyIntermediate DifficultyLevel = "intermediate"
	DifficultyAdvanced     DifficultyLevel = "advanced"
)

// SpellingFocusCategory represents spelling challenge categories
// Uses camelCase to match frontend JSON conventions
type SpellingFocusCategory string

const (
	SpellingFocusDoubleConsonant SpellingFocusCategory = "doubleConsonant" // Dobbelt konsonant
	SpellingFocusSilentLetter    SpellingFocusCategory = "silentLetter"    // Stumme bokstaver (hj-, gj-, kj-, hv-)
	SpellingFocusCompoundWord    SpellingFocusCategory = "compoundWord"    // Sammensatte ord
	SpellingFocusDiphthong       SpellingFocusCategory = "diphthong"       // Diftonger (ei, øy, au)
	SpellingFocusSkjSound        SpellingFocusCategory = "skjSound"        // Skj-lyden
	SpellingFocusSpecialChars    SpellingFocusCategory = "norwegianChars"  // Æ, Ø, Å
	SpellingFocusNgNk            SpellingFocusCategory = "ngNk"            // Ng og Nk sounds
	SpellingFocusSilentD         SpellingFocusCategory = "silentD"         // Stum D
	SpellingFocusVowelLength     SpellingFocusCategory = "vowelLength"     // Vokalforlengelse (tak/takk)
)

// SentenceItem represents a sentence for sentence dictation mode
type SentenceItem struct {
	Audio       *WordAudio      `json:"audio,omitempty"`
	Sentence    string          `json:"sentence"`
	Translation string          `json:"translation,omitempty"`
	Difficulty  DifficultyLevel `json:"difficulty"`
	Pattern     string          `json:"pattern,omitempty"`
	FocusWords  []string        `json:"focusWords,omitempty"`
}

// WordSet represents a collection of words for spelling tests
type WordSet struct {
	UpdatedAt         time.Time               `json:"updatedAt"`
	CreatedAt         time.Time               `json:"createdAt"`
	TargetGrade       *GradeLevel             `json:"targetGrade,omitempty"`
	Description       *string                 `json:"description,omitempty"`
	FamilyID          *string                 `json:"familyId,omitempty"`
	Difficulty        *DifficultyLevel        `json:"difficulty,omitempty"`
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
	Name              string                  `json:"name"`
	ID                string                  `json:"id"`
	CreatedBy         string                  `json:"createdBy"`
	Language          string                  `json:"language"`
	Sentences         []SentenceItem          `json:"sentences,omitempty"`
	SpellingFocus     []SpellingFocusCategory `json:"spellingFocus,omitempty"`
	AssignedUserIDs   []string                `json:"assignedUserIds,omitempty"`
	Words             []struct {
		Word         string        `json:"word"`
		Audio        WordAudio     `json:"audio,omitempty"`
		Definition   string        `json:"definition,omitempty"`
		Translations []Translation `json:"translations,omitempty"` // The word itself
		// Optional definition for the word

	} `json:"words"`
	IsGlobal bool `json:"isGlobal"` // Optional translations to other languages
}

// WordTestResult represents detailed information about a word in a test
type WordTestResult struct {
	Word           string   `json:"word"`
	FinalAnswer    string   `json:"finalAnswer"`
	UserAnswers    []string `json:"userAnswers"`
	ErrorTypes     []string `json:"errorTypes,omitempty"`
	Attempts       int      `json:"attempts"`
	TimeSpent      int      `json:"timeSpent"`
	HintsUsed      int      `json:"hintsUsed,omitempty"`
	AudioPlayCount int      `json:"audioPlayCount,omitempty"`
	Correct        bool     `json:"correct"`
}

// TestResult represents the result of a spelling test
type TestResult struct {
	CompletedAt    time.Time        `json:"completedAt"`
	CreatedAt      time.Time        `json:"createdAt"`
	ID             string           `json:"id"`
	WordSetID      string           `json:"wordSetId"`
	UserID         string           `json:"userId"`
	Mode           string           `json:"mode"`
	IncorrectWords []string         `json:"incorrectWords,omitempty"`
	Words          []WordTestResult `json:"words"`
	Score          float64          `json:"score"`
	TotalWords     int              `json:"totalWords"`
	CorrectWords   int              `json:"correctWords"`
	TimeSpent      int              `json:"timeSpent"`
	XPAwarded      int              `json:"xpAwarded"`
}

// AudioFile represents a generated TTS audio file
type AudioFile struct {
	CreatedAt time.Time `json:"createdAt"`
	ID        string    `json:"id"`
	Word      string    `json:"word"`
	Language  string    `json:"language"`
	VoiceID   string    `json:"voiceId"`
	URL       string    `json:"url"`
}

// WordInput represents a word input with optional definition for word set creation/updates
type WordInput struct {
	Word         string        `json:"word" binding:"required"`
	Definition   string        `json:"definition,omitempty"`
	Translations []Translation `json:"translations,omitempty"`
}

// CreateWordSetRequest represents the request to create a word set
type CreateWordSetRequest struct {
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
	Name              string                  `json:"name" binding:"required"`
	Language          string                  `json:"language" binding:"required"`
	Words             []WordInput             `json:"words" binding:"required"`
}

// UpdateWordSetRequest represents the request to update a word set
type UpdateWordSetRequest struct {
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
	Name              string                  `json:"name" binding:"required"`
	Language          string                  `json:"language" binding:"required"`
	Words             []WordInput             `json:"words" binding:"required"`
}

// SaveResultRequest represents the request to save a test result
type SaveResultRequest struct {
	WordSetID      string           `json:"wordSetId" binding:"required"`
	Mode           string           `json:"mode" binding:"required,oneof=letterTiles wordBank keyboard missingLetters flashcard lookCoverWrite translation listeningTranslation"`
	IncorrectWords []string         `json:"incorrectWords,omitempty"`
	Words          []WordTestResult `json:"words"`
	Score          float64          `json:"score" binding:"required"`
	TotalWords     int              `json:"totalWords" binding:"required"`
	CorrectWords   int              `json:"correctWords" binding:"required"`
	TimeSpent      int              `json:"timeSpent"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
	Details string      `json:"details,omitempty"` // Technical details for debugging
}

// Family represents a family group
type Family struct {
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedBy string    `json:"createdBy"`
	Members   []string  `json:"members"`
}

// ChildAccount represents a child user account managed by a parent
type ChildAccount struct {
	CreatedAt    time.Time `json:"createdAt"`
	LastActiveAt time.Time `json:"lastActiveAt"`
	ParentID     *string   `json:"parentId,omitempty"`
	BirthYear    *int      `json:"birthYear,omitempty"`
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"displayName"`
	FamilyID     string    `json:"familyId"`
	Role         string    `json:"role"`
	IsActive     bool      `json:"isActive"`
	TotalXP      int       `json:"totalXp"`
	Level        int       `json:"level"`
}

// FamilyInvitation represents an invitation to join a family
type FamilyInvitation struct {
	CreatedAt  time.Time  `json:"createdAt" db:"created_at"`
	ExpiresAt  *time.Time `json:"expiresAt,omitempty" db:"expires_at"`
	ID         string     `json:"id" db:"id"`
	FamilyID   string     `json:"familyId" db:"family_id"`
	FamilyName string     `json:"familyName" db:"family_name"`
	Email      string     `json:"email" db:"email"`
	Role       string     `json:"role" db:"role"`
	InvitedBy  string     `json:"invitedBy" db:"invited_by"`
	Status     string     `json:"status" db:"status"`
}

// FamilyProgress represents progress tracking for family members
type FamilyProgress struct {
	LastActivity                      time.Time    `json:"lastActivity"`
	BirthYear                         *int         `json:"birthYear,omitempty"`
	UserName                          string       `json:"userName"`
	Role                              string       `json:"role"`
	UserID                            string       `json:"userId"`
	RecentResults                     []TestResult `json:"recentResults"`
	TotalTests                        int          `json:"totalTests"`
	CorrectWords                      int          `json:"correctWords"`
	TotalWords                        int          `json:"totalWords"`
	AverageScore                      float64      `json:"averageScore"`
	TotalWordsWithMastery             int          `json:"totalWordsWithMastery"`
	LetterTilesMasteredWords          int          `json:"letterTilesMasteredWords"`
	WordBankMasteredWords             int          `json:"wordBankMasteredWords"`
	KeyboardMasteredWords             int          `json:"keyboardMasteredWords"`
	MissingLettersMasteredWords       int          `json:"missingLettersMasteredWords"`
	TranslationMasteredWords          int          `json:"translationMasteredWords"`
	ListeningTranslationMasteredWords int          `json:"listeningTranslationMasteredWords"`
	TotalXP                           int          `json:"totalXp"`
	Level                             int          `json:"level"`
}

// DisplayNameUpdateRequest represents a request to update a user's display name
type DisplayNameUpdateRequest struct {
	DisplayName string `json:"displayName" binding:"required,min=1,max=100"`
}

// FamilyStats represents aggregated statistics for a family
type FamilyStats struct {
	LastActivity        time.Time `json:"lastActivity"`
	MostActiveChild     *string   `json:"mostActiveChild,omitempty"`
	TotalMembers        int       `json:"totalMembers"`
	TotalChildren       int       `json:"totalChildren"`
	TotalWordSets       int       `json:"totalWordSets"`
	TotalTestsCompleted int       `json:"totalTestsCompleted"`
	AverageFamilyScore  float64   `json:"averageFamilyScore"`
}

// AddFamilyMemberRequest represents a request to add a parent or child to a family
// For children: creates pending user that links when they first log in via OIDC
// For parents: creates invitation that user accepts on login/registration
type AddFamilyMemberRequest struct {
	BirthYear   *int   `json:"birthYear,omitempty"`
	Email       string `json:"email" binding:"required,email"`
	DisplayName string `json:"displayName"` // Required for child, optional for parent (they provide on registration)
	Role        string `json:"role" binding:"required,oneof=parent child"`
	FamilyID    string `json:"familyId" binding:"required"`
}

// UpdateChildBirthYearRequest represents a request to update a child's birth year
type UpdateChildBirthYearRequest struct {
	BirthYear *int `json:"birthYear"` // Birth year for age-adaptive features (null to clear)
}

// CreateChildAccountRequest is deprecated, use AddFamilyMemberRequest instead
type CreateChildAccountRequest = AddFamilyMemberRequest

// XPInfo contains XP and level information returned after saving a test result
type XPInfo struct {
	LevelName      string `json:"levelName"`
	LevelNameNO    string `json:"levelNameNo"`
	LevelIconPath  string `json:"levelIconPath"`
	Awarded        int    `json:"awarded"`
	Total          int    `json:"total"`
	Level          int    `json:"level"`
	PreviousLevel  int    `json:"previousLevel,omitempty"`
	NextLevelXP    int    `json:"nextLevelXp"`
	CurrentLevelXP int    `json:"currentLevelXp"`
	LevelUp        bool   `json:"levelUp"`
}

// SaveResultResponse is the response from saving a test result, including XP info
type SaveResultResponse struct {
	TestResult *TestResult `json:"testResult"`
	XP         *XPInfo     `json:"xp"`
}
