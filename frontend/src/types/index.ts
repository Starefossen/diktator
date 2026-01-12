// src/types/index.ts - Shared type definitions

import type {
  InputMethod,
  DifficultyLevel,
  GradeLevel,
  SpellingFocusCategory,
} from "@/lib/sentenceConfig";

// Re-export sentence config types for convenience
// ======================
// Dictionary Types (ord.uib.no proxy)
// ======================

// Simplified dictionary word entry from ord.uib.no
interface DictionaryWord {
  lemma: string; // Base form of the word
  wordClass: string; // NOUN, VERB, ADJ, ADV, etc.
  inflections: string[]; // All inflected forms (e.g., katt, katten, katter, kattene)
  definition: string; // Primary definition only
  articleId: number; // For linking to ordbokene.no (e.g., https://ordbokene.no/bm/{articleId})
}

// Autocomplete suggestion from the dictionary
interface DictionarySuggestion {
  word: string;
  articleId: number;
}

// ======================
// Family Types
// ======================

// Family Invitation Type
export interface FamilyInvitation {
  id: string;
  familyId: string;
  familyName: string;
  email: string;
  role: "parent" | "child";
  invitedBy: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt?: string | null;
}

// Child Account Type
export interface ChildAccount {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  parentId: string; // The parent who created this child account
  role: "child";
  isActive: boolean; // Parents can deactivate child accounts
  birthYear?: number; // Optional birth year for age-adaptive features
  createdAt: string;
  lastActiveAt: string;
}

