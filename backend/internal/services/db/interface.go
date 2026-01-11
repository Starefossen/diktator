package db

import (
	"context"
	"time"

	"github.com/starefossen/diktator/backend/internal/models"
)

// Repository defines the interface for database operations.
// This abstraction allows for different database implementations (PostgreSQL, mock, etc.)
type Repository interface {
	// Close closes the database connection
	Close() error

	// User operations
	GetUser(userID string) (*models.User, error)
	GetUserByAuthID(authID string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	CreateUser(user *models.User) error
	UpdateUser(user *models.User) error
	UpdateUserDisplayName(userID, displayName string) error
	DeleteUser(userID string) error
	LinkUserToAuthID(userID, authID string) error

	// Family operations
	GetFamily(familyID string) (*models.Family, error)
	CreateFamily(family *models.Family) error
	UpdateFamily(family *models.Family) error
	DeleteFamily(familyID string) error
	AddFamilyMember(familyID, userID, role string) error

	// Child operations
	GetChild(childID string) (*models.ChildAccount, error)
	GetFamilyChildren(familyID string) ([]models.ChildAccount, error)
	CreateChild(child *models.ChildAccount) error
	UpdateChild(child *models.ChildAccount) error
	UpdateChildDisplayName(childID, displayName string) error
	DeleteChild(childID string) error

	// Word set operations
	GetWordSet(id string) (*models.WordSet, error)
	GetWordSets(familyID string) ([]models.WordSet, error)
	GetGlobalWordSets() ([]models.WordSet, error) // Get curated word sets available to all users
	CreateWordSet(wordSet *models.WordSet) error
	UpdateWordSet(wordSet *models.WordSet) error
	DeleteWordSet(id string) error
	IsGlobalWordSet(wordSetID string) (bool, error) // Check if a word set is global/curated

	// Word set assignment operations
	AssignWordSetToUser(wordSetID, userID, assignedBy string) error
	UnassignWordSetFromUser(wordSetID, userID string) error
	GetWordSetAssignments(wordSetID string) ([]string, error)

	// Test result operations
	GetTestResults(userID string) ([]models.TestResult, error)
	GetFamilyResults(familyID string) ([]models.TestResult, error)
	SaveTestResult(result *models.TestResult) error

	// Audio file operations
	GetAudioFile(word, language, voiceID string) (*models.AudioFile, error)
	SaveAudioFile(audioFile *models.AudioFile) error

	// Progress and stats operations
	GetFamilyProgress(familyID string) ([]models.FamilyProgress, error)
	GetFamilyStats(familyID string) (*models.FamilyStats, error)
	GetUserProgress(userID string) (*models.FamilyProgress, error)

	// Family invitation operations
	CreateFamilyInvitation(invitation *models.FamilyInvitation) error
	GetPendingInvitationsByEmail(email string) ([]models.FamilyInvitation, error)
	GetFamilyInvitations(familyID string) ([]models.FamilyInvitation, error)
	AcceptInvitation(invitationID, userID string) error
	DeleteInvitation(invitationID string) error

	// Verification operations
	VerifyFamilyMembership(userID, familyID string) error
	VerifyParentPermission(userID, familyID string) error
	VerifyChildOwnership(parentID, childID string) error
	VerifyWordSetAccess(familyID, wordSetID string) error

	// Word mastery operations
	GetWordMastery(userID, wordSetID, word string) (*models.WordMastery, error)
	GetWordSetMastery(userID, wordSetID string) ([]models.WordMastery, error)
	IncrementMastery(userID, wordSetID, word string, mode models.InputMethod) (*models.WordMastery, error)
}

// Config holds database configuration
type Config struct {
	DSN             string        // Database connection string
	MaxOpenConns    int           // Maximum number of open connections
	MaxIdleConns    int           // Maximum number of idle connections
	ConnMaxLifetime time.Duration // Maximum connection lifetime
	ConnMaxIdleTime time.Duration // Maximum idle time
}

// DefaultConfig returns sensible default configuration
func DefaultConfig() *Config {
	return &Config{
		MaxOpenConns:    25,
		MaxIdleConns:    5,
		ConnMaxLifetime: 5 * time.Minute,
		ConnMaxIdleTime: 1 * time.Minute,
	}
}

// NewRepository creates a new repository based on the configuration.
// This factory function allows switching between different implementations.
func NewRepository(ctx context.Context, cfg *Config) (Repository, error) {
	return NewPostgres(ctx, cfg)
}
