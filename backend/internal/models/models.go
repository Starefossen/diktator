package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID        string    `firestore:"id" json:"id"`
	Email     string    `firestore:"email" json:"email"`
	FamilyID  string    `firestore:"familyId" json:"familyId"`
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
}

// WordSet represents a collection of words for spelling tests
type WordSet struct {
	ID        string    `firestore:"id" json:"id"`
	Name      string    `firestore:"name" json:"name"`
	Words     []string  `firestore:"words" json:"words"`
	FamilyID  string    `firestore:"familyId" json:"familyId"`
	CreatedBy string    `firestore:"createdBy" json:"createdBy"`
	Language  string    `firestore:"language" json:"language"` // 'en' or 'no'
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `firestore:"updatedAt" json:"updatedAt"`
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
	Name     string   `json:"name" binding:"required"`
	Words    []string `json:"words" binding:"required"`
	Language string   `json:"language" binding:"required"`
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
