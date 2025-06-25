package tts

import (
	"context"
	"crypto/md5"
	"fmt"
	"log"
	"os"
	"strings"

	texttospeech "cloud.google.com/go/texttospeech/apiv1"
	"cloud.google.com/go/texttospeech/apiv1/texttospeechpb"
	"github.com/starefossen/diktator/backend/internal/models"
	"google.golang.org/api/option"
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
	SpeakingRate float64
	Pitch        float64
}

// Enhanced voice configurations with child-friendly options
var DefaultVoices = map[string]VoiceConfig{
	"en": {
		LanguageCode: "en-GB",
		VoiceName:    "en-GB-Neural2-A", // Child-friendly female voice
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85, // Slower for children
		Pitch:        2.0,  // Slightly higher pitch for children
	},
	"en-US": {
		LanguageCode: "en-US",
		VoiceName:    "en-US-Neural2-F",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85,
		Pitch:        2.0,
	},
	"en-GB": {
		LanguageCode: "en-GB",
		VoiceName:    "en-GB-Neural2-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85,
		Pitch:        2.0,
	},
	"no": {
		LanguageCode: "nb-NO",
		VoiceName:    "nb-NO-Wavenet-A", // Norwegian female voice
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.8, // Slower for Norwegian children
		Pitch:        1.5,
	},
	"nb": {
		LanguageCode: "nb-NO",
		VoiceName:    "nb-NO-Wavenet-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.8,
		Pitch:        1.5,
	},
	"nb-NO": {
		LanguageCode: "nb-NO",
		VoiceName:    "nb-NO-Wavenet-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.8,
		Pitch:        1.5,
	},
	"da": {
		LanguageCode: "da-DK",
		VoiceName:    "da-DK-Wavenet-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85,
		Pitch:        1.8,
	},
	"sv": {
		LanguageCode: "sv-SE",
		VoiceName:    "sv-SE-Wavenet-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85,
		Pitch:        1.8,
	},
	"de": {
		LanguageCode: "de-DE",
		VoiceName:    "de-DE-Neural2-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85,
		Pitch:        2.0,
	},
	"fr": {
		LanguageCode: "fr-FR",
		VoiceName:    "fr-FR-Neural2-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85,
		Pitch:        2.0,
	},
	"es": {
		LanguageCode: "es-ES",
		VoiceName:    "es-ES-Neural2-A",
		Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
		SpeakingRate: 0.85,
		Pitch:        2.0,
	},
}

