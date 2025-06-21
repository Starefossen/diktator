// src/types/index.ts - Keep it simple for MVP!

export interface User {
  id: string;
  email: string;
  familyId: string;
}

export interface WordSet {
  id: string;
  name: string;
  words: string[];
  familyId: string;
}

export interface TestResult {
  id: string;
  wordSetId: string;
  userId: string;
  score: number;
  completedAt: string;
}

// Simple API Response
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Basic form type
export interface CreateWordSetForm {
  name: string;
  words: string[];
}
