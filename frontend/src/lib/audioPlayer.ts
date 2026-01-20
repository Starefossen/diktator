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
 *
 * CRITICAL iOS Safari Note:
 * ANY async function boundary breaks the user gesture chain. Even calling an async function
 * synchronously causes its body to run in a microtask. The ONLY way to play audio on iOS
 * is to call audio.play() in the SAME synchronous call stack as the user click event.
 */

import { WordSet, WordItem } from "@/types";
import { TIMING } from "@/lib/timingConfig";
import { logger } from "@/lib/logger";

// Global audio state for browser compatibility
let audioContext: AudioContext | null = null;
let userHasInteracted = false;
let audioUnlocked = false;

// Global audio element for synchronous playback - reused to maintain gesture context
const _globalAudioElement: HTMLAudioElement | null = null;

/**
 * Check if user has interacted with the page (enabling autoplay)
 */
const _hasUserInteracted = (): boolean => userHasInteracted;

/**
 * Mark audio as unlocked after successful playback
 */
const markAudioUnlocked = (): void => {
  if (!audioUnlocked) {
    audioUnlocked = true;
    logger.audio.info(
      "Marked as unlocked - streaming should work for future plays",
    );
  }
};

/**
 * Mark that user has interacted - call this from click handlers
 */
const _markUserInteracted = (): void => {
  userHasInteracted = true;
  logger.audio.debug("User interaction registered");
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

  logger.audio.debug("initializeAudioForIOS: marking user interaction");

  // Initialize AudioContext (but don't play anything - save the gesture token!)
  try {
    const AudioContextConstructor =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextConstructor && !audioContext) {
      audioContext = new AudioContextConstructor();
      logger.audio.debug("AudioContext created, state:", audioContext.state);
    }

    // Resume context if suspended (this doesn't consume the gesture token)
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {
        // Ignore - not critical
      });
    }
  } catch (error) {
    logger.audio.warn("AudioContext init error:", error);
  }
};

/**
 * SYNCHRONOUS audio playback - MUST be called directly from click handler!
 *
 * This function creates an Audio element and calls play() SYNCHRONOUSLY.
 * It returns a handle object that allows setting up callbacks for completion.
 *
 * iOS Safari requires audio.play() to be in the EXACT same call stack as
 * the user click event. ANY async boundary (Promise, setTimeout, async function)
 * will break the gesture chain and cause "user denied permission" errors.
 *
 * @param audioUrl - URL to the audio file
 * @returns Handle object with methods to set callbacks and a promise for completion
 */
export const playAudioSync = (
  audioUrl: string,
): {
  onEnd: (callback: () => void) => void;
  onError: (callback: (error: Error) => void) => void;
  promise: Promise<void>;
} => {
  logger.audio.debug("playAudioSync: Creating audio element SYNCHRONOUSLY");

  // Create audio element synchronously
  const audio = new Audio();
  audio.src = audioUrl;

  let endCallback: (() => void) | null = null;
  let errorCallback: ((error: Error) => void) | null = null;
  let resolvePromise: () => void;
  let rejectPromise: (err: Error) => void;

  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const cleanup = () => {
    audio.removeEventListener("ended", onEndHandler);
    audio.removeEventListener("error", onErrorHandler);
  };

  const onEndHandler = () => {
    logger.audio.debug("playAudioSync: Audio ended successfully");
    markAudioUnlocked();
    cleanup();
    endCallback?.();
    resolvePromise();
  };

  const onErrorHandler = (event: Event) => {
    logger.audio.warn("playAudioSync: Audio error event:", event);
    cleanup();
    const error = new Error("Audio playback failed");
    errorCallback?.(error);
    rejectPromise(error);
  };

  audio.addEventListener("ended", onEndHandler);
  audio.addEventListener("error", onErrorHandler);

  // Call play() SYNCHRONOUSLY - this MUST be in the same call stack as user click!
  logger.audio.debug("playAudioSync: Calling audio.play() NOW");
  const playPromise = audio.play();

  if (playPromise) {
    playPromise
      .then(() => {
        logger.audio.debug(
          "playAudioSync: play() promise resolved - audio is playing!",
        );
        markAudioUnlocked();
      })
      .catch((err) => {
        logger.audio.warn(
          "playAudioSync: play() promise rejected:",
          err.message,
        );
        cleanup();
        errorCallback?.(err);
        rejectPromise(err);
      });
  }

  return {
    onEnd: (callback: () => void) => {
      endCallback = callback;
    },
    onError: (callback: (error: Error) => void) => {
      errorCallback = callback;
    },
    promise,
  };
};

/**
 * Plays audio directly from URL - MUST be called synchronously from user gesture.
 * This is the only way to get audio to play on Safari/Firefox with strict autoplay policies.
 *
 * CRITICAL: This function is NOT async because the `async` keyword itself causes the
 * function body to execute in a microtask, which breaks the user gesture chain.
 * audio.play() must be called in the SAME synchronous call stack as the user click.
 */
