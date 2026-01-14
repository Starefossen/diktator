/**
 * Audio tone utilities for the Diktator app
 * Provides success, error, and completion tone functions using Web Audio API
 */

import { logger } from "@/lib/logger";

// Type declaration for WebKit AudioContext fallback
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// Shared audio context for iOS Safari compatibility
let sharedAudioContext: AudioContext | null = null;

/**
 * Gets or creates a shared AudioContext for iOS Safari compatibility
 */
const getAudioContext = (): AudioContext | null => {
  if (!("AudioContext" in window || "webkitAudioContext" in window))
    return null;

  if (!sharedAudioContext) {
    try {
      const AudioContextConstructor =
        window.AudioContext || window.webkitAudioContext;
      sharedAudioContext = new AudioContextConstructor();

      // Resume context if suspended (required on iOS Safari)
      if (sharedAudioContext.state === "suspended") {
        sharedAudioContext.resume();
      }
    } catch (error) {
      logger.audio.debug("Could not create AudioContext", { error });
      return null;
    }
  }

  return sharedAudioContext;
};

/**
 * Plays a pleasant success chord (C major) when user answers correctly
 */
export const playSuccessTone = (): void => {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    // Create a pleasant success chord (C major)
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.5;

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.type = "sine";

      // Fade in and out for smooth sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.1,
        audioContext.currentTime + 0.05,
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + duration,
      );

      oscillator.start(audioContext.currentTime + index * 0.1);
      oscillator.stop(audioContext.currentTime + duration + index * 0.1);
    });
  } catch (error) {
    logger.audio.debug("Could not play success tone", { error });
  }
};

/**
 * Plays a subtle error sound (descending minor third) when user answers incorrectly
 */
export const playErrorSound = (): void => {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    // Create a subtle error sound (descending minor third)
    const frequencies = [329.63, 293.66]; // E4, D4
    const duration = 0.3;

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.type = "sine";

      // Quick fade in and out for subtle sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.08,
        audioContext.currentTime + 0.03,
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + duration,
      );

      oscillator.start(audioContext.currentTime + index * 0.15);
      oscillator.stop(audioContext.currentTime + duration + index * 0.15);
    });
  } catch (error) {
    logger.audio.debug("Could not play error sound", { error });
  }
};

/**
 * Plays a triumphant completion fanfare when the test is finished
 */
export const playCompletionTone = (): void => {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    // Create a triumphant completion fanfare (ascending major scale)
    const frequencies = [523.25, 587.33, 659.25, 698.46, 783.99]; // C5, D5, E5, F5, G5
    const duration = 0.8;

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.type = "sine";

      // Longer, more prominent sound for completion
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.15,
        audioContext.currentTime + 0.05,
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + duration,
      );

      oscillator.start(audioContext.currentTime + index * 0.2);
      oscillator.stop(audioContext.currentTime + duration + index * 0.2);
    });
  } catch (error) {
    logger.audio.debug("Could not play completion tone", { error });
  }
};
