/**
 * Sentence Scoring Utilities
 *
 * Provides scoring and alignment for sentence dictation:
 * - Longest Common Subsequence (LCS) for word-order comparison
 * - Partial credit scoring with attempt modifiers
 * - Word-level feedback with alignment
 */

import { analyzeSpelling, SpellingAnalysisResult } from "./spellingAnalysis";

// ============================================================================
// Types
// ============================================================================

export type WordFeedbackStatus =
  | "correct"
  | "incorrect"
  | "missing"
  | "extra"
  | "misspelled";

export interface WordFeedback {
  /** The word from the expected sentence (or user's extra word) */
  word: string;
  /** Status of this word in the answer */
  status: WordFeedbackStatus;
  /** User's actual word if different from expected */
  userWord?: string;
  /** Spelling analysis if misspelled */
  spellingAnalysis?: SpellingAnalysisResult;
  /** Position in expected sentence (0-indexed, -1 for extra words) */
  expectedPosition: number;
  /** Position in user's answer (0-indexed, -1 for missing words) */
  userPosition: number;
}

export interface SentenceScoringResult {
  /** Number of correct words (exact or close enough matches) */
  correctCount: number;
  /** Total expected words */
  totalExpected: number;
  /** Score as percentage (0-100) */
  score: number;
  /** Adjusted score with attempt modifier */
  adjustedScore: number;
  /** Per-word feedback */
  wordFeedback: WordFeedback[];
  /** Whether the sentence is fully correct */
  isFullyCorrect: boolean;
  /** LCS length (longest common subsequence) */
  lcsLength: number;
  /** Order accuracy (LCS / expected length) */
  orderAccuracy: number;
}

export interface ScoringConfig {
  /** Levenshtein distance threshold to consider a word "close enough" */
  closeEnoughThreshold: number;
  /** Score multiplier for first attempt */
  firstAttemptMultiplier: number;
  /** Score multiplier for second attempt */
  secondAttemptMultiplier: number;
  /** Score multiplier for third+ attempt */
  thirdAttemptMultiplier: number;
  /** Whether to ignore punctuation in comparison */
  ignorePunctuation: boolean;
  /** Whether to ignore case in comparison */
  ignoreCase: boolean;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  closeEnoughThreshold: 1, // Allow 1 character difference
  firstAttemptMultiplier: 1.0,
  secondAttemptMultiplier: 0.8,
  thirdAttemptMultiplier: 0.6,
  ignorePunctuation: true,
  ignoreCase: true,
};

// ============================================================================
// Text Normalization
// ============================================================================

/**
 * Normalizes text for comparison by:
 * - Converting to lowercase (if configured)
 * - Removing punctuation (if configured)
 * - Normalizing whitespace
 */
