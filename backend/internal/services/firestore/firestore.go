package firestore

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	"github.com/starefossen/diktator/backend/internal/models"
	"google.golang.org/api/option"
)

type Service struct {
	client *firestore.Client
	ctx    context.Context
}

// NewService creates a new Firestore service
func NewService() (*Service, error) {
	ctx := context.Background()

	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
	if projectID == "" {
		projectID = "diktator-dev" // fallback for development
	}

	// Check if we're using the emulator
	if emulatorHost := os.Getenv("FIRESTORE_EMULATOR_HOST"); emulatorHost != "" {
		log.Printf("Using Firestore emulator at %s", emulatorHost)
		client, err := firestore.NewClient(ctx, projectID)
		if err != nil {
			return nil, err
		}
		return &Service{client: client, ctx: ctx}, nil
	}

	// Production: use service account or application default credentials
	var client *firestore.Client
	var err error

	if credsPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"); credsPath != "" {
		client, err = firestore.NewClient(ctx, projectID, option.WithCredentialsFile(credsPath))
	} else {
		// Use application default credentials (for Cloud Run)
		client, err = firestore.NewClient(ctx, projectID)
	}

	if err != nil {
		return nil, err
	}

	return &Service{client: client, ctx: ctx}, nil
}

// Close closes the Firestore client
func (s *Service) Close() error {
	return s.client.Close()
}

// CreateWordSet creates a new word set
func (s *Service) CreateWordSet(wordSet *models.WordSet) error {
	_, err := s.client.Collection("wordsets").Doc(wordSet.ID).Set(s.ctx, wordSet)
	return err
}

// GetWordSets retrieves word sets for a family
func (s *Service) GetWordSets(familyID string) ([]models.WordSet, error) {
	var wordSets []models.WordSet

	iter := s.client.Collection("wordsets").
		Where("familyId", "==", familyID).
		OrderBy("createdAt", firestore.Desc).
		Documents(s.ctx)

	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var wordSet models.WordSet
		if err := doc.DataTo(&wordSet); err != nil {
			continue
		}
		wordSet.ID = doc.Ref.ID
		wordSets = append(wordSets, wordSet)
	}

	return wordSets, nil
}

// GetWordSet retrieves a single word set by ID
func (s *Service) GetWordSet(id string) (*models.WordSet, error) {
	doc, err := s.client.Collection("wordsets").Doc(id).Get(s.ctx)
	if err != nil {
		return nil, err
	}

	var wordSet models.WordSet
	if err := doc.DataTo(&wordSet); err != nil {
		return nil, err
	}
	wordSet.ID = doc.Ref.ID

	return &wordSet, nil
}

// DeleteWordSet deletes a word set
func (s *Service) DeleteWordSet(id string) error {
	_, err := s.client.Collection("wordsets").Doc(id).Delete(s.ctx)
	return err
}

// SaveTestResult saves a test result
func (s *Service) SaveTestResult(result *models.TestResult) error {
	_, err := s.client.Collection("results").Doc(result.ID).Set(s.ctx, result)
	return err
}

// GetTestResults retrieves test results for a user
func (s *Service) GetTestResults(userID string) ([]models.TestResult, error) {
	var results []models.TestResult

	iter := s.client.Collection("results").
		Where("userId", "==", userID).
		OrderBy("completedAt", firestore.Desc).
		Limit(50). // Limit to last 50 results
		Documents(s.ctx)

	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var result models.TestResult
		if err := doc.DataTo(&result); err != nil {
			continue
		}
		result.ID = doc.Ref.ID
		results = append(results, result)
	}

	return results, nil
}

// SaveAudioFile saves audio file metadata
func (s *Service) SaveAudioFile(audioFile *models.AudioFile) error {
	_, err := s.client.Collection("audiofiles").Doc(audioFile.ID).Set(s.ctx, audioFile)
	return err
}

// GetAudioFile retrieves audio file metadata
func (s *Service) GetAudioFile(word, language, voiceID string) (*models.AudioFile, error) {
	iter := s.client.Collection("audiofiles").
		Where("word", "==", word).
		Where("language", "==", language).
		Where("voiceId", "==", voiceID).
		Limit(1).
		Documents(s.ctx)

	defer iter.Stop()

	doc, err := iter.Next()
	if err != nil {
		return nil, err
	}

	var audioFile models.AudioFile
	if err := doc.DataTo(&audioFile); err != nil {
		return nil, err
	}
	audioFile.ID = doc.Ref.ID

	return &audioFile, nil
}
