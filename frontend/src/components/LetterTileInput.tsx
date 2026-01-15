"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import type { LetterTile } from "@/lib/challenges";
import { HeroLightBulbIcon } from "@/components/Icons";
import { CorrectFeedback } from "@/components/SpellingFeedback";
import type {
  NavigationActions,
  TileFeedbackState,
} from "@/lib/testEngine/types";

export type { TileFeedbackState };

interface LetterTileInputProps {
  tiles: LetterTile[];
  expectedWord: string;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  onAnswerChange?: (answer: string, isComplete: boolean) => void;
  disabled?: boolean;
  feedbackState?: TileFeedbackState | null;
  showingCorrectFeedback?: boolean;
  /** Duration for the countdown timer bar in milliseconds */
  timerDurationMs?: number;
  /** Navigation actions for unified button handling */
  navigation?: NavigationActions;
  /** Callback to expose clear function to parent */
  onClearRef?: (clearFn: () => void) => void;
  /** Callback to expose canClear state to parent */
  onCanClearChange?: (canClear: boolean) => void;
}

/**
 * LetterTileInput provides a tap-to-place letter tile interface for spelling words.
 *
 * Features:
 * - 48px+ touch targets for WCAG 2.1 AA compliance
 * - Tap available tile to place in next slot
 * - Tap placed tile to return to available pool
 * - Visual feedback with nordic color scheme
 * - Inline error feedback without layout shift
 * - Keyboard accessible with proper ARIA labels
 *
 * Navigation is handled externally via TestNavigationBar when navigation prop is provided.
 */
