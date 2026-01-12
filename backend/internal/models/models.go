package models

import (
	"time"
)

// SystemUserID is the user ID used for system-created content (e.g., curated word sets)
// When displaying this in the UI, show "Stavle" instead of a user name
const SystemUserID = "system"

// User represents a user in the system - Enhanced for family management
type User struct {
	ID           string    `json:"id" db:"id"`
	AuthID       string    `json:"authId" db:"auth_id"` // External auth provider ID (OIDC subject claim)
	Email        string    `json:"email" db:"email"`
	DisplayName  string    `json:"displayName" db:"display_name"`
	FamilyID     string    `json:"familyId" db:"family_id"`
	Role         string    `json:"role" db:"role"`                    // "parent" or "child"
	ParentID     *string   `json:"parentId,omitempty" db:"parent_id"` // Only for child accounts
	Children     []string  `json:"children,omitempty" db:"-"`         // Only for parent accounts (computed)
	IsActive     bool      `json:"isActive" db:"is_active"`
	BirthYear    *int      `json:"birthYear,omitempty" db:"birth_year"` // Optional birth year for age-adaptive features
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	LastActiveAt time.Time `json:"lastActiveAt" db:"last_active_at"`
}

// WordMastery tracks progressive challenge unlocking per word per user
type WordMastery struct {
	ID                 string    `json:"id" db:"id"`
	UserID             string    `json:"userId" db:"user_id"`
	WordSetID          string    `json:"wordSetId" db:"word_set_id"`
	Word               string    `json:"word" db:"word"`
	LetterTilesCorrect int       `json:"letterTilesCorrect" db:"letter_tiles_correct"`
	WordBankCorrect    int       `json:"wordBankCorrect" db:"word_bank_correct"`
	KeyboardCorrect    int       `json:"keyboardCorrect" db:"keyboard_correct"`
	CreatedAt          time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time `json:"updatedAt" db:"updated_at"`
}

// TestMode represents the unified test/input mode
// These modes combine what were previously separate "test modes" and "input methods"
type TestMode string

const (
	TestModeLetterTiles    TestMode = "letterTiles"    // Build It: arrange scrambled letters
	TestModeWordBank       TestMode = "wordBank"       // Pick Words: tap words to build sentence
	TestModeKeyboard       TestMode = "keyboard"       // Type It: full spelling production
	TestModeMissingLetters TestMode = "missingLetters" // Fill the Gap: complete the blanks
	TestModeFlashcard      TestMode = "flashcard"      // Quick Look: see word, countdown, self-check
	TestModeLookCoverWrite TestMode = "lookCoverWrite" // Memory Spell: see, hide, type from memory
	TestModeTranslation    TestMode = "translation"    // Switch Languages: type in other language
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
	Word      string    `json:"word"`
	AudioURL  string    `json:"audioUrl"`
	AudioID   string    `json:"audioId"`
	VoiceID   string    `json:"voiceId"`
	CreatedAt time.Time `json:"createdAt"`
}

// Translation represents a word translation in another language
type Translation struct {
	Language string  `json:"language"`
	Text     string  `json:"text"`
	AudioURL *string `json:"audioUrl,omitempty"`
	AudioID  *string `json:"audioId,omitempty"`
	VoiceID  *string `json:"voiceId,omitempty"`
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
	Sentence    string          `json:"sentence"`              // Full sentence text
	Translation string          `json:"translation,omitempty"` // Optional translation
	FocusWords  []string        `json:"focusWords,omitempty"`  // Words being specifically tested
	Difficulty  DifficultyLevel `json:"difficulty"`            // beginner, intermediate, advanced
	Pattern     string          `json:"pattern,omitempty"`     // e.g., "S+V+O", "subordinate clause"
	Audio       *WordAudio      `json:"audio,omitempty"`       // Audio info for the full sentence
}

