package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/auth"
	"github.com/starefossen/diktator/backend/internal/services/db"
	"github.com/starefossen/diktator/backend/internal/services/dictionary"
	"github.com/starefossen/diktator/backend/internal/services/tts"
	"github.com/starefossen/diktator/backend/internal/services/xp"
)

// Manager coordinates all services for the application
type Manager struct {
	DB            db.Repository // PostgreSQL database repository
	TTS           tts.Provider
	AuthValidator auth.SessionValidator
	Dictionary    *dictionary.Service // Norwegian dictionary proxy service
	XP            *xp.Service         // XP calculation service
}

// NewManager creates a new service manager for OIDC/PostgreSQL
func NewManager() (*Manager, error) {
	ctx := context.Background()

	// Initialize database connection
	dbConfig := db.DefaultConfig()
	dbConfig.DSN = os.Getenv("DATABASE_URL")
	if dbConfig.DSN == "" {
		// Default for local development
		dbConfig.DSN = "postgresql://postgres:postgres@localhost:5432/diktator?sslmode=disable"
	}

	repository, err := db.NewRepository(ctx, dbConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database: %v", err)
	}
	log.Println("✅ Database connection established")

	// Initialize auth validator
	authConfig := &auth.Config{
		Mode:                   os.Getenv("AUTH_MODE"),
		OIDCIssuerURL:          os.Getenv("OIDC_ISSUER_URL"),
		OIDCAudience:           os.Getenv("OIDC_AUDIENCE"),
		OIDCInsecureSkipVerify: os.Getenv("OIDC_INSECURE_SKIP_VERIFY") == "true",
	}

	// Default to mock mode for development
	if authConfig.Mode == "" {
		authConfig.Mode = "mock"
		log.Println("⚠️  AUTH_MODE not set, defaulting to mock mode")
	}

	authValidator, err := auth.NewSessionValidator(authConfig)
	if err != nil {
		repository.Close()
		return nil, fmt.Errorf("failed to initialize auth validator: %v", err)
	}
	log.Printf("✅ Auth validator initialized (mode: %s)", authConfig.Mode)

	// Initialize TTS service
	ttsService, err := tts.NewService()
	if err != nil {
		repository.Close()
		authValidator.Close()
		return nil, fmt.Errorf("failed to initialize TTS service: %v", err)
	}
	log.Println("✅ TTS service initialized")

	// Initialize Dictionary service (Norwegian dictionary proxy)
	dictService := dictionary.NewService(dictionary.DefaultConfig())
	log.Println("✅ Dictionary service initialized")

	// Initialize XP service
	xpService := xp.NewService(repository)
	log.Println("✅ XP service initialized")

	log.Println("🚀 All services initialized successfully")
	return &Manager{
		DB:            repository,
		TTS:           ttsService,
		AuthValidator: authValidator,
		Dictionary:    dictService,
		XP:            xpService,
	}, nil
}

// Close closes all services
func (m *Manager) Close() error {
	var errs []error

	if err := m.DB.Close(); err != nil {
		errs = append(errs, fmt.Errorf("database close error: %v", err))
	}

	if err := m.TTS.Close(); err != nil {
		errs = append(errs, fmt.Errorf("tts close error: %v", err))
	}

	if err := m.AuthValidator.Close(); err != nil {
		errs = append(errs, fmt.Errorf("auth validator close error: %v", err))
	}

	if m.Dictionary != nil {
		if err := m.Dictionary.Close(); err != nil {
			errs = append(errs, fmt.Errorf("dictionary close error: %v", err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors closing services: %v", errs)
	}

	return nil
}

// CreateUserIfNotExists creates a user from OIDC identity if they don't exist
func (m *Manager) CreateUserIfNotExists(identity *auth.Identity) (*models.User, error) {
	// Try to get existing user
	user, err := m.DB.GetUserByAuthID(identity.ID)
	if err == nil {
		// User exists, update last active time
		user.LastActiveAt = time.Now()
		if err := m.DB.UpdateUser(user); err != nil {
			// Log error but don't fail - user can still proceed
			log.Printf("Warning: failed to update user last active time: %v", err)
		}
		return user, nil
	}

	if err != db.ErrUserNotFound {
		return nil, fmt.Errorf("failed to check user existence: %v", err)
	}

	// Create new user
	name := identity.Traits["name"]
	if name == "" {
		name = identity.Email
	}

	user = &models.User{
		AuthID:       identity.ID, // External auth provider ID (subject claim)
		Email:        identity.Email,
		DisplayName:  name,
		Role:         "parent", // Default role
		IsActive:     true,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
	}

	if err := m.DB.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	log.Printf("Created new user %s from auth identity %s", user.ID, identity.ID)
	return user, nil
}
