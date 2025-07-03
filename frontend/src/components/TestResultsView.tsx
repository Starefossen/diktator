import React from "react";
import { WordSet, TestAnswer } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScoreIcon, HeroVolumeIcon } from "@/components/Icons";

interface TestResultsViewProps {
  activeTest: WordSet;
  answers: TestAnswer[];
  onRestart: () => void;
  onExit: () => void;
  onPlayAudio: (word: string) => void;
}

export function TestResultsView({
  activeTest,
  answers,
  onRestart,
  onExit,
  onPlayAudio,
}: TestResultsViewProps) {
  const { t } = useLanguage();

  const correctAnswers = answers.filter((a) => a.isCorrect);
  const score = Math.round((correctAnswers.length / answers.length) * 100);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-2xl p-8 mx-4 bg-white rounded-lg shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4">
            <ScoreIcon score={score} className="w-16 h-16" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {t("test.complete")}
          </h1>
          <h2 className="text-xl text-gray-600">{activeTest.name}</h2>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-4 text-center rounded-lg bg-green-50">
            <div className="text-3xl font-bold text-green-600">{score}%</div>
            <div className="text-gray-600">{t("test.score")}</div>
          </div>
          <div className="p-4 text-center rounded-lg bg-blue-50">
            <div className="text-3xl font-bold text-blue-600">
              {correctAnswers.length}/{answers.length}
            </div>
            <div className="text-gray-600">{t("test.correct")}</div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            {t("test.reviewResults")}
          </h3>
          <div className="space-y-2">
            {answers.map((answer, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  answer.isCorrect ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                      answer.isCorrect ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span
                      className={`font-medium ${
                        answer.isCorrect ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {answer.word}
                    </span>
                    {!answer.isCorrect && (
                      <span className="ml-2 text-gray-600">
                        {t("test.yourAnswer")} &quot;{answer.finalAnswer}&quot;
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onPlayAudio(answer.word)}
                  className={`px-3 py-1 transition-colors rounded ${
                    answer.isCorrect
                      ? "text-green-700 bg-green-100 hover:bg-green-200"
                      : "text-red-700 bg-red-100 hover:bg-red-200"
                  }`}
                >
                  <HeroVolumeIcon
                    className={`w-4 h-4 ${
                      answer.isCorrect ? "text-green-700" : "text-red-700"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onRestart}
            className="px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {t("test.restart")}
          </button>
          <button
            onClick={onExit}
            className="px-6 py-3 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
          >
            {t("test.backToWordSets")}
          </button>
        </div>
      </div>
    </div>
  );
}
