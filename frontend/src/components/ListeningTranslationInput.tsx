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

interface ListeningTranslationInputProps {
  expectedAnswer: string;
  userAnswer: string;
  onUserAnswerChange: (answer: string) => void;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  disabled?: boolean;
  feedbackState?: StandardFeedbackState | null;
  showingCorrectFeedback?: boolean;
  /** The source word (hidden from user, used for audio) */
  sourceWord: string;
  /** Original word from wordset (for audio URL lookup - always the wordset's word) */
  originalWord?: string;
  /** Direction of translation */
  direction: "toTarget" | "toSource";
  /** Target language code */
  targetLanguage: string;
  /** Source language code (wordset language) */
  sourceLanguage: string;
  /** Word set ID for audio URL construction */
  wordSetId: string;
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
 * ListeningTranslationInput - Hear & Translate Mode
 *
 * Unlike TranslationInput, this mode hides the source word and uses audio as
 * the primary stimulus. The child hears the word and types the translation.
 *
 * Features:
 * - Source word is HIDDEN (audio-only)
 * - Prominent audio play button as main interaction
 * - Direction indicator shows target language
 * - Standard text input for translation
 * - Inline SpellingFeedback for wrong answers
 * - WCAG 2.1 AA compliant with 48px touch targets
 */
export function ListeningTranslationInput({
  expectedAnswer,
  userAnswer,
  onUserAnswerChange,
  onSubmit,
  disabled = false,
  feedbackState = null,
  showingCorrectFeedback = false,
  sourceWord: _sourceWord,
  originalWord: _originalWord,
  direction,
  targetLanguage,
  sourceLanguage,
  wordSetId: _wordSetId,
  navigation: _navigation,
  testConfig,
  focusTrigger,
}: ListeningTranslationInputProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const showingFeedback = feedbackState !== null;

  // Language being spoken (what user hears)
  const spokenLanguage =
    direction === "toTarget" ? sourceLanguage : targetLanguage;
  // Language user types in
  const typingLanguage =
    direction === "toTarget" ? targetLanguage : sourceLanguage;

  // Focus input when not showing feedback or when focusTrigger changes (e.g., after audio ends)
  useEffect(() => {
    if (!showingFeedback && !showingCorrectFeedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showingFeedback, showingCorrectFeedback, focusTrigger]);

  // Handle Enter key submission
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && userAnswer.trim()) {
      const isCorrect =
        userAnswer.toLowerCase().trim() === expectedAnswer.toLowerCase();
      onSubmit(userAnswer.trim(), isCorrect);
    }
  }

  // Get language display name
  const getLanguageName = (langCode: string) => {
    const key =
      `common.${langCode === "en" ? "english" : langCode === "no" ? "norwegian" : langCode}` as TranslationKey;
    return t(key);
  };

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

  // Show listening input interface
  return (
    <div className="flex flex-col gap-4 items-center">
      {/* Language context - shows what language user heard and should type */}
      <div className="flex items-center gap-3 text-gray-500">
        <span className="text-sm">{getLanguageName(spokenLanguage)}</span>
        <span className="text-lg">→</span>
        <span className="text-sm font-medium text-gray-700">
          {getLanguageName(typingLanguage)}
        </span>
      </div>

      {/* Translation Input Area */}
      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <input
          ref={inputRef}
          type="text"
          value={userAnswer}
          onChange={(e) => onUserAnswerChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="
            w-full px-4 py-3 min-h-12
            rounded-lg border-2 border-gray-300
            text-xl text-center
            transition-all duration-200
            focus:border-transparent focus:ring-2 focus:ring-nordic-teal
            disabled:bg-gray-100 disabled:text-gray-400
          "
          placeholder={t("test.typeTranslationHere")}
          autoFocus
          autoCorrect={testConfig?.enableAutocorrect ? "on" : "off"}
          autoCapitalize={testConfig?.enableAutocorrect ? "on" : "off"}
          spellCheck={testConfig?.enableAutocorrect}
        />
      </div>
    </div>
  );
}