const playAudioDirect = (
  audioUrl: string,
  onEnd?: () => void,
): Promise<void> => {
  // Create Audio element SYNCHRONOUSLY in the user gesture context
  const audio = new Audio();

  logger.audio.debug("playAudioDirect: Creating audio element synchronously");

  const cleanup = () => {
    audio.removeEventListener("ended", onEndHandler);
    audio.removeEventListener("error", onErrorHandler);
    audio.removeEventListener("canplaythrough", onCanPlayHandler);
  };

  let resolvePromise: () => void;
  let rejectPromise: (err: Error) => void;

  const onEndHandler = () => {
    markAudioUnlocked();
    cleanup();
    onEnd?.();
    resolvePromise();
  };

  const onErrorHandler = (event: Event) => {
    logger.audio.warn("playAudioDirect: error event:", event);
    cleanup();
    const errorEvent = event as ErrorEvent;
    rejectPromise(new Error(errorEvent.message || "Audio playback error"));
  };

  const onCanPlayHandler = () => {
    logger.audio.debug("playAudioDirect: canplaythrough event fired");
    markAudioUnlocked();
  };

  audio.addEventListener("ended", onEndHandler);
  audio.addEventListener("error", onErrorHandler);
  audio.addEventListener("canplaythrough", onCanPlayHandler);

  // Set source SYNCHRONOUSLY
  audio.src = audioUrl;

  logger.audio.debug("playAudioDirect: Calling play() SYNCHRONOUSLY");

  // Call play() SYNCHRONOUSLY - this MUST happen in the same call stack as user click
  // Do NOT use await or .then() before this point!
  const playPromise = audio.play();

  // Now we can return a Promise for the caller to await
  return new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;

    if (playPromise) {
      playPromise
        .then(() => {
          markAudioUnlocked();
          logger.audio.debug("playAudioDirect: play() succeeded!");
        })
        .catch((err) => {
          logger.audio.warn("playAudioDirect: play() failed:", err.message);
          cleanup();
          reject(err);
        });
    }
  });
};

/**
 * Plays audio directly from URL without blob conversion (for Safari).
 * Safari has issues with blob URLs, so we use the direct URL instead.
 */
const playAudioDirectFromURL = async (
  audioUrl: string,
  onEnd?: () => void,
): Promise<void> => {
  const audio = new Audio();
  audio.preload = "auto";

  logger.audio.debug("Safari: Playing direct URL:", audioUrl);

  return new Promise((resolve, reject) => {
    // Shorter timeout for Safari - if no event fires in 3 seconds, something is wrong
    const loadTimeout = setTimeout(() => {
      logger.audio.warn("Safari: Timeout - no events fired, falling back to TTS");
      cleanup();
      reject(new Error("Audio loading timeout - no events fired"));
    }, 3000);

    const cleanup = () => {
      clearTimeout(loadTimeout);
      audio.removeEventListener("ended", onEndHandler);
      audio.removeEventListener("error", onErrorHandler);
      audio.removeEventListener("canplaythrough", onCanPlayHandler);
      audio.removeEventListener("loadeddata", onLoadedDataHandler);
      audio.removeEventListener("loadstart", onLoadStartHandler);
      audio.removeEventListener("suspend", onSuspendHandler);
      audio.removeEventListener("stalled", onStalledHandler);
    };

    const onLoadStartHandler = () => {
      logger.audio.debug("Safari: loadstart event fired");
    };

    const onSuspendHandler = () => {
      logger.audio.debug("Safari: suspend event fired");
    };

    const onStalledHandler = () => {
      logger.audio.warn(
        "Safari: stalled event - network issue, falling back to TTS",
      );
      cleanup();
      reject(new Error("Audio loading stalled"));
    };

    const onEndHandler = () => {
      logger.audio.debug("Safari: ended event fired");
      markAudioUnlocked();
      cleanup();
      onEnd?.();
      resolve();
    };

    const onErrorHandler = (event: ErrorEvent | Event) => {
      logger.audio.warn("Safari: error event fired:", event);
      cleanup();
      reject(new Error("Audio playback failed"));
    };

    const onLoadedDataHandler = async () => {
      logger.audio.debug("Safari: loadeddata event fired, attempting play");
      try {
        await audio.play();
        markAudioUnlocked();
      } catch (playError) {
        logger.audio.warn("Safari: play() failed:", playError);
        cleanup();
        reject(playError);
      }
    };

    const onCanPlayHandler = async () => {
      logger.audio.debug("Safari: canplaythrough event fired, attempting play");
      try {
        await audio.play();
        markAudioUnlocked();
      } catch (playError) {
        logger.audio.warn("Safari: play() failed:", playError);
        cleanup();
        reject(playError);
      }
    };

    audio.addEventListener("ended", onEndHandler);
    audio.addEventListener("error", onErrorHandler);
    audio.addEventListener("canplaythrough", onCanPlayHandler);
    audio.addEventListener("loadeddata", onLoadedDataHandler);
    audio.addEventListener("loadstart", onLoadStartHandler);
    audio.addEventListener("suspend", onSuspendHandler);
    audio.addEventListener("stalled", onStalledHandler);

    // Use direct URL instead of blob for Safari
    audio.src = audioUrl;

    logger.audio.debug("Safari: Audio element created, calling load()");

    audio.load();
  });
};

