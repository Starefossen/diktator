// src/types/index.ts - Enhanced for Phase 2

export interface User {
  id: string;
  email: string;
  familyId: string;
  createdAt: string;
}

export interface WordSet {
  id: string;
  name: string;
  words: string[];
  familyId: string;
  createdBy: string;
  language: "en" | "no";
  createdAt: string;
  updatedAt: string;
  // Test configuration for this wordset
  testConfiguration?: TestConfiguration;
}

export interface TestResult {
  id: string;
  wordSetId: string;
  userId: string;
  score: number; // Percentage (0-100)
  totalWords: number;
  correctWords: number;
  incorrectWords: string[] | null; // Can be null if no incorrect words
  timeSpent: number; // seconds
  completedAt: string;
  createdAt: string;
}

export interface AudioFile {
  id: string;
  word: string;
  language: "en" | "no";
  voiceId: string;
  storagePath: string;
  url: string;
  createdAt: string;
}

// API Request types
export interface CreateWordSetRequest {
  name: string;
  words: string[];
  language: "en" | "no";
  testConfiguration?: TestConfiguration;
}

export interface SaveResultRequest {
  wordSetId: string;
  score: number;
  totalWords: number;
  correctWords: number;
  incorrectWords: string[]; // When saving, we always provide an array (can be empty)
  timeSpent: number;
}

// API Response
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Form types
export interface CreateWordSetForm {
  name: string;
  words: string[];
  language: "en" | "no";
}

export interface TestAnswer {
  word: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  attemptNumber?: number; // Track which attempt this was
}

export interface TestConfiguration {
  maxAttempts: number; // How many tries per word (1-5, default: 3)
  showCorrectAnswer: boolean; // Show correct answer after failed attempts (default: true)
  autoAdvance: boolean; // Auto-advance after correct answer (default: true)
  timeLimit?: number; // Optional time limit per word in seconds (default: none)
  autoPlayAudio: boolean; // Auto-play word audio when starting/moving to next word (default: true)
  shuffleWords: boolean; // Randomize word order during test (default: false)
}

// Default test configuration
export const DEFAULT_TEST_CONFIG: TestConfiguration = {
  maxAttempts: 3,
  showCorrectAnswer: true,
  autoAdvance: true,
  autoPlayAudio: true,
  shuffleWords: false,
};

export interface TestSession {
  wordSetId: string;
  words: string[];
  currentWordIndex: number;
  answers: TestAnswer[];
  startTime: Date;
  isCompleted: boolean;
  configuration: TestConfiguration;
  currentAttempts: { [wordIndex: number]: number }; // Track attempts per word
}

// UI State types
export type Language = "en" | "no";

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

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
  };
}
