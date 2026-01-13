import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { WordSet, TestMode } from "@/types";

interface TestHeaderProps {
  activeTest: WordSet;
  testMode: TestMode;
  currentWordIndex: number;
  totalWords: number;
  progressPercent: number;
  translationInfo?: {
    showWord: string;
    wordDirection: "toTarget" | "toSource";
    targetLanguage: string;
  };
}

/**
 * TestHeader - Displays test title, progress bar, and mode-specific instructions
 *
 * Extracted from TestView to reduce duplication and improve maintainability.
 */
export function TestHeader({
  activeTest,
  testMode,
  currentWordIndex,
  totalWords,
  progressPercent,
  translationInfo,
}: TestHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-8 text-center">
      <h1 className="mb-2 text-3xl font-bold text-gray-800">
        {activeTest.name}
      </h1>

      {/* Translation mode instruction */}
      {testMode === "translation" && translationInfo && (
        <p className="mt-2 text-xl text-gray-700">
          {translationInfo.wordDirection === "toTarget" ? (
            <>
              {t("test.translateToTarget")}:{" "}
              <span className="font-semibold">{translationInfo.showWord}</span>{" "}
              → {translationInfo.targetLanguage.toUpperCase()}
            </>
          ) : (
            <>
              {t("test.translateToSource")}:{" "}
              <span className="font-semibold">{translationInfo.showWord}</span>{" "}
              → {activeTest.language.toUpperCase()}
            </>
          )}
        </p>
      )}

      {/* Progress text */}
      <p className="text-gray-600">
        {t("test.progress")} {currentWordIndex + 1} {t("common.of")}{" "}
        {totalWords}
      </p>

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-linear-to-r from-nordic-sky to-nordic-teal transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
