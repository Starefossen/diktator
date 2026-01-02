package tts

import (
	texttospeechpb "cloud.google.com/go/texttospeech/apiv1/texttospeechpb"
	"github.com/starefossen/diktator/backend/internal/models"
)

// TTSService defines the interface for text-to-speech services.
// This abstraction allows for different TTS implementations (Google Cloud, local mock, etc.)
type TTSService interface {
	// GenerateAudio generates audio for a word using text-to-speech
	// Returns the audio data, audio file metadata, and any error
	GenerateAudio(word, language string) ([]byte, *models.AudioFile, error)

	// GenerateAudioWithSSML generates audio using SSML markup for custom pronunciation
	GenerateAudioWithSSML(ssml, language string) ([]byte, error)

	// GetOptimalVoiceForWord returns the best voice configuration for a specific word and language
	GetOptimalVoiceForWord(word, language string) VoiceConfig

	// GetChildFriendlyVoices returns available child-friendly voices for a language
	GetChildFriendlyVoices(languageCode string) ([]*texttospeechpb.Voice, error)

	// Close releases any resources held by the TTS service
	Close() error
}

// Ensure Service implements TTSService interface
var _ TTSService = (*Service)(nil)
