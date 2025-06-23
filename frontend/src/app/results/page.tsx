"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TestResult, WordSet } from "@/types";
import { generatedApiClient } from "../../lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  HeroChartIcon,
  HeroTrophyIcon,
  HeroTargetIcon,
} from "@/components/Icons";

export default function ResultsPage() {
  const { t } = useLanguage();
  const [results, setResults] = useState<TestResult[]>([]);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "score" | "time">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterScore, setFilterScore] = useState<
    "all" | "excellent" | "good" | "needs-work"
  >("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load both results and word sets
      const [resultsResponse, wordSetsResponse] = await Promise.all([
        generatedApiClient.getResults(),
        generatedApiClient.getWordSets(),
      ]);

      if (resultsResponse.data?.data) {
        const allResults = resultsResponse.data.data as TestResult[];
        setResults(allResults);
        setFilteredResults(allResults);
      }

      if (wordSetsResponse.data?.data) {
        setWordSets(wordSetsResponse.data.data as WordSet[]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort results
  useEffect(() => {
    let filtered = [...results];

    // Apply score filter
    if (filterScore !== "all") {
      filtered = filtered.filter((result) => {
        switch (filterScore) {
          case "excellent":
            return result.score >= 90;
          case "good":
            return result.score >= 70 && result.score < 90;
          case "needs-work":
            return result.score < 70;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "score":
          aValue = a.score;
          bValue = b.score;
          break;
        case "time":
          aValue = a.timeSpent;
          bValue = b.timeSpent;
          break;
        case "date":
        default:
          aValue = new Date(a.completedAt).getTime();
          bValue = new Date(b.completedAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredResults(filtered);
  }, [results, sortBy, sortOrder, filterScore]);

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

  // Calculate comprehensive statistics
  const stats =
    results.length > 0
      ? {
          totalTests: results.length,
          averageScore: Math.round(
            results.reduce((sum, r) => sum + r.score, 0) / results.length,
          ),
          bestScore: Math.max(...results.map((r) => r.score)),
          worstScore: Math.min(...results.map((r) => r.score)),
          totalTimeSpent: results.reduce((sum, r) => sum + r.timeSpent, 0),
          totalWords: results.reduce((sum, r) => sum + r.totalWords, 0),
          totalCorrectWords: results.reduce(
            (sum, r) => sum + r.correctWords,
            0,
          ),
          improvementTrend: calculateImprovementTrend(),
          recentResults: results.slice(0, 5),
          excellentTests: results.filter((r) => r.score >= 90).length,
          goodTests: results.filter((r) => r.score >= 70 && r.score < 90)
            .length,
          needsWorkTests: results.filter((r) => r.score < 70).length,
        }
      : null;

  function calculateImprovementTrend() {
    if (results.length < 2) return 0;

    const recent10 = results.slice(0, Math.min(10, results.length));
    const older10 = results.slice(10, Math.min(20, results.length));

    if (older10.length === 0) return 0;

    const recentAvg =
      recent10.reduce((sum, r) => sum + r.score, 0) / recent10.length;
    const olderAvg =
      older10.reduce((sum, r) => sum + r.score, 0) / older10.length;

    return Math.round(recentAvg - olderAvg);
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full"></div>
            <p className="mt-4 text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              {t("results.title")}
            </h1>
            <p className="text-lg text-gray-600">{t("results.desc")}</p>
          </div>

          {stats ? (
            <>
              {/* Comprehensive Statistics */}
              <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Total Tests
                    </h3>
                    <HeroChartIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.totalTests}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.totalWords} total words
                  </p>
                </div>

                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Average Score
                    </h3>
                    <HeroTrophyIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.averageScore}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.totalCorrectWords}/{stats.totalWords} correct
                  </p>
                </div>

                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Best Score
                    </h3>
                    <HeroTargetIcon className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.bestScore}%
                  </p>
                  <p className="text-sm text-gray-500">Personal best</p>
                </div>

                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Improvement
                    </h3>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        stats.improvementTrend > 0
                          ? "bg-green-100 text-green-600"
                          : stats.improvementTrend < 0
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {stats.improvementTrend > 0
                        ? "↗"
                        : stats.improvementTrend < 0
                          ? "↘"
                          : "→"}
                    </div>
                  </div>
                  <p
                    className={`text-3xl font-bold ${
                      stats.improvementTrend > 0
                        ? "text-green-600"
                        : stats.improvementTrend < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {stats.improvementTrend > 0 ? "+" : ""}
                    {stats.improvementTrend}%
                  </p>
                  <p className="text-sm text-gray-500">Recent trend</p>
                </div>
              </div>

              {/* Performance Distribution */}
              <div className="p-6 mb-8 bg-white shadow-md rounded-xl">
                <h3 className="mb-6 text-xl font-bold text-gray-900">
                  Performance Distribution
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="p-4 text-center rounded-lg bg-green-50">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.excellentTests}
                    </div>
                    <div className="text-sm text-green-700">
                      Excellent (90%+)
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(
                        (stats.excellentTests / stats.totalTests) * 100,
                      )}
                      % of tests
                    </div>
                  </div>
                  <div className="p-4 text-center rounded-lg bg-yellow-50">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.goodTests}
                    </div>
                    <div className="text-sm text-yellow-700">Good (70-89%)</div>
                    <div className="text-xs text-gray-500">
                      {Math.round((stats.goodTests / stats.totalTests) * 100)}%
                      of tests
                    </div>
                  </div>
                  <div className="p-4 text-center rounded-lg bg-red-50">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.needsWorkTests}
                    </div>
                    <div className="text-sm text-red-700">
                      Needs Work (&lt;70%)
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(
                        (stats.needsWorkTests / stats.totalTests) * 100,
                      )}
                      % of tests
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Sorting */}
              <div className="p-6 mb-8 bg-white shadow-md rounded-xl">
                <h3 className="mb-4 text-xl font-bold text-gray-900">
                  Filter & Sort Results
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Filter by Score
                    </label>
                    <select
                      value={filterScore}
                      onChange={(e) =>
                        setFilterScore(
                          e.target.value as
                            | "all"
                            | "excellent"
                            | "good"
                            | "needs-work",
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Scores</option>
                      <option value="excellent">Excellent (90%+)</option>
                      <option value="good">Good (70-89%)</option>
                      <option value="needs-work">Needs Work (&lt;70%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Sort by
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as "date" | "score" | "time")
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="date">Date</option>
                      <option value="score">Score</option>
                      <option value="time">Time Spent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as "asc" | "desc")
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Showing {filteredResults.length} of {stats.totalTests} tests
                </div>
              </div>

              {/* Detailed Results List */}
              <div className="bg-white shadow-md rounded-xl">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">
                    Test Results
                  </h3>
                </div>

                <div className="divide-y divide-gray-200">
                  {filteredResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-6 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3 space-x-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {getWordSetName(result.wordSetId)}
                            </h4>
                            <div
                              className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${getScoreColor(result.score)}`}
                            >
                              {result.score}%
                            </div>
                          </div>

                          <div className="mb-3 text-sm text-gray-600">
                            {formatDate(result.completedAt)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <div>
                              <span className="text-gray-500">Words:</span>
                              <span className="ml-1 font-medium">
                                {result.correctWords}/{result.totalWords}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Time:</span>
                              <span className="ml-1 font-medium">
                                {formatTime(result.timeSpent)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Avg/Word:</span>
                              <span className="ml-1 font-medium">
                                {formatTime(
                                  Math.round(
                                    result.timeSpent / result.totalWords,
                                  ),
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Accuracy:</span>
                              <span className="ml-1 font-medium">
                                {Math.round(
                                  (result.correctWords / result.totalWords) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Show incorrect words if any */}
                      {result.incorrectWords &&
                        result.incorrectWords.length > 0 && (
                          <div className="pt-4 mt-4 border-t border-gray-100">
                            <p className="mb-2 text-sm font-medium text-gray-700">
                              Words to practice ({result.incorrectWords.length}
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

                {filteredResults.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="mb-4 text-gray-400">
                      <HeroChartIcon className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      No results found
                    </h3>
                    <p className="text-gray-600">
                      {results.length === 0
                        ? "Start taking spelling tests to see your results here!"
                        : "Try adjusting your filters to see more results."}
                    </p>
                  </div>
                )}
              </div>

              {/* Achievement Badges */}
              <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2">
                {stats.averageScore >= 90 && (
                  <div className="p-6 text-white bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <HeroTrophyIcon className="w-10 h-10" />
                      <div>
                        <h3 className="text-lg font-bold">Spelling Champion</h3>
                        <p className="text-yellow-100">
                          Maintaining an average score above 90%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {stats.totalTests >= 20 && (
                  <div className="p-6 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <HeroTargetIcon className="w-10 h-10" />
                      <div>
                        <h3 className="text-lg font-bold">Dedicated Learner</h3>
                        <p className="text-purple-100">
                          Completed {stats.totalTests} spelling tests
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white shadow-md rounded-xl">
              <div className="mb-4 text-gray-400">
                <HeroChartIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">
                No Test Results Yet
              </h3>
              <p className="mb-6 text-gray-600">
                Start taking spelling tests to track your progress and see
                detailed results here.
              </p>
              <button
                onClick={() => (window.location.href = "/wordsets/")}
                className="px-6 py-3 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Start Your First Test
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
