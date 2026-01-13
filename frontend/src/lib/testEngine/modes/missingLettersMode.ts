import { TestModeDefinition } from "../types";
import { detectSpellingChallenge } from "@/components/MissingLettersInput";
import type { WordSet } from "@/types";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";

/**
 * Missing Letters Mode - Fill in the Blanks
 *
 * Fill in missing letters to complete the word.
 * Tracks mastery, requires single words only.
 */
export const missingLettersMode: TestModeDefinition = {
  id: "missingLetters",
  metadata: {
    icon: PuzzlePieceIcon,
    nameKey: "modes.missingLetters",
    descriptionKey: "modes.missingLetters.desc",
  },
  inputType: "specialized",
  tracksMastery: true,
  contentRequirements: {
    singleWords: true,
  },
  isAvailable: (wordSet: WordSet) => {
    const hasSingleWords = wordSet.words.some((w) => !w.word.includes(" "));
    return {
      available: hasSingleWords,
      reasonKey: hasSingleWords ? undefined : "modes.requiresSingleWords",
    };
  },
  generateChallenge: (word: string) => {
    const challenge = detectSpellingChallenge(word);
    if (challenge) {
      return {
        blankedWord: challenge.blankedWord,
        missingLetters: challenge.missingLetters,
        challengeType: challenge.challengeType as
          | "prefix"
          | "suffix"
          | "compound"
          | "double"
          | "silent"
          | "mixed",
      };
    }
    // Fallback
    return {
      blankedWord: word,
      missingLetters: "",
      challengeType: "mixed" as const,
    };
  },
};
