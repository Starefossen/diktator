"use client";

import React, { useRef, useEffect } from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import type {
  NavigationActions,
  StandardFeedbackState,
} from "@/lib/testEngine/types";
import {
  SpellingFeedback,
  CorrectFeedback,
} from "@/components/SpellingFeedback";
import { TIMING, getFeedbackDuration } from "@/lib/timingConfig";

// Re-export for backwards compatibility
export type TranslationFeedbackState = StandardFeedbackState;

interface TranslationInputProps {
  expectedAnswer: string;
  userAnswer: string;
  onUserAnswerChange: (answer: string) => void;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  disabled?: boolean;
  feedbackState?: TranslationFeedbackState | null;
  showingCorrectFeedback?: boolean;
  /** The source word/language being translated from */
  sourceWord: string;
  /** Direction of translation */
  direction: "toTarget" | "toSource";
  /** Target language code */
  targetLanguage: string;
  /** Navigation actions for unified button handling */
  navigation?: NavigationActions;
  /** Test configuration */
  testConfig?: {
    enableAutocorrect?: boolean;
  };
  /** Increment to trigger focus on input (e.g., after audio ends) */
  focusTrigger?: number;
}

/**
 * TranslationInput provides a text input for translation exercises with built-in feedback.
 *
 * Features:
 * - Shows source word with direction indicators
 * - Standard text input with autocomplete/autocorrect options
 * - Inline SpellingFeedback for wrong answers
 * - Inline CorrectFeedback for correct answers
 * - WCAG 2.1 AA compliant with 48px touch target
 */
export function TranslationInput({
  expectedAnswer,
  userAnswer,
  onUserAnswerChange,
  onSubmit,
  disabled = false,
  feedbackState = null,
  showingCorrectFeedback = false,
  sourceWord,
  direction,
  targetLanguage,
  navigation: _navigation,
  testConfig,
  focusTrigger,
}: TranslationInputProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const showingFeedback = feedbackState !== null;

  // Focus input when not showing feedback or when focusTrigger changes (e.g., after audio ends)
  useEffect(() => {
    if (!showingFeedback && !showingCorrectFeedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showingFeedback, showingCorrectFeedback, focusTrigger]);

  // Handle Enter key submission
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && userAnswer.trim()) {
      const isCorrect =
        userAnswer.toLowerCase().trim() === expectedAnswer.toLowerCase();
      onSubmit(userAnswer.trim(), isCorrect);
    }
  }

  // Get language display names
  const sourceLang =
    direction === "toTarget"
      ? t("common.norwegian")
      : t(
          `common.${targetLanguage === "en" ? "english" : targetLanguage}` as TranslationKey,
        );
  const targetLang =
    direction === "toTarget"
      ? t(
          `common.${targetLanguage === "en" ? "english" : targetLanguage}` as TranslationKey,
        )
      : t("common.norwegian");

  // Show correct feedback
  if (showingCorrectFeedback) {
    return <CorrectFeedback timerDurationMs={TIMING.SUCCESS_FEEDBACK_MS} />;
  }

  // Show error feedback with SpellingFeedback component
  if (showingFeedback && feedbackState) {
    return (
      <SpellingFeedback
        userAnswer={feedbackState.lastUserAnswer}
        expectedWord={expectedAnswer}
        analysis={feedbackState.analysis}
        currentAttempt={feedbackState.currentAttempt}
        maxAttempts={feedbackState.maxAttempts}
        config={feedbackState.config}
        showCorrectAnswer={feedbackState.showCorrectAnswer}
        timerDurationMs={getFeedbackDuration(expectedAnswer)}
      />
    );
  }

  // Show input with translation context
  return (
    <div className="flex flex-col gap-4">
      {/* Source → Input area in horizontal layout */}
      <div className="flex flex-wrap items-center justify-center gap-3 p-4 pb-8 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 min-h-20">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 mb-1">{sourceLang}</span>
          <span className="text-2xl font-semibold text-gray-600">
            {sourceWord}
          </span>
        </div>
        <span className="text-xl text-gray-400">→</span>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 mb-1">{targetLang}</span>
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            className="px-4 py-2 min-h-12 rounded-lg border-2 border-gray-300 text-xl text-center w-40 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-nordic-teal"
            placeholder={t("test.typeTranslationHere")}
            autoFocus
            autoCorrect={testConfig?.enableAutocorrect ? "on" : "off"}
            autoCapitalize={testConfig?.enableAutocorrect ? "on" : "off"}
            spellCheck={testConfig?.enableAutocorrect}
          />
        </div>
      </div>
    </div>
  );
}
