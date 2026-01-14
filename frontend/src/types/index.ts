// src/types/index.ts - Shared type definitions

import type {
  DifficultyLevel,
  GradeLevel,
  SpellingFocusCategory,
} from "@/lib/sentenceConfig";

// ======================
// Test Mode Types (Unified)
// ======================

/**
 * Unified test mode type - combines what were previously "test modes" and "input methods"
 * See docs/LEARNING.md for detailed descriptions of each mode
 */
export type TestMode =
  | "letterTiles" // Build It: arrange scrambled letters
  | "wordBank" // Pick Words: tap words to build sentence
  | "keyboard" // Type It: full spelling production
  | "missingLetters" // Fill the Gap: complete the blanks
  | "flashcard" // Quick Look: see word, countdown, self-check
  | "lookCoverWrite" // Memory Spell: see, hide, type from memory
  | "translation"; // Switch Languages: type in other language

/**
 * All valid test modes for iteration and validation
 */
export const TEST_MODES: TestMode[] = [
  "letterTiles",
  "wordBank",
  "keyboard",
  "missingLetters",
  "flashcard",
  "lookCoverWrite",
  "translation",
];

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
  totalXp?: number; // Total XP earned
  level?: number; // Current level based on XP
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
  missingLettersCorrect: number;
  translationCorrect: number;
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
  missingLettersMasteredWords: number; // Words with missingLettersCorrect >= 2
  translationMasteredWords: number; // Words with translationCorrect >= 2
  // XP and level data
  totalXp: number;
  level: number;
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
  mode: TestMode; // Unified test mode
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
  defaultMode?: TestMode; // Default test mode (default: keyboard)
  targetLanguage?: string; // Target language for translation mode
  translationDirection?: "toTarget" | "toSource" | "mixed"; // Direction for translation mode: toTarget (source→target), toSource (target→source), mixed (random)
  // Spelling feedback configuration
  almostCorrectThreshold?: number; // Levenshtein distance to consider "almost correct" (default: 2)
  showHintOnAttempt?: number; // Which attempt to show specific hints (default: 2 = progressive)
  enableKeyboardProximity?: boolean; // Detect QWERTY keyboard typos (default: true)
  // Progressive challenge configuration
  allowReplay?: boolean; // Allow practicing easier modes after unlocking harder ones (default: true)
  // Specialized mode durations (in milliseconds)
  flashcardShowDuration?: number; // How long to show word in flashcard mode before countdown (default: 3000)
  lookCoverWriteLookDuration?: number; // How long to show word in look-cover-write mode (default: 4000)
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
  defaultMode: "keyboard",
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

// ======================
// XP & Level Types
// ======================

/**
 * XP information returned after saving a test result
 */
export interface XPInfo {
  awarded: number; // XP earned from this test
  total: number; // New total XP
  level: number; // Current level number
  levelName: string; // Level name in English
  levelNameNo: string; // Level name in Norwegian
  levelIconPath: string; // Path to level icon
  levelUp: boolean; // Whether user leveled up
  previousLevel?: number; // Previous level (if leveled up)
  nextLevelXp: number; // XP needed for next level
  currentLevelXp: number; // XP threshold for current level
}

/**
 * Response from saving a test result (includes XP data)
 */
interface SaveResultResponse {
  testResult: TestResult;
  xp?: XPInfo;
}

/**
 * Level definition for the Nordic-themed progression system
 */
export interface Level {
  number: number;
  name: string; // English name
  nameNo: string; // Norwegian name
  xpRequired: number; // XP to reach this level from previous
  totalXp: number; // Total XP threshold for this level
  iconPath: string; // Path to level icon
}

/**
 * Nordic-themed levels (1-10)
 * See docs/GAMIFICATION.md for full details
 */
