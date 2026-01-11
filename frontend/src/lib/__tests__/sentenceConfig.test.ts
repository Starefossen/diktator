import { describe, it, expect } from "vitest";
import {
  isSentence,
  getWordCount,
  classifySentenceDifficulty,
  MASTERY_CONFIG,
  CHALLENGE_CONFIG,
} from "../sentenceConfig";

describe("sentenceConfig", () => {
  describe("isSentence", () => {
    it("returns false for single word", () => {
      expect(isSentence("hello")).toBe(false);
      expect(isSentence("katten")).toBe(false);
    });

    it("returns true for multiple words", () => {
      expect(isSentence("hello world")).toBe(true);
      expect(isSentence("katten sover")).toBe(true);
    });

    it("handles leading/trailing whitespace", () => {
      expect(isSentence("  hello  ")).toBe(false);
      expect(isSentence("  hello world  ")).toBe(true);
    });

    it("handles empty string", () => {
      expect(isSentence("")).toBe(false);
      expect(isSentence("   ")).toBe(false);
    });

    it("handles Norwegian sentences", () => {
      expect(isSentence("Katten sover på sofaen")).toBe(true);
      expect(isSentence("Blåbær og rømme")).toBe(true);
    });
  });

  describe("getWordCount", () => {
    it("counts words correctly", () => {
      expect(getWordCount("hello")).toBe(1);
      expect(getWordCount("hello world")).toBe(2);
      expect(getWordCount("the quick brown fox")).toBe(4);
    });

    it("handles multiple spaces", () => {
      expect(getWordCount("hello   world")).toBe(2);
      expect(getWordCount("a  b  c")).toBe(3);
    });

    it("handles leading/trailing whitespace", () => {
      expect(getWordCount("  hello world  ")).toBe(2);
    });

    it("returns 0 for empty string", () => {
      expect(getWordCount("")).toBe(0);
      expect(getWordCount("   ")).toBe(0);
    });

    it("counts Norwegian words with special characters", () => {
      expect(getWordCount("Blåbær og rømme")).toBe(3);
      expect(getWordCount("Ørn på fjæra")).toBe(3);
    });
  });

  describe("classifySentenceDifficulty", () => {
    it("returns null for single word", () => {
      expect(classifySentenceDifficulty(1)).toBe(null);
      expect(classifySentenceDifficulty(0)).toBe(null);
    });

    it("returns beginner for 2-5 words", () => {
      expect(classifySentenceDifficulty(2)).toBe("beginner");
      expect(classifySentenceDifficulty(3)).toBe("beginner");
      expect(classifySentenceDifficulty(5)).toBe("beginner");
    });

    it("returns intermediate for 6-8 words", () => {
      expect(classifySentenceDifficulty(6)).toBe("intermediate");
      expect(classifySentenceDifficulty(7)).toBe("intermediate");
      expect(classifySentenceDifficulty(8)).toBe("intermediate");
    });

    it("returns advanced for 9+ words", () => {
      expect(classifySentenceDifficulty(9)).toBe("advanced");
      expect(classifySentenceDifficulty(12)).toBe("advanced");
      expect(classifySentenceDifficulty(15)).toBe("advanced");
    });
  });

  describe("Configuration constants", () => {
    it("exports MASTERY_CONFIG with correct values", () => {
      expect(MASTERY_CONFIG.LETTER_TILES_REQUIRED).toBe(2);
      expect(MASTERY_CONFIG.WORD_BANK_REQUIRED).toBe(2);
    });

    it("exports CHALLENGE_CONFIG with correct values", () => {
      expect(CHALLENGE_CONFIG.LETTER_DISTRACTORS).toBe(4);
      expect(CHALLENGE_CONFIG.WORD_DISTRACTORS).toBe(3);
      expect(CHALLENGE_CONFIG.NORWEGIAN_FILLERS).toContain("og");
      expect(CHALLENGE_CONFIG.NORWEGIAN_FILLERS).toContain("er");
    });

    it("has phonetic pairs for Norwegian characters", () => {
      expect(CHALLENGE_CONFIG.PHONETIC_PAIRS.o).toContain("ø");
      expect(CHALLENGE_CONFIG.PHONETIC_PAIRS.æ).toContain("e");
      expect(CHALLENGE_CONFIG.PHONETIC_PAIRS.å).toContain("o");
    });
  });
});
