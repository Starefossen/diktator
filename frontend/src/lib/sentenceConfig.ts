/**
 * Configuration for sentence dictation and progressive challenges.
 *
 * All sentence-related constants are defined here for easy adjustment
 * and consistency across the application.
 */

export const MASTERY_CONFIG = {
  /** Number of correct answers in letter tiles mode to unlock word bank */
  LETTER_TILES_REQUIRED: 2,

  /** Number of correct answers in word bank mode to unlock keyboard */
  WORD_BANK_REQUIRED: 2,
} as const;

const TTS_CONFIG = {
  /** Maximum number of words allowed in a sentence for TTS (hard limit) */
  MAX_SENTENCE_WORDS: 15,

  /** Word count threshold to show warning in editor */
  WARN_SENTENCE_WORDS: 12,

  /** Speaking rate for single words (slower for clarity) */
  SINGLE_WORD_RATE: 0.8,

  /** Speaking rate for sentences (slightly faster for natural flow) */
  SENTENCE_RATE: 0.9,
} as const;

export const CHALLENGE_CONFIG = {
  /** Number of extra distractor letters in letter tile mode */
  LETTER_DISTRACTORS: 4,

  /** Number of extra distractor words in word bank mode */
  WORD_DISTRACTORS: 6,

  /** Common Norwegian filler words used as distractors when word set is small */
  NORWEGIAN_FILLERS: [
    "og",
    "er",
    "på",
    "en",
    "et",
    "å",
    "i",
    "til",
    "for",
    "med",
    "som",
    "av",
    "har",
    "var",
    "kan",
    "jeg",
    "du",
    "vi",
    "de",
    "den",
    "det",
    "da",
    "om",
    "men",
    "så",
    "når",
    "etter",
    "før",
    "mot",
  ],

  /** Similar word pairs for advanced distractors (confusable words) */
  CONFUSABLE_WORDS: {
    da: ["når", "så"],
    når: ["da", "hvor"],
    der: ["her", "hvor"],
    her: ["der", "hit"],
    han: ["hun", "den"],
    hun: ["han", "den"],
    var: ["er", "blir"],
    er: ["var", "blir"],
    kan: ["skal", "vil"],
    skal: ["kan", "vil", "må"],
    vil: ["kan", "skal"],
    meg: ["deg", "seg"],
    deg: ["meg", "seg"],
    seg: ["meg", "deg"],
    sin: ["hans", "hennes"],
    sitt: ["hans", "hennes"],
    sine: ["hans", "hennes"],
    eller: ["og", "men"],
    og: ["eller", "men"],
    men: ["og", "eller"],
    i: ["på", "til"],
    på: ["i", "til", "av"],
    til: ["fra", "i", "på"],
    fra: ["til", "av"],
    av: ["fra", "på"],
    at: ["om", "så"],
    om: ["at", "hvis"],
    hvis: ["om", "når"],
    fordi: ["derfor", "siden"],
    derfor: ["fordi", "så"],
    selv: ["også", "bare"],
    også: ["selv", "bare"],
    bare: ["selv", "også", "kun"],
  } as Record<string, string[]>,

  /** Phonetically similar Norwegian letter pairs for distractor generation */
  PHONETIC_PAIRS: {
    o: ["ø", "å"],
    ø: ["o", "ö"],
    a: ["æ", "å"],
    æ: ["a", "e"],
    å: ["o", "a"],
    e: ["æ", "i"],
    k: ["g"],
    g: ["k"],
    p: ["b"],
    b: ["p"],
    t: ["d"],
    d: ["t"],
    s: ["z"],
    n: ["m"],
    m: ["n"],
  },
} as const;

const _DICTIONARY_CONFIG = {
  /** Minimum time between dictionary API requests (rate limiting) */
  RATE_LIMIT_MS: 500,

  /** Cache duration for dictionary responses in hours */
  CACHE_TTL_HOURS: 24,

  /** Base URL for dictionary API (proxied through backend) */
  BASE_URL: "/api/dictionary",
} as const;

const _AGE_CONFIG = {
  /** Minimum age for registration */
  MIN_AGE: 5,

  /** Maximum age for child accounts */
  MAX_AGE: 12,
} as const;

/**
 * Difficulty levels for curated content
 */
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

/**
 * Norwegian school grade levels (LK20 curriculum alignment)
 */
export type GradeLevel = "1-2" | "3-4" | "5-7";

/**
 * Spelling focus categories for curated word sets
 */
export type SpellingFocusCategory =
  | "doubleConsonant"
  | "silentLetter"
  | "compoundWord"
  | "diphthong"
  | "skjSound"
  | "norwegianChars"
  | "ngNk"
  | "silentD"
  | "vowelLength";

/**
 * Determines if content is a sentence (more than one word)
 */
export function isSentence(text: string): boolean {
  return getWordCount(text) > 1;
}

/**
 * Gets the word count of a text
 */
export function getWordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Classifies difficulty based on word count for sentences
 */
export function classifySentenceDifficulty(
  wordCount: number,
): DifficultyLevel | null {
  if (wordCount <= 1) return null; // Not a sentence
  if (wordCount <= 5) return "beginner";
  if (wordCount <= 8) return "intermediate";
  return "advanced";
}

/**
 * Checks if a sentence exceeds TTS limits
 */
function _checkSentenceLength(text: string): {
  wordCount: number;
  isOverLimit: boolean;
  isWarning: boolean;
  difficulty: DifficultyLevel | null;
} {
  const wordCount = getWordCount(text);
  return {
    wordCount,
    isOverLimit: wordCount > TTS_CONFIG.MAX_SENTENCE_WORDS,
    isWarning:
      wordCount > TTS_CONFIG.WARN_SENTENCE_WORDS &&
      wordCount <= TTS_CONFIG.MAX_SENTENCE_WORDS,
    difficulty: classifySentenceDifficulty(wordCount),
  };
}