export function LetterTileInput({
  tiles,
  expectedWord,
  onSubmit,
  onAnswerChange,
  disabled = false,
  feedbackState = null,
  showingCorrectFeedback = false,
  timerDurationMs,
  navigation,
  onClearRef,
  onCanClearChange,
}: LetterTileInputProps) {
  const { t } = useLanguage();

  // Track which tiles have been placed and in what order
  const [placedTileIds, setPlacedTileIds] = useState<string[]>([]);

  // Track previous feedback state to detect retry transitions
  const prevFeedbackStateRef = React.useRef<TileFeedbackState | null>(null);

  // Flag to skip auto-submit for one render after clearing for retry
  const skipAutoSubmitRef = React.useRef(false);

  // Track the last submitted answer to prevent double-submit
  const lastSubmittedAnswerRef = React.useRef<string | null>(null);

  // Clear tiles when transitioning from feedback to retry (not on initial mount)
  React.useEffect(() => {
    const wasFeedback = prevFeedbackStateRef.current !== null;
    const isFeedback = feedbackState !== null;

    // If we had feedback and now we don't (retry), clear the tiles and reset submit tracking
    if (wasFeedback && !isFeedback && !showingCorrectFeedback) {
      skipAutoSubmitRef.current = true; // Prevent auto-submit race condition
      lastSubmittedAnswerRef.current = null; // Allow new submission
      setPlacedTileIds([]);
    }

    prevFeedbackStateRef.current = feedbackState;
  }, [feedbackState, showingCorrectFeedback]);

  // Get available (unplaced) tiles
  const availableTiles = tiles.filter(
    (tile) => !placedTileIds.includes(tile.id),
  );

  // Get placed tiles in order
  const placedTiles = placedTileIds
    .map((id) => tiles.find((t) => t.id === id))
    .filter((t): t is LetterTile => t !== undefined);

  // Build the current answer string
  const currentAnswer = placedTiles.map((t) => t.letter).join("");

  // Compute feedback colors for each slot position when showing feedback
  const feedbackColors = useMemo(() => {
    if (!feedbackState) return null;

    const { analysis } = feedbackState;
    const colors: Array<"correct" | "wrong" | "missing"> = [];

    // Map diff results to simple position-based colors
    for (const diff of analysis.diffChars) {
      if (diff.type === "equal") {
        colors.push("correct");
      } else if (diff.type === "replace" || diff.type === "delete") {
        colors.push("wrong");
      } else if (diff.type === "insert") {
        colors.push("missing");
      }
    }

    // Ensure we have colors for all expected positions
    while (colors.length < expectedWord.length) {
      colors.push("missing");
    }

    return colors;
  }, [feedbackState, expectedWord]);

  // Get expected character for a position (for showing correction hints)
  function getExpectedChar(index: number): string | null {
    if (!feedbackState || index >= expectedWord.length) return null;
    return expectedWord[index];
  }

  // Handle tapping an available tile to place it
  function handlePlaceTile(tile: LetterTile) {
    if (disabled) return;
    if (placedTileIds.length >= expectedWord.length) return;
    setPlacedTileIds((prev) => [...prev, tile.id]);
  }

  // Handle tapping a placed tile to remove it
  function handleRemoveTile(tileId: string) {
    if (disabled) return;
    setPlacedTileIds((prev) => prev.filter((id) => id !== tileId));
  }

  // Handle clearing all placed tiles
  const handleClear = useCallback(() => {
    if (disabled) return;
    setPlacedTileIds([]);
  }, [disabled]);

  // Expose clear function to parent via ref callback
  React.useEffect(() => {
    onClearRef?.(handleClear);
  }, [handleClear, onClearRef]);

  // Notify parent of canClear state changes
  React.useEffect(() => {
    onCanClearChange?.(placedTileIds.length > 0);
  }, [placedTileIds.length, onCanClearChange]);

  // Notify parent of answer changes
  React.useEffect(() => {
    const isComplete = placedTileIds.length === expectedWord.length;
    onAnswerChange?.(currentAnswer, isComplete);
  }, [
    currentAnswer,
    placedTileIds.length,
    expectedWord.length,
    onAnswerChange,
  ]);

  // Create empty slots for visual guidance
  const slots = Array.from({ length: expectedWord.length }, (_, i) => ({
    index: i,
    tile: placedTiles[i] || null,
  }));

  const isComplete = placedTileIds.length === expectedWord.length;
  const showingFeedback = feedbackState !== null;

  // Auto-submit when navigation prop is provided and answer is complete
  React.useEffect(() => {
    // Skip if we just cleared tiles for retry (prevents race condition)
    if (skipAutoSubmitRef.current) {
      skipAutoSubmitRef.current = false;
      return;
    }

    // Skip if we already submitted this exact answer (prevents double-submit)
    if (lastSubmittedAnswerRef.current === currentAnswer) {
      return;
    }

    if (
      navigation &&
      isComplete &&
      !showingFeedback &&
      !showingCorrectFeedback
    ) {
      lastSubmittedAnswerRef.current = currentAnswer;
      const isCorrect =
        currentAnswer.toLowerCase() === expectedWord.toLowerCase();
      onSubmit(currentAnswer, isCorrect);
    }
  }, [
    isComplete,
    currentAnswer,
    expectedWord,
    navigation,
    showingFeedback,
    showingCorrectFeedback,
    onSubmit,
  ]);

  // Compute tile styling based on feedback state
  function getTileStyle(
    slotIndex: number,
    hasTile: boolean,
  ): { base: string; correction: string | null } {
    // Success state - all tiles green
    if (showingCorrectFeedback && hasTile) {
      return {
        base: "bg-green-100 text-green-800 border-2 border-green-400 shadow-md",
        correction: null,
      };
    }

    if (!showingFeedback || !feedbackColors) {
      // Normal state styling
      if (hasTile) {
        return {
          base: "bg-nordic-sky text-white hover:bg-nordic-sky/80 cursor-pointer shadow-md",
          correction: null,
        };
      }
      return {
        base: "bg-white border-2 border-gray-300 text-gray-400 cursor-default",
        correction: null,
      };
    }

    // Feedback state styling
    const color = feedbackColors[slotIndex];
    const expectedChar = getExpectedChar(slotIndex);
    const userChar = feedbackState?.lastUserAnswer[slotIndex]?.toLowerCase();

    if (color === "correct") {
      return {
        base: "bg-green-100 text-green-800 border-2 border-green-400 shadow-md",
        correction: null,
      };
    } else if (color === "wrong") {
      return {
        base: "bg-red-100 text-red-700 border-2 border-red-400 shadow-md",
        correction:
          expectedChar && userChar !== expectedChar ? expectedChar : null,
      };
    } else {
      // missing
      return {
        base: "bg-yellow-100 text-yellow-700 border-2 border-dashed border-yellow-400",
        correction: expectedChar,
      };
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Answer slots area */}
      <div
        className={`flex flex-wrap justify-center gap-2 p-4 pb-8 rounded-xl min-h-20 transition-colors duration-200 ${
          showingCorrectFeedback
            ? "bg-gray-50 border-2 border-gray-300"
            : showingFeedback
              ? "bg-red-50 border-2 border-red-200"
              : "bg-gray-50 border-2 border-gray-300"
        }`}
        role="group"
        aria-label={t("challenge.answerArea" as TranslationKey)}
      >
        {slots.map((slot) => {
          const hasTile = slot.tile !== null;
          const feedbackChar = showingFeedback
            ? feedbackState?.lastUserAnswer[slot.index] || ""
            : "";
          const displayChar = showingFeedback
            ? feedbackChar
            : slot.tile?.letter || "";
          const { base, correction } = getTileStyle(slot.index, hasTile);

          return (
            <div key={slot.index} className="relative">
              <button
                type="button"
                onClick={() =>
                  !showingFeedback &&
                  slot.tile &&
                  handleRemoveTile(slot.tile.id)
                }
                disabled={disabled || !slot.tile || showingFeedback}
                className={`
                  min-w-12 min-h-12 w-12 h-12
                  rounded-lg font-bold text-xl uppercase
                  transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                  ${base}
                  ${disabled || showingFeedback ? "cursor-default" : ""}
                `}
                aria-label={
                  hasTile || showingFeedback
                    ? `${t("challenge.removeLetter" as TranslationKey)} ${(displayChar || "").toUpperCase()}`
                    : `${t("challenge.emptySlot" as TranslationKey)} ${slot.index + 1}`
                }
              >
                {displayChar}
              </button>
              {/* Correction hint shown below wrong letters */}
              {correction && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold text-red-600 bg-white px-1 rounded">
                  {correction}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Success feedback - shows when answer is correct */}
      {showingCorrectFeedback && <CorrectFeedback />}

      {/* Legend - only shows during error feedback */}
      {showingFeedback && (
        <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded" />
            {t("test.feedback.correct" as TranslationKey)}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded" />
            {t("test.feedback.wrong" as TranslationKey)}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-400 rounded" />
            {t("test.feedback.missing" as TranslationKey)}
          </span>
        </div>
      )}

      {/* Feedback status - shows below legend during feedback */}
      {showingFeedback && feedbackState && (
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
      )}

      {/* Hint message - shows during feedback from second attempt */}
      {showingFeedback && feedbackState?.hintKey && (
        <div className="p-2 bg-nordic-sky/10 rounded-lg border border-nordic-sky/30">
          <p className="text-nordic-midnight text-sm font-medium text-center flex items-center justify-center gap-2">
            <HeroLightBulbIcon className="w-4 h-4 text-nordic-sky" />
            {t(feedbackState.hintKey as TranslationKey)}
          </p>
        </div>
      )}

      {/* Timer countdown bar - shows during feedback */}
      {showingFeedback && timerDurationMs && timerDurationMs > 0 && (
        <div className="h-1.5 bg-red-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 animate-shrink-x"
            style={
              {
                "--timer-duration": `${timerDurationMs}ms`,
              } as React.CSSProperties
            }
          />
        </div>
      )}

      {/* Available tiles - hidden during feedback */}
      {!showingFeedback && (
        <div
          className="flex flex-wrap justify-center gap-2"
          role="group"
          aria-label={t("challenge.availableLetters" as TranslationKey)}
        >
          {availableTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handlePlaceTile(tile)}
              disabled={disabled || isComplete}
              className={`
                min-w-12 min-h-12 w-12 h-12
                rounded-lg font-bold text-xl uppercase
                bg-white border-2 border-gray-300
                hover:border-nordic-sky hover:bg-nordic-sky/10
                active:scale-95
                transition-all duration-150
                focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                ${disabled || isComplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${tile.isDistractor ? "text-gray-700" : "text-gray-900"}
              `}
              aria-label={`${t("challenge.placeLetter" as TranslationKey)} ${tile.letter.toUpperCase()}`}
            >
              {tile.letter}
            </button>
          ))}
        </div>
      )}

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {currentAnswer
          ? `${t("challenge.currentAnswer" as TranslationKey)}: ${currentAnswer.toUpperCase()}`
          : t("challenge.noLettersPlaced" as TranslationKey)}
      </div>
    </div>
  );
}
