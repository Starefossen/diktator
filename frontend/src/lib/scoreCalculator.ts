/**
 * Score Calculator - Weighted scoring system for spelling tests
 *
 * This module provides both simple (correct/total) and weighted scoring.
 * Weighted scoring rewards first-attempt success and penalizes multiple attempts.
 */

import { TestAnswer } from "@/types";

/**
 * Weight configuration for scoring
 * These weights determine the score contribution based on attempts
 */
export const SCORE_WEIGHTS = {
  /** Score for correct on first attempt (100% of word value) */
  FIRST_ATTEMPT: 1.0,
  /** Score for correct on second attempt (70% of word value) */
  SECOND_ATTEMPT: 0.7,
  /** Score for correct on third attempt (40% of word value) */
  THIRD_ATTEMPT: 0.4,
  /** Score for failed word after all attempts (0% of word value) */
  FAILED: 0.0,
} as const;

export interface ScoreBreakdown {
  /** Simple percentage: correct/total * 100 */
  simpleScore: number;
  /** Weighted percentage taking attempts into account */
  weightedScore: number;
  /** Number of words correct on first attempt */
  firstAttemptCorrect: number;
  /** Number of words correct on second attempt */
  secondAttemptCorrect: number;
  /** Number of words correct on third attempt */
  thirdAttemptCorrect: number;
  /** Number of words correct on 4+ attempts (scored as 0%) */
  fourPlusAttemptCorrect: number;
  /** Number of words failed (not answered correctly) */
  failed: number;
  /** Total number of words */
  totalWords: number;
  /** Whether all words were perfect (first attempt) */
  isPerfect: boolean;
}

/**
 * Get the weight for a given number of attempts
 * 1st: 100%, 2nd: 70%, 3rd: 40%, 4+: 0%
 */
function getAttemptWeight(attempts: number, isCorrect: boolean): number {
  if (!isCorrect) return SCORE_WEIGHTS.FAILED;
  if (attempts === 1) return SCORE_WEIGHTS.FIRST_ATTEMPT;
  if (attempts === 2) return SCORE_WEIGHTS.SECOND_ATTEMPT;
  if (attempts === 3) return SCORE_WEIGHTS.THIRD_ATTEMPT;
  return SCORE_WEIGHTS.FAILED; // 4+ attempts score 0%
}

/**
 * Calculate both simple and weighted scores from test answers
 *
 * Simple score: (correct / total) * 100
 * Weighted score: Takes into account number of attempts per word
 *
 * @param answers - Array of test answers with attempt information
 * @returns Score breakdown with both scoring methods
 */
export function calculateScores(answers: TestAnswer[]): ScoreBreakdown {
  if (answers.length === 0) {
    return {
      simpleScore: 0,
      weightedScore: 0,
      firstAttemptCorrect: 0,
      secondAttemptCorrect: 0,
      thirdAttemptCorrect: 0,
      fourPlusAttemptCorrect: 0,
      failed: 0,
      totalWords: 0,
      isPerfect: false,
    };
  }

  let firstAttemptCorrect = 0;
  let secondAttemptCorrect = 0;
  let thirdAttemptCorrect = 0;
  let fourPlusAttemptCorrect = 0;
  let failed = 0;
  let weightedSum = 0;

  for (const answer of answers) {
    const weight = getAttemptWeight(answer.attempts, answer.isCorrect);
    weightedSum += weight;

    if (!answer.isCorrect) {
      failed++;
    } else if (answer.attempts === 1) {
      firstAttemptCorrect++;
    } else if (answer.attempts === 2) {
      secondAttemptCorrect++;
    } else if (answer.attempts === 3) {
      thirdAttemptCorrect++;
    } else {
      fourPlusAttemptCorrect++;
    }
  }

  const totalWords = answers.length;
  const correctWords = totalWords - failed;
  const simpleScore = Math.round((correctWords / totalWords) * 100);
  const weightedScore = Math.round((weightedSum / totalWords) * 100);
  const isPerfect = firstAttemptCorrect === totalWords;

  return {
    simpleScore,
    weightedScore,
    firstAttemptCorrect,
    secondAttemptCorrect,
    thirdAttemptCorrect,
    fourPlusAttemptCorrect,
    failed,
    totalWords,
    isPerfect,
  };
}
