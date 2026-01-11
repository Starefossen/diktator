import { describe, it, expect } from "vitest";
import {
  normalizeText,
  tokenize,
  computeLCSLength,
  reconstructLCS,
  levenshteinDistance,
  wordsMatch,
  alignSentences,
  scoreSentence,
  getSentenceFeedbackKey,
  getWordStatusClass,
  DEFAULT_SCORING_CONFIG,
} from "../sentenceScoring";

describe("normalizeText", () => {
  it("converts to lowercase when ignoreCase is true", () => {
    expect(normalizeText("Hello World")).toBe("hello world");
  });

  it("preserves case when ignoreCase is false", () => {
    expect(
      normalizeText("Hello World", {
        ignoreCase: false,
        ignorePunctuation: true,
      }),
    ).toBe("Hello World");
  });

  it("removes punctuation when ignorePunctuation is true", () => {
    expect(normalizeText("Hello, world!")).toBe("hello world");
    expect(normalizeText("«Hei på deg»")).toBe("hei på deg");
  });

  it("preserves punctuation when ignorePunctuation is false", () => {
    expect(
      normalizeText("Hello, world!", {
        ignoreCase: true,
        ignorePunctuation: false,
      }),
    ).toBe("hello, world!");
  });

  it("normalizes whitespace", () => {
    expect(normalizeText("  hello   world  ")).toBe("hello world");
  });

  it("preserves Norwegian characters", () => {
    expect(normalizeText("Blåbær og rømme")).toBe("blåbær og rømme");
    expect(normalizeText("Ørn på fjæra")).toBe("ørn på fjæra");
  });
});

