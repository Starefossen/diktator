"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TestResult, FamilyStats, ChildAccount } from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  HeroTrophyIcon,
  HeroChartBarIcon,
  HeroBookIcon,
  HeroUsersIcon,
  HeroUserIcon,
  ScoreIcon,
} from "@/components/Icons";

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isParent = userData?.role === "parent";
  const isChild = userData?.role === "child";

  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load test results for the current user
      const resultsResponse = await generatedApiClient.getResults();
      if (resultsResponse.data?.data) {
        // Take only the most recent 10 results
        const sortedResults = (resultsResponse.data.data as TestResult[])
          .sort(
            (a: TestResult, b: TestResult) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime(),
          )
          .slice(0, 10);
        setTestResults(sortedResults);
      }

      // If parent, also load family data
      if (isParent) {
        try {
          const [statsResponse, childrenResponse] = await Promise.all([
            generatedApiClient.getFamilyStats(),
            generatedApiClient.getFamilyChildren(),
          ]);

          if (statsResponse.data?.data)
            setFamilyStats(statsResponse.data.data as FamilyStats);
          if (childrenResponse.data?.data)
            setChildren(childrenResponse.data.data as ChildAccount[]);
        } catch (apiError) {
          console.error("Error loading family data:", apiError);
          // Don't fail the whole page if family data fails
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [user, isParent]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Calculate user statistics
  const totalTests = testResults.length;
  const averageScore =
    totalTests > 0
      ? testResults.reduce((sum, result) => sum + result.score, 0) / totalTests
      : 0;
  const totalWords = testResults.reduce(
    (sum, result) => sum + result.totalWords,
    0,
  );
  const correctWords = testResults.reduce(
    (sum, result) => sum + result.correctWords,
    0,
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">{t("profile.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => loadUserData()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              {t("profile.title")}
            </h1>
            <p className="text-lg text-gray-600">
              {isParent
                ? "Manage your family and track progress"
                : "View your spelling progress and achievements"}
            </p>
          </div>

          {/* User Info Card */}
          <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-2xl font-bold text-white">
                  {userData?.displayName?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {userData?.displayName || user?.email}
                </h2>
                <p className="text-gray-600">
                  {userData?.role === "parent"
                    ? t("auth.role.parent")
                    : t("auth.role.child")}
                </p>
                {isChild && userData?.parentId && (
                  <p className="text-sm text-gray-500">Family member</p>
                )}
              </div>
            </div>
          </div>

          {/* Statistics - Personal for child, Family overview for parent */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                <HeroChartBarIcon className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("profile.stats.testsCompleted")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isParent && familyStats
                      ? familyStats.totalTestsCompleted
                      : totalTests}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                <HeroTrophyIcon className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("profile.stats.averageScore")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      isParent && familyStats
                        ? familyStats.averageFamilyScore
                        : averageScore,
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                <HeroBookIcon className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("profile.stats.totalWords")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalWords}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                {isParent ? (
                  <HeroUsersIcon className="w-8 h-8 text-purple-500" />
                ) : (
                  <HeroUserIcon className="w-8 h-8 text-purple-500" />
                )}
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {isParent
                      ? "Family Members"
                      : t("profile.stats.correctWords")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isParent && familyStats
                      ? familyStats.totalMembers
                      : correctWords}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Parent: Family Quick Actions */}
          {isParent && (
            <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push("/family")}
                  className="flex items-center px-4 py-2 font-medium text-white transition-all duration-200 bg-blue-500 rounded-lg hover:bg-blue-600 hover:shadow-md"
                >
                  <HeroUsersIcon className="w-4 h-4 mr-2" />
                  Manage Family
                </button>
                <button
                  onClick={() => router.push("/wordsets")}
                  className="flex items-center px-4 py-2 font-medium text-white transition-all duration-200 bg-green-500 rounded-lg hover:bg-green-600 hover:shadow-md"
                >
                  <HeroBookIcon className="w-4 h-4 mr-2" />
                  Manage Word Sets
                </button>
              </div>

              {/* Recent Children Activity */}
              {children.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 text-md font-medium text-gray-700">
                    Recent Children Activity
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {children.slice(0, 4).map((child) => (
                      <div
                        key={child.id}
                        className="p-3 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer transition-shadow"
                        onClick={() => router.push(`/family/progress`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">
                              {child.displayName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Last active: {formatDate(child.lastActiveAt)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              child.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {child.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Test Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {t("profile.recentResults")} ({testResults.length})
            </h3>

            {testResults.length === 0 ? (
              <div className="py-12 text-center">
                <HeroBookIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">
                  {t("profile.noResults")}
                </h3>
                <p className="mb-4 text-gray-500">
                  {t("profile.noResults.subtitle")}
                </p>
                <button
                  onClick={() => router.push("/wordsets")}
                  className="px-4 py-2 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Start Testing
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ScoreIcon score={result.score} className="w-10 h-10" />
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Spelling Test
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(result.completedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Score</p>
                            <p className="text-lg font-bold text-gray-900">
                              {Math.round(result.score)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Words</p>
                            <p className="text-lg font-bold text-gray-900">
                              {result.correctWords}/{result.totalWords}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Time</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatTime(result.timeSpent)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
