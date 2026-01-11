import { describe, it, expect } from "vitest";
import {
  generateLetterTiles,
  generateWordBank,
  getNextChallengeMode,
  isModeUnlocked,
  getMasteryProgress,
  validateLetterTileAnswer,
  validateWordBankAnswer,
} from "@/lib/challenges";
import type { WordMastery, WordSet } from "@/types";

describe("challenges", () => {
  describe("generateLetterTiles", () => {
    it("returns tiles for all letters in the word", () => {
      const tiles = generateLetterTiles("katt");
      const wordTiles = tiles.filter((t) => !t.isDistractor);

      expect(wordTiles).toHaveLength(4);
      const letters = wordTiles.map((t) => t.letter).sort();
      expect(letters).toEqual(["a", "k", "t", "t"]);
    });

    it("includes distractor tiles", () => {
      const tiles = generateLetterTiles("hei");
      const distractorTiles = tiles.filter((t) => t.isDistractor);

      expect(distractorTiles.length).toBeGreaterThan(0);
      expect(distractorTiles.length).toBeLessThanOrEqual(4);
    });

    it("generates unique IDs for each tile", () => {
      const tiles = generateLetterTiles("test");
      const ids = tiles.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("handles Norwegian characters", () => {
      const tiles = generateLetterTiles("blåbær");
      const wordTiles = tiles.filter((t) => !t.isDistractor);

      expect(wordTiles).toHaveLength(6);
      const letters = wordTiles.map((t) => t.letter);
      expect(letters).toContain("å");
      expect(letters).toContain("æ");
    });

    it("converts to lowercase", () => {
      const tiles = generateLetterTiles("KATT");
      const wordTiles = tiles.filter((t) => !t.isDistractor);

      wordTiles.forEach((tile) => {
        expect(tile.letter).toBe(tile.letter.toLowerCase());
      });
    });
  });

  describe("generateWordBank", () => {
    const mockWordSet: WordSet = {
      id: "test-set",
      name: "Test Set",
      familyId: "family-1",
      createdBy: "user-1",
      language: "no",
      words: [
        { word: "hund" },
        { word: "katt" },
        { word: "fugl" },
        { word: "fisk" },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("returns items for all words in the sentence", () => {
      const items = generateWordBank("katten sover", mockWordSet);
      const sentenceItems = items.filter((item) => !item.isDistractor);

      expect(sentenceItems).toHaveLength(2);
      const words = sentenceItems.map((item) => item.word);
      expect(words).toContain("katten");
      expect(words).toContain("sover");
    });

    it("includes distractor words", () => {
      const items = generateWordBank("katten sover", mockWordSet);
      const distractorItems = items.filter((item) => item.isDistractor);

      expect(distractorItems.length).toBeGreaterThan(0);
      expect(distractorItems.length).toBeLessThanOrEqual(3);
    });

    it("generates unique IDs for each item", () => {
      const items = generateWordBank("katten sover på sofaen", mockWordSet);
      const ids = items.map((item) => item.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("uses words from word set as distractors when available", () => {
      const items = generateWordBank("katten sover", mockWordSet);
      const distractorItems = items.filter((item) => item.isDistractor);
      const distractorWords = distractorItems.map((item) => item.word);

      const wordSetWords = mockWordSet.words.map((w) => w.word.toLowerCase());
      const fromWordSet = distractorWords.some(
        (w) => wordSetWords.includes(w) || ["og", "er", "på"].includes(w),
      );
      expect(fromWordSet).toBe(true);
    });

    it("works without a word set", () => {
      const items = generateWordBank("katten sover");
      const sentenceItems = items.filter((item) => !item.isDistractor);

      expect(sentenceItems).toHaveLength(2);
    });

    it("handles punctuation attached to words", () => {
      const items = generateWordBank("hei, verden!");
      const sentenceItems = items.filter((item) => !item.isDistractor);
      const words = sentenceItems.map((item) => item.word);

      expect(words).toContain("hei,");
      expect(words).toContain("verden!");
    });
  });

  describe("getNextChallengeMode", () => {
    it("returns letterTiles when mastery is null", () => {
      expect(getNextChallengeMode(null)).toBe("letterTiles");
    });

    it("returns letterTiles when mastery is undefined", () => {
      expect(getNextChallengeMode(undefined)).toBe("letterTiles");
    });

    it("returns letterTiles when letter tiles not mastered", () => {
      const mastery: WordMastery = {
        id: "1",
        userId: "user-1",
        wordSetId: "set-1",
        word: "test",
        letterTilesCorrect: 1,
        wordBankCorrect: 0,
        keyboardCorrect: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(getNextChallengeMode(mastery)).toBe("letterTiles");
    });

    it("returns wordBank when letter tiles mastered but word bank not", () => {
      const mastery: WordMastery = {
        id: "1",
        userId: "user-1",
        wordSetId: "set-1",
        word: "test",
        letterTilesCorrect: 2,
        wordBankCorrect: 1,
        keyboardCorrect: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(getNextChallengeMode(mastery)).toBe("wordBank");
    });

    it("returns keyboard when both modes mastered", () => {
      const mastery: WordMastery = {
        id: "1",
        userId: "user-1",
        wordSetId: "set-1",
        word: "test",
        letterTilesCorrect: 2,
        wordBankCorrect: 2,
        keyboardCorrect: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(getNextChallengeMode(mastery)).toBe("keyboard");
    });
  });

  describe("isModeUnlocked", () => {
    it("letterTiles is always unlocked", () => {
      expect(isModeUnlocked(null, "letterTiles")).toBe(true);
      expect(isModeUnlocked(undefined, "letterTiles")).toBe(true);
    });

    it("wordBank requires letter tiles mastery", () => {
      expect(isModeUnlocked(null, "wordBank")).toBe(false);

      const partialMastery: WordMastery = {
        id: "1",
        userId: "user-1",
        wordSetId: "set-1",
        word: "test",
        letterTilesCorrect: 1,
        wordBankCorrect: 0,
        keyboardCorrect: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(isModeUnlocked(partialMastery, "wordBank")).toBe(false);

      const fullMastery: WordMastery = {
        ...partialMastery,
        letterTilesCorrect: 2,
      };
      expect(isModeUnlocked(fullMastery, "wordBank")).toBe(true);
    });

    it("keyboard requires both letter tiles and word bank mastery", () => {
      expect(isModeUnlocked(null, "keyboard")).toBe(false);

      const partialMastery: WordMastery = {
        id: "1",
        userId: "user-1",
        wordSetId: "set-1",
        word: "test",
        letterTilesCorrect: 2,
        wordBankCorrect: 1,
        keyboardCorrect: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(isModeUnlocked(partialMastery, "keyboard")).toBe(false);

      const fullMastery: WordMastery = {
        ...partialMastery,
        wordBankCorrect: 2,
      };
      expect(isModeUnlocked(fullMastery, "keyboard")).toBe(true);
    });

    it("auto mode is always unlocked", () => {
      expect(isModeUnlocked(null, "auto")).toBe(true);
    });
  });

  describe("getMasteryProgress", () => {
    it("returns zeros when mastery is null", () => {
      const progress = getMasteryProgress(null);

      expect(progress.letterTiles.current).toBe(0);
      expect(progress.letterTiles.required).toBe(2);
      expect(progress.letterTiles.complete).toBe(false);
      expect(progress.wordBank.current).toBe(0);
      expect(progress.wordBank.complete).toBe(false);
      expect(progress.keyboard.unlocked).toBe(false);
    });

    it("returns correct progress values", () => {
      const mastery: WordMastery = {
        id: "1",
        userId: "user-1",
        wordSetId: "set-1",
        word: "test",
        letterTilesCorrect: 2,
        wordBankCorrect: 1,
        keyboardCorrect: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const progress = getMasteryProgress(mastery);

      expect(progress.letterTiles.current).toBe(2);
      expect(progress.letterTiles.complete).toBe(true);
      expect(progress.wordBank.current).toBe(1);
      expect(progress.wordBank.complete).toBe(false);
      expect(progress.keyboard.correct).toBe(3);
      expect(progress.keyboard.unlocked).toBe(false);
    });
  });

  describe("validateLetterTileAnswer", () => {
    it("returns true for correct answer", () => {
      const tiles = [
        { id: "1", letter: "k", isDistractor: false },
        { id: "2", letter: "a", isDistractor: false },
        { id: "3", letter: "t", isDistractor: false },
        { id: "4", letter: "t", isDistractor: false },
      ];

      expect(validateLetterTileAnswer(tiles, "katt")).toBe(true);
    });

    it("returns false for incorrect answer", () => {
      const tiles = [
        { id: "1", letter: "k", isDistractor: false },
        { id: "2", letter: "a", isDistractor: false },
        { id: "3", letter: "t", isDistractor: false },
      ];

      expect(validateLetterTileAnswer(tiles, "katt")).toBe(false);
    });

    it("is case insensitive", () => {
      const tiles = [
        { id: "1", letter: "K", isDistractor: false },
        { id: "2", letter: "A", isDistractor: false },
        { id: "3", letter: "T", isDistractor: false },
        { id: "4", letter: "T", isDistractor: false },
      ];

      expect(validateLetterTileAnswer(tiles, "katt")).toBe(true);
    });
  });

  describe("validateWordBankAnswer", () => {
    it("returns true for correct answer", () => {
      const items = [
        { id: "1", word: "katten", isDistractor: false },
        { id: "2", word: "sover", isDistractor: false },
      ];

      expect(validateWordBankAnswer(items, "katten sover")).toBe(true);
    });

    it("returns false for incorrect word order", () => {
      const items = [
        { id: "1", word: "sover", isDistractor: false },
        { id: "2", word: "katten", isDistractor: false },
      ];

      expect(validateWordBankAnswer(items, "katten sover")).toBe(false);
    });

    it("is case insensitive", () => {
      const items = [
        { id: "1", word: "Katten", isDistractor: false },
        { id: "2", word: "Sover", isDistractor: false },
      ];

      expect(validateWordBankAnswer(items, "katten sover")).toBe(true);
    });

    it("handles extra whitespace", () => {
      const items = [
        { id: "1", word: "katten", isDistractor: false },
        { id: "2", word: "sover", isDistractor: false },
      ];

      expect(validateWordBankAnswer(items, "  katten  sover  ")).toBe(true);
    });
  });
});
