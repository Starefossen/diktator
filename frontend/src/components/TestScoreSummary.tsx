import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TestScoreSummaryProps {
  correctCount: number;
  totalAnswers: number;
}

/**
 * TestScoreSummary - Displays current test score
 *
 * Extracted from TestView to reduce duplication across modes.
 */
export function TestScoreSummary({
  correctCount,
  totalAnswers,
}: TestScoreSummaryProps) {
  const { t } = useLanguage();

  if (totalAnswers === 0) {
    return null;
  }

  return (
    <div className="mt-8 text-center text-gray-600">
      <p>
        {t("test.correctSoFar")}: {correctCount} / {totalAnswers}
      </p>
    </div>
  );
}
