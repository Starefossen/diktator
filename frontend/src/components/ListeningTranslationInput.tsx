"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
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
import { AudioPlayButton } from "@/components/AudioPlayButton";

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
    autoPlayAudio?: boolean;
  };
  /** Callback when audio starts playing */
  onAudioStart?: () => void;
  /** Callback when audio ends */
  onAudioEnd?: () => void;
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
  sourceWord,
  originalWord,
  direction,
  targetLanguage,
  sourceLanguage,
  wordSetId,
  navigation: _navigation,
  testConfig,
  onAudioStart,
  onAudioEnd,
}: ListeningTranslationInputProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [audioError, setAudioError] = useState(false);
  const showingFeedback = feedbackState !== null;

  // The word to use in the audio URL path - always the original wordset word
  // This is needed because the backend looks up translations by the original word
  const wordForUrl = originalWord || sourceWord;

  // Construct audio URL based on direction
  // toTarget: play source word in source language (e.g., Norwegian word)
  // toSource: play translation in target language (e.g., English word)
  const audioUrl = (() => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    if (direction === "toTarget") {
      // Play the Norwegian word, user types English translation
      return `${apiBaseUrl}/api/wordsets/${wordSetId}/words/${encodeURIComponent(wordForUrl)}/audio?lang=${encodeURIComponent(sourceLanguage)}`;
    } else {
      // Play the English translation, user types Norwegian word
      return `${apiBaseUrl}/api/wordsets/${wordSetId}/words/${encodeURIComponent(wordForUrl)}/audio?lang=${encodeURIComponent(targetLanguage)}`;
    }
  })();

  // Language being spoken (what user hears)
  const spokenLanguage =
    direction === "toTarget" ? sourceLanguage : targetLanguage;
  // Language user types in
  const typingLanguage =
    direction === "toTarget" ? targetLanguage : sourceLanguage;

  // Callback to restore focus after audio ends (mandatory for AudioPlayButton)
  const handleAudioEnd = useCallback(() => {
    // Always restore focus to input after audio finishes
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    onAudioEnd?.();
  }, [onAudioEnd]);

  // Callback when audio fails
  const handleAudioError = useCallback(() => {
    setAudioError(true);
  }, []);

  // Reset audio error when word changes
  useEffect(() => {
    setAudioError(false);
  }, [audioUrl]);

  // Focus input when not showing feedback
  useEffect(() => {
    if (!showingFeedback && !showingCorrectFeedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showingFeedback, showingCorrectFeedback]);

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
    <div className="flex flex-col gap-6 items-center">
      {/* Audio Play Area - Primary interaction */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-gray-600">
          {t("test.listenAndTranslate")}
        </span>

        {/* Large audio button */}
        <div className={audioError ? "ring-2 ring-red-300 rounded-full" : ""}>
          <AudioPlayButton
            audioUrl={audioUrl}
            onAudioEnd={handleAudioEnd}
            onAudioStart={onAudioStart}
            onAudioError={handleAudioError}
            ariaLabel={t("aria.playAudio")}
            size="lg"
            autoPlay={!showingFeedback && !showingCorrectFeedback}
          />
        </div>

        {/* Language indicator for what's being spoken */}
        <span className="text-sm text-gray-600">
          {getLanguageName(spokenLanguage)}
        </span>

        {audioError && (
          <span className="text-xs text-red-500">{t("test.audioError")}</span>
        )}
      </div>

      {/* Translation Input Area */}
      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-xs">{t("test.typeIn")}</span>
          <span className="text-sm font-medium text-gray-600">
            {getLanguageName(typingLanguage)}
          </span>
        </div>

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
