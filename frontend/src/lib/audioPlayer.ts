/**
 * Audio player utilities for the Diktator app
 * Provides unified audio playback with fallback from generated audio to speech synthesis
 */

import { WordSet, WordItem } from "@/types";

export interface AudioPlayerOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  autoDelay?: number;
  speechRate?: number;
}

/**
 * Plays audio for a word, prioritizing generated audio with fallback to speech synthesis
 * @param word - The word to play audio for
 * @param wordSet - The word set containing the word and potential audio data
 * @param options - Optional callbacks and configuration
 * @returns Promise that resolves when audio starts playing
 */
export const playWordAudio = async (
  word: string,
  wordSet: WordSet,
  options: AudioPlayerOptions = {},
): Promise<void> => {
  const { onStart, onEnd, onError, autoDelay = 0, speechRate = 0.8 } = options;

  const playFn = async () => {
    try {
      onStart?.();

      // First, try to use generated audio if available
      const wordItem = wordSet.words.find((w: WordItem) => w.word === word);
      const audioInfo = wordItem?.audio;

      if (audioInfo && audioInfo.audioId) {
        // Use the generated audio from the API
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const audioUrl = `${apiBaseUrl}/api/wordsets/${wordSet.id}/audio/${audioInfo.audioId}`;
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          onEnd?.();
        };

        audio.onerror = () => {
          console.log(
            "Generated audio failed, falling back to speech synthesis",
          );
          // Fallback to speech synthesis
          fallbackToSpeechSynthesis();
        };

        await audio.play();
      } else {
        // Fallback to speech synthesis if no generated audio
        fallbackToSpeechSynthesis();
      }
    } catch (error) {
      console.log(
        "Audio playback failed, falling back to speech synthesis:",
        error,
      );
      fallbackToSpeechSynthesis();
    }
  };

  const fallbackToSpeechSynthesis = () => {
    if (!("speechSynthesis" in window)) {
      const error = new Error("Speech synthesis not supported");
      onError?.(error);
      onEnd?.();
      return;
    }

    try {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = wordSet.language === "no" ? "nb-NO" : "en-US";
      utterance.rate = speechRate;

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = (event) => {
        const error = new Error(`Speech synthesis error: ${event.error}`);
        onError?.(error);
        onEnd?.();
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      const speechError =
        error instanceof Error
          ? error
          : new Error("Unknown speech synthesis error");
      onError?.(speechError);
      onEnd?.();
    }
  };

  if (autoDelay > 0) {
    setTimeout(playFn, autoDelay);
  } else {
    await playFn();
  }
};

/**
 * Stops any currently playing audio (both generated audio and speech synthesis)
 */
export const stopAudio = (): void => {
  // Stop speech synthesis
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  // Note: We can't easily stop HTML5 Audio elements globally,
  // but the calling code should manage their own audio element references
};

/**
 * Checks if a word has generated audio available
 * @param word - The word to check
 * @param wordSet - The word set containing the word
 * @returns true if generated audio is available, false otherwise
 */
export const hasGeneratedAudio = (word: string, wordSet: WordSet): boolean => {
  const wordItem = wordSet.words.find((w: WordItem) => w.word === word);
  return !!(wordItem?.audio?.audioId && wordItem?.audio?.audioUrl);
};

/**
 * Gets the audio URL for a word if generated audio is available
 * @param word - The word to get audio URL for
 * @param wordSet - The word set containing the word
 * @returns The audio URL or null if not available
 */
export const getWordAudioUrl = (
  word: string,
  wordSet: WordSet,
): string | null => {
  const wordItem = wordSet.words.find((w: WordItem) => w.word === word);
  const audioInfo = wordItem?.audio;

  if (audioInfo && audioInfo.audioId) {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${apiBaseUrl}/api/wordsets/${wordSet.id}/audio/${audioInfo.audioId}`;
  }

  return null;
};

/**
 * Gets statistics about audio availability in a wordset
 * @param wordSet - The word set to analyze
 * @returns Object with audio statistics
 */
export const getWordSetAudioStats = (wordSet: WordSet) => {
  const totalWords = wordSet.words.length;
  const wordsWithAudio = wordSet.words.filter((w) => w.audio?.audioUrl).length;
  const hasAnyAudio = wordsWithAudio > 0;
  const hasAllAudio = wordsWithAudio === totalWords;

  return {
    totalWords,
    wordsWithAudio,
    hasAnyAudio,
    hasAllAudio,
    audioPercentage:
      totalWords > 0 ? Math.round((wordsWithAudio / totalWords) * 100) : 0,
  };
};

/**
 * Creates a reusable audio player hook-like function for managing audio state
 * @returns Object with audio control functions and state management helpers
 */
export const createAudioController = () => {
  let currentAudio: HTMLAudioElement | null = null;
  let isPlaying = false;

  const stop = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    stopAudio(); // Also stop speech synthesis
    isPlaying = false;
  };

  const play = async (
    word: string,
    wordSet: WordSet,
    options: AudioPlayerOptions = {},
  ): Promise<void> => {
    // Stop any currently playing audio
    stop();

    isPlaying = true;

    const enhancedOptions = {
      ...options,
      onEnd: () => {
        isPlaying = false;
        currentAudio = null;
        options.onEnd?.();
      },
      onError: (error: Error) => {
        isPlaying = false;
        currentAudio = null;
        options.onError?.(error);
      },
    };

    await playWordAudio(word, wordSet, enhancedOptions);
  };

  return {
    play,
    stop,
    isPlaying: () => isPlaying,
  };
};
