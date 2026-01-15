"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import type { WordBankItem } from "@/lib/challenges";
import type {
  NavigationActions,
  StandardFeedbackState,
} from "@/lib/testEngine/types";
import { HeroLightBulbIcon } from "@/components/Icons";
import Stavle from "@/components/Stavle";

// Re-export for backwards compatibility
export type WordBankFeedbackState = StandardFeedbackState;

interface WordBankInputProps {
  items: WordBankItem[];
  expectedWordCount: number;
  expectedAnswer: string;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  disabled?: boolean;
  feedbackState?: WordBankFeedbackState | null;
  showingCorrectFeedback?: boolean;
  /** Navigation actions for unified button handling */
  navigation?: NavigationActions;
  /** Callback to expose clear function to parent */
  onClearRef?: (clearFn: () => void) => void;
  /** Callback to expose canClear state to parent */
  onCanClearChange?: (canClear: boolean) => void;
  /** Callback when answer changes */
  onAnswerChange?: (answer: string, isComplete: boolean) => void;
}

/**
 * WordBankInput provides a tap-to-select word bank interface for sentence construction.
 *
 * Features:
 * - 48px+ touch targets for WCAG 2.1 AA compliance
 * - Tap available word to add to sentence
 * - Tap selected word to remove from sentence
 * - Visual feedback showing selected state
 * - Keyboard accessible with proper ARIA labels
 *
 * Navigation is handled externally via TestNavigationBar when navigation prop is provided.
 */
