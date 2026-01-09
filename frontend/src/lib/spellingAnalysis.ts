/**
 * Spelling Analysis Utility for Norwegian Bokmål
 *
 * Provides intelligent spelling feedback through:
 * - Levenshtein distance calculation
 * - Character-level diff generation
 * - Norwegian-specific pattern detection
 * - QWERTY keyboard proximity analysis
 */

// ============================================================================
// Types
// ============================================================================

export type DiffType = "equal" | "insert" | "delete" | "replace";

export interface DiffChar {
  char: string;
  type: DiffType;
  expectedChar?: string; // For replacements, what was expected
}

export type ErrorType =
  | "doubleConsonant"
  | "silentH"
  | "silentD"
  | "silentG"
  | "silentV"
  | "silentT"
  | "kjSkjSj"
  | "gjHjJ"
  | "palatalization"
  | "vowelAeE"
  | "diphthong"
  | "retroflex"
  | "velarNg"
  | "compound"
  | "transposition"
  | "missingLetter"
  | "extraLetter"
  | "keyboardTypo"
  | "almostCorrect";

export interface SpellingAnalysisResult {
  diffChars: DiffChar[];
  errorTypes: ErrorType[];
  primaryHint: string | null; // i18n key for the most relevant hint
  distance: number; // Levenshtein distance
  isAlmostCorrect: boolean;
}

export interface SpellingFeedbackConfig {
  almostCorrectThreshold: number; // Levenshtein distance threshold (default: 2)
  showHintOnAttempt: number; // Which attempt to show specific hints (default: 2)
  enableKeyboardProximity: boolean; // Detect QWERTY typos (default: true)
}

export const DEFAULT_SPELLING_CONFIG: SpellingFeedbackConfig = {
  almostCorrectThreshold: 2,
  showHintOnAttempt: 2,
  enableKeyboardProximity: true,
};

// ============================================================================
// QWERTY Keyboard Proximity Map (Norwegian layout)
// ============================================================================

const QWERTY_NEIGHBORS: Record<string, string[]> = {
  // Top row
  q: ["w", "a", "s"],
  w: ["q", "e", "a", "s", "d"],
  e: ["w", "r", "s", "d", "f"],
  r: ["e", "t", "d", "f", "g"],
  t: ["r", "y", "f", "g", "h"],
  y: ["t", "u", "g", "h", "j"],
  u: ["y", "i", "h", "j", "k"],
  i: ["u", "o", "j", "k", "l"],
  o: ["i", "p", "k", "l", "ø"],
  p: ["o", "å", "l", "ø", "æ"],
  å: ["p", "ø", "æ"],

  // Middle row
  a: ["q", "w", "s", "z", "x"],
  s: ["q", "w", "e", "a", "d", "z", "x", "c"],
  d: ["w", "e", "r", "s", "f", "x", "c", "v"],
  f: ["e", "r", "t", "d", "g", "c", "v", "b"],
  g: ["r", "t", "y", "f", "h", "v", "b", "n"],
  h: ["t", "y", "u", "g", "j", "b", "n", "m"],
  j: ["y", "u", "i", "h", "k", "n", "m"],
  k: ["u", "i", "o", "j", "l", "m"],
  l: ["i", "o", "p", "k", "ø"],
  ø: ["o", "p", "å", "l", "æ"],
  æ: ["p", "å", "ø"],

  // Bottom row
  z: ["a", "s", "x"],
  x: ["z", "s", "d", "c"],
  c: ["x", "d", "f", "v"],
  v: ["c", "f", "g", "b"],
  b: ["v", "g", "h", "n"],
  n: ["b", "h", "j", "m"],
  m: ["n", "j", "k"],
};

// ============================================================================
// Norwegian Bokmål Pattern Definitions
// ============================================================================

// Double consonants that are commonly missed
const DOUBLE_CONSONANTS = [
  "bb",
  "dd",
  "ff",
  "gg",
  "kk",
  "ll",
  "mm",
  "nn",
  "pp",
  "rr",
  "ss",
  "tt",
];

