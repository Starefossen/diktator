import { describe, it, expect } from "vitest";
import { getMode } from "../registry";
import type { TestMode, WordSet } from "../../../types";
import {
  PuzzlePieceIcon,
  DocumentTextIcon,
  SquaresPlusIcon,
  EyeIcon,
  LightBulbIcon,
  LanguageIcon,
} from "@heroicons/react/24/outline";

describe("Test Mode Registry", () => {
  describe("getMode", () => {
    it("returns letterTiles mode definition", () => {
      const mode = getMode("letterTiles");
      expect(mode).toBeDefined();
      expect(mode?.id).toBe("letterTiles");
    });

    it("returns wordBank mode definition", () => {
      const mode = getMode("wordBank");
      expect(mode).toBeDefined();
      expect(mode?.id).toBe("wordBank");
    });

    it("returns keyboard mode definition", () => {
      const mode = getMode("keyboard");
      expect(mode).toBeDefined();
      expect(mode?.id).toBe("keyboard");
    });

    it("returns missingLetters mode definition", () => {
      const mode = getMode("missingLetters");
      expect(mode).toBeDefined();
      expect(mode?.id).toBe("missingLetters");
    });

    it("returns flashcard mode definition", () => {
      const mode = getMode("flashcard");
      expect(mode).toBeDefined();
      expect(mode?.id).toBe("flashcard");
    });

    it("returns lookCoverWrite mode definition", () => {
      const mode = getMode("lookCoverWrite");
      expect(mode).toBeDefined();
      expect(mode?.id).toBe("lookCoverWrite");
    });

    it("returns translation mode definition", () => {
      const mode = getMode("translation");
      expect(mode).toBeDefined();
      expect(mode?.id).toBe("translation");
    });

    it("returns undefined for invalid mode", () => {
      const mode = getMode("invalid" as TestMode);
      expect(mode).toBeUndefined();
    });
  });

  describe("Mode Metadata", () => {
    it("letterTiles has complete metadata with icon", () => {
      const mode = getMode("letterTiles");
      expect(mode?.metadata).toBeDefined();
      expect(mode?.metadata.icon).toBe(PuzzlePieceIcon);
      expect(mode?.metadata.nameKey).toBe("modes.letterTiles");
      expect(mode?.metadata.descriptionKey).toBe("modes.letterTiles.desc");
    });

    it("wordBank has complete metadata with icon", () => {
      const mode = getMode("wordBank");
      expect(mode?.metadata).toBeDefined();
      expect(mode?.metadata.icon).toBe(DocumentTextIcon);
      expect(mode?.metadata.nameKey).toBe("modes.wordBank");
      expect(mode?.metadata.descriptionKey).toBe("modes.wordBank.desc");
    });

    it("keyboard has complete metadata with icon", () => {
      const mode = getMode("keyboard");
      expect(mode?.metadata).toBeDefined();
      expect(mode?.metadata.icon).toBe(SquaresPlusIcon);
      expect(mode?.metadata.nameKey).toBe("modes.keyboard");
      expect(mode?.metadata.descriptionKey).toBe("modes.keyboard.desc");
    });

    it("missingLetters has complete metadata with icon", () => {
      const mode = getMode("missingLetters");
      expect(mode?.metadata).toBeDefined();
      expect(mode?.metadata.icon).toBe(PuzzlePieceIcon);
      expect(mode?.metadata.nameKey).toBe("modes.missingLetters");
      expect(mode?.metadata.descriptionKey).toBe("modes.missingLetters.desc");
    });

    it("flashcard has complete metadata with icon", () => {
      const mode = getMode("flashcard");
      expect(mode?.metadata).toBeDefined();
      expect(mode?.metadata.icon).toBe(EyeIcon);
      expect(mode?.metadata.nameKey).toBe("modes.flashcard");
      expect(mode?.metadata.descriptionKey).toBe("modes.flashcard.desc");
    });

    it("lookCoverWrite has complete metadata with icon", () => {
      const mode = getMode("lookCoverWrite");
      expect(mode?.metadata).toBeDefined();
      expect(mode?.metadata.icon).toBe(LightBulbIcon);
      expect(mode?.metadata.nameKey).toBe("modes.lookCoverWrite");
      expect(mode?.metadata.descriptionKey).toBe("modes.lookCoverWrite.desc");
    });

    it("translation has complete metadata with icon", () => {
      const mode = getMode("translation");
      expect(mode?.metadata).toBeDefined();
      expect(mode?.metadata.icon).toBe(LanguageIcon);
      expect(mode?.metadata.nameKey).toBe("modes.translation");
      expect(mode?.metadata.descriptionKey).toBe("modes.translation.desc");
    });
  });

  describe("Mastery Tracking", () => {
    it("letterTiles tracks mastery", () => {
      const mode = getMode("letterTiles");
      expect(mode?.tracksMastery).toBe(true);
    });

    it("wordBank tracks mastery", () => {
      const mode = getMode("wordBank");
      expect(mode?.tracksMastery).toBe(true);
    });

    it("keyboard tracks mastery", () => {
      const mode = getMode("keyboard");
      expect(mode?.tracksMastery).toBe(true);
    });

    it("missingLetters tracks mastery", () => {
      const mode = getMode("missingLetters");
      expect(mode?.tracksMastery).toBe(true);
    });

    it("flashcard does NOT track mastery (self-report)", () => {
      const mode = getMode("flashcard");
      expect(mode?.tracksMastery).toBe(false);
    });

    it("lookCoverWrite does NOT track mastery (self-paced)", () => {
      const mode = getMode("lookCoverWrite");
      expect(mode?.tracksMastery).toBe(false);
    });

    it("translation tracks mastery", () => {
      const mode = getMode("translation");
      expect(mode?.tracksMastery).toBe(true);
    });
  });

  describe("Mode Availability", () => {
    const singleWordSet: WordSet = {
      id: "1",
      name: "Single Words",
      language: "no" as const,
      words: [
        { id: "1", word: "katt", translations: [] },
        { id: "2", word: "hund", translations: [] },
      ],
      familyId: "fam1",
      createdBy: "user1",
      createdAt: new Date(),
      allowedModes: ["letterTiles", "keyboard", "missingLetters"],
    };

    const sentenceWordSet: WordSet = {
      id: "2",
      name: "Sentences",
      language: "no" as const,
      words: [
        { id: "1", word: "Katten sover", translations: [] },
        { id: "2", word: "Hunden løper", translations: [] },
      ],
      familyId: "fam1",
      createdBy: "user1",
      createdAt: new Date(),
      allowedModes: ["wordBank", "keyboard"],
    };

    const translationWordSet: WordSet = {
      id: "3",
      name: "Translations",
      language: "no" as const,
      words: [
        {
          id: "1",
          word: "katt",
          translations: [{ language: "en", text: "cat" }],
        },
        {
          id: "2",
          word: "hund",
          translations: [{ language: "en", text: "dog" }],
        },
      ],
      familyId: "fam1",
      createdBy: "user1",
      createdAt: new Date(),
      allowedModes: ["translation", "keyboard"],
    };

    it("letterTiles is available for single words", () => {
      const mode = getMode("letterTiles");
      const result = mode?.isAvailable(singleWordSet);
      expect(result?.available).toBe(true);
    });

    it("letterTiles is NOT available for sentences", () => {
      const mode = getMode("letterTiles");
      const result = mode?.isAvailable(sentenceWordSet);
      expect(result?.available).toBe(false);
      expect(result?.reasonKey).toBe("modes.requiresSingleWords");
    });

    it("wordBank is available for sentences", () => {
      const mode = getMode("wordBank");
      const result = mode?.isAvailable(sentenceWordSet);
      expect(result?.available).toBe(true);
    });

    it("wordBank is NOT available for single words", () => {
      const mode = getMode("wordBank");
      const result = mode?.isAvailable(singleWordSet);
      expect(result?.available).toBe(false);
      expect(result?.reasonKey).toBe("modes.requiresSentences");
    });

    it("keyboard is available for any content", () => {
      const mode = getMode("keyboard");
      expect(mode?.isAvailable(singleWordSet).available).toBe(true);
      expect(mode?.isAvailable(sentenceWordSet).available).toBe(true);
      expect(mode?.isAvailable(translationWordSet).available).toBe(true);
    });

    it("missingLetters is available for single words", () => {
      const mode = getMode("missingLetters");
      const result = mode?.isAvailable(singleWordSet);
      expect(result?.available).toBe(true);
    });

    it("missingLetters is NOT available for sentences", () => {
      const mode = getMode("missingLetters");
      const result = mode?.isAvailable(sentenceWordSet);
      expect(result?.available).toBe(false);
      expect(result?.reasonKey).toBe("modes.requiresSingleWords");
    });

    it("flashcard is available for any content", () => {
      const mode = getMode("flashcard");
      expect(mode?.isAvailable(singleWordSet).available).toBe(true);
      expect(mode?.isAvailable(sentenceWordSet).available).toBe(true);
    });

    it("lookCoverWrite is available for any content", () => {
      const mode = getMode("lookCoverWrite");
      expect(mode?.isAvailable(singleWordSet).available).toBe(true);
      expect(mode?.isAvailable(sentenceWordSet).available).toBe(true);
    });

    it("translation is available when translations exist", () => {
      const mode = getMode("translation");
      const result = mode?.isAvailable(translationWordSet);
      expect(result?.available).toBe(true);
    });

    it("translation is NOT available without translations", () => {
      const mode = getMode("translation");
      const result = mode?.isAvailable(singleWordSet);
      expect(result?.available).toBe(false);
      expect(result?.reasonKey).toBe("modes.requiresTranslations");
    });
  });

  describe("Challenge Generation", () => {
    it("letterTiles has generateChallenge function", () => {
      const mode = getMode("letterTiles");
      expect(mode?.generateChallenge).toBeDefined();
      expect(typeof mode?.generateChallenge).toBe("function");
    });

    it("wordBank has generateChallenge function", () => {
      const mode = getMode("wordBank");
      expect(mode?.generateChallenge).toBeDefined();
      expect(typeof mode?.generateChallenge).toBe("function");
    });

    it("missingLetters has generateChallenge function", () => {
      const mode = getMode("missingLetters");
      expect(mode?.generateChallenge).toBeDefined();
      expect(typeof mode?.generateChallenge).toBe("function");
    });

    it("keyboard does NOT have generateChallenge (direct input)", () => {
      const mode = getMode("keyboard");
      expect(mode?.generateChallenge).toBeUndefined();
    });

    it("flashcard does NOT have generateChallenge (self-report)", () => {
      const mode = getMode("flashcard");
      expect(mode?.generateChallenge).toBeUndefined();
    });

    it("lookCoverWrite does NOT have generateChallenge (memorization)", () => {
      const mode = getMode("lookCoverWrite");
      expect(mode?.generateChallenge).toBeUndefined();
    });

    it("translation does NOT have generateChallenge (direct input)", () => {
      const mode = getMode("translation");
      expect(mode?.generateChallenge).toBeUndefined();
    });
  });

  describe("Expected Answer Calculation", () => {
    const wordWithTranslation = {
      word: "katt",
      translations: [
        { language: "en", text: "cat" },
        { language: "de", text: "Katze" },
      ],
    };

    it("translation mode has getExpectedAnswer function", () => {
      const mode = getMode("translation");
      expect(mode?.getExpectedAnswer).toBeDefined();
      expect(typeof mode?.getExpectedAnswer).toBe("function");
    });

    it("translation mode returns correct answer for norwegian->target", () => {
      const mode = getMode("translation");
      const result = mode?.getExpectedAnswer?.(wordWithTranslation, {
        translationDirection: "toTarget",
      });
      expect(result).toBe("cat");
    });

    it("translation mode returns correct answer for target->norwegian", () => {
      const mode = getMode("translation");
      const result = mode?.getExpectedAnswer?.(wordWithTranslation, {
        translationDirection: "toSource",
      });
      expect(result).toBe("katt");
    });

    it("other modes do NOT have getExpectedAnswer (use word.text)", () => {
      expect(getMode("letterTiles")?.getExpectedAnswer).toBeUndefined();
      expect(getMode("wordBank")?.getExpectedAnswer).toBeUndefined();
      expect(getMode("keyboard")?.getExpectedAnswer).toBeUndefined();
      expect(getMode("missingLetters")?.getExpectedAnswer).toBeUndefined();
      expect(getMode("flashcard")?.getExpectedAnswer).toBeUndefined();
      expect(getMode("lookCoverWrite")?.getExpectedAnswer).toBeUndefined();
    });
  });

  describe("All Modes Registered", () => {
    it("registers exactly 7 modes", () => {
      const modes: TestMode[] = [
        "letterTiles",
        "wordBank",
        "keyboard",
        "missingLetters",
        "flashcard",
        "lookCoverWrite",
        "translation",
      ];

      modes.forEach((modeId) => {
        const mode = getMode(modeId);
        expect(mode).toBeDefined();
        expect(mode?.id).toBe(modeId);
      });
    });
  });
});
