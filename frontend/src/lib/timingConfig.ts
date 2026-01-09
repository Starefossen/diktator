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

  /** How long to show feedback after an answer (correct or incorrect) */
  FEEDBACK_DISPLAY_MS: 3500,

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
