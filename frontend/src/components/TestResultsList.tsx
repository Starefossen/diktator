import React from "react";
import { TestResult, WordSet } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  SpeakerWaveIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  HandThumbUpIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/16/solid";
import Stavle from "@/components/Stavle";

interface TestResultsListProps {
  results: TestResult[];
  wordSets: WordSet[];
  showUserName?: boolean;
  userName?: string;
}

export default function TestResultsList({
  results,
  wordSets,
  showUserName = false,
  userName,
}: TestResultsListProps) {
  const { t } = useLanguage();

  const getWordSetName = (wordSetId: string) => {
    const wordSet = wordSets.find((ws) => ws.id === wordSetId);
    return wordSet?.name || "Unknown Word Set";
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
        color: "text-green-600 bg-green-50 border-green-200",
        icon: <StarIcon className="w-3 h-3" />,
        label: t("results.performance.excellent"),
      };
    }
    if (score >= 70) {
      return {
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        icon: <HandThumbUpIcon className="w-3 h-3" />,
        label: t("results.performance.good"),
      };
    }
    return {
      color: "text-red-600 bg-red-50 border-red-200",
      icon: <ExclamationTriangleIcon className="w-3 h-3" />,
      label: t("results.performance.needsWork"),
    };
  };

  if (results.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mb-4 flex justify-center">
          <Stavle pose="encouraging" size={128} animate />
        </div>
        <h3 className="mb-2 text-lg font-medium text-nordic-midnight">
          {t("results.history.noResults")}
        </h3>
        <p className="text-gray-600">
          {showUserName
            ? `${userName || "This user"} ${t("results.user.noTests")}`
            : t("results.start.message")}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {results.map((result, index) => (
        <div key={index} className="p-4 transition-colors hover:bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2 space-x-3">
                {showUserName && userName && (
                  <span className="text-sm font-medium text-nordic-sky">
                    {userName}
                  </span>
                )}
                <h4 className="text-base font-semibold text-gray-900">
                  {getWordSetName(result.wordSetId)}
                </h4>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border font-semibold text-xs ${getScoreInfo(result.score).color
                    }`}
                >
                  {getScoreInfo(result.score).icon}
                  {result.score}% - {getScoreInfo(result.score).label}
                </div>
              </div>

              <div className="mb-2 text-xs text-gray-600">
                {formatDate(result.completedAt)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                <div>
                  <span className="text-gray-500">
                    {t("results.stats.words")}:
                  </span>
                  <span className="ml-1 font-medium">
                    {result.correctWords}/{result.totalWords}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">
                    {t("results.stats.time")}:
                  </span>
                  <span className="ml-1 font-medium">
                    {formatTime(result.timeSpent)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">
                    {t("results.stats.avgPerWord")}:
                  </span>
                  <span className="ml-1 font-medium">
                    {formatTime(
                      Math.round(result.timeSpent / result.totalWords),
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">
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
                  <p className="mb-2 text-xs font-medium text-gray-700">
                    {t("results.words.needingAttention")} (
                    {wordsNeedingAttention.length}):
                  </p>
                  <div className="space-y-1">
                    {wordsNeedingAttention.map((wordResult, wordIndex) => {
                      const isCorrectMultipleAttempts =
                        wordResult.correct && wordResult.attempts > 1;
                      const backgroundColor = wordResult.correct
                        ? isCorrectMultipleAttempts
                          ? "bg-orange-50 border-orange-200"
                          : "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200";

                      return (
                        <div
                          key={wordIndex}
                          className={`p-2 rounded border ${backgroundColor}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {wordResult.word}
                            </span>
                            <div className="flex items-center space-x-2">
                              {wordResult.correct ? (
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${isCorrectMultipleAttempts
                                      ? "text-orange-800 bg-orange-100"
                                      : "text-green-800 bg-green-100"
                                    }`}
                                >
                                  <CheckCircleIcon className="w-3 h-3" />
                                  {isCorrectMultipleAttempts
                                    ? `${t("results.words.correct")} (${wordResult.attempts} ${t("results.words.attempts")})`
                                    : t("results.words.correct")}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded-full flex items-center gap-1">
                                  <XCircleIcon className="w-3 h-3" />
                                  {t("results.words.incorrect")} (
                                  {wordResult.attempts}{" "}
                                  {t("results.words.attempts")})
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatTime(wordResult.timeSpent)}
                              </span>
                            </div>
                          </div>

                          {/* Show user answers for incorrect words or words with multiple attempts */}
                          {(!wordResult.correct || wordResult.attempts > 1) &&
                            wordResult.userAnswers &&
                            wordResult.userAnswers.length > 0 && (
                              <div className="mb-1">
                                <p className="mb-1 text-xs text-gray-600">
                                  {t("results.words.yourAnswers")}:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {wordResult.userAnswers.map(
                                    (answer, answerIndex) => (
                                      <span
                                        key={answerIndex}
                                        className={`px-1.5 py-0.5 text-xs rounded ${answer.toLowerCase().trim() ===
                                            wordResult.word.toLowerCase()
                                            ? "bg-green-100 text-green-800"
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
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <SpeakerWaveIcon className="w-3 h-3" />
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
                <p className="mb-2 text-sm font-medium text-gray-700">
                  {t("results.words.practice")} ({result.incorrectWords.length}
                  ):
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.incorrectWords.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full"
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
