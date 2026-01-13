package tts

import (
	"context"
	"crypto/md5" // #nosec G501 -- MD5 used for cache keys only, not cryptographic purposes
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	texttospeech "cloud.google.com/go/texttospeech/apiv1"
	"cloud.google.com/go/texttospeech/apiv1/texttospeechpb"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/cache"
	"google.golang.org/api/option"
)

// Service implements text-to-speech functionality using Google Cloud TTS API.
type Service struct {
	client *texttospeech.Client
	ctx    context.Context
	cache  *cache.LRUCache
}

// VoiceConfig defines the voice configuration for different languages
type VoiceConfig struct {
	LanguageCode string
	VoiceName    string
	Gender       texttospeechpb.SsmlVoiceGender
	SpeakingRate float64
	Pitch        float64
}

// DefaultVoices provides enhanced voice configurations with child-friendly options for Norwegian text-to-speech.
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

	// Allow TTS to be optional for environments without Google Cloud credentials
	if os.Getenv("DISABLE_TTS") == "true" {
		log.Println("⚠️  TTS service disabled (DISABLE_TTS=true)")
		return &Service{
			client: nil,
			ctx:    ctx,
			cache:  cache.NewLRUCache(1024 * 1024), // 1MB minimal cache
		}, nil
	}

	// Get quota project from environment
	var clientOptions []option.ClientOption
	if quotaProject := os.Getenv("TTS_QUOTA_PROJECT"); quotaProject != "" {
		clientOptions = append(clientOptions, option.WithQuotaProject(quotaProject))
		log.Printf("Using TTS quota project: %s", quotaProject)
	}

	client, err := texttospeech.NewClient(ctx, clientOptions...)
	if err != nil {
		// If credentials are missing, log warning and continue without TTS
		if strings.Contains(err.Error(), "credentials") || strings.Contains(err.Error(), "ADC") {
			log.Println("⚠️  TTS service disabled (no TTS credentials found)")
			return &Service{
				client: nil,
				ctx:    ctx,
				cache:  cache.NewLRUCache(1024 * 1024),
			}, nil
		}
		return nil, fmt.Errorf("failed to create TTS client: %v", err)
	}

	// Get cache size from environment (default 15MB)
	cacheSize := int64(15 * 1024 * 1024) // 15MB default
	if cacheSizeStr := os.Getenv("TTS_CACHE_SIZE_MB"); cacheSizeStr != "" {
		if size, err := strconv.ParseInt(cacheSizeStr, 10, 64); err == nil && size > 0 {
			cacheSize = size * 1024 * 1024
			log.Printf("TTS cache size set to %d MB", size)
		}
	} else {
		log.Printf("TTS cache size set to default 15 MB")
	}

	return &Service{
		client: client,
		ctx:    ctx,
		cache:  cache.NewLRUCache(cacheSize),
	}, nil
}

// Close closes the TTS client
func (s *Service) Close() error {
	if s.client != nil {
		return s.client.Close()
	}
	return nil
}

// GenerateAudio generates audio for a word using Text-to-Speech with optimal voice selection
func (s *Service) GenerateAudio(word, language string) ([]byte, *models.AudioFile, error) {
	return s.GenerateAudioWithFormat(word, language, false)
}

