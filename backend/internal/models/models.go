package models

import (
	"time"
)

// User represents a user in the system - Enhanced for family management
type User struct {
	ID           string    `firestore:"id" json:"id"`
	FirebaseUID  string    `firestore:"firebaseUID" json:"firebaseUID"`
	Email        string    `firestore:"email" json:"email"`
	DisplayName  string    `firestore:"displayName" json:"displayName"`
	FamilyID     string    `firestore:"familyId" json:"familyId"`
	Role         string    `firestore:"role" json:"role"`                             // "parent" or "child"
	ParentID     *string   `firestore:"parentId,omitempty" json:"parentId,omitempty"` // Only for child accounts
	Children     []string  `firestore:"children,omitempty" json:"children,omitempty"` // Only for parent accounts
	IsActive     bool      `firestore:"isActive" json:"isActive"`
	CreatedAt    time.Time `firestore:"createdAt" json:"createdAt"`
	LastActiveAt time.Time `firestore:"lastActiveAt" json:"lastActiveAt"`
}

// WordAudio represents audio information for a word
type WordAudio struct {
	Word      string    `firestore:"word" json:"word"`
	AudioURL  string    `firestore:"audioUrl" json:"audioUrl"`
	AudioID   string    `firestore:"audioId" json:"audioId"`
	VoiceID   string    `firestore:"voiceId" json:"voiceId"`
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
}

