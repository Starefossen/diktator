package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/starefossen/diktator/backend/internal/services/firestore"
	"github.com/starefossen/diktator/backend/internal/services/storage"
	"github.com/starefossen/diktator/backend/internal/services/tts"
	"google.golang.org/api/option"
)

// Manager coordinates all services
type Manager struct {
	Firestore *firestore.Service
	TTS       *tts.Service
	Storage   *storage.Service
	Firebase  *firebase.App
	Auth      *auth.Client
}

// NewManager creates a new service manager
func NewManager() (*Manager, error) {
	ctx := context.Background()

	// Initialize Firebase App
	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
	if projectID == "" {
		projectID = "diktator-dev" // fallback for development
	}

	var firebaseApp *firebase.App
	var err error

	// Check if we're running with Firebase emulators
	isEmulator := os.Getenv("FIREBASE_AUTH_EMULATOR_HOST") != "" ||
		os.Getenv("FIRESTORE_EMULATOR_HOST") != ""

	if isEmulator {
		log.Println("🔥 Initializing Firebase with emulator support")
		// For emulator mode, we can initialize without credentials
		config := &firebase.Config{ProjectID: projectID}
		firebaseApp, err = firebase.NewApp(ctx, config)
	} else if credsPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"); credsPath != "" {
		log.Println("🔥 Initializing Firebase with service account credentials")
		config := &firebase.Config{ProjectID: projectID}
		firebaseApp, err = firebase.NewApp(ctx, config, option.WithCredentialsFile(credsPath))
	} else {
		log.Println("🔥 Initializing Firebase with default credentials")
		config := &firebase.Config{ProjectID: projectID}
		firebaseApp, err = firebase.NewApp(ctx, config)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to initialize Firebase app: %v", err)
	}

	// Initialize Firebase Auth client
	authClient, err := firebaseApp.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Firebase Auth: %v", err)
	}

	// Initialize Firestore service
	firestoreService, err := firestore.NewService()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Firestore service: %v", err)
	}

	// Initialize TTS service
	ttsService, err := tts.NewService()
	if err != nil {
		firestoreService.Close()
		return nil, fmt.Errorf("failed to initialize TTS service: %v", err)
	}

	// Initialize Storage service
	storageService, err := storage.NewService()
	if err != nil {
		firestoreService.Close()
		ttsService.Close()
		return nil, fmt.Errorf("failed to initialize Storage service: %v", err)
	}

	log.Println("All services initialized successfully")
	return &Manager{
		Firestore: firestoreService,
		TTS:       ttsService,
		Storage:   storageService,
		Firebase:  firebaseApp,
		Auth:      authClient,
	}, nil
}

// Close closes all services
func (m *Manager) Close() error {
	var errs []error

	if err := m.Firestore.Close(); err != nil {
		errs = append(errs, fmt.Errorf("firestore close error: %v", err))
	}

	if err := m.TTS.Close(); err != nil {
		errs = append(errs, fmt.Errorf("tts close error: %v", err))
	}

	if err := m.Storage.Close(); err != nil {
		errs = append(errs, fmt.Errorf("storage close error: %v", err))
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors closing services: %v", errs)
	}

	return nil
}

// GenerateAudioForWordSet generates audio files for all words in a word set
func (m *Manager) GenerateAudioForWordSet(wordSetID string) error {
	// Get the word set
	wordSet, err := m.Firestore.GetWordSet(wordSetID)
	if err != nil {
		return fmt.Errorf("failed to get word set: %v", err)
	}

	log.Printf("Generating audio for word set '%s' with %d words", wordSet.Name, len(wordSet.Words))

	// Generate audio for each word
	for _, word := range wordSet.Words {
		err := m.GenerateAudioForWord(word, wordSet.Language)
		if err != nil {
			log.Printf("Failed to generate audio for word '%s': %v", word, err)
			// Continue with other words even if one fails
			continue
		}
	}

	log.Printf("Completed audio generation for word set '%s'", wordSet.Name)
	return nil
}

// GenerateAudioForWord generates and stores audio for a single word
func (m *Manager) GenerateAudioForWord(word, language string) error {
	// Check if audio already exists
	existingAudio, err := m.Firestore.GetAudioFile(word, language, tts.DefaultVoices[language].VoiceName)
	if err == nil && existingAudio != nil {
		// Audio already exists, check if file exists in storage
		exists, err := m.Storage.AudioExists(existingAudio.StoragePath)
		if err == nil && exists {
			log.Printf("Audio already exists for word '%s' in language '%s'", word, language)
			return nil
		}
	}

	// Generate new audio
	audioData, audioFile, err := m.TTS.GenerateAudio(word, language)
	if err != nil {
		return fmt.Errorf("failed to generate TTS audio: %v", err)
	}

	// Upload to storage
	url, err := m.Storage.UploadAudio(audioData, audioFile.StoragePath)
	if err != nil {
		return fmt.Errorf("failed to upload audio: %v", err)
	}

	// Update audio file metadata with URL
	audioFile.URL = url
	audioFile.CreatedAt = time.Now()

	// Save audio file metadata to Firestore
	err = m.Firestore.SaveAudioFile(audioFile)
	if err != nil {
		// Log error but don't fail - the audio file was uploaded successfully
		log.Printf("Warning: failed to save audio file metadata: %v", err)
	}

	log.Printf("Generated and stored audio for word '%s' in language '%s'", word, language)
	return nil
}

// GetAudioURL gets the URL for a word's audio file
func (m *Manager) GetAudioURL(word, language string) (string, error) {
	voiceName := tts.DefaultVoices[language].VoiceName
	if voiceName == "" {
		voiceName = tts.DefaultVoices["en"].VoiceName // fallback
	}

	audioFile, err := m.Firestore.GetAudioFile(word, language, voiceName)
	if err != nil {
		return "", fmt.Errorf("audio file not found: %v", err)
	}

	// Verify the file exists in storage
	exists, err := m.Storage.AudioExists(audioFile.StoragePath)
	if err != nil {
		return "", fmt.Errorf("failed to check audio file existence: %v", err)
	}

	if !exists {
		return "", fmt.Errorf("audio file not found in storage")
	}

	return audioFile.URL, nil
}
