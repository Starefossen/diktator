// src/types/index.ts - Shared type definitions

// Family Type
export interface Family {
  id: string;
  name: string;
  createdBy: string;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  email: string;
  displayName: string;
  role: "parent" | "child";
  joinedAt: string;
}

// Family Invitation Type
export interface FamilyInvitation {
  id: string;
  familyId: string;
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
  createdAt: string;
  lastActiveAt: string;
}

// Progress tracking for family members
export interface FamilyProgress {
  userId: string;
  userName: string;
  role: "parent" | "child";
  totalTests: number;
  averageScore: number;
  totalWords: number;
  correctWords: number;
  lastActivity: string;
  recentResults: TestResult[];
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

export interface CreateChildAccountRequest {
  email: string;
  displayName: string;
  familyId?: string; // Optional - can be set by backend from authenticated user
}

export interface AddFamilyMemberRequest {
  email: string;
  displayName: string;
  role: "parent" | "child";
  familyId?: string; // Optional - can be set by backend from authenticated user
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
  familyId: string;
  createdBy: string;
  language: "en" | "no";
  createdAt: string;
  updatedAt: string;
  // Test configuration for this wordset
  testConfiguration?: TestConfiguration;
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
