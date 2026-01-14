import React from "react";
import { WordSet, TestAnswer, XPInfo } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { HeroVolumeIcon } from "@/components/Icons";
import { calculateScores } from "@/lib/scoreCalculator";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import Stavle, { StavlePose } from "@/components/Stavle";
import { en } from "@/locales/en";

interface TestResultsViewProps {
  activeTest: WordSet;
  answers: TestAnswer[];
  onRestart: () => void;
  onExit: () => void;
  onPlayAudio: (word: string) => void;
  xpInfo?: XPInfo; // XP data from test completion
}

type TranslationKey = keyof typeof en;

export function getScoreMessageKey(score: number): TranslationKey {
  if (score >= 90) return "test.results.excellent";
  if (score >= 80) return "test.results.great";
  if (score >= 70) return "test.results.good";
  return "test.results.keepGoing";
}

export function getScorePose(score: number): StavlePose {
  if (score >= 90) return "celebrating";
  if (score >= 70) return "encouraging";
  return "reading";
}

export function TestResultsView({
  activeTest,
  answers,
  onRestart,
  onExit,
  onPlayAudio,
  xpInfo,
}: TestResultsViewProps) {
  const { t, language } = useLanguage();
  const { userData } = useAuth();
  const isParent = userData?.role === "parent";

  const scoreBreakdown = calculateScores(answers);
  const score = scoreBreakdown.weightedScore;

  const interpolate = (
    key: TranslationKey,
    variables: Record<string, string | number>,
  ): string => {
    let translation = t(key);
    Object.entries(variables).forEach(([variable, value]) => {
      translation = translation.replace(`{${variable}}`, String(value));
    });
    return translation;
  };

  const scoreMessage = interpolate(getScoreMessageKey(score), { score });

  return (
    <div className="flex items-center justify-center py-8 bg-nordic-birch">
      <div className="w-full max-w-2xl p-8 mx-4 bg-white rounded-lg shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Stavle
              pose={getScorePose(score)}
              size={score >= 90 ? 160 : 128}
              animate
            />
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
          <div className="p-4 text-center rounded-lg bg-nordic-sky/10">
            <div className="text-3xl font-bold text-nordic-sky">
              {scoreBreakdown.totalWords - scoreBreakdown.failed}/
              {scoreBreakdown.totalWords}
            </div>
            <div className="text-gray-600">{t("test.correct")}</div>
          </div>
        </div>

        {/* XP Summary Card */}
        {xpInfo && (
          <div className="p-6 mb-8 border border-nordic-cloudberry/30 rounded-lg bg-linear-to-br from-nordic-sunrise/10 to-nordic-cloudberry/10">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-nordic-midnight">
                  +{xpInfo.awarded}
                </div>
                <div className="text-sm text-gray-600">
                  {t("test.xpEarned")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-nordic-sky">
                  {xpInfo.total}
                </div>
                <div className="text-sm text-gray-600">{t("test.totalXp")}</div>
              </div>
              <div className="col-span-2 md:col-span-1 text-center">
                <div className="text-2xl font-bold text-nordic-forest">
                  {xpInfo.level}
                </div>
                <div className="text-sm text-gray-600">
                  {language === "no" ? xpInfo.levelNameNo : xpInfo.levelName}
                </div>
              </div>
            </div>
            {xpInfo.total < xpInfo.nextLevelXp && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{t("test.progressToNext")}</span>
                  <span>
                    {Math.max(0, xpInfo.nextLevelXp - xpInfo.total)}{" "}
                    {t("test.xpToGo")}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-nordic-sky to-nordic-aurora transition-all duration-800"
                    style={{
                      width: `${Math.min(
                        100,
                        ((xpInfo.total - xpInfo.currentLevelXp) /
                          (xpInfo.nextLevelXp - xpInfo.currentLevelXp)) *
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-8 text-center">
          <p className="text-lg font-medium text-nordic-midnight">
            {scoreMessage}
          </p>
        </div>

        {/* Detailed breakdown for parents */}
        {isParent && (
          <div className="p-4 mb-8 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              {t("test.scoreBreakdown")}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div className="p-2 text-center bg-white rounded">
                <div className="text-lg font-bold text-green-600">
                  {scoreBreakdown.firstAttemptCorrect}
                </div>
                <div className="text-xs text-gray-500">
                  {t("test.firstAttempt")}
                </div>
              </div>
              <div className="p-2 text-center bg-white rounded">
                <div className="text-lg font-bold text-yellow-600">
                  {scoreBreakdown.secondAttemptCorrect}
                </div>
                <div className="text-xs text-gray-500">
                  {t("test.secondAttempt")}
                </div>
              </div>
              <div className="p-2 text-center bg-white rounded">
                <div className="text-lg font-bold text-orange-600">
                  {scoreBreakdown.thirdAttemptCorrect}
                </div>
                <div className="text-xs text-gray-500">
                  {t("test.thirdAttempt")}
                </div>
              </div>
              <div className="p-2 text-center bg-white rounded">
                <div className="text-lg font-bold text-red-500">
                  {scoreBreakdown.fourPlusAttemptCorrect}
                </div>
                <div className="text-xs text-gray-500">
                  {t("test.fourPlusAttempt")}
                </div>
              </div>
              <div className="p-2 text-center bg-white rounded">
                <div className="text-lg font-bold text-red-600">
                  {scoreBreakdown.failed}
                </div>
                <div className="text-xs text-gray-500">{t("test.failed")}</div>
              </div>
            </div>
            {scoreBreakdown.isPerfect && (
              <div className="mt-3 text-sm text-center text-nordic-meadow font-medium">
                {t("test.perfectScore")}
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            {t("test.reviewResults")}
          </h3>
          <div className="space-y-2">
            {answers.map((answer, index) => {
              // Determine background color based on result and attempts
              const isCorrectFirstTry =
                answer.isCorrect && answer.attempts === 1;
              const isCorrectMultipleTries =
                answer.isCorrect && answer.attempts > 1;
              const bgClass = isCorrectFirstTry
                ? "bg-green-50"
                : isCorrectMultipleTries
                  ? "bg-yellow-50"
                  : "bg-red-50";

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${bgClass}`}
                >
                  <div className="flex items-center flex-1">
                    <div
                      className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center shrink-0 ${isCorrectFirstTry
                          ? "bg-green-500"
                          : isCorrectMultipleTries
                            ? "bg-yellow-500"
                            : "bg-red-500"
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
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-medium ${isCorrectFirstTry
                              ? "text-green-800"
                              : isCorrectMultipleTries
                                ? "text-yellow-800"
                                : "text-red-800"
                            }`}
                        >
                          {answer.word}
                        </span>
                        {/* Show attempts badge for words that needed multiple tries */}
                        {answer.attempts > 1 && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${answer.isCorrect
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-red-200 text-red-800"
                              }`}
                          >
                            {answer.attempts} {t("test.attempts")}
                          </span>
                        )}
                      </div>
                      {!answer.isCorrect && (
                        <span className="block text-sm text-gray-600 truncate">
                          {t("test.yourAnswer")} &quot;{answer.finalAnswer}
                          &quot;
                        </span>
                      )}
                    </div>
                  </div>
                  <IconButton
                    variant="default"
                    onClick={() => onPlayAudio(answer.word)}
                    aria-label={`Play pronunciation of ${answer.word}`}
                    className={`ml-2 shrink-0 ${isCorrectFirstTry
                        ? "text-green-700 bg-green-100 hover:bg-green-200"
                        : isCorrectMultipleTries
                          ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                          : "text-red-700 bg-red-100 hover:bg-red-200"
                      }`}
                  >
                    <HeroVolumeIcon
                      className={`w-4 h-4 ${isCorrectFirstTry
                          ? "text-green-700"
                          : isCorrectMultipleTries
                            ? "text-yellow-700"
                            : "text-red-700"
                        }`}
                    />
                  </IconButton>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-2 sm:gap-4">
          <Button variant="primary-child" onClick={onRestart}>
            <span className="sm:hidden">{t("test.nextMobile")}</span>
            <span className="hidden sm:inline">{t("test.restart")}</span>
          </Button>
          <Button variant="secondary-child" onClick={onExit}>
            <span className="sm:hidden">{t("test.backMobile")}</span>
            <span className="hidden sm:inline">{t("test.backToWordSets")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
