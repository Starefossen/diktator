package tts

import (
	"context"
	"crypto/md5"
	"fmt"
	"log"
	"strings"

	texttospeech "cloud.google.com/go/texttospeech/apiv1"
	"cloud.google.com/go/texttospeech/apiv1/texttospeechpb"
	"github.com/starefossen/diktator/backend/internal/models"
)

type Service struct {
	client *texttospeech.Client
	ctx    context.Context
}

// VoiceConfig defines the voice configuration for different languages
type VoiceConfig struct {
	LanguageCode string
	VoiceName    string
	Gender       texttospeechpb.SsmlVoiceGender
}

// DefaultVoices contains default voice configurations
var DefaultVoices = map[string]VoiceConfig{
	"en": {
		LanguageCode: "en-US",
		VoiceName:    "en-US-Neural2-A", // Child-friendly female voice
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
	},
	"no": {
		LanguageCode: "nb-NO",
		VoiceName:    "nb-NO-Wavenet-A", // Norwegian female voice
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
	},
}

// NewService creates a new Text-to-Speech service
func NewService() (*Service, error) {
	ctx := context.Background()

	client, err := texttospeech.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create TTS client: %v", err)
	}

	return &Service{
		client: client,
		ctx:    ctx,
	}, nil
}

// Close closes the TTS client
func (s *Service) Close() error {
	return s.client.Close()
}

// GenerateAudio generates audio for a word using Text-to-Speech
func (s *Service) GenerateAudio(word, language string) ([]byte, *models.AudioFile, error) {
	// Get voice configuration for language
	voiceConfig, exists := DefaultVoices[language]
	if !exists {
		voiceConfig = DefaultVoices["en"] // fallback to English
	}

	// Create the synthesis input
	input := &texttospeechpb.SynthesisInput{
		InputSource: &texttospeechpb.SynthesisInput_Text{
			Text: word,
		},
	}

	// Build the voice request
	voice := &texttospeechpb.VoiceSelectionParams{
		LanguageCode: voiceConfig.LanguageCode,
		Name:         voiceConfig.VoiceName,
		SsmlGender:   voiceConfig.Gender,
	}

	// Select the type of audio file
	audioConfig := &texttospeechpb.AudioConfig{
		AudioEncoding: texttospeechpb.AudioEncoding_MP3,
		SpeakingRate:  0.9, // Slightly slower for children
		Pitch:         0.0, // Normal pitch
	}

	// Perform the text-to-speech request
	req := &texttospeechpb.SynthesizeSpeechRequest{
		Input:       input,
		Voice:       voice,
		AudioConfig: audioConfig,
	}

	resp, err := s.client.SynthesizeSpeech(s.ctx, req)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to synthesize speech: %v", err)
	}

	// Generate a unique filename
	filename := s.generateFilename(word, language, voiceConfig.VoiceName)

	// Create audio file metadata
	audioFile := &models.AudioFile{
		ID:          filename,
		Word:        word,
		Language:    language,
		VoiceID:     voiceConfig.VoiceName,
		StoragePath: fmt.Sprintf("audio/%s", filename),
		URL:         "", // Will be set after upload to storage
	}

	log.Printf("Generated audio for word '%s' in language '%s'", word, language)
	return resp.AudioContent, audioFile, nil
}

// GenerateAudioWithSSML generates audio using SSML for custom pronunciation
func (s *Service) GenerateAudioWithSSML(ssml, language string) ([]byte, error) {
	voiceConfig, exists := DefaultVoices[language]
	if !exists {
		voiceConfig = DefaultVoices["en"]
	}

	input := &texttospeechpb.SynthesisInput{
		InputSource: &texttospeechpb.SynthesisInput_Ssml{
			Ssml: ssml,
		},
	}

	voice := &texttospeechpb.VoiceSelectionParams{
		LanguageCode: voiceConfig.LanguageCode,
		Name:         voiceConfig.VoiceName,
		SsmlGender:   voiceConfig.Gender,
	}

	audioConfig := &texttospeechpb.AudioConfig{
		AudioEncoding: texttospeechpb.AudioEncoding_MP3,
		SpeakingRate:  0.9,
		Pitch:         0.0,
	}

	req := &texttospeechpb.SynthesizeSpeechRequest{
		Input:       input,
		Voice:       voice,
		AudioConfig: audioConfig,
	}

	resp, err := s.client.SynthesizeSpeech(s.ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to synthesize SSML speech: %v", err)
	}

	return resp.AudioContent, nil
}

// generateFilename creates a unique filename for the audio file
func (s *Service) generateFilename(word, language, voiceID string) string {
	// Create a hash to ensure uniqueness and avoid conflicts
	hash := md5.Sum([]byte(fmt.Sprintf("%s-%s-%s", word, language, voiceID)))
	hashStr := fmt.Sprintf("%x", hash)

	// Clean the word for filename (remove special characters)
	cleanWord := strings.ToLower(strings.ReplaceAll(word, " ", "_"))
	cleanWord = strings.ReplaceAll(cleanWord, ".", "")
	cleanWord = strings.ReplaceAll(cleanWord, ",", "")

	return fmt.Sprintf("%s_%s_%s.mp3", cleanWord, language, hashStr[:8])
}

// ListAvailableVoices lists available voices for a language
func (s *Service) ListAvailableVoices(languageCode string) ([]*texttospeechpb.Voice, error) {
	req := &texttospeechpb.ListVoicesRequest{
		LanguageCode: languageCode,
	}

	resp, err := s.client.ListVoices(s.ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to list voices: %v", err)
	}

	return resp.Voices, nil
}