const LEVELS: Level[] = [
  {
    number: 1,
    name: "Snow Mouse",
    nameNo: "Snømus",
    xpRequired: 0,
    totalXp: 0,
    iconPath: "/levels/level-01-snomus.svg",
  },
  {
    number: 2,
    name: "Arctic Fox",
    nameNo: "Fjellrev",
    xpRequired: 100,
    totalXp: 100,
    iconPath: "/levels/level-02-fjellrev.svg",
  },
  {
    number: 3,
    name: "Arctic Hare",
    nameNo: "Snøhare",
    xpRequired: 200,
    totalXp: 300,
    iconPath: "/levels/level-03-snohare.svg",
  },
  {
    number: 4,
    name: "Reindeer",
    nameNo: "Rein",
    xpRequired: 300,
    totalXp: 600,
    iconPath: "/levels/level-04-rein.svg",
  },
  {
    number: 5,
    name: "Snowy Owl",
    nameNo: "Snøugle",
    xpRequired: 400,
    totalXp: 1000,
    iconPath: "/levels/level-05-snougle.svg",
  },
  {
    number: 6,
    name: "Wolverine",
    nameNo: "Jerv",
    xpRequired: 500,
    totalXp: 1500,
    iconPath: "/levels/level-06-jerv.svg",
  },
  {
    number: 7,
    name: "Wolf",
    nameNo: "Ulv",
    xpRequired: 600,
    totalXp: 2100,
    iconPath: "/levels/level-07-ulv.svg",
  },
  {
    number: 8,
    name: "Polar Bear",
    nameNo: "Isbjørn",
    xpRequired: 700,
    totalXp: 2800,
    iconPath: "/levels/level-08-isbjorn.svg",
  },
  {
    number: 9,
    name: "Northern Lights",
    nameNo: "Nordlys",
    xpRequired: 800,
    totalXp: 3600,
    iconPath: "/levels/level-09-nordlys.svg",
  },
  {
    number: 10,
    name: "Midnight Sun",
    nameNo: "Midnattsol",
    xpRequired: 900,
    totalXp: 4500,
    iconPath: "/levels/level-10-midnattsol.svg",
  },
];

/**
 * Level beyond 10 (Polar Explorer)
 */
const POLAR_EXPLORER_LEVEL = {
  name: "Polar Explorer",
  nameNo: "Polarforsker",
  iconPath: "/levels/level-11-polarforsker.svg",
  xpPerLevel: 1000,
};

/**
 * Get level info for a given level number
 */
export function getLevelInfo(levelNumber: number): Level {
  if (levelNumber <= 10) {
    return LEVELS[levelNumber - 1];
  }
  // Beyond level 10
  const level10 = LEVELS[9];
  return {
    number: levelNumber,
    name: POLAR_EXPLORER_LEVEL.name,
    nameNo: POLAR_EXPLORER_LEVEL.nameNo,
    xpRequired: POLAR_EXPLORER_LEVEL.xpPerLevel,
    totalXp:
      level10.totalXp + (levelNumber - 10) * POLAR_EXPLORER_LEVEL.xpPerLevel,
    iconPath: POLAR_EXPLORER_LEVEL.iconPath,
  };
}

/**
 * Get the level number for a given total XP
 */
function getLevelForXP(totalXp: number): number {
  // Check if beyond level 10
  const level10 = LEVELS[9];
  if (totalXp >= level10.totalXp) {
    const xpBeyond10 = totalXp - level10.totalXp;
    return 10 + Math.floor(xpBeyond10 / POLAR_EXPLORER_LEVEL.xpPerLevel);
  }
  // Find level in standard range
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].totalXp) {
      return LEVELS[i].number;
    }
  }
  return 1;
}

/**
 * Calculate progress to next level as a percentage (0-100)
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = getLevelForXP(totalXp);
  const currentLevelInfo = getLevelInfo(currentLevel);
  const nextLevelInfo = getLevelInfo(currentLevel + 1);

  const xpIntoCurrentLevel = totalXp - currentLevelInfo.totalXp;
  const xpNeededForNext = nextLevelInfo.totalXp - currentLevelInfo.totalXp;

  if (xpNeededForNext <= 0) return 100;
  return Math.min(
    100,
    Math.floor((xpIntoCurrentLevel / xpNeededForNext) * 100),
  );
}
