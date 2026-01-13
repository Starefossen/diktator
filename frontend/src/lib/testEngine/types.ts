/**
 * Test Engine - Core Type Definitions
 *
 * This module defines the unified interface for test modes in the Diktator app.
 * The registry pattern allows easy extension of new test modes without modifying core logic.
 */

import type { TestMode, WordSet, WordItem } from "@/types";
import type { ComponentType } from "react";

/**
 * Challenge data generated for specific test modes
 * Different modes may generate different challenge structures
 */
export interface ChallengeData {
  // Letter tiles mode
  tiles?: Array<{
    letter: string;
    id: string;
    isDistractor: boolean;
  }>;

  // Word bank mode
  wordBankItems?: Array<{
    id: string;
    word: string;
    isDistractor: boolean;
  }>;

  // Missing letters mode
  blankedWord?: string;
  missingLetters?: string;
  challengeType?:
  | "prefix"
  | "suffix"
  | "compound"
  | "double"
  | "silent"
  | "mixed";
}

/**
 * Standardized props for all test input components
 * All input components must accept these props for consistency
 */
export interface TestInputProps {
  /** The current word/sentence being tested */
  word: string;

  /** The expected correct answer */
  expectedAnswer: string;

  /** Callback when user submits an answer */
  onSubmit: (answer: string, isCorrect: boolean) => void;

  /** Optional callback to skip the current word */
  onSkip?: () => void;

  /** Whether input is disabled (e.g., showing feedback) */
  disabled?: boolean;

  /** Number of attempts made on current word */
  attempts: number;

  /** Optional audio URL for pronunciation */
  audioUrl?: string;

  /** Challenge data specific to this mode */
  challengeData?: ChallengeData;
}

/**
 * Context object passed to mode functions
 * Contains additional data modes may need to function
 */
export interface TestModeContext {
  /** Current word set being tested */
  wordSet?: WordSet;

  /** Current word object with all metadata */
  currentWord?: WordItem;

  /** For translation mode: direction of translation */
  translationDirection?: "toTarget" | "toSource";

  /** Any mode-specific state */
  [key: string]: unknown;
}

/**
 * Complete definition for a test mode
 * Each mode registers an instance of this to make itself available
 */
export interface TestModeDefinition {
  /** Unique identifier matching TestMode type */
  id: TestMode;

  /** Display metadata for UI */
  metadata: {
    /** Heroicon component for visual representation */
    icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

    /** i18n key for mode name */
    nameKey: string;

    /** i18n key for mode description */
    descriptionKey: string;
  };

  /** General category of input this mode uses */
  inputType: "tiles" | "wordBank" | "keyboard" | "specialized";

  /** Whether this mode tracks mastery in the database */
  tracksMastery: boolean;

  /** Content type requirements for this mode */
  contentRequirements: {
    /** Requires single words (no sentences) */
    singleWords?: boolean;

    /** Requires sentences (not single words) */
    sentences?: boolean;

    /** Requires translations to be present */
    translations?: boolean;
  };

  /**
   * Determines if this mode is available for a given word set
   * @param wordSet - The word set to check
   * @returns availability status with optional reason key for i18n
   */
  isAvailable: (wordSet: WordSet) => {
    available: boolean;
    reasonKey?: string;
  };

  /**
   * Generate challenge data for this mode
   * @param word - The word/sentence to generate challenge for
   * @param context - Additional context (word set, etc.)
   * @returns Challenge data specific to this mode
   */
  generateChallenge?: (
    word: string,
    context?: TestModeContext,
  ) => ChallengeData;

  /**
   * Get the expected answer for this mode
   * Most modes just return the word, but translation mode may swap
   * @param word - The current word object
   * @param context - Additional context (translation direction, etc.)
   * @returns The expected answer string
   */
  getExpectedAnswer?: (word: WordItem, context?: TestModeContext) => string;
}

/**
 * Registry map type: TestMode → TestModeDefinition
 */
export type TestModeRegistry = Map<TestMode, TestModeDefinition>;
