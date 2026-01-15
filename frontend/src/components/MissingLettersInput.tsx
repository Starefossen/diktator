"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import { CorrectFeedback } from "@/components/SpellingFeedback";
import type {
  NavigationActions,
  StandardFeedbackState,
} from "@/lib/testEngine/types";

interface MissingLettersInputProps {
  word: string;
  blankedWord: string; // e.g., "ma__" for "mann" or "_jelpe" for "hjelpe"
  missingLetters: string; // The letters that are missing, e.g., "nn" or "h"
  onSubmit: (answer: string, isCorrect: boolean) => void;
  onSkip?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Feedback state from parent (for error feedback) */
  feedbackState?: StandardFeedbackState | null;
  /** Whether to show correct feedback animation */
  showingCorrectFeedback?: boolean;
  /** Navigation actions for unified button handling */
  navigation?: NavigationActions;
  /** Callback to expose clear function to parent */
  onClearRef?: (clearFn: () => void) => void;
  /** Callback to expose canClear state to parent */
  onCanClearChange?: (canClear: boolean) => void;
  /** Initial submitted state for dev/demo purposes */
  initialHasSubmitted?: boolean;
  /** Initial isCorrect state for dev/demo purposes (requires initialHasSubmitted=true) */
  initialIsCorrect?: boolean;
}

/**
 * MissingLettersInput - Gap fill input for targeted spelling practice
 *
 * Displays a word with strategic blanks and lets the child type directly
 * into the blank squares. Ideal for practicing specific spelling challenges
 * like double consonants, silent letters, or Norwegian characters.
 *
 * @example
 * // Double consonant practice
 * <MissingLettersInput
 *   word="mann"
 *   blankedWord="ma__"
 *   missingLetters="nn"
 *   onSubmit={(answer, correct) => console.log(answer, correct)}
 * />
 *
 * @example
 * // Silent letter practice
 * <MissingLettersInput
 *   word="hjelpe"
 *   blankedWord="_jelpe"
 *   missingLetters="h"
 *   onSubmit={(answer, correct) => console.log(answer, correct)}
 * />
 */
