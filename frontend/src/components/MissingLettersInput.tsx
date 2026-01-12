"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MissingLettersInputProps {
  word: string;
  blankedWord: string; // e.g., "ma__" for "mann" or "_jelpe" for "hjelpe"
  missingLetters: string; // The letters that are missing, e.g., "nn" or "h"
  onSubmit: (answer: string, isCorrect: boolean) => void;
  onSkip?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * MissingLettersInput - Gap fill input for targeted spelling practice
 *
 * Displays a word with strategic blanks and lets the child type only
 * the missing letters. Ideal for practicing specific spelling challenges
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
  onSkip,
  autoFocus = true,
  disabled = false,
}: MissingLettersInputProps) {
  const { t } = useLanguage();
  const [userInput, setUserInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Reset state when word changes
  useEffect(() => {
    setUserInput("");
    setHasSubmitted(false);
    setIsCorrect(null);
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [word, autoFocus]);

  const handleSubmit = useCallback(() => {
    if (disabled || hasSubmitted || !userInput.trim()) return;

    const normalizedInput = userInput.toLowerCase().trim();
    const normalizedMissing = missingLetters.toLowerCase();
    const correct = normalizedInput === normalizedMissing;

    setHasSubmitted(true);
    setIsCorrect(correct);
    onSubmit(userInput, correct);
  }, [disabled, hasSubmitted, userInput, missingLetters, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Build the display with filled-in letters when submitted
  const buildDisplayWord = () => {
    if (!hasSubmitted) {
      return blankedWord;
    }

    // Replace underscores with user input (character by character)
    let result = "";
    let inputIndex = 0;

    for (const char of blankedWord) {
      if (char === "_") {
        result += userInput[inputIndex] || "_";
        inputIndex++;
      } else {
        result += char;
      }
    }

    return result;
  };

  // Count blanks to show expected length
  const blankCount = (blankedWord.match(/_/g) || []).length;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Instruction */}
      <p className="text-lg text-gray-600">{t("missingLetters.instruction")}</p>

      {/* Word display with blanks */}
      <div className="flex items-center justify-center gap-1 text-3xl font-semibold tracking-widest">
        {blankedWord.split("").map((char, index) => (
          <span
            key={index}
            className={`inline-flex h-12 w-10 items-center justify-center rounded-lg ${
              char === "_"
                ? hasSubmitted
                  ? isCorrect
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                  : "border-2 border-dashed border-sky-300 bg-sky-50"
                : "bg-gray-100"
            }`}
          >
            {char === "_" && hasSubmitted
              ? userInput[blankedWord.slice(0, index).split("_").length - 1] ||
                "_"
              : char === "_"
                ? ""
                : char}
          </span>
        ))}
      </div>

      {/* Input field */}
      {!hasSubmitted && (
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="missing-letters-input" className="sr-only">
            {t("missingLetters.placeholder")}
          </label>
          <input
            ref={inputRef}
            id="missing-letters-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${blankCount} letter${blankCount > 1 ? "s" : ""}...`}
            disabled={disabled}
            maxLength={blankCount + 2} // Allow slight overflow for typos
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-h-14 w-32 rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-2xl font-medium focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <p className="text-sm text-gray-500">
            {blankCount}{" "}
            {blankCount === 1
              ? t("missingLetters.letterMissing")
              : t("missingLetters.lettersMissing")}
          </p>
        </div>
      )}

      {/* Feedback after submission */}
      {hasSubmitted && (
        <div
          className={`rounded-xl px-6 py-3 text-lg font-medium ${
            isCorrect
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isCorrect ? (
            <span>{t("test.feedback.correct")}</span>
          ) : (
            <span>
              {t("test.feedback.correctAnswer")}:{" "}
              <strong>{missingLetters}</strong>
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-4">
        {onSkip && !hasSubmitted && (
          <button
            type="button"
            onClick={onSkip}
            disabled={disabled}
            className="min-h-12 rounded-xl border-2 border-gray-200 px-6 py-3 font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {t("challenge.clear")}
          </button>
        )}

        {!hasSubmitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !userInput.trim()}
            className="min-h-12 rounded-xl bg-sky-500 px-8 py-3 font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
          >
            {t("challenge.check")} ✓
          </button>
        )}
      </div>
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
