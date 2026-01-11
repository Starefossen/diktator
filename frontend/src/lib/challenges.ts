/**
 * Challenge generation utilities for progressive input modes.
 *
 * Generates letter tiles with phonetically similar distractors for word challenges,
 * and word banks with contextual distractors for sentence challenges.
 */

import {
  CHALLENGE_CONFIG,
  MASTERY_CONFIG,
  InputMethod,
} from "@/lib/sentenceConfig";
import type { WordMastery, WordSet } from "@/types";

/**
 * Represents a letter tile in the letter tiles challenge mode
 */
export interface LetterTile {
  id: string;
  letter: string;
  isDistractor: boolean;
}

/**
 * Represents a word option in the word bank challenge mode
 */
export interface WordBankItem {
  id: string;
  word: string;
  isDistractor: boolean;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a unique ID for tiles/items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets phonetically similar distractor letters for Norwegian
 */
function getPhoneticDistractors(letter: string): readonly string[] {
  const lowerLetter = letter.toLowerCase();
  const pairs =
    CHALLENGE_CONFIG.PHONETIC_PAIRS[
      lowerLetter as keyof typeof CHALLENGE_CONFIG.PHONETIC_PAIRS
    ];
  return pairs ?? [];
}

/**
 * Generates letter tiles for a word with phonetically similar Norwegian distractors.
 *
 * The tiles include:
 * - All letters from the target word (scrambled)
 * - Phonetically similar Norwegian distractors (ø/o, æ/e, kj/k, etc.)
 * - Random additional letters if needed to reach distractor count
 *
 * @param word - The target word to spell
 * @returns Array of LetterTile objects, shuffled
 *
 * @example
 * generateLetterTiles("katt")
 * // Returns tiles with k, a, t, t plus distractors like g, æ, d, etc.
 */
export function generateLetterTiles(word: string): LetterTile[] {
  const wordLetters = word.toLowerCase().split("");

  // Create tiles for the actual word letters
  const wordTiles: LetterTile[] = wordLetters.map((letter) => ({
    id: generateId(),
    letter,
    isDistractor: false,
  }));

  // Generate distractor letters
  const distractorSet = new Set<string>();
  const wordLetterSet = new Set(wordLetters);

  // First, add phonetically similar distractors
  for (const letter of wordLetters) {
    const phonetic = getPhoneticDistractors(letter);
    for (const distractor of phonetic) {
      if (!wordLetterSet.has(distractor)) {
        distractorSet.add(distractor);
      }
    }
  }

  // If we need more distractors, add common Norwegian letters
  const commonNorwegianLetters = [
    "e",
    "r",
    "n",
    "t",
    "s",
    "a",
    "i",
    "l",
    "o",
    "d",
    "k",
    "g",
    "m",
    "v",
    "f",
    "p",
    "b",
    "h",
    "j",
    "u",
    "y",
    "å",
    "ø",
    "æ",
  ];

  const shuffledCommon = shuffleArray(commonNorwegianLetters);
  for (const letter of shuffledCommon) {
    if (distractorSet.size >= CHALLENGE_CONFIG.LETTER_DISTRACTORS) break;
    if (!wordLetterSet.has(letter) && !distractorSet.has(letter)) {
      distractorSet.add(letter);
    }
  }

  // Create distractor tiles
  const distractorTiles: LetterTile[] = Array.from(distractorSet)
    .slice(0, CHALLENGE_CONFIG.LETTER_DISTRACTORS)
    .map((letter) => ({
      id: generateId(),
      letter,
      isDistractor: true,
    }));

  // Combine and shuffle all tiles
  return shuffleArray([...wordTiles, ...distractorTiles]);
}

/**
 * Generates a word bank for sentence completion with contextual distractors.
 *
 * The word bank includes:
 * - All words from the target sentence
 * - Words from the same word set as distractors
 * - Common Norwegian filler words if more distractors are needed
 *
 * @param sentence - The target sentence to construct
 * @param wordSet - The word set for contextual distractors
 * @returns Array of WordBankItem objects, shuffled
 *
 * @example
 * generateWordBank("Katten sover på sofaen", wordSet)
 * // Returns items with katten, sover, på, sofaen plus distractors
 */
export function generateWordBank(
  sentence: string,
  wordSet?: WordSet,
): WordBankItem[] {
  // Split sentence into words, preserving punctuation attached to words
  const sentenceWords = sentence
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Create items for sentence words
  const sentenceItems: WordBankItem[] = sentenceWords.map((word) => ({
    id: generateId(),
    word,
    isDistractor: false,
  }));

  const sentenceWordSet = new Set(sentenceWords);
  const distractors: string[] = [];

  // Add words from the word set as distractors (if available)
  if (wordSet?.words) {
    const wordSetWords = wordSet.words
      .map((w) => w.word.toLowerCase())
      .filter((w) => !sentenceWordSet.has(w));

    const shuffledWordSetWords = shuffleArray(wordSetWords);
    for (const word of shuffledWordSetWords) {
      if (distractors.length >= CHALLENGE_CONFIG.WORD_DISTRACTORS) break;
      if (!distractors.includes(word)) {
        distractors.push(word);
      }
    }
  }

  // Add Norwegian fillers if we need more distractors
  const shuffledFillers = shuffleArray([...CHALLENGE_CONFIG.NORWEGIAN_FILLERS]);
  for (const filler of shuffledFillers) {
    if (distractors.length >= CHALLENGE_CONFIG.WORD_DISTRACTORS) break;
    if (!sentenceWordSet.has(filler) && !distractors.includes(filler)) {
      distractors.push(filler);
    }
  }

  // Create distractor items
  const distractorItems: WordBankItem[] = distractors.map((word) => ({
    id: generateId(),
    word,
    isDistractor: true,
  }));

  // Combine and shuffle all items
  return shuffleArray([...sentenceItems, ...distractorItems]);
}

/**
 * Determines the next challenge mode based on mastery progression.
 *
 * Progression:
 * 1. Letter tiles until LETTER_TILES_REQUIRED correct answers
 * 2. Word bank until WORD_BANK_REQUIRED correct answers
 * 3. Keyboard (final mode)
 *
 * @param mastery - The user's mastery record for this word
 * @returns The recommended input method
 *
 * @example
 * getNextChallengeMode({ letterTilesCorrect: 0, ... }) // "letterTiles"
 * getNextChallengeMode({ letterTilesCorrect: 2, wordBankCorrect: 0, ... }) // "wordBank"
 * getNextChallengeMode({ letterTilesCorrect: 2, wordBankCorrect: 2, ... }) // "keyboard"
 */
export function getNextChallengeMode(
  mastery: WordMastery | null | undefined,
): InputMethod {
  if (!mastery) {
    return "letterTiles";
  }

  // Check letter tiles mastery
  if (mastery.letterTilesCorrect < MASTERY_CONFIG.LETTER_TILES_REQUIRED) {
    return "letterTiles";
  }

  // Check word bank mastery
  if (mastery.wordBankCorrect < MASTERY_CONFIG.WORD_BANK_REQUIRED) {
    return "wordBank";
  }

  // Full mastery achieved - use keyboard
  return "keyboard";
}

/**
 * Checks if a specific challenge mode is unlocked for the user.
 *
 * @param mastery - The user's mastery record
 * @param mode - The mode to check
 * @returns true if the mode is available to the user
 */
export function isModeUnlocked(
  mastery: WordMastery | null | undefined,
  mode: InputMethod,
): boolean {
  if (mode === "letterTiles") {
    // Letter tiles is always available
    return true;
  }

  if (mode === "wordBank") {
    // Word bank requires letter tiles mastery
    return (
      (mastery?.letterTilesCorrect ?? 0) >= MASTERY_CONFIG.LETTER_TILES_REQUIRED
    );
  }

  if (mode === "keyboard") {
    // Keyboard requires word bank mastery
    return (
      (mastery?.letterTilesCorrect ?? 0) >=
        MASTERY_CONFIG.LETTER_TILES_REQUIRED &&
      (mastery?.wordBankCorrect ?? 0) >= MASTERY_CONFIG.WORD_BANK_REQUIRED
    );
  }

  // Auto mode is always available
  return true;
}

/**
 * Gets the mastery progress for display.
 *
 * @param mastery - The user's mastery record
 * @returns Object with progress information for each mode
 */
export function getMasteryProgress(mastery: WordMastery | null | undefined): {
  letterTiles: { current: number; required: number; complete: boolean };
  wordBank: { current: number; required: number; complete: boolean };
  keyboard: { correct: number; unlocked: boolean };
} {
  const letterTilesCorrect = mastery?.letterTilesCorrect ?? 0;
  const wordBankCorrect = mastery?.wordBankCorrect ?? 0;
  const keyboardCorrect = mastery?.keyboardCorrect ?? 0;

  return {
    letterTiles: {
      current: letterTilesCorrect,
      required: MASTERY_CONFIG.LETTER_TILES_REQUIRED,
      complete: letterTilesCorrect >= MASTERY_CONFIG.LETTER_TILES_REQUIRED,
    },
    wordBank: {
      current: wordBankCorrect,
      required: MASTERY_CONFIG.WORD_BANK_REQUIRED,
      complete: wordBankCorrect >= MASTERY_CONFIG.WORD_BANK_REQUIRED,
    },
    keyboard: {
      correct: keyboardCorrect,
      unlocked:
        letterTilesCorrect >= MASTERY_CONFIG.LETTER_TILES_REQUIRED &&
        wordBankCorrect >= MASTERY_CONFIG.WORD_BANK_REQUIRED,
    },
  };
}

/**
 * Validates that a letter tile answer matches the expected word.
 *
 * @param placedTiles - Array of placed tile IDs in order
 * @param allTiles - All available tiles
 * @param expectedWord - The word to match
 * @returns true if the placed tiles spell the word correctly
 */
export function validateLetterTileAnswer(
  placedTiles: LetterTile[],
  expectedWord: string,
): boolean {
  const answer = placedTiles.map((t) => t.letter).join("");
  return answer.toLowerCase() === expectedWord.toLowerCase();
}

/**
 * Validates that a word bank answer matches the expected sentence.
 *
 * @param selectedItems - Array of selected word bank items in order
 * @param expectedSentence - The sentence to match
 * @returns true if the selected words form the sentence correctly
 */
export function validateWordBankAnswer(
  selectedItems: WordBankItem[],
  expectedSentence: string,
): boolean {
  const answer = selectedItems.map((item) => item.word).join(" ");
  // Normalize both for comparison (lowercase, trim, collapse whitespace)
  const normalizedAnswer = answer.toLowerCase().trim().replace(/\s+/g, " ");
  const normalizedExpected = expectedSentence
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  return normalizedAnswer === normalizedExpected;
}
