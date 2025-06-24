"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { FamilyProgress, TestResult } from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  HeroChartBarIcon,
  HeroTrophyIcon,
  HeroBookIcon,
  ScoreIcon,
} from "@/components/Icons";

export default function FamilyProgressPage() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const router = useRouter();

  const [familyMembers, setFamilyMembers] = useState<FamilyProgress[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFamilyData = useCallback(async () => {
    if (!userData) return;

    try {
      setLoading(true);

      // Load family progress and stats
      const [progressResponse, resultsResponse] = await Promise.all([
        generatedApiClient.getFamilyProgress(),
        generatedApiClient.getFamilyResults(),
      ]);

      if (progressResponse.data?.data)
        setFamilyMembers(progressResponse.data.data as FamilyProgress[]);
      if (resultsResponse.data?.data)
        setResults(resultsResponse.data.data as TestResult[]);
    } catch (error) {
      console.error("Failed to load family data:", error);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">{t("family.loading")}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Calculate overall family statistics
  const totalTests = familyMembers.reduce(
    (sum, member) => sum + member.totalTests,
    0,
  );
  const totalWords = familyMembers.reduce(
    (sum, member) => sum + member.totalWords,
    0,
  );
  const totalCorrectWords = familyMembers.reduce(
    (sum, member) => sum + member.correctWords,
    0,
  );
  const averageScore =
    totalWords > 0 ? (totalCorrectWords / totalWords) * 100 : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                {t("family.title")}
              </h1>
              <p className="text-lg text-gray-600">{t("family.subtitle")}</p>
            </div>
            <button
              onClick={() => router.push("/family")}
              className="px-4 py-2 text-gray-600 transition-colors rounded-lg hover:text-gray-800 hover:bg-gray-100"
            >
              {t("family.back")}
            </button>
          </div>

          {/* Overall Family Statistics */}
          <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center">
                <HeroChartBarIcon className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("family.stats.testsCompleted")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalTests}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center">
                <HeroTrophyIcon className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("family.stats.averageScore")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(averageScore)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center">
                <HeroBookIcon className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("family.stats.totalWords")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalWords}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center">
                <HeroTrophyIcon className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("family.stats.wordsCorrect")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalCorrectWords}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Family Members Progress */}
          {familyMembers.length > 0 && (
            <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
              <h2 className="mb-6 text-2xl font-semibold text-gray-800">
                {t("family.children.title")} ({familyMembers.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {familyMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                  >
                    <div className="flex items-center mb-3 space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {member.userName}
                        </h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">
                          {t("family.child.progress.tests")}
                        </p>
                        <p className="font-bold">{member.totalTests}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {t("family.child.progress.avgScore")}
                        </p>
                        <p className="font-bold">
                          {Math.round(member.averageScore)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {t("family.child.progress.words")}
                        </p>
                        <p className="font-bold">
                          {member.correctWords}/{member.totalWords}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {t("family.child.progress.accuracy")}
                        </p>
                        <p className="font-bold">
                          {member.totalWords > 0
                            ? Math.round(
                              (member.correctWords / member.totalWords) * 100,
                            )
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Test Results */}
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-gray-800">
              {t("results.title")} ({results.length})
            </h2>

            {results.length === 0 ? (
              <div className="py-12 text-center">
                <HeroBookIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">
                  {t("results.history.noResults")}
                </h3>
                <p className="text-gray-500">{t("results.empty.subtitle")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ScoreIcon score={result.score} className="w-10 h-10" />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {t("family.test.title")}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(result.completedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">
                              {t("results.history.score")}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {Math.round(result.score)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">
                              {t("results.history.words")}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {result.correctWords}/{result.totalWords}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">
                              {t("results.history.time")}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatTime(result.timeSpent)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Show incorrect words if any */}
                    {result.incorrectWords &&
                      result.incorrectWords.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-gray-100">
                          <p className="mb-2 text-sm font-medium text-gray-700">
                            {t("results.details.incorrectWords")}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.incorrectWords.map((word, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-sm text-red-800 bg-red-100 rounded"
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
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
