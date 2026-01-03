package models

import (
	"time"
)

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
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	LastActiveAt time.Time `json:"lastActiveAt" db:"last_active_at"`
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
	FamilyID          string                  `json:"familyId"`
	CreatedBy         string                  `json:"createdBy"`
	Language          string                  `json:"language"` // 'en' or 'no'
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
	CreatedAt         time.Time               `json:"createdAt"`
	UpdatedAt         time.Time               `json:"updatedAt"`
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
}

// TestResult represents the result of a spelling test
type TestResult struct {
	ID             string           `json:"id"`
	WordSetID      string           `json:"wordSetId"`
	UserID         string           `json:"userId"`
	Score          float64          `json:"score"` // Percentage (0-100)
	TotalWords     int              `json:"totalWords"`
	CorrectWords   int              `json:"correctWords"`
	Mode           string           `json:"mode"`                     // "standard", "dictation", "translation"
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
	Mode           string           `json:"mode" binding:"required,oneof=standard dictation translation"`
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
	ParentID     string    `json:"parentId"` // The parent who created this child account
	Role         string    `json:"role"`     // Always "child"
	IsActive     bool      `json:"isActive"` // Parents can deactivate child accounts
	CreatedAt    time.Time `json:"createdAt"`
	LastActiveAt time.Time `json:"lastActiveAt"`
}

// FamilyInvitation represents an invitation to join a family
type FamilyInvitation struct {
	ID        string     `json:"id" db:"id"`
	FamilyID  string     `json:"familyId" db:"family_id"`
	Email     string     `json:"email" db:"email"`
	Role      string     `json:"role" db:"role"` // "child" or "parent"
	InvitedBy string     `json:"invitedBy" db:"invited_by"`
	Status    string     `json:"status" db:"status"` // "pending", "accepted", "declined", "expired"
	CreatedAt time.Time  `json:"createdAt" db:"created_at"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty" db:"expires_at"` // NULL for non-expiring invitations
}

// FamilyProgress represents progress tracking for family members
type FamilyProgress struct {
	UserID        string       `json:"userId"`
	UserName      string       `json:"userName"`
	Role          string       `json:"role"`
	TotalTests    int          `json:"totalTests"`
	AverageScore  float64      `json:"averageScore"`
	TotalWords    int          `json:"totalWords"`
	CorrectWords  int          `json:"correctWords"`
	LastActivity  time.Time    `json:"lastActivity"`
	RecentResults []TestResult `json:"recentResults"`
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
}

// CreateChildAccountRequest is deprecated, use AddFamilyMemberRequest instead
type CreateChildAccountRequest = AddFamilyMemberRequest