// WordSet represents a collection of words for spelling tests
type WordSet struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Words []struct {
		Word         string        `json:"word"`                   // The word itself
		Audio        WordAudio     `json:"audio,omitempty"`        // Optional audio info for the word
		Definition   string        `json:"definition,omitempty"`   // Optional definition for the word
		Translations []Translation `json:"translations,omitempty"` // Optional translations to other languages
	} `json:"words"`
	Description       *string                 `json:"description,omitempty"`     // Optional description for curated word sets
	Sentences         []SentenceItem          `json:"sentences,omitempty"`       // Sentences for sentence dictation mode
	FamilyID          *string                 `json:"familyId,omitempty"`        // NULL for global word sets
	IsGlobal          bool                    `json:"isGlobal"`                  // True for curated word sets available to all users
	CreatedBy         string                  `json:"createdBy"`                 // SystemUserID for curated sets
	Language          string                  `json:"language"`                  // 'en' or 'no'
	AssignedUserIDs   []string                `json:"assignedUserIds,omitempty"` // IDs of child users assigned to this wordset
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
	// Curated content metadata
	TargetGrade   *GradeLevel             `json:"targetGrade,omitempty"`   // Norwegian school grade level
	SpellingFocus []SpellingFocusCategory `json:"spellingFocus,omitempty"` // Spelling challenge categories
	Difficulty    *DifficultyLevel        `json:"difficulty,omitempty"`    // Overall difficulty level
	CreatedAt     time.Time               `json:"createdAt"`
	UpdatedAt     time.Time               `json:"updatedAt"`
}

// WordTestResult represents detailed information about a word in a test
type WordTestResult struct {
	Word           string   `json:"word"`
	UserAnswers    []string `json:"userAnswers"`              // All answers the user provided for this word
	Attempts       int      `json:"attempts"`                 // Number of attempts made
	Correct        bool     `json:"correct"`                  // Whether the word was answered correctly
	TimeSpent      int      `json:"timeSpent"`                // Time spent on this word in seconds
	FinalAnswer    string   `json:"finalAnswer"`              // The final answer provided
	HintsUsed      int      `json:"hintsUsed,omitempty"`      // Number of hints used (if applicable)
	AudioPlayCount int      `json:"audioPlayCount,omitempty"` // Number of times audio was played
	ErrorTypes     []string `json:"errorTypes,omitempty"`     // Detected spelling error types (doubleConsonant, silentH, etc.)
}

// TestResult represents the result of a spelling test
type TestResult struct {
	ID             string           `json:"id"`
	WordSetID      string           `json:"wordSetId"`
	UserID         string           `json:"userId"`
	Score          float64          `json:"score"` // Percentage (0-100)
	TotalWords     int              `json:"totalWords"`
	CorrectWords   int              `json:"correctWords"`
	Mode           string           `json:"mode"`                     // Test mode: letterTiles, wordBank, keyboard, missingLetters, flashcard, lookCoverWrite, translation
	IncorrectWords []string         `json:"incorrectWords,omitempty"` // Deprecated: Use Words field for detailed information
	Words          []WordTestResult `json:"words"`                    // Detailed information for each word in the test
	TimeSpent      int              `json:"timeSpent"`                // Total time spent on test in seconds
	CompletedAt    time.Time        `json:"completedAt"`
	CreatedAt      time.Time        `json:"createdAt"`
}

// AudioFile represents a generated TTS audio file
type AudioFile struct {
	ID        string    `json:"id"`
	Word      string    `json:"word"`
	Language  string    `json:"language"`
	VoiceID   string    `json:"voiceId"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"createdAt"`
}

// WordInput represents a word input with optional definition for word set creation/updates
type WordInput struct {
	Word         string        `json:"word" binding:"required"`
	Definition   string        `json:"definition,omitempty"`
	Translations []Translation `json:"translations,omitempty"`
}

// CreateWordSetRequest represents the request to create a word set
type CreateWordSetRequest struct {
	Name              string                  `json:"name" binding:"required"`
	Words             []WordInput             `json:"words" binding:"required"`
	Language          string                  `json:"language" binding:"required"`
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
}

// UpdateWordSetRequest represents the request to update a word set
type UpdateWordSetRequest struct {
	Name              string                  `json:"name" binding:"required"`
	Words             []WordInput             `json:"words" binding:"required"`
	Language          string                  `json:"language" binding:"required"`
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
}