// Helper function to calculate age from birth year
export function calculateAge(birthYear?: number): number | undefined {
  if (!birthYear) return undefined;
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

// Word Mastery for progressive challenge unlocking
export interface WordMastery {
  id: string;
  userId: string;
  wordSetId: string;
  word: string;
  letterTilesCorrect: number;
  wordBankCorrect: number;
  keyboardCorrect: number;
  createdAt: string;
  updatedAt: string;
}

// Progress tracking for family members
export interface FamilyProgress {
  userId: string;
  userName: string;
  role: "parent" | "child";
  birthYear?: number;
  totalTests: number;
  averageScore: number;
  totalWords: number;
  correctWords: number;
  lastActivity: string;
  recentResults: TestResult[];
  // Mastery summary across all word sets
  totalWordsWithMastery: number; // Total unique words with any mastery
  letterTilesMasteredWords: number; // Words with letterTilesCorrect >= 2
  wordBankMasteredWords: number; // Words with wordBankCorrect >= 2
  keyboardMasteredWords: number; // Words with keyboardCorrect >= 2
}

// Family statistics
export interface FamilyStats {
  totalMembers: number;
  totalChildren: number;
  totalWordSets: number;
  totalTestsCompleted: number;
  averageFamilyScore: number;
  mostActiveChild?: string;
  lastActivity: string;
}

// WordSet Types
export interface WordAudio {
  word: string;
  audioUrl: string;
  audioId: string;
  voiceId: string;
  createdAt: string;
}

export interface Translation {
  language: string;
  text: string;
  audioUrl?: string;
  audioId?: string;
  voiceId?: string;
}

export interface WordSet {
  id: string;
  name: string;
  words: WordItem[]; // Array of word objects instead of strings
  sentences?: SentenceItem[]; // Optional array of sentences for sentence dictation
  description?: string; // Optional description for curated word sets
  familyId?: string; // Optional for global word sets (null when isGlobal is true)
  createdBy: string;
  language: "en" | "no";
  assignedUserIds?: string[]; // IDs of child users assigned to this wordset
  createdAt: string;
  updatedAt: string;
  isGlobal?: boolean; // True for system-created curated word sets
  // Curated content metadata
  targetGrade?: GradeLevel; // Norwegian school grade level (1-2, 3-4, 5-7)
  spellingFocus?: SpellingFocusCategory[]; // Spelling challenge categories
  difficulty?: DifficultyLevel; // Overall difficulty level
  // Test configuration for this wordset
  testConfiguration?: TestConfiguration;
}

// Sentence item for sentence dictation mode
export interface SentenceItem {
  sentence: string; // Full sentence text
  translation?: string; // Optional translation
  focusWords?: string[]; // Words being specifically tested in this sentence
  difficulty: DifficultyLevel; // beginner, intermediate, advanced
  pattern?: string; // Sentence pattern e.g., "S+V+O", "subordinate clause"
  audio?: WordAudio; // Audio info for the full sentence
}

export interface WordItem {
  word: string;
  definition?: string;
  audio?: WordAudio; // Audio info for this specific word
  translations?: Translation[]; // Translations to other languages
}

export interface WordTestResult {
  word: string;
  userAnswers: string[]; // All answers the user provided for this word
  attempts: number; // Number of attempts made
  correct: boolean; // Whether the word was answered correctly
  timeSpent: number; // Time spent on this word in seconds
  finalAnswer: string; // The final answer provided
  hintsUsed?: number; // Number of hints used (if applicable)
  audioPlayCount?: number; // Number of times audio was played
  errorTypes?: string[]; // Detected spelling error types (doubleConsonant, silentH, etc.)
}

export interface TestResult {
  id: string;
  wordSetId: string;
  userId: string;
  score: number; // Percentage (0-100)
  totalWords: number;
  correctWords: number;
  mode: "standard" | "dictation" | "translation"; // Test mode used
  incorrectWords?: string[] | null; // Deprecated: Use words field for detailed information
  words: WordTestResult[]; // Detailed information for each word in the test
  timeSpent: number; // Total time spent on test in seconds
  completedAt: string;
  createdAt: string;
}

// Test Types
export interface TestAnswer {
  word: string;
  userAnswers: string[]; // All answers the user provided for this word
  isCorrect: boolean; // Whether the word was answered correctly
  timeSpent: number; // Time spent on this word in seconds
  attempts: number; // Total number of attempts made
  finalAnswer: string; // The final answer provided
  hintsUsed?: number; // Number of hints used (if applicable)
  audioPlayCount?: number; // Number of times audio was played
  errorTypes?: string[]; // Detected spelling error types (doubleConsonant, silentH, etc.)
}

export interface TestConfiguration {
  maxAttempts: number; // How many tries per word (1-5, default: 3)
  showCorrectAnswer: boolean; // Show correct answer after failed attempts (default: true)
  autoAdvance: boolean; // Auto-advance after correct answer (default: true)
  timeLimit?: number; // Optional time limit per word in seconds (default: none)
  autoPlayAudio: boolean; // Auto-play word audio when starting/moving to next word (default: true)
  shuffleWords: boolean; // Randomize word order during test (default: false)
  enableAutocorrect: boolean; // Enable browser autocorrect/spellcheck in input field (default: false)
  defaultMode?: "standard" | "dictation" | "translation"; // Default test mode (default: standard)
  targetLanguage?: string; // Target language for translation mode
  translationDirection?: "toTarget" | "toSource" | "mixed"; // Direction for translation mode: toTarget (source→target), toSource (target→source), mixed (random)
  // Spelling feedback configuration
  almostCorrectThreshold?: number; // Levenshtein distance to consider "almost correct" (default: 2)
  showHintOnAttempt?: number; // Which attempt to show specific hints (default: 2 = progressive)
  enableKeyboardProximity?: boolean; // Detect QWERTY keyboard typos (default: true)
  // Progressive challenge configuration (sentence dictation)
  inputMethod?: InputMethod; // Input method for tests: keyboard, wordBank, letterTiles, or auto (default: auto)
  allowReplay?: boolean; // Allow practicing easier modes after unlocking harder ones (default: true)
}

// Default test configuration
export const DEFAULT_TEST_CONFIG: TestConfiguration = {
  maxAttempts: 3,
  showCorrectAnswer: true,
  autoAdvance: true,
  autoPlayAudio: true,
  shuffleWords: false,
  enableAutocorrect: false,
  translationDirection: "toTarget",
  inputMethod: "auto",
  allowReplay: true,
};

// Helper functions for test configuration
export function getEffectiveTestConfig(wordSet: WordSet): TestConfiguration {
  return {
    ...DEFAULT_TEST_CONFIG,
    ...wordSet.testConfiguration,
  };
}

export function validateTestConfiguration(
  config: Partial<TestConfiguration>,
): TestConfiguration {
  return {
    maxAttempts: Math.max(
      1,
      Math.min(5, config.maxAttempts ?? DEFAULT_TEST_CONFIG.maxAttempts),
    ),
    showCorrectAnswer:
      config.showCorrectAnswer ?? DEFAULT_TEST_CONFIG.showCorrectAnswer,
    autoAdvance: config.autoAdvance ?? DEFAULT_TEST_CONFIG.autoAdvance,
    timeLimit:
      config.timeLimit && config.timeLimit > 0 ? config.timeLimit : undefined,
    autoPlayAudio: config.autoPlayAudio ?? DEFAULT_TEST_CONFIG.autoPlayAudio,
    shuffleWords: config.shuffleWords ?? DEFAULT_TEST_CONFIG.shuffleWords,
    enableAutocorrect:
      config.enableAutocorrect ?? DEFAULT_TEST_CONFIG.enableAutocorrect,
  };
}
