/**
 * Audio player utilities for the Diktator app
 * Provides unified audio playback with fallback from generated audio to speech synthesis
 */

import { WordSet, WordItem } from "@/types";
import { TIMING } from "@/lib/timingConfig";

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
    // Using OGG Opus format for better browser compatibility (especially Firefox)
    const silentAudio = new Audio();
    silentAudio.src =
      "data:audio/ogg;base64,T2dnUwACAAAAAAAAAAAAAAAAAAAAAABW4AEAAAAAAKp0I0UBHgF2b3JiaXMAAAAAAUSsAAAAAAAAgLsAAAAAAAC4AU9nZ1MAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAC7pF06Az3///////////////+BA3ZvcmJpcysAAABYaXBoLk9yZyBsaWJWb3JiaXMgSSAyMDEyMDIwMyAoT21uaXByZXNlbnQpAAAAAAEFdm9yYmlzEkJDVgEAQAAAJHMYKkalcxaEEBpCUBnjHELOa+wZQkwRghwyTFvLJXOQIaSgQohbKIHQkFUAAEAAAIdBeBSEikEIIYQlPViSgyc9CCGEiDl4FIRpQQghhBBCCCGEEEIIIYRFOWiSgydBCB2E4zA4DIPlOPgchEU5WBCDJ0HoIIQPQriag6w5CCGEJDVIUIMGOegchMIsKIqCxDC4FoQENSiMguQwyNSDC0KImoNJNfgchGtBCCGEJEFoEoQovIHIMBiKgsQwuBaAKDkIkYMgNUiQgwZByBiERkFYkoMGObgUhMtBqBqEKjkHJem4RycAvgcAHgcAADhBhAkCzgJAggIYCIACUGEOLMgxp7CSIDYAGAAACPwHAAAAAAAQAIBA4CYAgMCBIxUCYAGAAAAAIAAAgAIHjoQDAAR/AAYAAICjCAAAIAAAEEAAcMABATAABgoIOCBA4KYBAgAAAAAABHgA";
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
 * Plays audio with iOS Safari compatibility handling and Firefox Blob URL support
 */
const playAudioWithiOSSupport = async (
  audioUrl: string,
  requireUserInteraction: boolean,
  onEnd?: () => void,
): Promise<void> => {
  // Fetch the audio as a blob for better Firefox compatibility
  let blobUrl: string | null = null;

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }

    const blob = await response.blob();
    blobUrl = URL.createObjectURL(blob);

    const audio = new Audio();
    audio.preload = "auto";

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener("ended", onEndHandler);
        audio.removeEventListener("error", onErrorHandler);
        audio.removeEventListener("canplaythrough", onCanPlayHandler);
        audio.removeEventListener("loadeddata", onLoadedDataHandler);
        // Revoke blob URL to free memory
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      };

      const onEndHandler = () => {
        cleanup();
        onEnd?.();
        resolve();
      };

      const onErrorHandler = (_event: ErrorEvent | Event) => {
        cleanup();
        reject(new Error("Audio playback failed"));
      };

      const onLoadedDataHandler = async () => {
        // Firefox-compatible: wait for loadeddata instead of canplaythrough
        try {
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
      audio.addEventListener("loadeddata", onLoadedDataHandler);

      // Set blob URL as source (better for Firefox)
      if (blobUrl) {
        audio.src = blobUrl;
        audio.load();
      } else {
        reject(new Error("Failed to create blob URL"));
        return;
      }
    });
  } catch (fetchError) {
    // Clean up blob URL if fetch failed
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    throw fetchError;
  }
};

export interface AudioPlayerOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  autoDelay?: number;
  speechRate?: number;
  requireUserInteraction?: boolean; // Add flag to handle iOS autoplay restrictions
  preloadNext?: boolean; // Whether to preload the next word in the sequence
}

