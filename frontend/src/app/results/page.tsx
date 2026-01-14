"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { TestResult, WordSet, FamilyProgress } from "@/types";
import { generatedApiClient } from "../../lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import TestResultsList from "@/components/TestResultsList";
import { StavleCompanion } from "@/components/StavleCompanion";
import {
  HeroChartIcon,
  HeroTrophyIcon,
  HeroTargetIcon,
} from "@/components/Icons";
import { XPIndicator } from "@/components/XPIndicator";
import {
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
} from "@heroicons/react/16/solid";

function ResultsPageContent() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<TestResult[]>([]);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [familyProgress, setFamilyProgress] = useState<FamilyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "score" | "time">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterScore, setFilterScore] = useState<
    "all" | "excellent" | "good" | "needs-work"
  >("all");

  const isParent = userData?.role === "parent";
  const isNewResult = searchParams.get("new") === "true";

  // Helper function for interpolated translations
  const interpolate = (
    key: string,
    variables: Record<string, string | number>,
  ) => {
    let translation = t(key as keyof typeof import("@/locales/en").en);
    Object.entries(variables).forEach(([variable, value]) => {
      translation = translation.replace(`{${variable}}`, String(value));
    });
    return translation;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load results and word sets (including curated), plus family progress for parents
      const apiCalls: Promise<unknown>[] = [
        generatedApiClient.getResults(),
        generatedApiClient.getWordSets(),
        generatedApiClient.getCuratedWordSets(),
      ];

      if (isParent) {
        apiCalls.push(generatedApiClient.getFamilyProgress());
      }

      const [
        resultsResponse,
        wordSetsResponse,
        curatedWordSetsResponse,
        familyProgressResponse,
      ] = (await Promise.all(apiCalls)) as [
        Awaited<ReturnType<typeof generatedApiClient.getResults>>,
        Awaited<ReturnType<typeof generatedApiClient.getWordSets>>,
        Awaited<ReturnType<typeof generatedApiClient.getCuratedWordSets>>,
        (
          | Awaited<ReturnType<typeof generatedApiClient.getFamilyProgress>>
          | undefined
        ),
      ];

      if (resultsResponse.data) {
        const allResults = resultsResponse.data as TestResult[];
        setResults(allResults);
        setFilteredResults(allResults);
      }

      // Combine family word sets with curated word sets
      const familyWordSets = (wordSetsResponse.data as WordSet[]) || [];
      const curatedWordSets =
        (curatedWordSetsResponse.data as WordSet[]) || [];
      setWordSets([...familyWordSets, ...curatedWordSets]);

      if (familyProgressResponse?.data) {
        setFamilyProgress(familyProgressResponse.data as FamilyProgress[]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [isParent]);

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
        <div className="flex items-center justify-center min-h-screen bg-nordic-birch">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 border-nordic-sky rounded-full"></div>
            <p className="mt-4 text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-nordic-birch">
        <div className="container px-4 py-8 mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
              {t("results.title")}
            </h1>
            <p className="text-lg text-gray-600">{t("results.desc")}</p>
          </div>

          {stats ? (
            <>
              {" "}
              {/* XP Summary Card */}
              {userData &&
                userData.totalXp !== undefined &&
                userData.level !== undefined && (
                  <div className="p-6 mb-8 bg-linear-to-r from-nordic-sky/10 to-nordic-teal/10 shadow-md rounded-xl border border-nordic-sky/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {t("test.xpEarned")}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {t("test.totalXp")}: {userData.totalXp} XP
                        </p>
                      </div>
                      <XPIndicator
                        totalXp={userData.totalXp}
                        level={userData.level}
                        size="lg"
                        showProgress={true}
                      />
                    </div>
                  </div>
                )}
              {/* Comprehensive Statistics */}
              <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      {t("results.stats.totalTestsCard")}
                    </h3>
                    <HeroChartIcon className="w-6 h-6 text-nordic-sky" />
                  </div>
                  <p className="text-3xl font-bold text-nordic-sky">
                    {stats.totalTests}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.totalWords} {t("results.stats.totalWordsLabel")}
                  </p>
                </div>

                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      {t("results.stats.averageScoreCard")}
                    </h3>
                    <HeroTrophyIcon className="w-6 h-6 text-nordic-sunrise" />
                  </div>
                  <p className="text-3xl font-bold text-nordic-sunrise">
                    {stats.averageScore}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.totalCorrectWords}/{stats.totalWords}{" "}
                    {t("results.stats.correctLabel")}
                  </p>
                </div>

                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      {t("results.stats.bestScoreCard")}
                    </h3>
                    <HeroTargetIcon className="w-6 h-6 text-nordic-meadow" />
                  </div>
                  <p className="text-3xl font-bold text-nordic-meadow">
                    {stats.bestScore}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("results.stats.personalBest")}
                  </p>
                </div>

                <div className="p-6 bg-white shadow-md rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      {t("results.stats.improvementCard")}
                    </h3>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${stats.improvementTrend > 0
                          ? "bg-nordic-meadow/20 text-nordic-meadow"
                          : stats.improvementTrend < 0
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {stats.improvementTrend > 0 ? (
                        <ArrowTrendingUpIcon className="w-4 h-4" />
                      ) : stats.improvementTrend < 0 ? (
                        <ArrowTrendingDownIcon className="w-4 h-4" />
                      ) : (
                        <ArrowRightIcon className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-3xl font-bold ${stats.improvementTrend > 0
                        ? "text-nordic-meadow"
                        : stats.improvementTrend < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                  >
                    {stats.improvementTrend > 0 ? "+" : ""}
                    {stats.improvementTrend}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("results.stats.recentTrend")}
                  </p>
                </div>
              </div>
              {/* Performance Distribution */}
              <div className="p-6 mb-8 bg-white shadow-md rounded-xl">
                <h3 className="mb-6 text-xl font-bold text-gray-900">
                  {t("results.performance.distributionTitle")}
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="p-4 text-center rounded-lg bg-nordic-meadow/10">
                    <div className="text-2xl font-bold text-nordic-meadow">
                      {stats.excellentTests}
                    </div>
                    <div className="text-sm text-nordic-midnight">
                      {t("results.performance.excellentLabel")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(
                        (stats.excellentTests / stats.totalTests) * 100,
                      )}
                      {t("results.performance.ofTests")}
                    </div>
                  </div>
                  <div className="p-4 text-center rounded-lg bg-nordic-sunrise/10">
                    <div className="text-2xl font-bold text-nordic-sunrise">
                      {stats.goodTests}
                    </div>
                    <div className="text-sm text-nordic-midnight">
                      {t("results.performance.goodLabel")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((stats.goodTests / stats.totalTests) * 100)}
                      {t("results.performance.ofTests")}
                    </div>
                  </div>
                  <div className="p-4 text-center rounded-lg bg-nordic-cloudberry/10">
                    <div className="text-2xl font-bold text-nordic-cloudberry">
                      {stats.needsWorkTests}
                    </div>
                    <div className="text-sm text-nordic-midnight">
                      {t("results.performance.needsWorkLabel")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(
                        (stats.needsWorkTests / stats.totalTests) * 100,
                      )}
                      {t("results.performance.ofTests")}
                    </div>
                  </div>
                </div>
              </div>
              {/* Filters and Sorting */}
              <div className="p-6 mb-8 bg-white shadow-md rounded-xl">
                <h3 className="mb-4 text-xl font-bold text-gray-900">
                  {t("results.filters.filterSortTitle")}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="filterScore"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      {t("results.filters.filterByScore")}
                    </label>
                    <div className="grid grid-cols-1 mt-2">
                      <select
                        id="filterScore"
                        name="filterScore"
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
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                      >
                        <option value="all">
                          {t("results.filters.allScores")}
                        </option>
                        <option value="excellent">
                          {t("results.filters.excellentOption")}
                        </option>
                        <option value="good">
                          {t("results.filters.goodOption")}
                        </option>
                        <option value="needs-work">
                          {t("results.filters.needsWorkOption")}
                        </option>
                      </select>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="self-center col-start-1 row-start-1 mr-2 text-gray-500 pointer-events-none size-5 justify-self-end sm:size-4"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="sortBy"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      {t("results.filters.sortByLabel")}
                    </label>
                    <div className="grid grid-cols-1 mt-2">
                      <select
                        id="sortBy"
                        name="sortBy"
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as "date" | "score" | "time")
                        }
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                      >
                        <option value="date">
                          {t("results.filters.dateOption")}
                        </option>
                        <option value="score">
                          {t("results.filters.scoreOption")}
                        </option>
                        <option value="time">
                          {t("results.filters.timeSpentOption")}
                        </option>
                      </select>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="self-center col-start-1 row-start-1 mr-2 text-gray-500 pointer-events-none size-5 justify-self-end sm:size-4"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="sortOrder"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      {t("results.filters.orderLabel")}
                    </label>
                    <div className="grid grid-cols-1 mt-2">
                      <select
                        id="sortOrder"
                        name="sortOrder"
                        value={sortOrder}
                        onChange={(e) =>
                          setSortOrder(e.target.value as "asc" | "desc")
                        }
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-nordic-teal sm:text-sm/6"
                      >
                        <option value="desc">
                          {t("results.filters.descendingOption")}
                        </option>
                        <option value="asc">
                          {t("results.filters.ascendingOption")}
                        </option>
                      </select>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="self-center col-start-1 row-start-1 mr-2 text-gray-500 pointer-events-none size-5 justify-self-end sm:size-4"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  {interpolate("results.filters.showingResults", {
                    count: filteredResults.length,
                    total: stats.totalTests,
                  })}
                </div>
              </div>
              {/* Detailed Results List */}
              <div className="bg-white shadow-md rounded-xl">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">
                    {t("results.list.title")}
                  </h3>
                </div>

                <TestResultsList
                  results={filteredResults}
                  wordSets={wordSets}
                  isNewResult={isNewResult}
                />

                {filteredResults.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="mb-4 text-gray-400">
                      <HeroChartIcon className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      {t("results.list.noResultsTitle")}
                    </h3>
                    <p className="text-gray-600">
                      {results.length === 0
                        ? t("results.start.message")
                        : t("results.list.noResultsMessage")}
                    </p>
                  </div>
                )}
              </div>
              {/* Achievement Badges */}
              <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2">
                {stats.averageScore >= 90 && (
                  <div className="p-6 text-nordic-midnight bg-linear-to-r from-nordic-sunrise to-nordic-cloudberry rounded-xl">
                    <div className="flex items-center space-x-3">
                      <HeroTrophyIcon className="w-10 h-10" />
                      <div>
                        <h3 className="text-lg font-bold">
                          {t("results.achievement.spellingChampion")}
                        </h3>
                        <p className="text-nordic-midnight/80">
                          {t("results.achievement.spellingChampionDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {stats.totalTests >= 20 && (
                  <div className="p-6 text-nordic-midnight bg-linear-to-r from-nordic-sky to-nordic-teal rounded-xl">
                    <div className="flex items-center space-x-3">
                      <HeroTargetIcon className="w-10 h-10" />
                      <div>
                        <h3 className="text-lg font-bold">
                          {t("results.achievement.dedicatedLearner")}
                        </h3>
                        <p className="text-nordic-midnight/80">
                          {interpolate(
                            "results.achievement.dedicatedLearnerDesc",
                            {
                              count: stats.totalTests,
                            },
                          )}
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
                {t("results.empty.noTestsTitle")}
              </h3>
              <p className="mb-6 text-gray-600">
                {t("results.empty.noTestsMessage")}
              </p>
              <button
                onClick={() => (window.location.href = "/wordsets/")}
                className="px-6 py-3 text-nordic-midnight transition-colors bg-nordic-sky rounded-lg hover:bg-nordic-sky/90"
              >
                {t("results.empty.startFirstTest")}
              </button>
            </div>
          )}
        </div>

        <StavleCompanion
          page="results"
          userResults={results}
          familyProgress={familyProgress}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-nordic-birch">
          <div className="w-12 h-12 mx-auto border-b-2 border-nordic-sky rounded-full animate-spin" />
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
