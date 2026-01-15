/**
 * Centralized timing configuration for the Diktator app.
 *
 * All timing-related constants are defined here for easy adjustment
 * and consistency across the application.
 */

export const TIMING = {
  // ==========================================================================
  // Test Mode Timings
  // ==========================================================================

  /** Base feedback display time (minimum) */
  FEEDBACK_DISPLAY_MS: 3500,

  /** Success feedback display time (fixed, short) */
  SUCCESS_FEEDBACK_MS: 1500,

  /** Minimum error feedback display time */
  FEEDBACK_MIN_MS: 2500,

  /** Maximum feedback display time */
  FEEDBACK_MAX_MS: 6000,

  /** Additional time per character for feedback */
  FEEDBACK_PER_CHAR_MS: 100,

  /** Delay before auto-playing audio after wrong answer */
  AUDIO_REPLAY_DELAY_MS: 500,

  /** Delay before auto-playing first word when test starts */
  TEST_START_AUDIO_DELAY_MS: 500,

  /** Safety timeout for audio playback (resets stuck state) */
  AUDIO_SAFETY_TIMEOUT_MS: 10000,

  // ==========================================================================
  // Practice Mode Timings
  // ==========================================================================

  /** Delay before playing audio when entering practice mode */
  PRACTICE_MODE_INITIAL_DELAY_MS: 800,

  /** Audio delay parameter when entering practice mode */
  PRACTICE_MODE_AUDIO_DELAY_MS: 500,

  /** Delay before playing audio after shuffle */
  PRACTICE_SHUFFLE_DELAY_MS: 1000,

  /** Audio delay parameter after shuffle */
  PRACTICE_SHUFFLE_AUDIO_DELAY_MS: 300,

  /** Delay before playing audio when navigating to next word */
  PRACTICE_NAV_DELAY_MS: 500,

  /** Audio delay parameter when navigating */
  PRACTICE_NAV_AUDIO_DELAY_MS: 300,

  // ==========================================================================
  // UI Interaction Timings
  // ==========================================================================

  /** Debounce delay for input focus */
  INPUT_FOCUS_DELAY_MS: 100,

  /** Delay for audio player cache clearing */
  AUDIO_CACHE_CLEAR_DELAY_MS: 1000,

  // ==========================================================================
  // Token/Auth Timings
  // ==========================================================================

  /** Buffer before token expiry to trigger refresh (1 minute) */
  TOKEN_REFRESH_BUFFER_MS: 60000,
} as const;

/**
 * Calculate feedback display duration based on word/sentence length.
 * Longer words/sentences get more time to read the correct answer.
 *
 * @param text - The word or sentence to calculate duration for
 * @returns Duration in milliseconds
 */
export function getFeedbackDuration(text: string): number {
  const charCount = text.length;
  const baseDuration = TIMING.FEEDBACK_MIN_MS;
  const perCharDuration = charCount * TIMING.FEEDBACK_PER_CHAR_MS;

  return Math.min(TIMING.FEEDBACK_MAX_MS, baseDuration + perCharDuration);
}
