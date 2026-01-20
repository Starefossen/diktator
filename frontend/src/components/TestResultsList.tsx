import React from "react";
import { TestResult, WordSet } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  HandThumbUpIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/16/solid";
import { HeroVolumeIcon } from "@/components/Icons";
import Stavle from "@/components/Stavle";
import ChildResultCard from "@/components/ChildResultCard";

interface TestResultsListProps {
  results: TestResult[];
  wordSets: WordSet[];
  showUserName?: boolean;
  userName?: string;
  isNewResult?: boolean;
  forceParentView?: boolean;
}

export default function TestResultsList({
  results,
  wordSets,
  showUserName = false,
  userName,
  isNewResult = false,
  forceParentView = false,
}: TestResultsListProps) {
  const { t } = useLanguage();
  const { userData } = useAuth();

  const isChild = userData?.role === "child";
  const useChildView = isChild && !forceParentView && !showUserName;

  const getWordSetName = (wordSetId: string) => {
    const wordSet = wordSets.find((ws) => ws.id === wordSetId);
    return wordSet?.name || t("wordsets.unknownWordSet");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getScoreInfo = (score: number) => {
    if (score >= 90) {
      return {
        color: "text-nordic-meadow bg-nordic-meadow/20 border-nordic-meadow/40",
        icon: <StarIcon className="w-4 h-4" />,
        label: t("results.performance.excellent"),
      };
    }
    if (score >= 70) {
      return {
        color:
          "text-nordic-sunrise bg-nordic-sunrise/20 border-nordic-sunrise/40",
        icon: <HandThumbUpIcon className="w-4 h-4" />,
        label: t("results.performance.good"),
      };
    }
    return {
      color:
        "text-nordic-cloudberry bg-nordic-cloudberry/20 border-nordic-cloudberry/40",
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      label: t("results.performance.needsWork"),
    };
  };

  if (results.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mb-4 flex justify-center">
          <Stavle pose="encouraging" size={128} animate />
        </div>
        <h3 className="mb-2 text-xl font-medium text-nordic-midnight">
          {t("results.history.noResults")}
        </h3>
        <p className="text-base text-gray-600">
          {showUserName
            ? `${userName || "This user"} ${t("results.user.noTests")}`
            : t("results.start.message")}
        </p>
      </div>
    );
  }

  if (useChildView) {
    return (
      <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
        {results.map((result, index) => (
          <ChildResultCard
            key={index}
            result={result}
            wordSetName={getWordSetName(result.wordSetId)}
            isNew={isNewResult && index === 0}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {results.map((result, index) => (
        <div key={index} className="p-4 transition-colors hover:bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center mb-2 gap-3">
                {showUserName && userName && (
                  <span className="text-base font-medium text-nordic-sky">
                    {userName}
                  </span>
                )}
                <h4 className="text-lg font-semibold text-gray-900">
                  {getWordSetName(result.wordSetId)}
                </h4>
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-semibold text-sm ${
                    getScoreInfo(result.score).color
                  }`}
                >
                  {getScoreInfo(result.score).icon}
                  {result.score}% - {getScoreInfo(result.score).label}
                </div>
              </div>

              <div className="mb-2 text-sm text-gray-600">
                {formatDate(result.completedAt)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <span className="text-gray-600">
                    {t("results.stats.words")}:
                  </span>
                  <span className="ml-1 font-medium">
                    {result.correctWords}/{result.totalWords}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("results.stats.time")}:
                  </span>
                  <span className="ml-1 font-medium">
                    {formatTime(result.timeSpent)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("results.stats.avgPerWord")}:
                  </span>
                  <span className="ml-1 font-medium">
                    {formatTime(
                      Math.round(result.timeSpent / result.totalWords),
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("results.stats.accuracy")}:
                  </span>
                  <span className="ml-1 font-medium">
                    {Math.round(
                      (result.correctWords / result.totalWords) * 100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Show detailed word results - only words that need attention */}
          {result.words &&
            result.words.length > 0 &&
            (() => {
              // Filter to show only incorrect words and correct words with multiple attempts
              const wordsNeedingAttention = result.words.filter(
                (wordResult) => !wordResult.correct || wordResult.attempts > 1,
              );

              if (wordsNeedingAttention.length === 0) return null;

              return (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    {t("results.words.needingAttention")} (
                    {wordsNeedingAttention.length}):
                  </p>
                  <div className="space-y-2">
                    {wordsNeedingAttention.map((wordResult, wordIndex) => {
                      const isCorrectMultipleAttempts =
                        wordResult.correct && wordResult.attempts > 1;
                      const backgroundColor = wordResult.correct
                        ? isCorrectMultipleAttempts
                          ? "bg-nordic-sunrise/10 border-nordic-sunrise/30"
                          : "bg-nordic-meadow/10 border-nordic-meadow/30"
                        : "bg-nordic-cloudberry/10 border-nordic-cloudberry/30";

                      return (
                        <div
                          key={wordIndex}
                          className={`p-3 rounded-lg border ${backgroundColor}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base font-medium text-gray-900">
                              {wordResult.word}
                            </span>
                            <div className="flex items-center space-x-2">
                              {wordResult.correct ? (
                                <span
                                  className={`px-2 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${
                                    isCorrectMultipleAttempts
                                      ? "text-nordic-sunrise bg-nordic-sunrise/20"
                                      : "text-nordic-meadow bg-nordic-meadow/20"
                                  }`}
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  {isCorrectMultipleAttempts
                                    ? `${t("results.words.correct")} (${wordResult.attempts} ${t("results.words.attempts")})`
                                    : t("results.words.correct")}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-sm font-medium text-nordic-cloudberry bg-nordic-cloudberry/20 rounded-full flex items-center gap-1">
                                  <XCircleIcon className="w-4 h-4" />
                                  {t("results.words.incorrect")} (
                                  {wordResult.attempts}{" "}
                                  {t("results.words.attempts")})
                                </span>
                              )}
                              <span className="text-sm text-gray-600">
                                {formatTime(wordResult.timeSpent)}
                              </span>
                            </div>
                          </div>

                          {/* Show user answers for incorrect words or words with multiple attempts */}
                          {(!wordResult.correct || wordResult.attempts > 1) &&
                            wordResult.userAnswers &&
                            wordResult.userAnswers.length > 0 && (
                              <div className="mb-1">
                                <p className="mb-1 text-sm text-gray-600">
                                  {t("results.words.yourAnswers")}:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {wordResult.userAnswers.map(
                                    (answer, answerIndex) => (
                                      <span
                                        key={answerIndex}
                                        className={`px-2 py-1 text-sm rounded ${
                                          answer.toLowerCase().trim() ===
                                          wordResult.word.toLowerCase()
                                            ? "bg-nordic-meadow/20 text-nordic-meadow"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        {answer || t("results.words.empty")}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Show audio play count if available */}
                          {wordResult.audioPlayCount &&
                            wordResult.audioPlayCount > 0 && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <HeroVolumeIcon className="w-4 h-4" />
                                {t("results.words.audioPlayed")}{" "}
                                {wordResult.audioPlayCount}{" "}
                                {wordResult.audioPlayCount === 1
                                  ? t("results.words.time")
                                  : t("results.words.times")}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {/* Fallback: Show incorrect words if detailed results not available */}
          {(!result.words || result.words.length === 0) &&
            result.incorrectWords &&
            result.incorrectWords.length > 0 && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="mb-2 text-base font-medium text-gray-700">
                  {t("results.words.practice")} ({result.incorrectWords.length}
                  ):
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.incorrectWords.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className="px-3 py-1 text-base font-medium text-nordic-cloudberry bg-nordic-cloudberry/20 rounded-full"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