// NewService creates a new Text-to-Speech service
func NewService() (*Service, error) {
	ctx := context.Background()

	// Get quota project from environment
	var clientOptions []option.ClientOption
	if quotaProject := os.Getenv("GOOGLE_CLOUD_QUOTA_PROJECT"); quotaProject != "" {
		clientOptions = append(clientOptions, option.WithQuotaProject(quotaProject))
		log.Printf("Using Google Cloud quota project: %s", quotaProject)
	}

	client, err := texttospeech.NewClient(ctx, clientOptions...)
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

// GenerateAudio generates audio for a word using Text-to-Speech with optimal voice selection
func (s *Service) GenerateAudio(word, language string) ([]byte, *models.AudioFile, error) {
	// Normalize language code and get voice configuration
	voiceConfig := s.getOptimalVoiceConfig(language)

	log.Printf("Generating audio for word '%s' in language '%s' using voice '%s'",
		word, language, voiceConfig.VoiceName)

	// Create the synthesis input with word normalization
	normalizedWord := s.normalizeTextForTTS(word)
	input := &texttospeechpb.SynthesisInput{
		InputSource: &texttospeechpb.SynthesisInput_Text{
			Text: normalizedWord,
		},
	}

	// Build the voice request with optimal settings
	voice := &texttospeechpb.VoiceSelectionParams{
		LanguageCode: voiceConfig.LanguageCode,
		Name:         voiceConfig.VoiceName,
		SsmlGender:   voiceConfig.Gender,
	}

	// Configure audio for child-friendly output
	audioConfig := &texttospeechpb.AudioConfig{
		AudioEncoding:   texttospeechpb.AudioEncoding_MP3,
		SpeakingRate:    voiceConfig.SpeakingRate,
		Pitch:           voiceConfig.Pitch,
		VolumeGainDb:    2.0,   // Slightly louder for clarity
		SampleRateHertz: 22050, // Good quality for speech
	}

	// Perform the text-to-speech request
	req := &texttospeechpb.SynthesizeSpeechRequest{
		Input:       input,
		Voice:       voice,
		AudioConfig: audioConfig,
	}

	resp, err := s.client.SynthesizeSpeech(s.ctx, req)
	if err != nil {
		// Try fallback voice if the primary voice fails
		fallbackConfig := s.getFallbackVoiceConfig(language)
		if fallbackConfig.VoiceName != voiceConfig.VoiceName {
			log.Printf("Primary voice failed, trying fallback voice: %s", fallbackConfig.VoiceName)
			voice.Name = fallbackConfig.VoiceName
			voice.LanguageCode = fallbackConfig.LanguageCode
			req.Voice = voice

			resp, err = s.client.SynthesizeSpeech(s.ctx, req)
			if err != nil {
				return nil, nil, fmt.Errorf("failed to synthesize speech with both primary and fallback voices: %v", err)
			}
			voiceConfig = fallbackConfig // Update for metadata
		} else {
			return nil, nil, fmt.Errorf("failed to synthesize speech: %v", err)
		}
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
	voiceConfig := s.getOptimalVoiceConfig(language)

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
		AudioEncoding:   texttospeechpb.AudioEncoding_MP3,
		SpeakingRate:    voiceConfig.SpeakingRate,
		Pitch:           voiceConfig.Pitch,
		VolumeGainDb:    2.0,
		SampleRateHertz: 22050,
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

// GetChildFriendlyVoices returns available child-friendly voices for a language
func (s *Service) GetChildFriendlyVoices(languageCode string) ([]*texttospeechpb.Voice, error) {
	voices, err := s.ListAvailableVoices(languageCode)
	if err != nil {
		return nil, err
	}

	var childFriendlyVoices []*texttospeechpb.Voice

	// Filter for voices that are good for children
	for _, voice := range voices {
		// Prefer Neural2 voices (highest quality)
		if strings.Contains(voice.Name, "Neural2") {
			childFriendlyVoices = append(childFriendlyVoices, voice)
			continue
		}

		// Then Wavenet voices (good quality)
		if strings.Contains(voice.Name, "Wavenet") {
			childFriendlyVoices = append(childFriendlyVoices, voice)
			continue
		}

		// Then Studio voices
		if strings.Contains(voice.Name, "Studio") {
			childFriendlyVoices = append(childFriendlyVoices, voice)
			continue
		}
	}

	// If no premium voices found, return all available voices
	if len(childFriendlyVoices) == 0 {
		return voices, nil
	}

	return childFriendlyVoices, nil
}

// ValidateVoice checks if a specific voice is available for a language
func (s *Service) ValidateVoice(languageCode, voiceName string) (bool, error) {
	voices, err := s.ListAvailableVoices(languageCode)
	if err != nil {
		return false, err
	}

	for _, voice := range voices {
		if voice.Name == voiceName {
			return true, nil
		}
	}

	return false, nil
}

// GetOptimalVoiceForWord selects the best voice for a specific word and language
func (s *Service) GetOptimalVoiceForWord(word, language string) VoiceConfig {
	baseConfig := s.getOptimalVoiceConfig(language)

	// For short words or single letters, use slightly slower speech
	if len(word) <= 2 {
		baseConfig.SpeakingRate *= 0.9
		baseConfig.Pitch += 0.5
	}

	// For longer words, use normal or slightly faster speech
	if len(word) > 8 {
		baseConfig.SpeakingRate *= 1.1
		if baseConfig.SpeakingRate > 1.0 {
			baseConfig.SpeakingRate = 1.0
		}
	}

	return baseConfig
}

// getOptimalVoiceConfig returns the best voice configuration for a language
func (s *Service) getOptimalVoiceConfig(language string) VoiceConfig {
	// Try exact match first
	if config, exists := DefaultVoices[language]; exists {
		return config
	}

	// Try language code without region (e.g., "en" from "en-US")
	if len(language) > 2 {
		baseLanguage := language[:2]
		if config, exists := DefaultVoices[baseLanguage]; exists {
			return config
		}
	}

	// Try with common region variants
	commonVariants := map[string][]string{
		"en": {"en-US", "en-GB"},
		"no": {"nb-NO", "nb"},
		"nb": {"nb-NO", "no"},
		"da": {"da-DK"},
		"sv": {"sv-SE"},
		"de": {"de-DE"},
		"fr": {"fr-FR"},
		"es": {"es-ES"},
	}

	if variants, exists := commonVariants[language]; exists {
		for _, variant := range variants {
			if config, exists := DefaultVoices[variant]; exists {
				return config
			}
		}
	}

	// Fallback to English
	return DefaultVoices["en"]
}

// getFallbackVoiceConfig returns a fallback voice configuration
func (s *Service) getFallbackVoiceConfig(language string) VoiceConfig {
	// For Norwegian, try different Norwegian variants
	if strings.HasPrefix(language, "nb") || strings.HasPrefix(language, "no") {
		fallbacks := []string{"nb-NO", "nb", "no"}
		for _, fallback := range fallbacks {
			if config, exists := DefaultVoices[fallback]; exists {
				return config
			}
		}
	}

	// For English, try different English variants
	if strings.HasPrefix(language, "en") {
		fallbacks := []string{"en-US", "en-GB", "en"}
		for _, fallback := range fallbacks {
			if config, exists := DefaultVoices[fallback]; exists {
				return config
			}
		}
	}

	// Try using Wavenet voices as fallback (more widely available)
	wavenetFallbacks := map[string]VoiceConfig{
		"nb": {
			LanguageCode: "nb-NO",
			VoiceName:    "nb-NO-Wavenet-A",
			Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
			SpeakingRate: 0.8,
			Pitch:        1.5,
		},
		"en": {
			LanguageCode: "en-US",
			VoiceName:    "en-US-Wavenet-F",
			Gender:       texttospeechpb.SsmlVoiceGender_FEMALE,
			SpeakingRate: 0.85,
			Pitch:        2.0,
		},
	}

	baseLanguage := language
	if len(language) > 2 {
		baseLanguage = language[:2]
	}

	if config, exists := wavenetFallbacks[baseLanguage]; exists {
		return config
	}

	// Ultimate fallback to English Wavenet
	return wavenetFallbacks["en"]
}

// normalizeTextForTTS normalizes text for better TTS pronunciation
func (s *Service) normalizeTextForTTS(text string) string {
	// Clean up the text for better pronunciation
	normalized := strings.TrimSpace(text)

	// Remove extra spaces
	normalized = strings.ReplaceAll(normalized, "  ", " ")

	// Handle common abbreviations and special cases
	replacements := map[string]string{
		"&": "and",
		"@": "at",
		"%": "percent",
		"#": "number",
		"$": "dollar",
		"€": "euro",
		"£": "pound",
		"+": "plus",
		"=": "equals",
		"<": "less than",
		">": "greater than",
		"_": " ",
		"-": " ",
	}

	for old, new := range replacements {
		normalized = strings.ReplaceAll(normalized, old, new)
	}

	// Handle numbers - convert to words for better pronunciation
	// This is a basic implementation; for production, consider using a number-to-words library
	numberReplacements := map[string]string{
		"0": "zero",
		"1": "one",
		"2": "two",
		"3": "three",
		"4": "four",
		"5": "five",
		"6": "six",
		"7": "seven",
		"8": "eight",
		"9": "nine",
	}

	// Only replace single digits to avoid issues with larger numbers
	words := strings.Fields(normalized)
	for i, word := range words {
		if len(word) == 1 {
			if replacement, exists := numberReplacements[word]; exists {
				words[i] = replacement
			}
		}
	}

	return strings.Join(words, " ")
}