// GenerateAudioWithFormat generates TTS audio for a single word with format control.
// If useMP3 is true, generates MP3 format for iOS Safari compatibility. Otherwise uses OGG Opus.
func (s *Service) GenerateAudioWithFormat(word, language string, useMP3 bool) ([]byte, *models.AudioFile, error) {
	if s.client == nil {
		return nil, nil, fmt.Errorf("TTS service is disabled")
	}
	// Normalize language code and get voice configuration
	voiceConfig := s.getOptimalVoiceConfig(language)

	// Determine format-specific cache key and settings
	formatSuffix := "ogg"
	var audioEncoding texttospeechpb.AudioEncoding
	if useMP3 {
		formatSuffix = "mp3"
		audioEncoding = texttospeechpb.AudioEncoding_MP3
	} else {
		audioEncoding = texttospeechpb.AudioEncoding_OGG_OPUS
	}

	// Generate cache key including format
	cacheKey := fmt.Sprintf("%s:%s:%s:%s", word, language, voiceConfig.VoiceName, formatSuffix)

	// Check cache first
	if cachedAudio, found := s.cache.Get(cacheKey); found {
		log.Printf("Cache HIT for word '%s' in language '%s'", word, language)

		// Generate filename for cached audio
		filename := s.generateFilename(word, language, voiceConfig.VoiceName)
		audioFile := &models.AudioFile{
			ID:       filename,
			Word:     word,
			Language: language,
			VoiceID:  voiceConfig.VoiceName,
			URL:      "",
		}

		return cachedAudio, audioFile, nil
	}

	log.Printf("Cache MISS - Generating audio for word '%s' in language '%s' using voice '%s'",
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
	// iOS Safari requires MP3 (doesn't support OGG Opus codec)
	// Other browsers use OGG_OPUS for better quality at similar bitrate
	audioConfig := &texttospeechpb.AudioConfig{
		AudioEncoding:   audioEncoding,
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
		ID:       filename,
		Word:     word,
		Language: language,
		VoiceID:  voiceConfig.VoiceName,
		URL:      "", // Will be set after upload to storage
	}

	// Store in cache
	s.cache.Put(cacheKey, resp.AudioContent)

	// Log cache stats periodically
	items, bytes, maxBytes := s.cache.Stats()
	log.Printf("Generated audio for word '%s' in language '%s' | Cache: %d items, %.2f MB / %.2f MB",
		word, language, items, float64(bytes)/(1024*1024), float64(maxBytes)/(1024*1024))

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
		AudioEncoding:   texttospeechpb.AudioEncoding_OGG_OPUS,
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

// Sentence TTS configuration constants
const (
	// MaxSentenceWords is the maximum number of words allowed in a sentence for TTS
	MaxSentenceWords = 15
	// SentenceSpeakingRate is the speaking rate for sentences (slightly faster than single words)
	SentenceSpeakingRate = 0.9
	// SingleWordSpeakingRate is the speaking rate for single words
	SingleWordSpeakingRate = 0.8
)

// IsSentence determines if text contains multiple words (is a sentence)
func IsSentence(text string) bool {
	return GetWordCount(text) > 1
}

// GetWordCount returns the number of words in the text
func GetWordCount(text string) int {
	words := strings.Fields(strings.TrimSpace(text))
	return len(words)
}

// GenerateSentenceAudio generates audio for a sentence using SSML with appropriate prosody
// Uses a slightly faster speaking rate (0.9x) than single words (0.8x) for natural flow
func (s *Service) GenerateSentenceAudio(sentence, language string) ([]byte, *models.AudioFile, error) {
	return s.GenerateSentenceAudioWithFormat(sentence, language, false)
}

// GenerateSentenceAudioWithFormat generates TTS audio for a sentence with format control.
// If useMP3 is true, generates MP3 format for iOS Safari compatibility. Otherwise uses OGG Opus.
func (s *Service) GenerateSentenceAudioWithFormat(sentence, language string, useMP3 bool) ([]byte, *models.AudioFile, error) {
	if s.client == nil {
		return nil, nil, fmt.Errorf("TTS service is disabled")
	}

	// Validate sentence length
	wordCount := GetWordCount(sentence)
	if wordCount > MaxSentenceWords {
		return nil, nil, fmt.Errorf("sentence exceeds maximum word limit of %d (has %d words)", MaxSentenceWords, wordCount)
	}

	// Normalize language code and get voice configuration
	voiceConfig := s.getOptimalVoiceConfig(language)

	// Determine format-specific settings
	formatSuffix := "ogg"
	var audioEncoding texttospeechpb.AudioEncoding
	if useMP3 {
		formatSuffix = "mp3"
		audioEncoding = texttospeechpb.AudioEncoding_MP3
	} else {
		audioEncoding = texttospeechpb.AudioEncoding_OGG_OPUS
	}

	// Generate cache key with "sentence:" prefix and format to distinguish from single words
	hash := md5.Sum([]byte(sentence))
	cacheKey := fmt.Sprintf("sentence:%x:%s:%s:%s", hash, language, voiceConfig.VoiceName, formatSuffix)

	// Check cache first
	if cachedAudio, found := s.cache.Get(cacheKey); found {
		log.Printf("Cache HIT for sentence in language '%s' (%d words)", language, wordCount)

		filename := s.generateSentenceFilename(sentence, language, voiceConfig.VoiceName)
		audioFile := &models.AudioFile{
			ID:       filename,
			Word:     sentence,
			Language: language,
			VoiceID:  voiceConfig.VoiceName,
			URL:      "",
		}

		return cachedAudio, audioFile, nil
	}

	log.Printf("Cache MISS - Generating audio for sentence in language '%s' (%d words)", language, wordCount)

	// Normalize the sentence for TTS
	normalizedSentence := s.normalizeTextForTTS(sentence)

	// Build SSML with prosody for sentence-appropriate speaking rate
	ssml := fmt.Sprintf(`<speak><prosody rate="%.1f">%s</prosody></speak>`, SentenceSpeakingRate, normalizedSentence)

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

	// Use base speaking rate of 1.0 since prosody handles the rate adjustment
	audioConfig := &texttospeechpb.AudioConfig{
		AudioEncoding:   audioEncoding,
		SpeakingRate:    1.0, // Prosody rate is relative to this
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
		// Try fallback voice
		fallbackConfig := s.getFallbackVoiceConfig(language)
		if fallbackConfig.VoiceName != voiceConfig.VoiceName {
			log.Printf("Primary voice failed for sentence, trying fallback: %s", fallbackConfig.VoiceName)
			voice.Name = fallbackConfig.VoiceName
			voice.LanguageCode = fallbackConfig.LanguageCode
			req.Voice = voice

			resp, err = s.client.SynthesizeSpeech(s.ctx, req)
			if err != nil {
				return nil, nil, fmt.Errorf("failed to synthesize sentence with both primary and fallback voices: %v", err)
			}
			voiceConfig = fallbackConfig
		} else {
			return nil, nil, fmt.Errorf("failed to synthesize sentence: %v", err)
		}
	}

	filename := s.generateSentenceFilename(sentence, language, voiceConfig.VoiceName)
	audioFile := &models.AudioFile{
		ID:       filename,
		Word:     sentence,
		Language: language,
		VoiceID:  voiceConfig.VoiceName,
		URL:      "",
	}

	// Store in cache
	s.cache.Put(cacheKey, resp.AudioContent)

	items, bytes, maxBytes := s.cache.Stats()
	log.Printf("Generated audio for sentence (%d words) in language '%s' | Cache: %d items, %.2f MB / %.2f MB",
		wordCount, language, items, float64(bytes)/(1024*1024), float64(maxBytes)/(1024*1024))

	return resp.AudioContent, audioFile, nil
}

// GenerateTextAudio generates audio for any text, automatically detecting if it's a sentence
// and using the appropriate generation method
func (s *Service) GenerateTextAudio(text, language string) ([]byte, *models.AudioFile, error) {
	if IsSentence(text) {
		return s.GenerateSentenceAudio(text, language)
	}
	return s.GenerateAudio(text, language)
}

// GenerateTextAudioWithFormat generates audio for text (word or sentence) with format detection
// and returns the appropriate content type. iOS Safari requires MP3, other browsers use OGG Opus.
func (s *Service) GenerateTextAudioWithFormat(text, language string, useMP3 bool) ([]byte, *models.AudioFile, string, error) {
	var audioData []byte
	var audioFile *models.AudioFile
	var err error

	if IsSentence(text) {
		audioData, audioFile, err = s.GenerateSentenceAudioWithFormat(text, language, useMP3)
	} else {
		audioData, audioFile, err = s.GenerateAudioWithFormat(text, language, useMP3)
	}

	if err != nil {
		return nil, nil, "", err
	}

	contentType := "audio/ogg; codecs=opus"
	if useMP3 {
		contentType = "audio/mpeg"
	}

	return audioData, audioFile, contentType, nil
}

// generateSentenceFilename creates a unique filename for sentence audio
func (s *Service) generateSentenceFilename(sentence, language, voiceID string) string {
	hash := md5.Sum([]byte(fmt.Sprintf("%s-%s-%s", sentence, language, voiceID)))
	hashStr := fmt.Sprintf("%x", hash)

	// Use first few words for a readable prefix, truncated
	words := strings.Fields(sentence)
	prefix := strings.Join(words, "_")
	if len(prefix) > 30 {
		prefix = prefix[:30]
	}
	prefix = strings.ToLower(prefix)
	prefix = strings.ReplaceAll(prefix, ".", "")
	prefix = strings.ReplaceAll(prefix, ",", "")
	prefix = strings.ReplaceAll(prefix, "?", "")
	prefix = strings.ReplaceAll(prefix, "!", "")

	return fmt.Sprintf("sentence_%s_%s_%s.ogg", prefix, language, hashStr[:8])
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

	return fmt.Sprintf("%s_%s_%s.ogg", cleanWord, language, hashStr[:8])
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