// Silent letter patterns in Norwegian Bokmål
const SILENT_PATTERNS = {
  silentH: {
    patterns: [/^hv/, /^hj/], // hv-, hj- at start
    description: "Silent h at word start",
  },
  silentD: {
    patterns: [/ld$/, /nd$/, /rd$/, /gd$/], // -ld, -nd, -rd, -gd endings
    description: "Silent d after consonant",
  },
  silentG: {
    patterns: [/ig$/, /lig$/], // -ig, -lig suffixes
    description: "Silent g in -ig/-lig",
  },
  silentV: {
    patterns: [/lv$/], // -lv ending (halv, selv, tolv)
    description: "Silent v after l",
  },
  silentT: {
    patterns: [/et$/], // Neuter -et definite
    description: "Silent t in -et",
  },
};

// Sound confusion patterns
const SOUND_CONFUSIONS = {
  kjSkjSj: {
    variants: ["kj", "skj", "sj"],
    description: "kj/skj/sj sound confusion",
  },
  gjHjJ: {
    variants: ["gj", "hj", "j"],
    description: "gj/hj/j sound confusion",
  },
  palatalization: {
    patterns: [
      { before: /^ki/, confused: /^kji/ },
      { before: /^ky/, confused: /^kjy/ },
      { before: /^ski/, confused: /^sji/ },
      { before: /^sky/, confused: /^sjy/ },
    ],
    description: "k/sk palatalization before i/y",
  },
};

// Vowel confusion patterns
const VOWEL_CONFUSIONS = {
  vowelAeE: {
    pairs: [
      ["æ", "e"],
      ["e", "æ"],
    ],
    description: "æ/e confusion",
  },
  diphthong: {
    pairs: [
      ["ei", "ai"],
      ["ai", "ei"],
    ],
    description: "ei/ai diphthong confusion",
  },
};

// ============================================================================
// Core Algorithms
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower.length === 0) return bLower.length;
  if (bLower.length === 0) return aLower.length;

  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
}

/**
 * Generate character-level diff between user answer and expected word
 * Returns array of DiffChar showing what's correct, wrong, missing, or extra
 */
function generateCharDiff(userAnswer: string, expected: string): DiffChar[] {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  // Use dynamic programming to find optimal alignment
  const m = user.length;
  const n = exp.length;

  // Build the DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (user[i - 1] === exp[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
      }
    }
  }

  // Backtrack to find the actual operations
  let i = m;
  let j = n;
  const operations: DiffChar[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && user[i - 1] === exp[j - 1]) {
      // Characters match
      operations.unshift({ char: user[i - 1], type: "equal" });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // Replacement
      operations.unshift({
        char: user[i - 1],
        type: "replace",
        expectedChar: exp[j - 1],
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // Deletion (extra character in user input)
      operations.unshift({ char: user[i - 1], type: "delete" });
      i--;
    } else if (j > 0 && dp[i][j] === dp[0][j - 1] + 1 && i === 0) {
      // Insertion when user string is exhausted
      operations.unshift({ char: exp[j - 1], type: "insert" });
      j--;
    } else if (j > 0) {
      // Insertion (missing character)
      operations.unshift({ char: exp[j - 1], type: "insert" });
      j--;
    } else if (i > 0) {
      // Extra character
      operations.unshift({ char: user[i - 1], type: "delete" });
      i--;
    }
  }

  return operations;
}

/**
 * Check if two characters are adjacent on QWERTY keyboard
 */
function areKeysAdjacent(char1: string, char2: string): boolean {
  const c1 = char1.toLowerCase();
  const c2 = char2.toLowerCase();

  const neighbors = QWERTY_NEIGHBORS[c1];
  return neighbors ? neighbors.includes(c2) : false;
}

// ============================================================================
// Pattern Detection
// ============================================================================

/**
 * Detect double consonant errors
 */
function detectDoubleConsonantError(
  userAnswer: string,
  expected: string,
): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  for (const dc of DOUBLE_CONSONANTS) {
    const single = dc[0];
    // Expected has double, user wrote single
    if (exp.includes(dc) && !user.includes(dc)) {
      // Check if the word structure matches with single consonant instead of double
      // Replace double with single in expected and see if it matches user
      const expWithSingle = exp.replace(dc, single);
      if (
        expWithSingle === user ||
        levenshteinDistance(expWithSingle, user) <
          levenshteinDistance(exp, user)
      ) {
        return true;
      }
    }
    // Or user wrote double when should be single (over-correction)
    if (!exp.includes(dc) && user.includes(dc)) {
      return true;
    }
  }
  return false;
}

/**
 * Detect silent letter errors
 */
