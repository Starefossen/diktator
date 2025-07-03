import React from "react";
import { WordSet, TestAnswer, getEffectiveTestConfig } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { requiresUserInteractionForAudio } from "@/lib/audioPlayer";
import { HeroVolumeIcon, HeroDevicePhoneMobileIcon } from "@/components/Icons";

interface TestViewProps {
  activeTest: WordSet;
  currentWordIndex: number;
  processedWords: string[];
  userAnswer: string;
  showFeedback: boolean;
  lastAnswerCorrect: boolean;
  currentTries: number;
  answers: TestAnswer[];
  isAudioPlaying: boolean;
  onUserAnswerChange: (answer: string) => void;
  onSubmitAnswer: () => void;
  onPlayCurrentWord: () => void;
  onExitTest: () => void;
}

export function TestView({
  activeTest,
  currentWordIndex,
  processedWords,
  userAnswer,
  showFeedback,
  lastAnswerCorrect,
  currentTries,
  answers,
  isAudioPlaying,
  onUserAnswerChange,
  onSubmitAnswer,
  onPlayCurrentWord,
  onExitTest,
}: TestViewProps) {
  const { t } = useLanguage();
  const testConfig = getEffectiveTestConfig(activeTest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {activeTest.name}
          </h1>
          <p className="text-gray-600">
            {t("test.progress")} {currentWordIndex + 1} {t("common.of")}{" "}
            {processedWords.length}
          </p>
          <div className="w-full h-2 mt-4 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{
                width: `${((currentWordIndex + 1) / processedWords.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Safari Auto-play Notice */}
        {requiresUserInteractionForAudio() && testConfig?.autoPlayAudio && (
          <div className="max-w-2xl mx-auto mb-4">
            <div className="p-3 text-sm border rounded-lg text-amber-700 bg-amber-50 border-amber-200">
              <div className="flex items-center">
                <HeroDevicePhoneMobileIcon className="w-5 h-5 mr-2 text-amber-600" />
                <span>{t("wordsets.safari.autoplayLimited")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Test Area */}
        <div className="max-w-2xl mx-auto">
          <div className="p-4 text-center bg-white rounded-lg shadow-xl sm:p-8">
            <div className="mb-8">
              <div className="relative inline-block">
                {isAudioPlaying && (
                  <div className="absolute border-4 border-transparent rounded-full -inset-3 border-t-blue-500 border-r-blue-400 animate-spin"></div>
                )}
                <button
                  onClick={onPlayCurrentWord}
                  className="relative p-4 text-4xl text-white transition-all duration-200 transform rounded-full shadow-lg sm:p-6 sm:text-6xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:scale-105"
                >
                  <HeroVolumeIcon className="w-12 h-12 text-white sm:w-16 sm:h-16" />
                </button>
              </div>
              <p className="mt-4 text-gray-600">
                <span className="sm:hidden">
                  {t("test.listenToWordMobile")}
                </span>
                <span className="hidden sm:inline">
                  {t("test.listenToWord")}
                </span>
              </p>

              {/* Show definition/context if available for current word */}
              {activeTest.words[currentWordIndex]?.definition && (
                <div className="max-w-md px-4 py-2 mx-auto mt-3 text-sm border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-blue-800">
                    <span className="font-medium">{t("test.context")}</span>{" "}
                    {activeTest.words[currentWordIndex].definition}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center mb-6">
              {showFeedback ? (
                <div
                  className={`p-4 rounded-lg animate-in fade-in-0 slide-in-from-top-2 duration-300 ${
                    lastAnswerCorrect
                      ? "bg-green-100 border border-green-300"
                      : "bg-red-100 border border-red-300"
                  }`}
                >
                  <p
                    className={`font-semibold text-lg ${
                      lastAnswerCorrect ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {lastAnswerCorrect
                      ? t("test.correct")
                      : `${t("test.incorrect")} - ${t("test.tryAgain")} (${currentTries}/${testConfig?.maxAttempts ?? 3})`}
                  </p>
                </div>
              ) : (
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => onUserAnswerChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onSubmitAnswer()}
                  className="w-full px-4 py-3 text-xl text-center transition-all duration-200 border-2 border-gray-300 rounded-lg sm:px-6 sm:py-4 sm:text-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("test.typeWordHere")}
                  autoFocus
                  autoCorrect={testConfig?.enableAutocorrect ? "on" : "off"}
                  autoCapitalize={testConfig?.enableAutocorrect ? "on" : "off"}
                  spellCheck={testConfig?.enableAutocorrect}
                />
              )}
            </div>

            <div className="flex justify-center h-5 mb-8">
              <p className="text-sm text-gray-500">
                {t("test.attemptsRemaining")}:{" "}
                {(testConfig?.maxAttempts ?? 3) - currentTries}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {/* Play Again Button */}
              <button
                onClick={onPlayCurrentWord}
                className="flex items-center px-4 py-2 font-semibold text-white transition-colors bg-blue-500 rounded-lg sm:px-6 sm:py-3 hover:bg-blue-600"
                disabled={showFeedback}
              >
                <HeroVolumeIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("test.playAgain")}</span>
              </button>

              {/* Next/Finish Button */}
              <button
                onClick={onSubmitAnswer}
                disabled={!userAnswer.trim() || showFeedback}
                className="px-4 py-2 font-semibold text-white transition-all duration-200 rounded-lg sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sm:hidden">
                  {currentWordIndex < processedWords.length - 1
                    ? t("test.nextMobile")
                    : t("test.finishMobile")}
                </span>
                <span className="hidden sm:inline">
                  {currentWordIndex < processedWords.length - 1
                    ? t("test.nextWord")
                    : t("test.finishTest")}
                </span>
              </button>

              {/* Back Button */}
              <button
                onClick={onExitTest}
                className="px-4 py-2 font-semibold text-gray-600 transition-colors bg-gray-200 rounded-lg sm:px-6 sm:py-3 hover:bg-gray-300"
              >
                <span className="sm:hidden">{t("test.backMobile")}</span>
                <span className="hidden sm:inline">
                  {t("test.backToWordSets")}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-600">
            {answers.length > 0 && (
              <p>
                {t("test.correctSoFar")}:{" "}
                {answers.filter((a) => a.isCorrect).length} / {answers.length}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
