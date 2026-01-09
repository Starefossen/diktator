import { describe, it, expect } from "vitest";
import { calculateScores, SCORE_WEIGHTS } from "../scoreCalculator";
import { TestAnswer } from "@/types";

describe("scoreCalculator", () => {
  describe("calculateScores", () => {
    it("should return 100% for all words correct on first attempt", () => {
      const answers: TestAnswer[] = [
        {
          word: "word1",
          userAnswers: ["word1"],
          isCorrect: true,
          timeSpent: 5,
          attempts: 1,
          finalAnswer: "word1",
        },
        {
          word: "word2",
          userAnswers: ["word2"],
          isCorrect: true,
          timeSpent: 5,
          attempts: 1,
          finalAnswer: "word2",
        },
      ];

      const result = calculateScores(answers);

      expect(result.simpleScore).toBe(100);
      expect(result.weightedScore).toBe(100);
      expect(result.isPerfect).toBe(true);
      expect(result.firstAttemptCorrect).toBe(2);
      expect(result.secondAttemptCorrect).toBe(0);
      expect(result.thirdPlusAttemptCorrect).toBe(0);
      expect(result.failed).toBe(0);
    });

    it("should return lower weighted score for words needing multiple attempts", () => {
      const answers: TestAnswer[] = [
        {
          word: "word1",
          userAnswers: ["word1"],
          isCorrect: true,
          timeSpent: 5,
          attempts: 1,
          finalAnswer: "word1",
        },
        {
          word: "word2",
          userAnswers: ["wrong", "word2"],
          isCorrect: true,
          timeSpent: 10,
          attempts: 2,
          finalAnswer: "word2",
        },
      ];

      const result = calculateScores(answers);

      // Simple: 2/2 = 100%
      expect(result.simpleScore).toBe(100);
      // Weighted: (1.0 + 0.7) / 2 = 0.85 = 85%
      expect(result.weightedScore).toBe(85);
      expect(result.isPerfect).toBe(false);
      expect(result.firstAttemptCorrect).toBe(1);
      expect(result.secondAttemptCorrect).toBe(1);
    });

    it("should give 0 points for failed words", () => {
      const answers: TestAnswer[] = [
        {
          word: "word1",
          userAnswers: ["word1"],
          isCorrect: true,
          timeSpent: 5,
          attempts: 1,
          finalAnswer: "word1",
        },
        {
          word: "word2",
          userAnswers: ["wrong1", "wrong2", "wrong3"],
          isCorrect: false,
          timeSpent: 15,
          attempts: 3,
          finalAnswer: "wrong3",
        },
      ];

      const result = calculateScores(answers);

      // Simple: 1/2 = 50%
      expect(result.simpleScore).toBe(50);
      // Weighted: (1.0 + 0.0) / 2 = 0.5 = 50%
      expect(result.weightedScore).toBe(50);
      expect(result.isPerfect).toBe(false);
      expect(result.firstAttemptCorrect).toBe(1);
      expect(result.failed).toBe(1);
    });

    it("should handle third+ attempts with reduced weight", () => {
      const answers: TestAnswer[] = [
        {
          word: "word1",
          userAnswers: ["w1", "w2", "word1"],
          isCorrect: true,
          timeSpent: 15,
          attempts: 3,
          finalAnswer: "word1",
        },
      ];

      const result = calculateScores(answers);

      // Weighted: 0.4 / 1 = 40%
      expect(result.weightedScore).toBe(40);
      expect(result.thirdPlusAttemptCorrect).toBe(1);
    });

    it("should handle empty answers array", () => {
      const result = calculateScores([]);

      expect(result.simpleScore).toBe(0);
      expect(result.weightedScore).toBe(0);
      expect(result.totalWords).toBe(0);
      expect(result.isPerfect).toBe(false);
    });

    it("should calculate complex mixed scenario correctly", () => {
      const answers: TestAnswer[] = [
        // First attempt correct (1.0)
        {
          word: "easy",
          userAnswers: ["easy"],
          isCorrect: true,
          timeSpent: 3,
          attempts: 1,
          finalAnswer: "easy",
        },
        // Second attempt correct (0.7)
        {
          word: "medium",
          userAnswers: ["meedium", "medium"],
          isCorrect: true,
          timeSpent: 8,
          attempts: 2,
          finalAnswer: "medium",
        },
        // Third attempt correct (0.4)
        {
          word: "hard",
          userAnswers: ["hrad", "hadr", "hard"],
          isCorrect: true,
          timeSpent: 12,
          attempts: 3,
          finalAnswer: "hard",
        },
        // Failed (0.0)
        {
          word: "veryhard",
          userAnswers: ["verhard", "verihard", "verihrad"],
          isCorrect: false,
          timeSpent: 15,
          attempts: 3,
          finalAnswer: "verihrad",
        },
      ];

      const result = calculateScores(answers);

      // Simple: 3/4 = 75%
      expect(result.simpleScore).toBe(75);
      // Weighted: (1.0 + 0.7 + 0.4 + 0.0) / 4 = 2.1/4 = 0.525 = 53% (rounded)
      expect(result.weightedScore).toBe(53);
      expect(result.isPerfect).toBe(false);
      expect(result.firstAttemptCorrect).toBe(1);
      expect(result.secondAttemptCorrect).toBe(1);
      expect(result.thirdPlusAttemptCorrect).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.totalWords).toBe(4);
    });
  });

  describe("SCORE_WEIGHTS", () => {
    it("should have correct weight values", () => {
      expect(SCORE_WEIGHTS.FIRST_ATTEMPT).toBe(1.0);
      expect(SCORE_WEIGHTS.SECOND_ATTEMPT).toBe(0.7);
      expect(SCORE_WEIGHTS.THIRD_ATTEMPT).toBe(0.4);
      expect(SCORE_WEIGHTS.FAILED).toBe(0.0);
    });
  });
});
