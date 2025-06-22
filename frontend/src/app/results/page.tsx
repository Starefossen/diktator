"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { TestResult, WordSet } from "@/types";
import { apiClient } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  HeroChartIcon,
  HeroTrophyIcon,
  HeroTargetIcon,
  ScoreIcon,
} from "@/components/Icons";

export default function ResultsPage() {
  const { t } = useLanguage();
  const { user, userData } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);

  // Use real user data from auth context
  const familyId = userData?.familyId || "family-default";
  const userId = user?.uid || "";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load both results and word sets
      const [resultsResponse, wordSetsResponse] = await Promise.all([
        apiClient.getResults(userId),
        apiClient.getWordSets(familyId),
      ]);

      if (resultsResponse.data) {
        setResults(resultsResponse.data);
      }

      if (wordSetsResponse.data) {
        setWordSets(wordSetsResponse.data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [familyId, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Calculate statistics
  const stats =
    results.length > 0
      ? {
          totalTests: results.length,
          averageScore: Math.round(
            results.reduce((sum, r) => sum + r.score, 0) / results.length,
          ),
          bestScore: Math.max(...results.map((r) => r.score)),
          totalTimeSpent: results.reduce((sum, r) => sum + r.timeSpent, 0),
          recentResults: results.slice(0, 5),
        }
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-4">
              {t("results.title")}
            </h1>
            <p className="text-gray-600 text-lg">{t("results.subtitle")}</p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <HeroChartIcon className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {t("results.noResults")}
              </h3>
              <p className="text-gray-500 mb-6">{t("results.startFirst")}</p>
              <a
                href="/wordsets"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-semibold"
              >
                {t("results.startFirstTest")}
              </a>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.totalTests}
                    </div>
                    <div className="text-gray-600">
                      {t("results.stats.totalTests")}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.averageScore}%
                    </div>
                    <div className="text-gray-600">
                      {t("results.stats.averageScore")}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100">
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.bestScore}%
                    </div>
                    <div className="text-gray-600">
                      {t("results.stats.bestScore")}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-100">
                    <div className="text-3xl font-bold text-orange-600">
                      {formatTime(stats.totalTimeSpent)}
                    </div>
                    <div className="text-gray-600">
                      {t("results.stats.timeSpent")}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Results */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {t("results.recentTests")}
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">
                            <ScoreIcon
                              score={result.score}
                              className="w-8 h-8"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {getWordSetName(result.wordSetId)}
                            </h3>
                            <p className="text-gray-600">
                              {formatDate(result.completedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div
                              className={`inline-block px-3 py-1 rounded-full font-semibold ${getScoreColor(result.score)}`}
                            >
                              {result.score}%
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {result.correctWords}/{result.totalWords}{" "}
                              {t("results.correct")}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {t("results.time")}:{" "}
                              {formatTime(result.timeSpent)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {t("results.avg")}:{" "}
                              {formatTime(
                                Math.round(
                                  result.timeSpent / result.totalWords,
                                ),
                              )}
                              /{t("results.word")}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Show incorrect words if any */}
                      {result.incorrectWords &&
                        result.incorrectWords.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600 mb-2">
                              {t("results.wordsToPractice")}:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {result.incorrectWords!.map((word, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
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
              </div>

              {/* Achievement-style messages */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats && stats.averageScore >= 90 && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <HeroTrophyIcon className="w-8 h-8 text-yellow-500" />
                      <div>
                        <h3 className="font-bold">
                          {t("results.spellingChampion")}
                        </h3>
                        <p className="text-yellow-100">
                          {t("results.averageAbove90")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {stats && stats.totalTests >= 10 && (
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <HeroTargetIcon className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-bold">
                          {t("results.dedicatedLearner")}
                        </h3>
                        <p className="text-purple-100">
                          {t("results.completedTests")} {stats.totalTests}{" "}
                          {t("results.tests")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
