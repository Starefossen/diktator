"use client";

import React from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import {
  SentenceScoringResult,
  WordFeedback,
  getWordStatusClass,
  getSentenceFeedbackKey,
} from "@/lib/sentenceScoring";
import {
  HeroCheckCircleIcon,
  HeroXMarkIcon,
  HeroExclamationTriangleIcon,
} from "@/components/Icons";

interface SentenceFeedbackProps {
  /** The scoring result from scoreSentence() */
  result: SentenceScoringResult;
  /** Current attempt number */
  currentAttempt: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Whether to show the correct sentence after all attempts */
  showCorrectAnswer?: boolean;
  /** The expected sentence (for showing correct answer) */
  expectedSentence?: string;
  /** Animation duration in ms */
  timerDurationMs?: number;
}

/**
 * Displays word-by-word feedback for sentence dictation.
 * Shows correct, incorrect, misspelled, missing, and extra words with visual styling.
 */
export function SentenceFeedback({
  result,
  currentAttempt,
  maxAttempts,
  showCorrectAnswer = false,
  expectedSentence,
  timerDurationMs = 2000,
}: SentenceFeedbackProps) {
  const { t } = useLanguage();

  // Get status icon
  const StatusIcon = result.isFullyCorrect
    ? HeroCheckCircleIcon
    : result.correctCount > result.totalExpected / 2
      ? HeroExclamationTriangleIcon
      : HeroXMarkIcon;

  const statusColor = result.isFullyCorrect
    ? "text-green-600"
    : result.correctCount > result.totalExpected / 2
      ? "text-amber-600"
      : "text-red-600";

  const bgColor = result.isFullyCorrect
    ? "bg-green-50 border-green-200"
    : result.correctCount > result.totalExpected / 2
      ? "bg-amber-50 border-amber-200"
      : "bg-red-50 border-red-200";

  // Get feedback message key
  const feedbackKey = getSentenceFeedbackKey(result);

  // Separate feedback into expected words and extra words
  const expectedWordsFeedback = result.wordFeedback.filter(
    (f) => f.expectedPosition !== -1,
  );
  const extraWordsFeedback = result.wordFeedback.filter(
    (f) => f.expectedPosition === -1,
  );

  return (
    <div
      className={`p-4 rounded-lg border ${bgColor} animate-in fade-in-0 slide-in-from-top-2 duration-300`}
      role="alert"
      aria-live="polite"
    >
      {/* Header with icon and summary */}
      <div className="flex items-center gap-3 mb-3">
        <StatusIcon className={`w-8 h-8 ${statusColor}`} aria-hidden="true" />
        <div className="flex-1">
          <p className={`font-semibold text-lg ${statusColor}`}>
            {t(feedbackKey as TranslationKey)}
          </p>
          <p className="text-sm text-gray-600">
            {result.correctCount} {t("common.of")} {result.totalExpected}{" "}
            {t("test.sentence.wordsCorrect" as TranslationKey)}
          </p>
        </div>
        {!result.isFullyCorrect && (
          <div className="text-sm text-gray-500">
            {currentAttempt}/{maxAttempts}
          </div>
        )}
      </div>

      {/* Word-by-word feedback */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {expectedWordsFeedback.map((feedback, index) => (
          <WordPill key={`expected-${index}`} feedback={feedback} />
        ))}
      </div>

      {/* Extra words section */}
      {extraWordsFeedback.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1.5">
            {t("test.sentence.extraWords" as TranslationKey)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extraWordsFeedback.map((feedback, index) => (
              <WordPill key={`extra-${index}`} feedback={feedback} />
            ))}
          </div>
        </div>
      )}

      {/* Show correct answer after all attempts */}
      {showCorrectAnswer && expectedSentence && !result.isFullyCorrect && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {t("test.correctAnswer" as TranslationKey)}
          </p>
          <p className="text-base text-gray-900 font-medium">
            {expectedSentence}
          </p>
        </div>
      )}

      {/* Progress bar animation */}
      {timerDurationMs > 0 && (
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-nordic-sky animate-progress-shrink"
            style={
              {
                "--progress-duration": `${timerDurationMs}ms`,
              } as React.CSSProperties
            }
          />
        </div>
      )}
    </div>
  );
}

/**
 * Individual word pill with status styling
 */
function WordPill({ feedback }: { feedback: WordFeedback }) {
  const statusClass = getWordStatusClass(feedback.status);

  // For misspelled words, show both expected and user's word
  if (feedback.status === "misspelled" && feedback.userWord) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${statusClass}`}
        title={`Du skrev: ${feedback.userWord}`}
      >
        <span className="line-through text-gray-500">{feedback.userWord}</span>
        <span>→</span>
        <span className="font-medium">{feedback.word}</span>
      </span>
    );
  }

  return (
    <span className={`inline-block px-2 py-1 rounded text-sm ${statusClass}`}>
      {feedback.word}
    </span>
  );
}

/**
 * Compact sentence feedback for results view
 */
export function SentenceFeedbackCompact({
  result,
}: {
  result: SentenceScoringResult;
}) {
  const statusColor = result.isFullyCorrect
    ? "text-green-600"
    : result.correctCount > result.totalExpected / 2
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${statusColor}`}>
        {result.correctCount}/{result.totalExpected}
      </span>
      <div className="flex gap-0.5">
        {result.wordFeedback
          .filter((f) => f.expectedPosition !== -1)
          .map((feedback, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                feedback.status === "correct"
                  ? "bg-green-500"
                  : feedback.status === "misspelled"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              title={feedback.word}
            />
          ))}
      </div>
    </div>
  );
}
