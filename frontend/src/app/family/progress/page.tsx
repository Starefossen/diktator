"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { FamilyProgress, TestResult, WordSet } from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import TestResultsList from "@/components/TestResultsList";
import {
  HeroChartBarIcon,
  HeroTrophyIcon,
  HeroBookIcon,
} from "@/components/Icons";

function FamilyProgressPageContent() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedChildId = searchParams.get("childId");

  const [familyMembers, setFamilyMembers] = useState<FamilyProgress[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFamilyData = useCallback(async () => {
    if (!userData) return;

    try {
      setLoading(true);

      // Load family progress and stats
      const [progressResponse, resultsResponse, wordSetsResponse] =
        await Promise.all([
          generatedApiClient.getFamilyProgress(),
          generatedApiClient.getFamilyResults(),
          generatedApiClient.getWordSets(),
        ]);

      if (progressResponse.data?.data) {
        // Filter to only include children
        const allMembers = progressResponse.data.data as FamilyProgress[];
        const children = allMembers.filter((member) => member.role === "child");
        setFamilyMembers(children);
      }
      if (resultsResponse.data?.data)
        setResults(resultsResponse.data.data as TestResult[]);
      if (wordSetsResponse.data?.data)
        setWordSets(wordSetsResponse.data.data as WordSet[]);
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
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">{t("family.loading")}</p>
        </div>
      </div>
    );
  }

  // Calculate overall or child-specific statistics
  const isChildView = selectedChildId !== null;
  const selectedChild = familyMembers.find(
    (member) => member.userId === selectedChildId,
  );

  const totalTests = isChildView
    ? selectedChild?.totalTests || 0
    : familyMembers.reduce((sum, member) => sum + member.totalTests, 0);
  const totalWords = isChildView
    ? selectedChild?.totalWords || 0
    : familyMembers.reduce((sum, member) => sum + member.totalWords, 0);
  const totalCorrectWords = isChildView
    ? selectedChild?.correctWords || 0
    : familyMembers.reduce((sum, member) => sum + member.correctWords, 0);
  const averageScore = isChildView
    ? selectedChild?.averageScore || 0
    : totalWords > 0
      ? (totalCorrectWords / totalWords) * 100
      : 0;

  // Filter results based on selected child
  const filteredResults = isChildView
    ? results.filter((result) => result.userId === selectedChildId)
    : results;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="mb-4 text-4xl font-bold text-transparent bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text">
                {isChildView
                  ? selectedChild?.userName || t("family.progress.unknown")
                  : t("family.title")}
              </h1>
              <p className="text-lg text-gray-600">
                {isChildView ? "Progress Overview" : t("family.subtitle")}
              </p>
            </div>
            <button
              onClick={() =>
                router.push(isChildView ? "/family/progress" : "/family")
              }
              className="px-4 py-2 text-gray-600 transition-colors rounded-lg hover:text-gray-800 hover:bg-gray-100"
            >
              {t("common.back")}
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
          {!isChildView && familyMembers.length > 0 && (
            <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {t("family.children.title")} ({familyMembers.length})
                </h2>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                {t("family.progress.instruction")}
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {familyMembers.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() =>
                      router.push(`/family/progress?childId=${member.userId}`)
                    }
                    className="w-full p-4 text-left transition-all border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-center mb-3 space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-full bg-linear-to-br from-blue-500 to-purple-500">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {member.userName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {member.role === "parent"
                            ? t("family.member.role.parent")
                            : t("family.member.role.child")}
                        </p>
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
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Test Results */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {t("results.title")} ({filteredResults.length})
                </h2>
                {isChildView && (
                  <button
                    onClick={() => router.push("/family/progress")}
                    className="px-3 py-1 text-sm text-blue-600 transition-colors border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    {t("family.progress.viewAll")}
                  </button>
                )}
              </div>
              {isChildView && selectedChild && (
                <p className="mt-2 text-sm text-gray-600">
                  {t("family.progress.showingResultsFor")}{" "}
                  <span className="font-medium">{selectedChild.userName}</span>
                </p>
              )}
              {!isChildView && (
                <p className="mt-2 text-sm text-gray-600">
                  {t("family.progress.allChildren")}
                </p>
              )}
            </div>

            <TestResultsList
              results={filteredResults.slice(0, 20)}
              wordSets={wordSets}
              showUserName={!isChildView}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function FamilyProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <FamilyProgressPageContent />
    </Suspense>
  );
}
