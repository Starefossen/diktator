"use client";

import React, { useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
export type KeyboardFeedbackState = StandardFeedbackState;

interface KeyboardInputProps {
  expectedWord: string;
  userAnswer: string;
  onUserAnswerChange: (answer: string) => void;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  disabled?: boolean;
  feedbackState?: KeyboardFeedbackState | null;
  showingCorrectFeedback?: boolean;
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
 * KeyboardInput provides a text input for typing words with built-in feedback.
 *
 * Features:
 * - Standard text input with autocomplete/autocorrect options
 * - Inline SpellingFeedback for wrong answers
 * - Inline CorrectFeedback for correct answers
 * - WCAG 2.1 AA compliant with 48px touch target
 */
export function KeyboardInput({
  expectedWord,
  userAnswer,
  onUserAnswerChange,
  onSubmit,
  disabled = false,
  feedbackState = null,
  showingCorrectFeedback = false,
  navigation: _navigation,
  testConfig,
  focusTrigger = 0,
}: KeyboardInputProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusTriggerRef = useRef(focusTrigger);
  const showingFeedback = feedbackState !== null;

  // Focus input when not showing feedback
  useEffect(() => {
    if (!showingFeedback && !showingCorrectFeedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showingFeedback, showingCorrectFeedback]);

  // Focus input when focusTrigger changes (e.g., after audio ends)
  useEffect(() => {
    if (focusTrigger !== lastFocusTriggerRef.current) {
      lastFocusTriggerRef.current = focusTrigger;
      inputRef.current?.focus();
    }
  }, [focusTrigger]);

  // Handle Enter key submission
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && userAnswer.trim()) {
      const isCorrect =
        userAnswer.toLowerCase().trim() === expectedWord.toLowerCase();
      onSubmit(userAnswer.trim(), isCorrect);
    }
  }

  // Show correct feedback
  if (showingCorrectFeedback) {
    return <CorrectFeedback timerDurationMs={TIMING.SUCCESS_FEEDBACK_MS} />;
  }

  // Show error feedback with SpellingFeedback component
  if (showingFeedback && feedbackState) {
    return (
      <SpellingFeedback
        userAnswer={feedbackState.lastUserAnswer}
        expectedWord={expectedWord}
        analysis={feedbackState.analysis}
        currentAttempt={feedbackState.currentAttempt}
        maxAttempts={feedbackState.maxAttempts}
        config={feedbackState.config}
        showCorrectAnswer={feedbackState.showCorrectAnswer}
        timerDurationMs={getFeedbackDuration(expectedWord)}
      />
    );
  }

  // Show input
  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="text"
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-xl transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-nordic-teal sm:px-6 sm:py-4 sm:text-2xl min-h-12"
        placeholder={t("test.typeWordHere")}
        autoFocus
        autoCorrect={testConfig?.enableAutocorrect ? "on" : "off"}
        autoCapitalize={testConfig?.enableAutocorrect ? "on" : "off"}
        spellCheck={testConfig?.enableAutocorrect}
      />
    </div>
  );
}