describe("tokenize", () => {
  it("splits text into words", () => {
    expect(tokenize("hello world")).toEqual(["hello", "world"]);
  });

  it("handles Norwegian sentences", () => {
    expect(tokenize("Katten sover på sofaen")).toEqual([
      "katten",
      "sover",
      "på",
      "sofaen",
    ]);
  });

  it("removes punctuation and splits", () => {
    expect(tokenize("Hei, verden!")).toEqual(["hei", "verden"]);
  });

  it("returns empty array for empty string", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("computeLCSLength", () => {
  it("returns 0 for empty arrays", () => {
    expect(computeLCSLength([], [])).toBe(0);
    expect(computeLCSLength(["a"], [])).toBe(0);
    expect(computeLCSLength([], ["a"])).toBe(0);
  });

  it("returns correct length for identical arrays", () => {
    expect(computeLCSLength(["a", "b", "c"], ["a", "b", "c"])).toBe(3);
  });

  it("returns correct length for partial matches", () => {
    expect(computeLCSLength(["a", "b", "c"], ["a", "c"])).toBe(2);
    expect(computeLCSLength(["a", "b", "c"], ["b", "c"])).toBe(2);
  });

  it("handles word order differences", () => {
    expect(computeLCSLength(["a", "b", "c"], ["c", "b", "a"])).toBe(1);
    expect(computeLCSLength(["a", "b", "c"], ["b", "a", "c"])).toBe(2);
  });

  it("handles Norwegian sentence words", () => {
    const expected = ["katten", "sover", "på", "sofaen"];
    const actual = ["katten", "på", "sofaen"];
    expect(computeLCSLength(expected, actual)).toBe(3);
  });
});

describe("reconstructLCS", () => {
  it("returns empty array for no matches", () => {
    expect(reconstructLCS(["a"], ["b"])).toEqual([]);
  });

  it("returns indices for matching words", () => {
    expect(reconstructLCS(["a", "b", "c"], ["a", "b", "c"])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it("finds correct subsequence with gaps", () => {
    const result = reconstructLCS(["a", "b", "c", "d"], ["a", "c", "d"]);
    expect(result).toEqual([
      [0, 0],
      [2, 1],
      [3, 2],
    ]);
  });
});

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("test", "test")).toBe(0);
    expect(levenshteinDistance("", "")).toBe(0);
  });

  it("returns string length for empty comparison", () => {
    expect(levenshteinDistance("test", "")).toBe(4);
    expect(levenshteinDistance("", "test")).toBe(4);
  });

  it("counts single character differences", () => {
    expect(levenshteinDistance("cat", "bat")).toBe(1); // substitution
    expect(levenshteinDistance("cat", "cats")).toBe(1); // insertion
    expect(levenshteinDistance("cats", "cat")).toBe(1); // deletion
  });

  it("handles Norwegian words", () => {
    expect(levenshteinDistance("katten", "katen")).toBe(1);
    expect(levenshteinDistance("blåbær", "blåbr")).toBe(1);
  });
});

describe("wordsMatch", () => {
  it("returns true for exact matches", () => {
    expect(wordsMatch("hello", "hello")).toBe(true);
  });

  it("returns true for matches within threshold", () => {
    expect(wordsMatch("hello", "helo", 1)).toBe(true);
    expect(wordsMatch("katten", "katen", 1)).toBe(true);
  });

  it("returns false for matches outside threshold", () => {
    expect(wordsMatch("hello", "hi", 1)).toBe(false);
    expect(wordsMatch("hello", "helo", 0)).toBe(false);
  });
});

describe("alignSentences", () => {
  it("aligns identical sentences", () => {
    const result = alignSentences(["a", "b", "c"], ["a", "b", "c"]);
    expect(result.matches).toHaveLength(3);
    expect(result.missingIndices).toEqual([]);
    expect(result.extraIndices).toEqual([]);
  });

  it("identifies missing words", () => {
    const result = alignSentences(["a", "b", "c"], ["a", "c"]);
    expect(result.matches).toHaveLength(2);
    expect(result.missingIndices).toEqual([1]);
    expect(result.extraIndices).toEqual([]);
  });

  it("identifies extra words", () => {
    const result = alignSentences(["a", "c"], ["a", "b", "c"]);
    expect(result.matches).toHaveLength(2);
    expect(result.missingIndices).toEqual([]);
    expect(result.extraIndices).toEqual([1]);
  });

  it("finds fuzzy matches", () => {
    const result = alignSentences(["katten", "sover"], ["katen", "sover"], {
      closeEnoughThreshold: 1,
    });
    expect(result.matches).toHaveLength(2);
    const fuzzyMatch = result.matches.find((m) => !m.isExact);
    expect(fuzzyMatch).toBeDefined();
    expect(fuzzyMatch?.expectedIndex).toBe(0);
  });
});

describe("scoreSentence", () => {
  it("scores perfect match as 100", () => {
    const result = scoreSentence("Katten sover", "Katten sover");
    expect(result.score).toBe(100);
    expect(result.isFullyCorrect).toBe(true);
    expect(result.correctCount).toBe(2);
    expect(result.totalExpected).toBe(2);
  });

  it("scores partial match correctly", () => {
    const result = scoreSentence("Katten sover på sofaen", "Katten sover");
    expect(result.correctCount).toBe(2);
    expect(result.totalExpected).toBe(4);
    expect(result.score).toBe(50);
    expect(result.isFullyCorrect).toBe(false);
  });

  it("gives partial credit for misspellings", () => {
    const result = scoreSentence("Katten sover", "Katen sover");
    expect(result.correctCount).toBe(1); // exact match: sover
    expect(result.score).toBe(75); // 1 exact + 0.5 close = 1.5 / 2 = 75%
  });

  it("applies attempt multiplier", () => {
    const result1 = scoreSentence("Katten sover", "Katten sover", 1);
    const result2 = scoreSentence("Katten sover", "Katten sover", 2);
    const result3 = scoreSentence("Katten sover", "Katten sover", 3);

    expect(result1.adjustedScore).toBe(100);
    expect(result2.adjustedScore).toBe(80);
    expect(result3.adjustedScore).toBe(60);
  });

  it("handles empty expected sentence", () => {
    const result = scoreSentence("", "");
    expect(result.score).toBe(100);
  });

  it("handles empty actual sentence", () => {
    const result = scoreSentence("Katten sover", "");
    expect(result.score).toBe(0);
    expect(result.wordFeedback).toHaveLength(2);
    expect(result.wordFeedback.every((f) => f.status === "missing")).toBe(true);
  });

  it("identifies extra words", () => {
    const result = scoreSentence(
      "Katten sover",
      "Den store katten sover rolig",
    );
    const extraWords = result.wordFeedback.filter((f) => f.status === "extra");
    expect(extraWords.length).toBeGreaterThan(0);
  });

  it("calculates order accuracy", () => {
    const result1 = scoreSentence("a b c", "a b c");
    expect(result1.orderAccuracy).toBe(1);

    const result2 = scoreSentence("a b c", "c b a");
    expect(result2.orderAccuracy).toBeLessThan(1);
  });

  it("provides word-level feedback", () => {
    const result = scoreSentence("Katten sover på sofaen", "Katen sovr på");

    const correct = result.wordFeedback.filter((f) => f.status === "correct");
    const misspelled = result.wordFeedback.filter(
      (f) => f.status === "misspelled",
    );
    const missing = result.wordFeedback.filter((f) => f.status === "missing");

    expect(correct.length).toBe(1); // "på"
    expect(misspelled.length).toBe(2); // "katten", "sover"
    expect(missing.length).toBe(1); // "sofaen"
  });
});

describe("getSentenceFeedbackKey", () => {
  it("returns perfect key for fully correct", () => {
    const result = scoreSentence("test", "test");
    expect(getSentenceFeedbackKey(result)).toBe("test.sentence.perfect");
  });

  it("returns almostPerfect for 80%+ correct", () => {
    const result = scoreSentence("a b c d e", "a b c d");
    expect(getSentenceFeedbackKey(result)).toBe("test.sentence.almostPerfect");
  });

  it("returns goodProgress for 50%+ correct", () => {
    const result = scoreSentence("a b c d", "a b");
    expect(getSentenceFeedbackKey(result)).toBe("test.sentence.goodProgress");
  });

  it("returns tryAgain for 0% correct", () => {
    const result = scoreSentence("a b c", "x y z");
    expect(getSentenceFeedbackKey(result)).toBe("test.sentence.tryAgain");
  });
});

describe("getWordStatusClass", () => {
  it("returns correct class for each status", () => {
    expect(getWordStatusClass("correct")).toContain("green");
    expect(getWordStatusClass("misspelled")).toContain("amber");
    expect(getWordStatusClass("missing")).toContain("red");
    expect(getWordStatusClass("extra")).toContain("gray");
  });
});