// WordSet represents a collection of words for spelling tests
type WordSet struct {
	ID    string `firestore:"id" json:"id"`
	Name  string `firestore:"name" json:"name"`
	Words []struct {
		Word       string    `firestore:"word" json:"word"`                                 // The word itself
		Audio      WordAudio `firestore:"audio,omitempty" json:"audio,omitempty"`           // Optional audio info for the word
		Definition string    `firestore:"definition,omitempty" json:"definition,omitempty"` // Optional definition for the word
	} `firestore:"words" json:"words"`
	FamilyID          string                  `firestore:"familyId" json:"familyId"`
	CreatedBy         string                  `firestore:"createdBy" json:"createdBy"`
	Language          string                  `firestore:"language" json:"language"`                                   // 'en' or 'no'
	AudioProcessing   string                  `firestore:"audioProcessing,omitempty" json:"audioProcessing,omitempty"` // "pending", "completed", "failed", or empty
	AudioProcessedAt  *time.Time              `firestore:"audioProcessedAt,omitempty" json:"audioProcessedAt,omitempty"`
	TestConfiguration *map[string]interface{} `firestore:"testConfiguration,omitempty" json:"testConfiguration,omitempty"`
	CreatedAt         time.Time               `firestore:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time               `firestore:"updatedAt" json:"updatedAt"`
}

// TestResult represents the result of a spelling test
type TestResult struct {
	ID             string    `firestore:"id" json:"id"`
	WordSetID      string    `firestore:"wordSetId" json:"wordSetId"`
	UserID         string    `firestore:"userId" json:"userId"`
	Score          float64   `firestore:"score" json:"score"` // Percentage (0-100)
	TotalWords     int       `firestore:"totalWords" json:"totalWords"`
	CorrectWords   int       `firestore:"correctWords" json:"correctWords"`
	IncorrectWords []string  `firestore:"incorrectWords" json:"incorrectWords"`
	TimeSpent      int       `firestore:"timeSpent" json:"timeSpent"` // seconds
	CompletedAt    time.Time `firestore:"completedAt" json:"completedAt"`
	CreatedAt      time.Time `firestore:"createdAt" json:"createdAt"`
}

// AudioFile represents a generated TTS audio file
type AudioFile struct {
	ID          string    `firestore:"id" json:"id"`
	Word        string    `firestore:"word" json:"word"`
	Language    string    `firestore:"language" json:"language"`
	VoiceID     string    `firestore:"voiceId" json:"voiceId"`
	StoragePath string    `firestore:"storagePath" json:"storagePath"`
	URL         string    `firestore:"url" json:"url"`
	CreatedAt   time.Time `firestore:"createdAt" json:"createdAt"`
}

// CreateWordSetRequest represents the request to create a word set
type CreateWordSetRequest struct {
	Name              string                  `json:"name" binding:"required"`
	Words             []string                `json:"words" binding:"required"`
	Language          string                  `json:"language" binding:"required"`
	TestConfiguration *map[string]interface{} `json:"testConfiguration,omitempty"`
}

// SaveResultRequest represents the request to save a test result
type SaveResultRequest struct {
	WordSetID      string   `json:"wordSetId" binding:"required"`
	Score          float64  `json:"score" binding:"required"`
	TotalWords     int      `json:"totalWords" binding:"required"`
	CorrectWords   int      `json:"correctWords" binding:"required"`
	IncorrectWords []string `json:"incorrectWords"`
	TimeSpent      int      `json:"timeSpent"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Family represents a family group
type Family struct {
	ID        string    `firestore:"id" json:"id"`
	Name      string    `firestore:"name" json:"name"`
	CreatedBy string    `firestore:"createdBy" json:"createdBy"` // Parent's user ID
	Members   []string  `firestore:"members" json:"members"`     // Array of user IDs in the family
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `firestore:"updatedAt" json:"updatedAt"`
}

// ChildAccount represents a child user account managed by a parent
type ChildAccount struct {
	ID           string    `firestore:"id" json:"id"`
	Email        string    `firestore:"email" json:"email"`
	DisplayName  string    `firestore:"displayName" json:"displayName"`
	FamilyID     string    `firestore:"familyId" json:"familyId"`
	ParentID     string    `firestore:"parentId" json:"parentId"` // The parent who created this child account
	Role         string    `firestore:"role" json:"role"`         // Always "child"
	IsActive     bool      `firestore:"isActive" json:"isActive"` // Parents can deactivate child accounts
	CreatedAt    time.Time `firestore:"createdAt" json:"createdAt"`
	LastActiveAt time.Time `firestore:"lastActiveAt" json:"lastActiveAt"`
}

// FamilyInvitation represents an invitation to join a family
type FamilyInvitation struct {
	ID        string    `firestore:"id" json:"id"`
	FamilyID  string    `firestore:"familyId" json:"familyId"`
	Email     string    `firestore:"email" json:"email"`
	Role      string    `firestore:"role" json:"role"` // "child" or "parent"
	InvitedBy string    `firestore:"invitedBy" json:"invitedBy"`
	Status    string    `firestore:"status" json:"status"` // "pending", "accepted", "declined", "expired"
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
	ExpiresAt time.Time `firestore:"expiresAt" json:"expiresAt"`
}

// FamilyProgress represents progress tracking for family members
type FamilyProgress struct {
	UserID        string       `firestore:"userId" json:"userId"`
	UserName      string       `firestore:"userName" json:"userName"`
	Role          string       `firestore:"role" json:"role"`
	TotalTests    int          `firestore:"totalTests" json:"totalTests"`
	AverageScore  float64      `firestore:"averageScore" json:"averageScore"`
	TotalWords    int          `firestore:"totalWords" json:"totalWords"`
	CorrectWords  int          `firestore:"correctWords" json:"correctWords"`
	LastActivity  time.Time    `firestore:"lastActivity" json:"lastActivity"`
	RecentResults []TestResult `firestore:"recentResults" json:"recentResults"`
}

// FamilyStats represents aggregated statistics for a family
type FamilyStats struct {
	TotalMembers        int       `firestore:"totalMembers" json:"totalMembers"`
	TotalChildren       int       `firestore:"totalChildren" json:"totalChildren"`
	TotalWordSets       int       `firestore:"totalWordSets" json:"totalWordSets"`
	TotalTestsCompleted int       `firestore:"totalTestsCompleted" json:"totalTestsCompleted"`
	AverageFamilyScore  float64   `firestore:"averageFamilyScore" json:"averageFamilyScore"`
	MostActiveChild     *string   `firestore:"mostActiveChild,omitempty" json:"mostActiveChild,omitempty"`
	LastActivity        time.Time `firestore:"lastActivity" json:"lastActivity"`
}

// CreateChildAccountRequest represents a request to create a child account
type CreateChildAccountRequest struct {
	Email       string `json:"email" binding:"required,email"`
	DisplayName string `json:"displayName" binding:"required"`
	Password    string `json:"password" binding:"required,min=6"`
	FamilyID    string `json:"familyId" binding:"required"`
}

// InviteFamilyMemberRequest represents a request to invite someone to join a family
type InviteFamilyMemberRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Role     string `json:"role" binding:"required,oneof=child parent"`
	FamilyID string `json:"familyId" binding:"required"`
}
