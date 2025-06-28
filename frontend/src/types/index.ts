// src/types/index.ts - Enhanced for Phase 2

// Family Management Types
export interface Family {
  id: string;
  name: string;
  createdBy: string; // Parent's user ID
  members: string[]; // Array of user IDs in the family
  createdAt: string;
  updatedAt: string;
}

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

export interface ParentUser {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: "parent";
  children: string[]; // Array of child user IDs
  createdAt: string;
  lastActiveAt: string;
}

// Enhanced User data interface to support family management
export interface EnhancedUserData {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: "parent" | "child";
  parentId?: string; // Only for child accounts
  children?: string[]; // Only for parent accounts
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// Family invitation system
export interface FamilyInvitation {
  id: string;
  familyId: string;
  email: string;
  role: "child" | "parent";
  invitedBy: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt: string;
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

// API Request types for family management
export interface CreateChildAccountRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface InviteFamilyMemberRequest {
  email: string;
  role: "child" | "parent";
  familyId: string;
}

// Existing User, WordSet, TestResult, AudioFile, and other types...
export interface User {
  id: string;
  email: string;
  familyId: string;
  createdAt: string;
}

export interface WordAudio {
  word: string;
  audioUrl: string;
  audioId: string;
  voiceId: string;
  createdAt: string;
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
  // Audio processing status
  audioProcessing?: "pending" | "completed" | "failed";
  audioProcessedAt?: string;
  // Test configuration for this wordset
  testConfiguration?: TestConfiguration;
}

export interface WordItem {
  word: string;
  definition?: string;
  audio?: WordAudio; // Audio info for this specific word
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
  words: string[]; // Frontend still sends simple strings, backend converts to WordItem
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
  enableAutocorrect: boolean; // Enable browser autocorrect/spellcheck in input field (default: false)
}

// Default test configuration
export const DEFAULT_TEST_CONFIG: TestConfiguration = {
  maxAttempts: 3,
  showCorrectAnswer: true,
  autoAdvance: true,
  autoPlayAudio: true,
  shuffleWords: false,
  enableAutocorrect: false,
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
    enableAutocorrect:
      config.enableAutocorrect ?? DEFAULT_TEST_CONFIG.enableAutocorrect,
  };
}
