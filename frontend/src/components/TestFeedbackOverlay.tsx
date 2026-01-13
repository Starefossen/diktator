import React, { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/Button";
import {
  SpellingFeedback,
  CorrectFeedback,
} from "@/components/SpellingFeedback";
import { SentenceFeedback } from "@/components/SentenceFeedback";
import { HeroXMarkIcon, HeroArrowRightIcon } from "@/components/Icons";
import { analyzeSpelling } from "@/lib/spellingAnalysis";
import { TIMING } from "@/lib/timingConfig";
import type { SpellingFeedbackConfig } from "@/lib/spellingAnalysis";
import type { SentenceScoringResult } from "@/lib/sentenceScoring";

interface TestFeedbackOverlayProps {
  lastAnswerCorrect: boolean;
  lastUserAnswer: string;
  expectedAnswer: string;
  currentTries: number;
  maxAttempts: number;
  showCorrectAnswer: boolean;
  correctCount: number;
  totalAnswers: number;
  isLastWord: boolean;
  onNext: () => void;
  onExitTest: () => void;
  feedbackState: {
    isCurrentSentence: boolean;
    sentenceScoringResult: SentenceScoringResult | null;
    spellingConfig: SpellingFeedbackConfig;
  };
}

/**
 * TestFeedbackOverlay - Displays feedback after answer submission
 *
 * Handles both sentence and word feedback with consistent UI structure.
 * Extracted from TestView to reduce complexity and duplication.
 */
export function TestFeedbackOverlay({
  lastAnswerCorrect,
  lastUserAnswer,
  expectedAnswer,
  currentTries,
  maxAttempts,
  showCorrectAnswer,
  correctCount,
  totalAnswers,
  isLastWord,
  onNext,
  onExitTest,
  feedbackState,
}: TestFeedbackOverlayProps) {
  const { t } = useLanguage();
  const { isCurrentSentence, sentenceScoringResult, spellingConfig } =
    feedbackState;

  // Compute spelling analysis only when needed
  const spellingAnalysis = useMemo(() => {
    if (lastAnswerCorrect || !lastUserAnswer || isCurrentSentence) {
      return null;
    }
    return analyzeSpelling(lastUserAnswer, expectedAnswer, spellingConfig);
  }, [
    lastAnswerCorrect,
    lastUserAnswer,
    expectedAnswer,
    isCurrentSentence,
    spellingConfig,
  ]);

  return (
    <>
      {lastAnswerCorrect ? (
        <CorrectFeedback />
      ) : isCurrentSentence && sentenceScoringResult ? (
        <SentenceFeedback
          result={sentenceScoringResult}
          currentAttempt={currentTries}
          maxAttempts={maxAttempts}
          showCorrectAnswer={currentTries >= maxAttempts && showCorrectAnswer}
          expectedSentence={expectedAnswer}
          timerDurationMs={TIMING.FEEDBACK_DISPLAY_MS}
        />
      ) : spellingAnalysis ? (
        <SpellingFeedback
          userAnswer={lastUserAnswer}
          expectedWord={expectedAnswer}
          analysis={spellingAnalysis}
          currentAttempt={currentTries}
          maxAttempts={maxAttempts}
          config={spellingConfig}
          showCorrectAnswer={currentTries >= maxAttempts && showCorrectAnswer}
          timerDurationMs={TIMING.FEEDBACK_DISPLAY_MS}
        />
      ) : null}

      {/* Action Buttons */}
      <div className="mt-6 flex justify-center gap-2 sm:gap-4">
        <Button variant="primary-child" onClick={onNext}>
          <span className="sm:hidden">
            {isLastWord ? t("test.finishMobile") : t("test.nextMobile")}
          </span>
          <span className="hidden sm:inline">
            {isLastWord ? t("test.finishTest") : t("test.nextWord")}
          </span>
        </Button>

        <Button variant="secondary-child" onClick={onExitTest}>
          <span className="sm:hidden">{t("test.backMobile")}</span>
          <span className="hidden sm:inline">{t("test.backToWordSets")}</span>
        </Button>
      </div>
    </>
  );
}
