/**
 * Audio player utilities for the Diktator app
 * Provides unified audio playback with fallback from generated audio to speech synthesis
 *
 * BROWSER AUTOPLAY POLICY:
 * Modern browsers require a "user gesture" (click/touch) to play audio with sound.
 * The gesture token is "transient" - it expires after a few seconds or after being used.
 *
 * Our strategy:
 * 1. Mark when user has interacted (clicked Start button)
 * 2. Play actual audio synchronously within the click handler - don't waste gesture on silent audio!
 * 3. Once first audio plays successfully, mark as unlocked for subsequent autoplays
 * 4. If streaming audio fails, fall back to browser TTS (SpeechSynthesis)
 */

import { WordSet, WordItem } from "@/types";
import { TIMING } from "@/lib/timingConfig";

// Global audio state for browser compatibility
let audioContext: AudioContext | null = null;
let userHasInteracted = false;
let audioUnlocked = false;

/**
 * Check if user has interacted with the page (enabling autoplay)
 */
const hasUserInteracted = (): boolean => userHasInteracted;

/**
 * Check if audio has been unlocked (successfully played once)
 */
export const isAudioUnlocked = (): boolean => audioUnlocked;

/**
 * Mark audio as unlocked after successful playback
 */
const markAudioUnlocked = (): void => {
  if (!audioUnlocked) {
    audioUnlocked = true;
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Audio] Marked as unlocked - streaming should work for future plays",
      );
    }
  }
};

/**
 * Mark that user has interacted - call this from click handlers
 */
const markUserInteracted = (): void => {
  userHasInteracted = true;
  if (process.env.NODE_ENV === "development") {
    console.log("[Audio] User interaction registered");
  }
};

/**
 * Initialize AudioContext and mark user interaction.
 * This should be called from a user gesture (click/touch handler).
 *
 * IMPORTANT: We intentionally do NOT try to play silent audio here!
 * Playing silent audio consumes/wastes the "user gesture token" that browsers
 * use to allow audio playback. Instead, we save the gesture token for the
 * actual first audio playback.
 */
export const initializeAudioForIOS = (): void => {
  if (typeof window === "undefined") return;

  userHasInteracted = true;

  if (process.env.NODE_ENV === "development") {
    console.log("[Audio] initializeAudioForIOS: marking user interaction");
  }

  // Initialize AudioContext (but don't play anything - save the gesture token!)
  try {
    const AudioContextConstructor =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextConstructor && !audioContext) {
      audioContext = new AudioContextConstructor();
      if (process.env.NODE_ENV === "development") {
        console.log("[Audio] AudioContext created, state:", audioContext.state);
      }
    }

    // Resume context if suspended (this doesn't consume the gesture token)
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {
        // Ignore - not critical
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Audio] AudioContext init error:", error);
    }
  }
};

/**
 * Plays audio directly from URL - MUST be called synchronously from user gesture.
 * This is the only way to get audio to play on Safari/Firefox with strict autoplay policies.
 *
 * Key insight: audio.play() must be called synchronously in the user gesture context,
 * BEFORE any async operations (fetch, setTimeout, Promise.then, etc.)
 */
const playAudioDirect = (
  audioUrl: string,
  onEnd?: () => void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    const cleanup = () => {
      audio.removeEventListener("ended", onEndHandler);
      audio.removeEventListener("error", onErrorHandler);
    };

    const onEndHandler = () => {
      markAudioUnlocked();
      cleanup();
      onEnd?.();
      resolve();
    };

    const onErrorHandler = (event: Event) => {
      cleanup();
      const errorEvent = event as ErrorEvent;
      reject(new Error(errorEvent.message || "Audio playback error"));
    };

    audio.addEventListener("ended", onEndHandler);
    audio.addEventListener("error", onErrorHandler);

    // Set source and call play() IMMEDIATELY - no async operations in between!
    audio.src = audioUrl;

    // Call play() synchronously - this captures the user gesture token
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          markAudioUnlocked();
          if (process.env.NODE_ENV === "development") {
            console.log("[Audio] Direct play succeeded!");
          }
        })
        .catch((err) => {
          cleanup();
          reject(err);
        });
    }
  });
};

/**
 * Plays audio with iOS Safari compatibility handling and Firefox Blob URL support.
 * NOTE: This function uses fetch/blob which is async - call playAudioDirect() instead
 * when you need to play from a user gesture context.
 */
const playAudioWithiOSSupport = async (
  audioUrl: string,
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
        // Mark audio as unlocked on successful completion
        markAudioUnlocked();
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
          await audio.play();
          // Mark as unlocked on successful play start
          markAudioUnlocked();
        } catch (playError) {
          cleanup();
          reject(playError);
        }
      };

      const onCanPlayHandler = async () => {
        try {
          await audio.play();
          // Mark as unlocked on successful play start
          markAudioUnlocked();
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

interface AudioPlayerOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  autoDelay?: number;
  speechRate?: number;
  isAutoPlay?: boolean; // True if this is an automatic play (not user-initiated click)
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
    isAutoPlay = false,
    preloadNext = false,
  } = options;

  const playFn = async () => {
    try {
      onStart?.();

      if (process.env.NODE_ENV === "development") {
        console.log("[Audio] playWordAudio:", {
          word: word.substring(0, 30) + (word.length > 30 ? "..." : ""),
          isAutoPlay,
          audioUnlocked,
          userHasInteracted,
        });
      }

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // Use streaming endpoint with language parameter - browser will cache this
      const streamingUrl = `${apiBaseUrl}/api/wordsets/${wordSet.id}/words/${encodeURIComponent(word)}/audio?lang=${encodeURIComponent(wordSet.language)}`;

      try {
        // CRITICAL: If this is a direct user gesture (not autoplay), use playAudioDirect
        // which calls audio.play() synchronously to capture the user gesture token.
        // For autoplay (after audio is unlocked), we can use the blob-based approach.
        if (!isAutoPlay) {
          if (process.env.NODE_ENV === "development") {
            console.log("[Audio] Using direct play (user gesture context)");
          }
          await playAudioDirect(streamingUrl, onEnd);
        } else if (audioUnlocked) {
          // Audio already unlocked, can use async blob approach
          if (process.env.NODE_ENV === "development") {
            console.log("[Audio] Using blob play (audio already unlocked)");
          }
          await playAudioWithiOSSupport(streamingUrl, onEnd);
        } else {
          // Autoplay but not unlocked - this will likely fail, but try anyway
          if (process.env.NODE_ENV === "development") {
            console.log("[Audio] Trying direct play for autoplay (may fail)");
          }
          await playAudioDirect(streamingUrl, onEnd);
        }

        if (process.env.NODE_ENV === "development") {
          console.log(
            "[Audio] Streaming audio succeeded for:",
            word.substring(0, 30),
          );
        }

        // Opportunistically preload next word if requested
        if (preloadNext) {
          preloadNextWord(word, wordSet);
        }
        return; // Success - don't fall back to TTS
      } catch (streamingError) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[Audio] Streaming failed, using browser TTS:",
            streamingError instanceof Error
              ? streamingError.message
              : String(streamingError),
          );
        }
        // Fall through to browser TTS
      }

      // Fall back to browser speech synthesis
      await fallbackToSpeechSynthesis();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Audio] playWordAudio error, using browser TTS:", error);
      }
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
        // "canceled" is not a real error - it happens when we call speechSynthesis.cancel()
        // before starting a new utterance, which is expected behavior
        if (event.error === "canceled") {
          return;
        }
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