export function WordBankInput({
  items,
  expectedWordCount,
  expectedAnswer,
  onSubmit,
  disabled = false,
  feedbackState = null,
  showingCorrectFeedback = false,
  navigation,
  onClearRef,
  onCanClearChange,
  onAnswerChange,
}: WordBankInputProps) {
  const { t } = useLanguage();

  // Track which items have been selected and in what order
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Track previous feedback state to detect retry transitions
  const prevFeedbackStateRef = React.useRef<StandardFeedbackState | null>(null);

  // Flag to skip auto-submit for one render after clearing for retry
  const skipAutoSubmitRef = React.useRef(false);

  // Clear selection when transitioning from feedback to retry (not on initial mount)
  React.useEffect(() => {
    const wasFeedback = prevFeedbackStateRef.current !== null;
    const isFeedback = feedbackState !== null;

    // If we had feedback and now we don't (retry), clear the selection
    if (wasFeedback && !isFeedback && !showingCorrectFeedback) {
      skipAutoSubmitRef.current = true; // Prevent auto-submit race condition
      setSelectedItemIds([]);
    }

    prevFeedbackStateRef.current = feedbackState;
  }, [feedbackState, showingCorrectFeedback]);

  // Get available (unselected) items
  const availableItems = items.filter(
    (item) => !selectedItemIds.includes(item.id),
  );

  // Get selected items in order
  const selectedItems = selectedItemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is WordBankItem => item !== undefined);

  // Build the current answer string
  const currentAnswer = selectedItems.map((item) => item.word).join(" ");

  // Handle tapping an available item to select it
  function handleSelectItem(item: WordBankItem) {
    if (disabled) return;
    setSelectedItemIds((prev) => [...prev, item.id]);
  }

  // Handle tapping a selected item to deselect it
  function handleDeselectItem(itemId: string) {
    if (disabled) return;
    setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
  }

  // Handle clearing all selected items
  const handleClear = useCallback(() => {
    if (disabled) return;
    setSelectedItemIds([]);
  }, [disabled]);

  // Expose clear function to parent via ref callback
  React.useEffect(() => {
    onClearRef?.(handleClear);
  }, [handleClear, onClearRef]);

  // Notify parent of canClear state changes
  React.useEffect(() => {
    onCanClearChange?.(selectedItemIds.length > 0);
  }, [selectedItemIds.length, onCanClearChange]);

  // Notify parent of answer changes
  React.useEffect(() => {
    const isComplete = selectedItemIds.length === expectedWordCount;
    onAnswerChange?.(currentAnswer, isComplete);
  }, [
    currentAnswer,
    selectedItemIds.length,
    expectedWordCount,
    onAnswerChange,
  ]);

  const _hasSelection = selectedItemIds.length > 0;
  const isComplete = selectedItemIds.length === expectedWordCount;
  const showingFeedback = feedbackState !== null;

  // Auto-submit when navigation prop is provided and answer is complete
  React.useEffect(() => {
    // Skip if we just cleared selection for retry (prevents race condition)
    if (skipAutoSubmitRef.current) {
      skipAutoSubmitRef.current = false;
      return;
    }

    if (
      navigation &&
      isComplete &&
      !showingFeedback &&
      !showingCorrectFeedback
    ) {
      const isCorrect =
        currentAnswer.toLowerCase() === expectedAnswer.toLowerCase();
      onSubmit(currentAnswer, isCorrect);
    }
  }, [
    isComplete,
    currentAnswer,
    expectedAnswer,
    navigation,
    showingFeedback,
    showingCorrectFeedback,
    onSubmit,
  ]);

  // Create placeholder slots for expected words
  const slots = Array.from({ length: expectedWordCount }, (_, i) => ({
    index: i,
    item: selectedItems[i] || null,
  }));

  // Compute word-level feedback for sentence comparison
  const wordFeedback = useMemo(() => {
    if (!feedbackState) return null;

    const expectedWords = expectedAnswer.toLowerCase().split(/\s+/);
    const userWords = feedbackState.lastUserAnswer.toLowerCase().split(/\s+/);

    return userWords.map((word, i) => {
      const expected = expectedWords[i];
      if (!expected) return { word, status: "extra" as const };
      if (word === expected) return { word, status: "correct" as const };
      return { word, status: "wrong" as const, expected };
    });
  }, [feedbackState, expectedAnswer]);

  // Get word styling based on feedback
  function getWordStyle(index: number): {
    base: string;
    correction: string | null;
  } {
    if (!showingFeedback || !wordFeedback) {
      return {
        base: "bg-nordic-sky text-white hover:bg-nordic-sky/80 cursor-pointer shadow-md",
        correction: null,
      };
    }

    const feedback = wordFeedback[index];
    if (!feedback) {
      return {
        base: "bg-yellow-100 text-yellow-700 border-2 border-dashed border-yellow-400",
        correction: null,
      };
    }

    if (feedback.status === "correct") {
      return {
        base: "bg-green-100 text-green-800 border-2 border-green-400 shadow-md",
        correction: null,
      };
    } else if (feedback.status === "wrong") {
      return {
        base: "bg-red-100 text-red-700 border-2 border-red-400 shadow-md",
        correction: feedback.expected || null,
      };
    } else {
      return {
        base: "bg-red-100 text-red-700 border-2 border-red-400 shadow-md",
        correction: null,
      };
    }
  }

  // Show correct feedback
  if (showingCorrectFeedback) {
    return (
      <div className="flex flex-col gap-4">
        <div className="w-full rounded-lg bg-green-100 border border-green-300 p-6 text-center animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <Stavle pose="celebrating" size={96} animate className="mx-auto" />
          <p className="mt-3 text-xl font-bold text-green-800">
            {t("test.correct" as TranslationKey)}
          </p>
          <p className="mt-1 text-green-700">{expectedAnswer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selected words area */}
      <div
        className={`flex flex-wrap justify-center gap-2 p-4 rounded-xl min-h-20 transition-colors duration-200 ${
          showingFeedback
            ? "bg-red-50 border-2 border-red-200"
            : "bg-gray-50 border-2 border-dashed border-gray-300"
        }`}
        role="group"
        aria-label={t("challenge.sentenceArea" as TranslationKey)}
      >
        {showingFeedback && wordFeedback
          ? // Show feedback for submitted words
            wordFeedback.map((fb, i) => {
              const { base, correction } = getWordStyle(i);
              return (
                <div key={i} className="relative">
                  <span
                    className={`px-4 py-2 min-h-12 rounded-lg font-semibold text-base inline-block ${base}`}
                  >
                    {fb.word}
                  </span>
                  {correction && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold text-red-600 bg-white px-1 rounded whitespace-nowrap">
                      {correction}
                    </span>
                  )}
                </div>
              );
            })
          : // Show editable slots
            slots.map((slot) =>
              slot.item ? (
                <button
                  key={slot.item.id}
                  type="button"
                  onClick={() => handleDeselectItem(slot.item!.id)}
                  disabled={disabled}
                  className={`
                  px-4 py-2 min-h-12
                  rounded-lg font-semibold text-base
                  bg-nordic-sky text-white
                  hover:bg-nordic-sky/80
                  active:scale-95
                  transition-all duration-150
                  focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                  shadow-md
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                  aria-label={`${t("challenge.removeWord" as TranslationKey)} ${slot.item.word}`}
                >
                  {slot.item.word}
                </button>
              ) : (
                <span
                  key={`empty-${slot.index}`}
                  className="px-6 py-2 min-h-12 min-w-16 rounded-lg border-2 border-gray-300 bg-white flex items-center justify-center text-gray-400"
                >
                  —
                </span>
              ),
            )}
      </div>

      {/* Legend - only shows during feedback */}
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

      {/* Available words - hidden during feedback */}
      {!showingFeedback && (
        <div
          className="flex flex-wrap justify-center gap-2"
          role="group"
          aria-label={t("challenge.availableWords" as TranslationKey)}
        >
          {availableItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectItem(item)}
              disabled={disabled || isComplete}
              className={`
                px-4 py-2 min-h-12
                rounded-lg font-semibold text-base
                bg-white border-2 border-gray-300
                hover:border-nordic-sky hover:bg-nordic-sky/10
                active:scale-95
                transition-all duration-150
                focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                ${disabled || isComplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${item.isDistractor ? "text-gray-700" : "text-gray-900"}
              `}
              aria-label={`${t("challenge.addWord" as TranslationKey)} ${item.word}`}
            >
              {item.word}
            </button>
          ))}
        </div>
      )}

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {currentAnswer
          ? `${t("challenge.currentSentence" as TranslationKey)}: ${currentAnswer}`
          : t("challenge.noWordsSelected" as TranslationKey)}
      </div>
    </div>
  );
}
