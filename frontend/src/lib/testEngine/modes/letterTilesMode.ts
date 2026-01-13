import { TestModeDefinition } from "../types";
import { generateLetterTiles } from "@/lib/challenges";
import type { WordSet } from "@/types";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";

/**
 * Letter Tiles Mode - Build It
 *
 * Arrange scrambled letters to spell the word.
 * Tracks mastery, requires single words only.
 */
export const letterTilesMode: TestModeDefinition = {
  id: "letterTiles",
  metadata: {
    icon: PuzzlePieceIcon,
    nameKey: "modes.letterTiles",
    descriptionKey: "modes.letterTiles.desc",
  },
  inputType: "tiles",
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
    const tiles = generateLetterTiles(word);
    return {
      tiles: tiles.map((tile) => ({
        letter: tile.letter,
        id: tile.id,
        isDistractor: tile.isDistractor,
      })),
    };
  },
};