export function normalizeText(
  text: string,
  config: Pick<ScoringConfig, "ignorePunctuation" | "ignoreCase"> = {
    ignorePunctuation: true,
    ignoreCase: true,
  },
): string {
  let normalized = text.trim();

  if (config.ignoreCase) {
    normalized = normalized.toLowerCase();
  }

  if (config.ignorePunctuation) {
    // Remove common punctuation but keep Norwegian characters
    normalized = normalized.replace(/[.,!?;:'"()[\]{}«»–—-]/g, "");
  }

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Splits text into words for comparison
 */
export function tokenize(
  text: string,
  config: Pick<ScoringConfig, "ignorePunctuation" | "ignoreCase"> = {
    ignorePunctuation: true,
    ignoreCase: true,
  },
): string[] {
  const normalized = normalizeText(text, config);
  return normalized.split(" ").filter((word) => word.length > 0);
}

// ============================================================================
// Longest Common Subsequence (LCS)
// ============================================================================

/**
 * Computes the Longest Common Subsequence length between two word arrays.
 * This measures how many words appear in the same relative order.
 */
export function computeLCSLength(expected: string[], actual: string[]): number {
  const m = expected.length;
  const n = actual.length;

  // DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (expected[i - 1] === actual[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Reconstructs the LCS as an array of indices showing which words matched.
 * Returns array of [expectedIndex, actualIndex] pairs.
 */
export function reconstructLCS(
  expected: string[],
  actual: string[],
): Array<[number, number]> {
  const m = expected.length;
  const n = actual.length;

  // DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (expected[i - 1] === actual[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the actual LCS
  const result: Array<[number, number]> = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (expected[i - 1] === actual[j - 1]) {
      result.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

// ============================================================================
// Word Matching with Fuzzy Matching
// ============================================================================

/**
 * Computes Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Checks if two words match within the fuzzy threshold.
 */
export function wordsMatch(
  expected: string,
  actual: string,
  threshold: number = 1,
): boolean {
  if (expected === actual) return true;
  if (threshold === 0) return false;

  const distance = levenshteinDistance(expected, actual);
  return distance <= threshold;
}

/**
 * Finds the best match for an expected word in the actual words.
 * Returns the index and distance, or null if no close match found.
 */
function findBestMatch(
  expected: string,
  actualWords: string[],
  usedIndices: Set<number>,
  threshold: number,
): { index: number; distance: number } | null {
  let bestIndex = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < actualWords.length; i++) {
    if (usedIndices.has(i)) continue;

    const distance = levenshteinDistance(expected, actualWords[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  if (bestIndex >= 0 && bestDistance <= threshold) {
    return { index: bestIndex, distance: bestDistance };
  }

  return null;
}

// ============================================================================
// Sentence Alignment
// ============================================================================

export interface AlignmentResult {
  /** Pairs of [expectedIndex, actualIndex] for matched words */
  matches: Array<{
    expectedIndex: number;
    actualIndex: number;
    isExact: boolean;
    distance: number;
  }>;
  /** Indices of expected words that weren't matched */
  missingIndices: number[];
  /** Indices of actual words that weren't matched (extra) */
  extraIndices: number[];
}

/**
 * Aligns expected and actual word arrays, finding the best matching.
 * Uses a greedy approach that prefers:
 * 1. Exact matches in order (LCS)
 * 2. Fuzzy matches for remaining words
 */
export function alignSentences(
  expectedWords: string[],
  actualWords: string[],
  config: Pick<ScoringConfig, "closeEnoughThreshold"> = {
    closeEnoughThreshold: 1,
  },
): AlignmentResult {
  const matches: AlignmentResult["matches"] = [];
  const usedExpected = new Set<number>();
  const usedActual = new Set<number>();

  // First pass: Find exact matches using LCS for word order
  const lcsMatches = reconstructLCS(expectedWords, actualWords);
  for (const [expIdx, actIdx] of lcsMatches) {
    matches.push({
      expectedIndex: expIdx,
      actualIndex: actIdx,
      isExact: true,
      distance: 0,
    });
    usedExpected.add(expIdx);
    usedActual.add(actIdx);
  }

  // Second pass: Find fuzzy matches for unmatched expected words
  for (let expIdx = 0; expIdx < expectedWords.length; expIdx++) {
    if (usedExpected.has(expIdx)) continue;

    const bestMatch = findBestMatch(
      expectedWords[expIdx],
      actualWords,
      usedActual,
      config.closeEnoughThreshold,
    );

    if (bestMatch) {
      matches.push({
        expectedIndex: expIdx,
        actualIndex: bestMatch.index,
        isExact: false,
        distance: bestMatch.distance,
      });
      usedExpected.add(expIdx);
      usedActual.add(bestMatch.index);
    }
  }

  // Collect missing and extra indices
  const missingIndices: number[] = [];
  const extraIndices: number[] = [];

  for (let i = 0; i < expectedWords.length; i++) {
    if (!usedExpected.has(i)) missingIndices.push(i);
  }

  for (let i = 0; i < actualWords.length; i++) {
    if (!usedActual.has(i)) extraIndices.push(i);
  }

  // Sort matches by expected index for consistent ordering
  matches.sort((a, b) => a.expectedIndex - b.expectedIndex);

  return { matches, missingIndices, extraIndices };
}

// ============================================================================
// Scoring
// ============================================================================

/**
 * Gets the attempt multiplier based on attempt number.
 */
function getAttemptMultiplier(
  attempt: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): number {
  if (attempt <= 1) return config.firstAttemptMultiplier;
  if (attempt === 2) return config.secondAttemptMultiplier;
  return config.thirdAttemptMultiplier;
}

/**
 * Scores a sentence answer against the expected sentence.
 */
export function scoreSentence(
  expected: string,
  actual: string,
  attempt: number = 1,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): SentenceScoringResult {
  const expectedWords = tokenize(expected, config);
  const actualWords = tokenize(actual, config);

  // Handle empty cases
  if (expectedWords.length === 0) {
    return {
      correctCount: actualWords.length === 0 ? 1 : 0,
      totalExpected: 1,
      score: actualWords.length === 0 ? 100 : 0,
      adjustedScore: actualWords.length === 0 ? 100 : 0,
      wordFeedback: [],
      isFullyCorrect: actualWords.length === 0,
      lcsLength: 0,
      orderAccuracy: actualWords.length === 0 ? 1 : 0,
    };
  }

  if (actualWords.length === 0) {
    const feedback: WordFeedback[] = expectedWords.map((word, i) => ({
      word,
      status: "missing" as WordFeedbackStatus,
      expectedPosition: i,
      userPosition: -1,
    }));

    return {
      correctCount: 0,
      totalExpected: expectedWords.length,
      score: 0,
      adjustedScore: 0,
      wordFeedback: feedback,
      isFullyCorrect: false,
      lcsLength: 0,
      orderAccuracy: 0,
    };
  }

  // Align sentences
  const alignment = alignSentences(expectedWords, actualWords, config);
  const lcsLength = computeLCSLength(expectedWords, actualWords);

  // Build feedback array
  const wordFeedback: WordFeedback[] = [];

  // Process matched words
  for (const match of alignment.matches) {
    const expectedWord = expectedWords[match.expectedIndex];
    const actualWord = actualWords[match.actualIndex];

    if (match.isExact) {
      wordFeedback.push({
        word: expectedWord,
        status: "correct",
        expectedPosition: match.expectedIndex,
        userPosition: match.actualIndex,
      });
    } else {
      // Misspelled but close
      const spellingAnalysis = analyzeSpelling(actualWord, expectedWord);
      wordFeedback.push({
        word: expectedWord,
        status: "misspelled",
        userWord: actualWord,
        spellingAnalysis,
        expectedPosition: match.expectedIndex,
        userPosition: match.actualIndex,
      });
    }
  }

  // Add missing words
  for (const expIdx of alignment.missingIndices) {
    wordFeedback.push({
      word: expectedWords[expIdx],
      status: "missing",
      expectedPosition: expIdx,
      userPosition: -1,
    });
  }

  // Add extra words
  for (const actIdx of alignment.extraIndices) {
    wordFeedback.push({
      word: actualWords[actIdx],
      status: "extra",
      expectedPosition: -1,
      userPosition: actIdx,
    });
  }

  // Sort by expected position (missing/correct/misspelled first), then extra words
  wordFeedback.sort((a, b) => {
    if (a.expectedPosition === -1 && b.expectedPosition === -1) {
      return a.userPosition - b.userPosition;
    }
    if (a.expectedPosition === -1) return 1;
    if (b.expectedPosition === -1) return -1;
    return a.expectedPosition - b.expectedPosition;
  });

  // Calculate scores
  const correctCount = alignment.matches.filter((m) => m.isExact).length;
  const closeCount = alignment.matches.filter((m) => !m.isExact).length;

  // Partial credit: exact matches = 1 point, close matches = 0.5 points
  const rawPoints = correctCount + closeCount * 0.5;
  const score = Math.round((rawPoints / expectedWords.length) * 100);

  const multiplier = getAttemptMultiplier(attempt, config);
  const adjustedScore = Math.round(score * multiplier);

  const orderAccuracy =
    expectedWords.length > 0 ? lcsLength / expectedWords.length : 1;
  const isFullyCorrect =
    correctCount === expectedWords.length &&
    alignment.extraIndices.length === 0;

  return {
    correctCount,
    totalExpected: expectedWords.length,
    score,
    adjustedScore,
    wordFeedback,
    isFullyCorrect,
    lcsLength,
    orderAccuracy,
  };
}

// ============================================================================
// Feedback Helpers
// ============================================================================

/**
 * Gets a summary message for the sentence result.
 * Returns an i18n key.
 */
export function getSentenceFeedbackKey(result: SentenceScoringResult): string {
  if (result.isFullyCorrect) {
    return "test.sentence.perfect";
  }

  const ratio = result.correctCount / result.totalExpected;

  if (ratio >= 0.8) {
    return "test.sentence.almostPerfect";
  }

  if (ratio >= 0.5) {
    return "test.sentence.goodProgress";
  }

  if (ratio > 0) {
    return "test.sentence.keepTrying";
  }

  return "test.sentence.tryAgain";
}

/**
 * Gets per-word styling class based on feedback status.
 */
export function getWordStatusClass(status: WordFeedbackStatus): string {
  switch (status) {
    case "correct":
      return "text-green-700 bg-green-50";
    case "misspelled":
      return "text-amber-700 bg-amber-50";
    case "missing":
      return "text-red-700 bg-red-50 line-through";
    case "extra":
      return "text-gray-500 bg-gray-100 line-through";
    case "incorrect":
      return "text-red-700 bg-red-50";
    default:
      return "";
  }
}

/**
 * Formats word feedback for display.
 */
function formatWordFeedback(feedback: WordFeedback): string {
  switch (feedback.status) {
    case "correct":
      return feedback.word;
    case "misspelled":
      return `${feedback.userWord} → ${feedback.word}`;
    case "missing":
      return `[${feedback.word}]`;
    case "extra":
      return feedback.word;
    default:
      return feedback.word;
  }
}
