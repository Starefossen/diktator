/**
 * Audio player utilities for the Diktator app
 * Provides unified audio playback with fallback from generated audio to speech synthesis
 */

import { WordSet, WordItem } from "@/types";

// Global audio pre-loader for iOS Safari compatibility
let iOSAudioContext: AudioContext | null = null;
let iOSAudioEnabled = false;

/**
 * Pre-initializes audio context for iOS Safari
 * Should be called from a user interaction (click/touch)
 */
export const initializeAudioForIOS = (): void => {
  if (typeof window === "undefined") return;

  try {
    // Initialize AudioContext for Web Audio API compatibility
    const AudioContextConstructor =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextConstructor && !iOSAudioContext) {
      iOSAudioContext = new AudioContextConstructor();
      // Resume context if suspended (required on iOS)
      if (iOSAudioContext.state === "suspended") {
        iOSAudioContext.resume();
      }
    }

    // Pre-load a silent audio element to enable HTML5 audio
    const silentAudio = new Audio();
    silentAudio.src =
      "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAAGZ1bmRyZWFkYXBfdGVjaG5vbG9neQBURU5EAAAAEQAAAGZ1bmRyZWFkYXBfc2VydmljZQAQAAAABABAAAAAAAA";
    silentAudio.preload = "auto";

    // Try to play and immediately pause to unlock audio
    const playPromise = silentAudio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          silentAudio.pause();
          silentAudio.currentTime = 0;
          iOSAudioEnabled = true;
        })
        .catch(() => {
          // Ignore errors - this is expected on some browsers
        });
    }
  } catch (error) {
    console.log("iOS audio initialization failed:", error);
  }
};

/**
 * Plays audio with iOS Safari compatibility handling
 */
const playAudioWithiOSSupport = async (
  audioUrl: string,
  requireUserInteraction: boolean,
  onEnd?: () => void,
): Promise<void> => {
  const audio = new Audio(audioUrl);
  audio.preload = "auto";

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("ended", onEndHandler);
      audio.removeEventListener("error", onErrorHandler);
      audio.removeEventListener("canplaythrough", onCanPlayHandler);
    };

    const onEndHandler = () => {
      cleanup();
      onEnd?.();
      resolve();
    };

    const onErrorHandler = () => {
      cleanup();
      reject(new Error("Audio loading failed"));
    };

    const onCanPlayHandler = async () => {
      try {
        // Check if we need user interaction and haven't enabled audio yet
        if (requireUserInteraction && !iOSAudioEnabled) {
          throw new Error("User interaction required for audio playback");
        }

        await audio.play();
        // If we reach here, playback started successfully
      } catch (playError) {
        cleanup();
        reject(playError);
      }
    };

    audio.addEventListener("ended", onEndHandler);
    audio.addEventListener("error", onErrorHandler);
    audio.addEventListener("canplaythrough", onCanPlayHandler);

    // Start loading the audio
    audio.load();
  });
};

export interface AudioPlayerOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  autoDelay?: number;
  speechRate?: number;
  requireUserInteraction?: boolean; // Add flag to handle iOS autoplay restrictions
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
  const {
    onStart,
    onEnd,
    onError,
    autoDelay = 0,
    speechRate = 0.8,
    requireUserInteraction = false,
  } = options;

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

        try {
          await playAudioWithiOSSupport(
            audioUrl,
            requireUserInteraction,
            onEnd,
          );
        } catch (audioError) {
          console.log(
            "Generated audio failed, falling back to speech synthesis:",
            audioError,
          );
          // Fallback to speech synthesis
          fallbackToSpeechSynthesis();
        }
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
 * Detects if the current browser/device requires user interaction for audio
 * @returns true if user interaction is required (Safari < version 17)
 */
export const requiresUserInteractionForAudio = (): boolean => {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;

  // Check if it's Safari (not Chrome-based browsers)
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

  if (!isSafari) {
    return false;
  }

  // Extract Safari version from user agent
  const versionMatch = userAgent.match(/Version\/(\d+)\.(\d+)/);
  if (!versionMatch) {
    // If we can't parse the version, assume it needs user interaction for safety
    return true;
  }

  const majorVersion = parseInt(versionMatch[1], 10);
  const requiresInteraction = majorVersion < 17;

  // Debug logging for troubleshooting (can be removed in production)
  if (process.env.NODE_ENV === "development") {
    console.log("Audio detection:", {
      userAgent,
      isSafari,
      safariVersion: versionMatch
        ? `${versionMatch[1]}.${versionMatch[2]}`
        : "unknown",
      majorVersion,
      requiresInteraction,
    });
  }

  return requiresInteraction;
};

/**
 * Test function to verify detection logic for specific user agent
 * @param testUA - User agent string to test
 * @returns detection result
 */
export const testUserAgentDetection = (testUA: string) => {
  const userAgent = testUA.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMacOS = /macintosh|mac os x/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
      userAgent,
    );

  const requiresInteraction = isIOS || (isSafari && (isMacOS || isMobile));

  return {
    originalUA: testUA,
    userAgentLower: userAgent,
    isIOS,
    isMacOS,
    isSafari,
    isMobile,
    requiresInteraction,
  };
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

  const initializeForUserInteraction = () => {
    initializeAudioForIOS();
  };

  return {
    play,
    stop,
    isPlaying: () => isPlaying,
    initializeForUserInteraction,
  };
};
