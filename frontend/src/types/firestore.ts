// Basic Firestore types for MVP
export interface TestResult {
  id: string;
  userId: string;
  wordSetName: string;
  language: "en" | "no";
  score: number;
  totalWords: number;
  correctWords: number;
  timeSpent: number;
  completedAt: string;
  createdAt: string;
}

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: "parent" | "child";
  createdAt: string;
  lastActiveAt: string;
}

export interface WordSet {
  id: string;
  name: string;
  words: string[];
  language: "en" | "no";
  familyId: string;
  createdBy: string;
  createdAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
}
