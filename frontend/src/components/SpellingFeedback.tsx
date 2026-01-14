"use client";

import React from "react";
import {
  DiffChar,
  SpellingAnalysisResult,
  SpellingFeedbackConfig,
  DEFAULT_SPELLING_CONFIG,
  getHintForAttempt,
} from "@/lib/spellingAnalysis";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import { HeroLightBulbIcon, HeroCheckSolidIcon } from "@/components/Icons";
import Stavle from "@/components/Stavle";

interface SpellingFeedbackProps {
  userAnswer: string;
  expectedWord: string;
  analysis: SpellingAnalysisResult;
  currentAttempt: number;
  maxAttempts: number;
  config?: SpellingFeedbackConfig;
  showCorrectAnswer?: boolean;
  timerDurationMs?: number;
}

/**
 * Renders a single character in the diff display
 */
function DiffCharacter({
  diff,
  showMissingChar,
}: {
  diff: DiffChar;
  showMissingChar: boolean;
}) {
  switch (diff.type) {
    case "equal":
      return (
        <span className="text-green-700 bg-green-100 px-1.5 py-0.5 rounded border border-green-300 min-w-6 text-center inline-block">
          {diff.char}
        </span>
      );
    case "replace":
      return (
        <span
          className="relative text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300 min-w-6 text-center inline-block"
          title={`Forventet: ${diff.expectedChar}`}
        >
          {diff.char}
          {diff.expectedChar && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-red-500 font-medium">
              {diff.expectedChar}
            </span>
          )}
        </span>
      );
    case "delete":
      return (
        <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300 min-w-6 text-center inline-block line-through opacity-75">
          {diff.char}
        </span>
      );
    case "insert":
      // Show the missing character only on second+ attempt
      return (
        <span className="text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded border-2 border-yellow-400 border-dashed min-w-6 text-center inline-block">
          {showMissingChar ? diff.char : "_"}
        </span>
      );
    default:
      return <span>{diff.char}</span>;
  }
}

/**
 * Visual legend explaining the diff colors
 */
function DiffLegend() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-gray-600">
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded" />
        {t("test.feedback.correct" as TranslationKey)}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded" />
        {t("test.feedback.wrong" as TranslationKey)}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
        {t("test.feedback.missing" as TranslationKey)}
      </span>
    </div>
  );
}

/**
 * SpellingFeedback component shows intelligent character-level feedback
 * for spelling mistakes with Norwegian-specific hints
 */
export function SpellingFeedback({
  userAnswer: _userAnswer,
  expectedWord,
  analysis,
  currentAttempt,
  maxAttempts,
  config = DEFAULT_SPELLING_CONFIG,
  showCorrectAnswer = false,
  timerDurationMs,
}: SpellingFeedbackProps) {
  const { t } = useLanguage();

  // Get the appropriate hint for this attempt
  const hintKey = getHintForAttempt(analysis, currentAttempt, config);

  // Determine feedback state
  const isLastAttempt = currentAttempt >= maxAttempts;
  const attemptsRemaining = maxAttempts - currentAttempt;

  // Show missing characters from second attempt onwards
  const showMissingChar = currentAttempt >= 2;

  return (
    <div className="rounded-xl bg-red-50 border border-red-200 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
      {/* Header with attempt info */}
      <div className="flex items-center justify-between px-4 py-3 bg-red-100/50">
        <div className="flex items-center gap-2">
          <Stavle
            pose={analysis.isAlmostCorrect ? "thinking" : "encouraging"}
            size={48}
            animate
          />
          <p className="font-semibold text-red-800">
            {t("test.incorrect")} - {t("test.tryAgain")} ({currentAttempt}/
            {maxAttempts})
          </p>
        </div>
        {analysis.isAlmostCorrect && (
          <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
            {t("test.feedback.almostThere" as TranslationKey)}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Character diff display */}
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-3 text-center">
            {t("test.yourAnswer")}:
          </p>
          <div className="text-2xl font-mono tracking-wide flex flex-wrap justify-center gap-1 pb-6">
            {analysis.diffChars.map((diff, index) => (
              <DiffCharacter
                key={index}
                diff={diff}
                showMissingChar={showMissingChar}
              />
            ))}
          </div>
          <DiffLegend />
        </div>

        {/* Hint message (progressive - only shown after first attempt) */}
        {hintKey && (
          <div className="mb-4 p-3 bg-nordic-sky/10 rounded-lg border border-nordic-sky/30">
            <p className="text-nordic-midnight text-sm font-medium text-center flex items-center justify-center gap-2">
              <HeroLightBulbIcon className="w-5 h-5 text-nordic-sky" />
              {t(hintKey as TranslationKey)}
            </p>
          </div>
        )}

        {/* Show correct answer if last attempt and configured to show */}
        {isLastAttempt && showCorrectAnswer && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm text-center">
              <span className="font-medium">
                {t("test.feedback.correctAnswer" as TranslationKey)}:
              </span>{" "}
              <span className="font-bold text-lg">{expectedWord}</span>
            </p>
          </div>
        )}

        {/* Attempts remaining indicator */}
        {!isLastAttempt && (
          <p className="text-sm text-gray-500 text-center">
            {t("test.attemptsRemaining")}: {attemptsRemaining}
          </p>
        )}
      </div>

      {/* Timer bar at the bottom */}
      {timerDurationMs && timerDurationMs > 0 && (
        <div className="h-1.5 bg-red-200">
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
    </div>
  );
}

/**
 * Simple success feedback for correct answers
 */
export function CorrectFeedback({
  timerDurationMs,
}: {
  timerDurationMs?: number;
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-lg bg-green-100 border border-green-300 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div className="p-4">
        <div className="flex items-center justify-center gap-3">
          <Stavle pose="celebrating" size={64} animate />
          <p className="font-semibold text-lg text-green-800 flex items-center gap-2">
            <HeroCheckSolidIcon className="w-7 h-7 text-green-600" />
            {t("test.correct")}
          </p>
        </div>
      </div>

      {/* Timer bar at the bottom */}
      {timerDurationMs && timerDurationMs > 0 && (
        <div className="h-1.5 bg-green-200">
          <div
            className="h-full bg-green-600 animate-shrink-x"
            style={
              {
                "--timer-duration": `${timerDurationMs}ms`,
              } as React.CSSProperties
            }
          />
        </div>
      )}
    </div>
  );
}