/**
 * Plays audio with Safari compatibility handling and Firefox Blob URL support.
 * NOTE: This function uses fetch/blob which is async - call playAudioDirect() instead
 * when you need to play from a user gesture context.
 */
const playAudioWithiOSSupport = async (
  audioUrl: string,
  onEnd?: () => void,
): Promise<void> => {
  // Safari on all platforms (iOS, iPadOS, macOS) has issues with blob URLs for audio - use direct URL instead
  // Detect Safari but exclude Chrome (which also contains "Safari" in UA)
  const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);

  logger.audio.debug(
    "Device detection - isSafari:",
    isSafari,
    "UA:",
    navigator.userAgent.substring(0, 50),
  );

  if (isSafari) {
    // For Safari, use the direct URL without blob conversion
    logger.audio.debug("Using Safari direct URL path");
    return playAudioDirectFromURL(audioUrl, onEnd);
  }

  // For other browsers (especially Firefox), use blob URL for better compatibility
  let blobUrl: string | null = null;

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw response; // Throw the response for error handling upstream
    }

    const blob = await response.blob();
    blobUrl = URL.createObjectURL(blob);

    const audio = new Audio();
    audio.preload = "auto";

    return new Promise((resolve, reject) => {
      // iOS Safari doesn't fire error events for unsupported codecs (e.g., OGG Opus)
      // Add timeout to detect hung playback and fallback to TTS
      const loadTimeout = setTimeout(() => {
        cleanup();
        reject(new Error("Audio loading timeout - codec may not be supported"));
      }, 5000); // 5 second timeout

      const cleanup = () => {
        clearTimeout(loadTimeout);
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
  onError?: (error: Error, details?: string) => void;
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

      logger.audio.debug("playWordAudio:", {
        word: word.substring(0, 30) + (word.length > 30 ? "..." : ""),
        isAutoPlay,
        audioUnlocked,
        userHasInteracted,
      });

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // Use streaming endpoint with language parameter - browser will cache this
      const streamingUrl = `${apiBaseUrl}/api/wordsets/${wordSet.id}/words/${encodeURIComponent(word)}/audio?lang=${encodeURIComponent(wordSet.language)}`;

      try {
        // CRITICAL: If this is a direct user gesture (not autoplay), use playAudioDirect
        // which calls audio.play() synchronously to capture the user gesture token.
        // For autoplay (after audio is unlocked), we can use the blob-based approach.
        if (!isAutoPlay) {
          logger.audio.debug("Using direct play (user gesture context)");
          await playAudioDirect(streamingUrl, onEnd);
        } else if (audioUnlocked) {
          // Audio already unlocked, can use async blob approach
          logger.audio.debug("Using blob play (audio already unlocked)");
          await playAudioWithiOSSupport(streamingUrl, onEnd);
        } else {
          // Autoplay but not unlocked - this will likely fail, but try anyway
          logger.audio.debug("Trying direct play for autoplay (may fail)");
          await playAudioDirect(streamingUrl, onEnd);
        }

        logger.audio.debug(
          "Streaming audio succeeded for:",
          word.substring(0, 30),
        );

        // Opportunistically preload next word if requested
        if (preloadNext) {
          preloadNextWord(word, wordSet);
        }
        return; // Success - don't fall back to TTS
      } catch (streamingError) {
        // Check if it's an HTTP error with a response
        if (streamingError instanceof Response) {
          try {
            const errorData = await streamingError.json();
            const errorMessage = errorData.error || "Failed to play audio";
            const errorDetails = errorData.details || streamingError.statusText;

            logger.audio.debug("API error:", { errorMessage, errorDetails });

            // If it's a service unavailable error, notify the user
            if (streamingError.status === 503) {
              const error = new Error(errorMessage);
              onError?.(error, errorDetails);
              onEnd?.();
              return; // Don't fall back to TTS for configuration errors
            }

            // For other API errors, report but try TTS fallback
            logger.audio.debug("API error, will try TTS fallback");
          } catch (_parseError) {
            logger.audio.debug("Could not parse error response");
          }
        }

        logger.audio.debug(
          "Streaming failed, using browser TTS:",
          streamingError instanceof Error
            ? streamingError.message
            : String(streamingError),
        );
        // Fall through to browser TTS
      }

      // Fall back to browser speech synthesis
      await fallbackToSpeechSynthesis();
    } catch (error) {
      logger.audio.warn("playWordAudio error, using browser TTS:", error);
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
          logger.audio.debug(
            "Using Norwegian voice:",
            norwegianVoice.name,
            norwegianVoice.lang,
          );
        } else {
          logger.audio.warn("No Norwegian voice found, using default");
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

  logger.audio.debug("Audio detection:", {
    userAgent,
    isSafari,
    safariVersion: versionMatch
      ? `${versionMatch[1]}.${versionMatch[2]}`
      : "unknown",
    majorVersion,
    requiresInteraction,
  });

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
      logger.audio.debug("Preloaded audio for next word:", nextWord);
    })
    .catch((error) => {
      // Silently fail - this is just an optimization
      logger.audio.debug("Failed to preload next word:", error);
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