// SaveResultRequest represents the request to save a test result
type SaveResultRequest struct {
	WordSetID      string           `json:"wordSetId" binding:"required"`
	Score          float64          `json:"score" binding:"required"`
	TotalWords     int              `json:"totalWords" binding:"required"`
	CorrectWords   int              `json:"correctWords" binding:"required"`
	Mode           string           `json:"mode" binding:"required,oneof=letterTiles wordBank keyboard missingLetters flashcard lookCoverWrite translation"`
	IncorrectWords []string         `json:"incorrectWords,omitempty"` // Deprecated: Use Words field for detailed information
	Words          []WordTestResult `json:"words"`                    // Detailed information for each word in the test
	TimeSpent      int              `json:"timeSpent"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Family represents a family group
type Family struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedBy string    `json:"createdBy"` // Parent's user ID
	Members   []string  `json:"members"`   // Array of user IDs in the family
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ChildAccount represents a child user account managed by a parent
type ChildAccount struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"displayName"`
	FamilyID     string    `json:"familyId"`
	ParentID     *string   `json:"parentId,omitempty"`  // The parent who created this child account
	Role         string    `json:"role"`                // Always "child"
	IsActive     bool      `json:"isActive"`            // Parents can deactivate child accounts
	BirthYear    *int      `json:"birthYear,omitempty"` // Optional birth year for age-adaptive features
	CreatedAt    time.Time `json:"createdAt"`
	LastActiveAt time.Time `json:"lastActiveAt"`
}

// FamilyInvitation represents an invitation to join a family
type FamilyInvitation struct {
	ID         string     `json:"id" db:"id"`
	FamilyID   string     `json:"familyId" db:"family_id"`
	FamilyName string     `json:"familyName" db:"family_name"` // Name of the family being invited to
	Email      string     `json:"email" db:"email"`
	Role       string     `json:"role" db:"role"` // "child" or "parent"
	InvitedBy  string     `json:"invitedBy" db:"invited_by"`
	Status     string     `json:"status" db:"status"` // "pending", "accepted", "declined", "expired"
	CreatedAt  time.Time  `json:"createdAt" db:"created_at"`
	ExpiresAt  *time.Time `json:"expiresAt,omitempty" db:"expires_at"` // NULL for non-expiring invitations
}

// FamilyProgress represents progress tracking for family members
type FamilyProgress struct {
	UserID        string       `json:"userId"`
	UserName      string       `json:"userName"`
	Role          string       `json:"role"`
	BirthYear     *int         `json:"birthYear,omitempty"`
	TotalTests    int          `json:"totalTests"`
	AverageScore  float64      `json:"averageScore"`
	TotalWords    int          `json:"totalWords"`
	CorrectWords  int          `json:"correctWords"`
	LastActivity  time.Time    `json:"lastActivity"`
	RecentResults []TestResult `json:"recentResults"`
	// Mastery summary across all word sets
	TotalWordsWithMastery    int `json:"totalWordsWithMastery"`    // Total unique words with any mastery
	LetterTilesMasteredWords int `json:"letterTilesMasteredWords"` // Words with letterTilesCorrect >= 2
	WordBankMasteredWords    int `json:"wordBankMasteredWords"`    // Words with wordBankCorrect >= 2
	KeyboardMasteredWords    int `json:"keyboardMasteredWords"`    // Words with keyboardCorrect >= 2
}

// DisplayNameUpdateRequest represents a request to update a user's display name
type DisplayNameUpdateRequest struct {
	DisplayName string `json:"displayName" binding:"required,min=1,max=100"`
}

// FamilyStats represents aggregated statistics for a family
type FamilyStats struct {
	TotalMembers        int       `json:"totalMembers"`
	TotalChildren       int       `json:"totalChildren"`
	TotalWordSets       int       `json:"totalWordSets"`
	TotalTestsCompleted int       `json:"totalTestsCompleted"`
	AverageFamilyScore  float64   `json:"averageFamilyScore"`
	MostActiveChild     *string   `json:"mostActiveChild,omitempty"`
	LastActivity        time.Time `json:"lastActivity"`
}

// AddFamilyMemberRequest represents a request to add a parent or child to a family
// For children: creates pending user that links when they first log in via OIDC
// For parents: creates invitation that user accepts on login/registration
type AddFamilyMemberRequest struct {
	Email       string `json:"email" binding:"required,email"`
	DisplayName string `json:"displayName" binding:"required"`
	Role        string `json:"role" binding:"required,oneof=parent child"`
	FamilyID    string `json:"familyId" binding:"required"`
	BirthYear   *int   `json:"birthYear,omitempty"` // Optional birth year for children (age-adaptive features)
}

// UpdateChildBirthYearRequest represents a request to update a child's birth year
type UpdateChildBirthYearRequest struct {
	BirthYear *int `json:"birthYear"` // Birth year for age-adaptive features (null to clear)
}

// CreateChildAccountRequest is deprecated, use AddFamilyMemberRequest instead
type CreateChildAccountRequest = AddFamilyMemberRequest