export function MissingLettersInput({
  word,
  blankedWord,
  missingLetters,
  onSubmit,
  onSkip: _onSkip,
  autoFocus = true,
  disabled = false,
  feedbackState = null,
  showingCorrectFeedback = false,
  navigation: _navigation,
  onClearRef,
  onCanClearChange,
  initialHasSubmitted = false,
  initialIsCorrect,
}: MissingLettersInputProps) {
  const { t } = useLanguage();

  // Determine if showing feedback based on parent control
  const showingFeedback = feedbackState !== null;
  const hasSubmitted =
    showingFeedback || showingCorrectFeedback || initialHasSubmitted;
  const isCorrect = showingCorrectFeedback || (initialIsCorrect ?? false);

  const isInitialMount = useRef(true);

  // Track individual letter inputs
  const blankCount = (blankedWord.match(/_/g) || []).length;
  const [letterInputs, setLetterInputs] = useState<string[]>(
    Array(blankCount).fill(""),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first blank on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Reset state when word changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newBlankCount = (blankedWord.match(/_/g) || []).length;
    setLetterInputs(Array(newBlankCount).fill(""));
    inputRefs.current = [];
    // Focus first input after reset
    setTimeout(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 0);
  }, [word, blankedWord, autoFocus]);

  // Get just the letters the user typed (for internal validation)
  const getUserLetters = useCallback(() => {
    return letterInputs.join("");
  }, [letterInputs]);

  // Reconstruct the full word by filling blanks with user's letters
  const getFullWord = useCallback(
    (letters: string[]) => {
      let letterIdx = 0;
      let result = "";
      for (const char of blankedWord) {
        if (char === "_") {
          result += letters[letterIdx] || "";
          letterIdx++;
        } else {
          result += char;
        }
      }
      return result;
    },
    [blankedWord],
  );

  const handleSubmit = useCallback(() => {
    if (disabled || hasSubmitted) return;

    const userLetters = getUserLetters();
    if (userLetters.length !== missingLetters.length) return;

    const normalizedInput = userLetters.toLowerCase();
    const normalizedMissing = missingLetters.toLowerCase();
    const correct = normalizedInput === normalizedMissing;

    // Submit the full reconstructed word (not just the missing letters)
    const fullWord = getFullWord(letterInputs);

    onSubmit(fullWord, correct);
  }, [
    disabled,
    hasSubmitted,
    getUserLetters,
    missingLetters,
    getFullWord,
    letterInputs,
    onSubmit,
  ]);

  const handleLetterChange = (index: number, value: string) => {
    if (disabled || hasSubmitted) return;

    // Only take the last character if multiple are pasted/typed
    const newChar = value.slice(-1).toLowerCase();

    setLetterInputs((prev) => {
      const updated = [...prev];
      updated[index] = newChar;
      return updated;
    });

    // Auto-advance to next input if a character was entered
    if (newChar && index < blankCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if this was the last blank and all are filled
    if (newChar && index === blankCount - 1) {
      // Check if all inputs are filled (including this one)
      const allFilled = letterInputs.every((l, i) =>
        i === index ? newChar : l,
      );
      if (allFilled) {
        // Use timeout to allow state to update
        setTimeout(() => {
          const userLettersArray = letterInputs.map((l, i) =>
            i === index ? newChar : l,
          );
          const userLetters = userLettersArray.join("");
          if (userLetters.length === missingLetters.length) {
            const normalizedInput = userLetters.toLowerCase();
            const normalizedMissing = missingLetters.toLowerCase();
            const correct = normalizedInput === normalizedMissing;

            // Reconstruct full word for submission
            let letterIdx = 0;
            let fullWord = "";
            for (const char of blankedWord) {
              if (char === "_") {
                fullWord += userLettersArray[letterIdx] || "";
                letterIdx++;
              } else {
                fullWord += char;
              }
            }

            onSubmit(fullWord, correct);
          }
        }, 50);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !letterInputs[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < blankCount - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = useCallback(() => {
    setLetterInputs(Array(blankCount).fill(""));
    inputRefs.current[0]?.focus();
  }, [blankCount]);

  // Expose clear function to parent via ref callback
  useEffect(() => {
    onClearRef?.(handleClear);
  }, [handleClear, onClearRef]);

  // Notify parent of canClear state changes
  useEffect(() => {
    onCanClearChange?.(letterInputs.some((l) => l));
  }, [letterInputs, onCanClearChange]);

  // Build character array with blank positions tracked
  const chars: { char: string; isBlank: boolean; blankIndex: number }[] = [];
  let blankIndex = 0;
  for (const char of blankedWord) {
    if (char === "_") {
      chars.push({ char, isBlank: true, blankIndex: blankIndex++ });
    } else {
      chars.push({ char, isBlank: false, blankIndex: -1 });
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Instruction */}
      <p className="text-lg text-gray-600">{t("missingLetters.instruction")}</p>

      {/* Word display area - matches LetterTileInput styling */}
      <div
        className="flex flex-wrap justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4"
        role="group"
        aria-label={t("challenge.answerArea" as TranslationKey)}
      >
        {chars.map((item, index) =>
          item.isBlank ? (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[item.blankIndex] = el;
              }}
              type="text"
              value={letterInputs[item.blankIndex]}
              onChange={(e) =>
                handleLetterChange(item.blankIndex, e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(item.blankIndex, e)}
              disabled={disabled || hasSubmitted}
              maxLength={1}
              size={1}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`${t("missingLetters.letterInput")} ${item.blankIndex + 1}`}
              // i18n-ignore - visual placeholder showing blank slot
              placeholder="_"
              style={{ width: "48px", minWidth: "48px", maxWidth: "48px" }}
              className={`
                h-12 shrink-0 box-border
                rounded-lg text-center text-xl font-bold uppercase
                transition-all duration-150
                focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                placeholder:text-gray-400
                ${
                  hasSubmitted
                    ? isCorrect
                      ? "bg-green-100 text-green-800 border-2 border-green-400"
                      : "bg-red-100 text-red-700 border-2 border-red-400"
                    : "bg-nordic-sky/20 border-2 border-dashed border-nordic-sky/50 text-gray-900 focus:border-nordic-sky focus:bg-nordic-sky/30 focus:border-solid"
                }
              `}
            />
          ) : (
            <span
              key={index}
              className="inline-flex w-12 h-12 shrink-0 items-center justify-center rounded-lg bg-nordic-sky text-xl font-bold uppercase text-white shadow-md"
            >
              {item.char}
            </span>
          ),
        )}
      </div>

      {/* Helper text */}
      {!hasSubmitted && (
        <p className="text-sm text-gray-500">
          {blankCount}{" "}
          {blankCount === 1
            ? t("missingLetters.letterMissing")
            : t("missingLetters.lettersMissing")}
        </p>
      )}

      {/* Success feedback - shows when answer is correct */}
      {showingCorrectFeedback && <CorrectFeedback />}

      {/* Error feedback - shows attempt count and hints */}
      {showingFeedback && feedbackState && (
        <>
          {/* Legend for tile colors */}
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded" />
              {t("test.feedback.correct" as TranslationKey)}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded" />
              {t("test.feedback.wrong" as TranslationKey)}
            </span>
          </div>

          {/* Attempt counter */}
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="font-semibold text-red-700">
              {t("test.tryAgain")} ({feedbackState.currentAttempt}/
              {feedbackState.maxAttempts})
            </span>
            {feedbackState.analysis.isAlmostCorrect && (
              <span className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                {t("test.feedback.almostThere" as TranslationKey)}
              </span>
            )}
          </div>

          {/* Hint message - shows during feedback from second attempt */}
          {feedbackState.hintKey && (
            <div className="p-2 bg-nordic-sky/10 rounded-lg border border-nordic-sky/30">
              <p className="text-nordic-midnight text-sm font-medium text-center">
                {t(feedbackState.hintKey as TranslationKey)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Helper function to generate blanked word from a word and focus positions
 *
 * @param word - The full word
 * @param positions - Array of character positions to blank (0-indexed)
 * @returns Object with blankedWord and missingLetters
 *
 * @example
 * generateBlankedWord("mann", [2, 3])
 * // Returns: { blankedWord: "ma__", missingLetters: "nn" }
 *
 * @example
 * generateBlankedWord("hjelpe", [0])
 * // Returns: { blankedWord: "_jelpe", missingLetters: "h" }
 */
export function generateBlankedWord(
  word: string,
  positions: number[],
): { blankedWord: string; missingLetters: string } {
  const chars = word.split("");
  let missingLetters = "";

  positions.forEach((pos) => {
    if (pos >= 0 && pos < chars.length) {
      missingLetters += chars[pos];
      chars[pos] = "_";
    }
  });

  return {
    blankedWord: chars.join(""),
    missingLetters,
  };
}

/**
 * Helper function to detect common Norwegian spelling challenge patterns
 * and generate appropriate blank positions
 *
 * @param word - The word to analyze
 * @returns Object with blankedWord, missingLetters, and challengeType
 */
export function detectSpellingChallenge(word: string): {
  blankedWord: string;
  missingLetters: string;
  challengeType: string;
} | null {
  const lowerWord = word.toLowerCase();

  // Double consonants (nn, ll, mm, tt, ss, etc.)
  const doubleMatch = lowerWord.match(/(.)\1/);
  if (doubleMatch && doubleMatch.index !== undefined) {
    return {
      ...generateBlankedWord(word, [doubleMatch.index, doubleMatch.index + 1]),
      challengeType: "doubleConsonant",
    };
  }

  // Silent h at start (hj-, hv-)
  if (lowerWord.startsWith("hj") || lowerWord.startsWith("hv")) {
    return {
      ...generateBlankedWord(word, [0]),
      challengeType: "silentH",
    };
  }

  // Silent d at end (-nd, -ld)
  if (lowerWord.match(/[nl]d$/)) {
    return {
      ...generateBlankedWord(word, [word.length - 1]),
      challengeType: "silentD",
    };
  }

  // Norwegian special characters (æ, ø, å)
  const specialCharMatch = lowerWord.match(/[æøå]/);
  if (specialCharMatch && specialCharMatch.index !== undefined) {
    return {
      ...generateBlankedWord(word, [specialCharMatch.index]),
      challengeType: "norwegianChar",
    };
  }

  // Skj-sound variants
  const skjMatch = lowerWord.match(/^(skj|sj|sk)/);
  if (skjMatch) {
    const positions = Array.from({ length: skjMatch[1].length }, (_, i) => i);
    return {
      ...generateBlankedWord(word, positions),
      challengeType: "skjSound",
    };
  }

  // Default: blank a vowel
  const vowelMatch = lowerWord.match(/[aeiouyæøå]/);
  if (vowelMatch && vowelMatch.index !== undefined) {
    return {
      ...generateBlankedWord(word, [vowelMatch.index]),
      challengeType: "vowel",
    };
  }

  return null;
}