function detectSilentLetterError(
  userAnswer: string,
  expected: string,
): ErrorType | null {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  for (const [errorType, config] of Object.entries(SILENT_PATTERNS)) {
    for (const pattern of config.patterns) {
      // Expected matches pattern but user doesn't (user omitted silent letter)
      if (pattern.test(exp) && !pattern.test(user)) {
        // Verify this is likely the cause
        const cleanedUser = user.replace(/[^a-zæøå]/g, "");
        const cleanedExp = exp.replace(/[^a-zæøå]/g, "");
        if (Math.abs(cleanedUser.length - cleanedExp.length) <= 2) {
          return errorType as ErrorType;
        }
      }
    }
  }
  return null;
}

/**
 * Detect kj/skj/sj confusion
 */
function detectKjSkjSjError(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  const variants = SOUND_CONFUSIONS.kjSkjSj.variants;
  for (const v1 of variants) {
    for (const v2 of variants) {
      if (v1 !== v2) {
        // Expected has v1, user wrote v2
        if (exp.includes(v1) && user.includes(v2) && !user.includes(v1)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Detect gj/hj/j confusion
 */
function detectGjHjJError(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  const variants = SOUND_CONFUSIONS.gjHjJ.variants;
  for (const v1 of variants) {
    for (const v2 of variants) {
      if (v1 !== v2) {
        // Expected has v1, user wrote v2
        if (exp.includes(v1) && user.includes(v2) && !user.includes(v1)) {
          return true;
        }
        // User wrote v2 where v1 was expected (at word start)
        if (exp.startsWith(v1) && user.startsWith(v2)) {
          return true;
        }
      }
    }
  }

  // Also detect when user adds gj/hj where just j was expected
  if (exp.startsWith("j") && !exp.startsWith("gj") && !exp.startsWith("hj")) {
    if (user.startsWith("gj") || user.startsWith("hj")) {
      return true;
    }
  }

  return false;
}

/**
 * Detect vowel confusion (æ/e)
 */
function detectVowelAeEError(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  // Check if swapping æ↔e makes them match better
  const userWithSwap = user.replace(/æ/g, "e").replace(/e/g, "æ");
  if (
    levenshteinDistance(userWithSwap, exp) <
    levenshteinDistance(user, exp) - 1
  ) {
    return true;
  }

  // Direct check for æ/e positions
  for (let i = 0; i < Math.min(user.length, exp.length); i++) {
    if (
      (user[i] === "æ" && exp[i] === "e") ||
      (user[i] === "e" && exp[i] === "æ")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Detect diphthong confusion (ei/ai)
 */
function detectDiphthongError(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  for (const [d1, d2] of VOWEL_CONFUSIONS.diphthong.pairs) {
    if (exp.includes(d1) && user.includes(d2) && !user.includes(d1)) {
      return true;
    }
  }
  return false;
}

/**
 * Detect transposition (adjacent letters swapped)
 */
function detectTransposition(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  // Must be same length and not identical
  if (user.length !== exp.length || user === exp) return false;

  let transpositions = 0;
  for (let i = 0; i < user.length - 1; i++) {
    // Check for swap: user[i] matches exp[i+1] AND user[i+1] matches exp[i]
    // But also verify they don't already match their positions
    if (
      user[i] === exp[i + 1] &&
      user[i + 1] === exp[i] &&
      user[i] !== exp[i]
    ) {
      transpositions++;
      // Skip the next position since we've already processed it
    }
  }

  return transpositions > 0 && transpositions <= 2;
}

/**
 * Detect keyboard typos (adjacent key presses)
 */
function detectKeyboardTypo(
  userAnswer: string,
  expected: string,
  config: SpellingFeedbackConfig,
): boolean {
  if (!config.enableKeyboardProximity) return false;

  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  // Only check if lengths are similar
  if (Math.abs(user.length - exp.length) > 1) return false;

  let adjacentMismatches = 0;
  const minLen = Math.min(user.length, exp.length);

  for (let i = 0; i < minLen; i++) {
    if (user[i] !== exp[i] && areKeysAdjacent(user[i], exp[i])) {
      adjacentMismatches++;
    }
  }

  // If most errors are adjacent key presses, it's likely a typo
  return adjacentMismatches > 0 && adjacentMismatches <= 2;
}

/**
 * Detect compound word boundary errors (space inserted)
 */
function detectCompoundError(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase().trim();
  const exp = expected.toLowerCase();

  // User added space(s) in what should be a compound word
  if (user.includes(" ") && !exp.includes(" ")) {
    const userNoSpace = user.replace(/\s+/g, "");
    return userNoSpace === exp;
  }
  return false;
}

/**
 * Detect retroflex rs confusion
 */
function detectRetroflexError(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  // rs in Norwegian sounds like /ʂ/, might be confused with sj
  if (exp.includes("rs") && (user.includes("sj") || user.includes("s"))) {
    const userWithRs = user.replace("sj", "rs").replace(/([^r])s/g, "$1rs");
    return (
      levenshteinDistance(userWithRs, exp) < levenshteinDistance(user, exp)
    );
  }
  return false;
}

/**
 * Detect velar ng errors (extra g after ng)
 */
function detectVelarNgError(userAnswer: string, expected: string): boolean {
  const user = userAnswer.toLowerCase();
  const exp = expected.toLowerCase();

  // User wrote "ngg" when it should be "ng"
  if (user.includes("ngg") && exp.includes("ng") && !exp.includes("ngg")) {
    return true;
  }
  // Or user wrote "ng" with extra g elsewhere
  if (!exp.includes("ng") && user.includes("ng")) {
    return true;
  }
  return false;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze a user's spelling answer and provide intelligent feedback
 */
export function analyzeSpelling(
  userAnswer: string,
  expected: string,
  config: SpellingFeedbackConfig = DEFAULT_SPELLING_CONFIG,
): SpellingAnalysisResult {
  const distance = levenshteinDistance(userAnswer, expected);
  const diffChars = generateCharDiff(userAnswer, expected);
  const errorTypes: ErrorType[] = [];

  // Determine if almost correct
  const isAlmostCorrect = distance <= config.almostCorrectThreshold;

  // Detect error patterns (order matters for hint priority)

  // Compound word check first (user added space)
  if (detectCompoundError(userAnswer, expected)) {
    errorTypes.push("compound");
  }

  // Double consonants (very common in Norwegian)
  if (detectDoubleConsonantError(userAnswer, expected)) {
    errorTypes.push("doubleConsonant");
  }

  // Silent letters
  const silentError = detectSilentLetterError(userAnswer, expected);
  if (silentError) {
    errorTypes.push(silentError);
  }

  // Sound confusions
  if (detectKjSkjSjError(userAnswer, expected)) {
    errorTypes.push("kjSkjSj");
  }

  if (detectGjHjJError(userAnswer, expected)) {
    errorTypes.push("gjHjJ");
  }

  // Vowel confusions
  if (detectVowelAeEError(userAnswer, expected)) {
    errorTypes.push("vowelAeE");
  }

  if (detectDiphthongError(userAnswer, expected)) {
    errorTypes.push("diphthong");
  }

  // Retroflex
  if (detectRetroflexError(userAnswer, expected)) {
    errorTypes.push("retroflex");
  }

  // Velar ng
  if (detectVelarNgError(userAnswer, expected)) {
    errorTypes.push("velarNg");
  }

  // Transposition
  if (detectTransposition(userAnswer, expected)) {
    errorTypes.push("transposition");
  }

  // Keyboard typo (only if enabled)
  if (detectKeyboardTypo(userAnswer, expected, config)) {
    errorTypes.push("keyboardTypo");
  }

  // Generic missing/extra letter detection
  const userLen = userAnswer.length;
  const expLen = expected.length;
  if (userLen < expLen && !errorTypes.length) {
    errorTypes.push("missingLetter");
  } else if (userLen > expLen && !errorTypes.length) {
    errorTypes.push("extraLetter");
  }

  // Add almostCorrect if within threshold and we found specific errors
  if (isAlmostCorrect && errorTypes.length > 0) {
    errorTypes.push("almostCorrect");
  }

  // Determine primary hint (first detected error type maps to hint key)
  const primaryHint =
    errorTypes.length > 0 ? `test.hint.${errorTypes[0]}` : null;

  return {
    diffChars,
    errorTypes,
    primaryHint,
    distance,
    isAlmostCorrect,
  };
}

/**
 * Get hint text for a specific attempt number
 * Progressive hints: generic on first attempt, specific on later attempts
 */
export function getHintForAttempt(
  analysis: SpellingAnalysisResult,
  attemptNumber: number,
  config: SpellingFeedbackConfig = DEFAULT_SPELLING_CONFIG,
): string | null {
  // First attempt: no specific hint (just show "try again")
  if (attemptNumber < config.showHintOnAttempt) {
    return null;
  }

  // Later attempts: show specific hint
  return analysis.primaryHint;
}
