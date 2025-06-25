package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/starefossen/diktator/backend/internal/models"
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

	// Mark audio processing as pending
	wordSet.AudioProcessing = "pending"
	err = m.Firestore.UpdateWordSet(wordSet)
	if err != nil {
		log.Printf("Failed to update word set status to pending: %v", err)
	}

	// Keep track of processing status
	hasErrors := false

	// Generate audio for each word in the word set
	for i, wordItem := range wordSet.Words {
		audioFile, err := m.GenerateAudioForWord(wordItem.Word, wordSet.Language)
		if err != nil {
			log.Printf("Failed to generate audio for word '%s': %v", wordItem.Word, err)
			hasErrors = true
			// Continue with other words even if one fails
			continue
		}

		// Update the word item with audio file information (both new and existing)
		if audioFile != nil {
			wordSet.Words[i].Audio = models.WordAudio{
				Word:      wordItem.Word,
				AudioURL:  audioFile.URL,
				AudioID:   audioFile.ID,
				VoiceID:   audioFile.VoiceID,
				CreatedAt: audioFile.CreatedAt,
			}
			log.Printf("Updated audio reference for word '%s'", wordItem.Word)
		}
	}

	// Update the word set with final status
	now := time.Now()
	wordSet.AudioProcessedAt = &now

	if hasErrors {
		wordSet.AudioProcessing = "failed"
	} else {
		wordSet.AudioProcessing = "completed"
	}

	// Update the word set with audio references and status
	err = m.Firestore.UpdateWordSet(wordSet)
	if err != nil {
		log.Printf("Failed to update word set with audio references: %v", err)
		return fmt.Errorf("failed to update word set: %v", err)
	}

	if hasErrors {
		log.Printf("Completed audio generation for word set '%s' with some errors", wordSet.Name)
	} else {
		log.Printf("Successfully completed audio generation for word set '%s'", wordSet.Name)
	}

	return nil
}

// GenerateAudioForWord generates and stores audio for a single word
// Returns the audio file if generated, nil if already exists, or error
func (m *Manager) GenerateAudioForWord(word, language string) (*models.AudioFile, error) {
	// Get optimal voice configuration for this word and language
	voiceConfig := m.TTS.GetOptimalVoiceForWord(word, language)

	// Check if audio already exists
	existingAudio, err := m.Firestore.GetAudioFile(word, language, voiceConfig.VoiceName)
	if err == nil && existingAudio != nil {
		// Audio already exists, check if file exists in storage
		exists, err := m.Storage.AudioExists(existingAudio.StoragePath)
		if err == nil && exists {
			log.Printf("Audio already exists for word '%s' in language '%s'", word, language)
			return existingAudio, nil // Return existing audio file
		}
	}

	// Generate new audio
	audioData, audioFile, err := m.TTS.GenerateAudio(word, language)
	if err != nil {
		return nil, fmt.Errorf("failed to generate TTS audio: %v", err)
	}

	// Upload to storage
	url, err := m.Storage.UploadAudio(audioData, audioFile.StoragePath)
	if err != nil {
		return nil, fmt.Errorf("failed to upload audio: %v", err)
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
	return audioFile, nil
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

// GetAudioFile retrieves audio file data from storage
func (m *Manager) GetAudioFile(word, language string) ([]byte, string, error) {
	// Get optimal voice configuration for this word and language
	voiceConfig := m.TTS.GetOptimalVoiceForWord(word, language)

	// Get the audio file metadata from Firestore
	audioFile, err := m.Firestore.GetAudioFile(word, language, voiceConfig.VoiceName)
	if err != nil {
		return nil, "", fmt.Errorf("audio file metadata not found: %v", err)
	}

	// Download the audio file from storage
	audioData, err := m.Storage.GetAudioData(audioFile.StoragePath)
	if err != nil {
		return nil, "", fmt.Errorf("failed to download audio file: %v", err)
	}

	// Determine content type based on file extension
	contentType := "audio/mpeg" // Default to MP3
	if strings.HasSuffix(audioFile.StoragePath, ".wav") {
		contentType = "audio/wav"
	} else if strings.HasSuffix(audioFile.StoragePath, ".ogg") {
		contentType = "audio/ogg"
	}

	return audioData, contentType, nil
}

// DeleteWordSetWithAudio deletes a wordset and all its associated audio files
func (m *Manager) DeleteWordSetWithAudio(wordSetID string) error {
	// First, get the wordset to retrieve all audio file IDs
	wordSet, err := m.Firestore.GetWordSet(wordSetID)
	if err != nil {
		return fmt.Errorf("failed to retrieve wordset: %v", err)
	}

	// Collect all audio file IDs that need to be deleted
	var audioFilesToDelete []string
	for _, word := range wordSet.Words {
		if word.Audio.AudioID != "" {
			// The AudioID is the filename in storage
			audioFilesToDelete = append(audioFilesToDelete, fmt.Sprintf("audio/%s", word.Audio.AudioID))
		}
	}

	// Delete all audio files from storage
	for _, audioPath := range audioFilesToDelete {
		err := m.Storage.DeleteAudio(audioPath)
		if err != nil {
			// Log the error but continue with deletion
			// We don't want to fail the entire operation if one audio file fails to delete
			log.Printf("Warning: Failed to delete audio file %s: %v", audioPath, err)
		}
	}

	// Finally, delete the wordset document from Firestore
	err = m.Firestore.DeleteWordSet(wordSetID)
	if err != nil {
		return fmt.Errorf("failed to delete wordset from database: %v", err)
	}

	log.Printf("Successfully deleted wordset %s and %d associated audio files", wordSetID, len(audioFilesToDelete))
	return nil
}