/**
 * Plays audio for a word using streaming endpoint with browser caching
 * @param word - The word to play audio for
 * @param wordSet - The word set containing the word
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
    preloadNext = false,
  } = options;

  const playFn = async () => {
    try {
      onStart?.();

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // Use streaming endpoint with language parameter - browser will cache this
      // Including language in URL avoids database lookup on backend
      const streamingUrl = `${apiBaseUrl}/api/wordsets/${wordSet.id}/words/${encodeURIComponent(word)}/audio?lang=${encodeURIComponent(wordSet.language)}`;

      try {
        await playAudioWithiOSSupport(
          streamingUrl,
          requireUserInteraction,
          onEnd,
        );

        if (process.env.NODE_ENV === "development") {
          console.log("Successfully played streaming audio for:", word);
        }

        // Opportunistically preload next word if requested
        if (preloadNext) {
          preloadNextWord(word, wordSet);
        }
      } catch (streamingError) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "Streaming audio failed, falling back to browser TTS:",
            streamingError,
          );
        }

        // Fall back to browser speech synthesis
        await fallbackToSpeechSynthesis();
      }
    } catch (error) {
      console.log(
        "Audio playback failed, falling back to speech synthesis:",
        error,
      );
      await fallbackToSpeechSynthesis();
    }
  };

  const fallbackToSpeechSynthesis = async () => {
    if (!("speechSynthesis" in window)) {
      const error = new Error("Speech synthesis not supported");
      onError?.(error);
      onEnd?.();
      return;
    }

    try {
      speechSynthesis.cancel();

      // Get available voices with Safari compatibility
      const voices = await getVoicesWithFallback();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = wordSet.language === "no" ? "nb-NO" : "en-US";
      utterance.rate = speechRate;

      // Explicitly select the best voice for Norwegian if available
      if (wordSet.language === "no" && voices.length > 0) {
        const norwegianVoice = selectBestNorwegianVoice(voices);
        if (norwegianVoice) {
          utterance.voice = norwegianVoice;
          if (process.env.NODE_ENV === "development") {
            console.log(
              "Using Norwegian voice:",
              norwegianVoice.name,
              norwegianVoice.lang,
            );
          }
        } else if (process.env.NODE_ENV === "development") {
          console.warn("No Norwegian voice found, using default");
        }
      }

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
 * Gets available speech synthesis voices with Safari compatibility
 * Safari requires waiting for onvoiceschanged event
 */
const getVoicesWithFallback = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();

    // If voices are already loaded (Chrome, Firefox)
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Safari needs to wait for onvoiceschanged
    const voicesChangedHandler = () => {
      voices = speechSynthesis.getVoices();
      speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandler,
      );
      resolve(voices);
    };

    speechSynthesis.addEventListener("voiceschanged", voicesChangedHandler);

    // Fallback timeout in case event never fires
    setTimeout(() => {
      speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandler,
      );
      resolve(speechSynthesis.getVoices());
    }, TIMING.AUDIO_CACHE_CLEAR_DELAY_MS);
  });
};

/**
 * Selects the best Norwegian voice from available voices
 * Prioritizes: nb-NO (Bokmål) > no-NO (generic) > nn-NO (Nynorsk)
 */
const selectBestNorwegianVoice = (
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null => {
  // Priority 1: Bokmål (nb-NO)
  let norwegianVoice = voices.find((voice) => voice.lang === "nb-NO");

  if (norwegianVoice) return norwegianVoice;

  // Priority 2: Generic Norwegian (no-NO)
  norwegianVoice = voices.find((voice) => voice.lang === "no-NO");

  if (norwegianVoice) return norwegianVoice;

  // Priority 3: Nynorsk (nn-NO)
  norwegianVoice = voices.find((voice) => voice.lang === "nn-NO");

  if (norwegianVoice) return norwegianVoice;

  // Priority 4: Any voice starting with nb-, no-, or nn-
  norwegianVoice = voices.find(
    (voice) =>
      voice.lang.startsWith("nb-") ||
      voice.lang.startsWith("no-") ||
      voice.lang.startsWith("nn-"),
  );

  return norwegianVoice || null;
};

/**
 * Preloads the next word's audio in the background for smoother playback
 */
const preloadNextWord = (currentWord: string, wordSet: WordSet): void => {
  const currentIndex = wordSet.words.findIndex((w) => w.word === currentWord);

  if (currentIndex === -1 || currentIndex >= wordSet.words.length - 1) {
    // No next word to preload
    return;
  }

  const nextWord = wordSet.words[currentIndex + 1].word;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const nextWordUrl = `${apiBaseUrl}/api/wordsets/${wordSet.id}/words/${encodeURIComponent(nextWord)}/audio?lang=${encodeURIComponent(wordSet.language)}`;

  // Preload using fetch (browser will cache it)
  fetch(nextWordUrl, {
    method: "GET",
    cache: "force-cache", // Use cached version if available
  })
    .then(() => {
      if (process.env.NODE_ENV === "development") {
        console.log("Preloaded audio for next word:", nextWord);
      }
    })
    .catch((error) => {
      // Silently fail - this is just an optimization
      if (process.env.NODE_ENV === "development") {
        console.log("Failed to preload next word:", error);
      }
    });
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
 * Checks if audio is available for a word (either generated audio or speech synthesis)
 * @param wordItem - The word item to check
 * @returns true if any form of audio is available
 */
export const hasAudioAvailable = (wordItem: WordItem | undefined): boolean => {
  if (!wordItem) return false;

  // Check if generated audio is available
  if (wordItem.audio?.audioUrl || wordItem.audio?.audioId) {
    return true;
  }

  // Check if speech synthesis is available as fallback
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return true;
  }

  return false;
};
