"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TestResult,
  FamilyStats,
  ChildAccount,
  FamilyProgress,
  calculateAge,
} from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import { StavleCompanion } from "@/components/StavleCompanion";
import {
  HeroTrophyIcon,
  HeroChartBarIcon,
  HeroBookIcon,
  HeroUsersIcon,
} from "@/components/Icons";

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [familyProgress, setFamilyProgress] = useState<FamilyProgress[]>([]);
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isParent = userData?.role === "parent";
  const isChild = userData?.role === "child";

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (isParent) {
        // Load all data for parents in parallel
        const [
          resultsResponse,
          statsResponse,
          childrenResponse,
          progressResponse,
        ] = await Promise.all([
          generatedApiClient.getResults(),
          generatedApiClient.getFamilyStats(),
          generatedApiClient.getFamilyChildren(),
          generatedApiClient.getFamilyProgress(),
        ]);

        if (resultsResponse.data?.data) {
          const allResults = resultsResponse.data.data as TestResult[];
          // Show only the most recent 10 results
          setRecentResults(
            allResults
              .sort(
                (a, b) =>
                  new Date(b.completedAt).getTime() -
                  new Date(a.completedAt).getTime(),
              )
              .slice(0, 10),
          );
        }

        if (statsResponse.data?.data) {
          setFamilyStats(statsResponse.data.data as FamilyStats);
        }

        if (childrenResponse.data?.data) {
          setChildren(childrenResponse.data.data as ChildAccount[]);
        }

        if (progressResponse.data?.data) {
          setFamilyProgress(progressResponse.data.data as FamilyProgress[]);
        }
      } else {
        // Load only results for children
        const resultsResponse = await generatedApiClient.getResults();

        if (resultsResponse.data?.data) {
          const allResults = resultsResponse.data.data as TestResult[];
          // Show only the most recent 10 results
          setRecentResults(
            allResults
              .sort(
                (a, b) =>
                  new Date(b.completedAt).getTime() -
                  new Date(a.completedAt).getTime(),
              )
              .slice(0, 10),
          );
        }
      }
    } catch (err) {
      console.error("Error loading profile data:", err);
      setError(t("profile.error.load"));
    } finally {
      setLoading(false);
    }
  }, [user, isParent, t]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Calculate basic statistics for profile overview
  const totalTests = recentResults.length;
  const averageScore =
    totalTests > 0
      ? Math.round(
          recentResults.reduce((sum, result) => sum + result.score, 0) /
            totalTests,
        )
      : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-nordic-birch">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">{t("profile.loading")}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-nordic-birch">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadProfileData()}
              className="px-4 py-2 mt-4 text-nordic-midnight bg-nordic-sky rounded-lg hover:bg-nordic-sky/90"
            >
              {t("profile.retry")}
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-nordic-birch">
        <div className="container max-w-4xl px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
              {t("profile.title")}
            </h1>
            <p className="text-lg text-gray-600">
              {isParent ? t("profile.desc.parent") : t("profile.desc.child")}
            </p>
          </div>

          {/* Profile Details Card */}
          <div className="p-8 mb-8 bg-white shadow-lg rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-6 space-x-6 md:mb-0">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-nordic-sky to-nordic-teal">
                  <span className="text-3xl font-bold text-white">
                    {userData?.displayName?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userData?.displayName || user?.email}
                    {isChild && userData?.birthYear && (
                      <span className="ml-2 text-lg font-normal text-gray-500">
                        ({calculateAge(userData.birthYear)}{" "}
                        {t("family.child.years")})
                      </span>
                    )}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {userData?.role === "parent"
                      ? t("auth.role.parent") || "Parent"
                      : t("auth.role.child") || "Child"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
                  {isChild && userData?.parentId && (
                    <p className="text-sm font-medium text-nordic-sky">
                      {t("profile.family.member")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => router.push("/results")}
                  className="px-4 py-2 text-nordic-midnight transition-colors bg-nordic-sky rounded-lg hover:bg-nordic-sky/90"
                >
                  {t("profile.viewAllResults")}
                </button>
                {isParent && (
                  <button
                    onClick={() => router.push("/family")}
                    className="px-4 py-2 text-nordic-midnight transition-colors bg-nordic-teal rounded-lg hover:bg-nordic-teal/90"
                  >
                    {t("profile.manageFamily")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <div className="p-6 bg-white shadow-md rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("profile.stats.recentTests")}
                  </p>
                  <p className="text-3xl font-bold text-nordic-sky">
                    {totalTests}
                  </p>
                </div>
                <HeroChartBarIcon className="w-12 h-12 text-nordic-sky" />
              </div>
            </div>

            <div className="p-6 bg-white shadow-md rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("profile.stats.averageScore")}
                  </p>
                  <p className="text-3xl font-bold text-nordic-sunrise">
                    {averageScore}%
                  </p>
                </div>
                <HeroTrophyIcon className="w-12 h-12 text-nordic-sunrise" />
              </div>
            </div>

            {isParent && familyStats ? (
              <div className="p-6 bg-white shadow-md rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("profile.stats.familyTests")}
                    </p>
                    <p className="text-3xl font-bold text-nordic-teal">
                      {familyStats.totalTestsCompleted}
                    </p>
                  </div>
                  <HeroUsersIcon className="w-12 h-12 text-nordic-teal" />
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white shadow-md rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("profile.stats.bestScore")}
                    </p>
                    <p className="text-3xl font-bold text-nordic-meadow">
                      {recentResults.length > 0
                        ? Math.max(...recentResults.map((r) => r.score))
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 bg-nordic-meadow/20 rounded-lg">
                    <span className="text-xl font-bold text-nordic-meadow">
                      ★
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {recentResults.length > 0 ? (
            <div className="p-6 mb-8 bg-white shadow-md rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {t("profile.recentActivity")}
                </h3>
                <button
                  onClick={() => router.push("/results")}
                  className="font-medium text-nordic-sky hover:text-nordic-sky/80"
                >
                  {t("profile.activity.viewAll")}
                </button>
              </div>

              <div className="space-y-3">
                {recentResults.slice(0, 3).map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {t("profile.activity.wordSetTest")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(result.completedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-block px-3 py-1 rounded-full font-semibold ${
                          result.score >= 90
                            ? "text-nordic-meadow bg-nordic-meadow/10"
                            : result.score >= 70
                              ? "text-nordic-sunrise bg-nordic-sunrise/10"
                              : "text-nordic-cloudberry bg-nordic-cloudberry/10"
                        }`}
                      >
                        {result.score}%
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {result.correctWords}/{result.totalWords}{" "}
                        {t("profile.activity.correct")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 mb-8 bg-white shadow-md rounded-xl">
              <div className="text-center">
                <HeroChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">
                  {t("profile.noResults")}
                </h3>
                <p className="mb-4 text-gray-500">
                  {t("profile.noResults.subtitle")}
                </p>
                <button
                  onClick={() => router.push("/wordsets")}
                  className="px-4 py-2 font-medium text-nordic-midnight bg-nordic-sky rounded-lg hover:bg-nordic-sky/90"
                >
                  {t("profile.startTesting")}
                </button>
              </div>
            </div>
          )}

          {/* Family Quick Actions for Parents */}
          {isParent && (
            <div className="p-6 mb-8 bg-white shadow-md rounded-xl">
              <h3 className="mb-6 text-xl font-bold text-gray-900">
                {t("profile.family.title")}
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {t("profile.family.children")} ({children.length})
                    </h4>
                    <HeroUsersIcon className="w-6 h-6 text-gray-400" />
                  </div>

                  {children.length > 0 ? (
                    <div className="space-y-2">
                      {children.slice(0, 3).map((child, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">
                            {child.displayName}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              child.isActive
                                ? "bg-nordic-meadow/20 text-nordic-midnight"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {child.isActive
                              ? t("profile.family.active")
                              : t("profile.family.inactive")}
                          </span>
                        </div>
                      ))}
                      {children.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{children.length - 3} {t("profile.family.more")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("profile.family.noChildren")}
                    </p>
                  )}

                  <button
                    onClick={() => router.push("/family")}
                    className="w-full px-3 py-2 mt-3 text-sm text-nordic-sky rounded bg-nordic-sky/10 hover:bg-nordic-sky/20"
                  >
                    {t("profile.family.manageChildren")}
                  </button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {t("profile.family.quickActions")}
                    </h4>
                    <HeroBookIcon className="w-6 h-6 text-gray-400" />
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => router.push("/wordsets")}
                      className="w-full px-3 py-2 text-sm text-left rounded bg-gray-50 hover:bg-gray-100"
                    >
                      {t("profile.family.browseWordSets")}
                    </button>
                    <button
                      onClick={() => router.push("/family")}
                      className="w-full px-3 py-2 text-sm text-left rounded bg-gray-50 hover:bg-gray-100"
                    >
                      {t("profile.family.addNewChild")}
                    </button>
                    <button
                      onClick={() => router.push("/results")}
                      className="w-full px-3 py-2 text-sm text-left rounded bg-gray-50 hover:bg-gray-100"
                    >
                      {t("profile.family.familyProgress")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievement Highlights for Children */}
          {isChild && recentResults.length > 0 && (
            <div className="p-6 bg-white shadow-md rounded-xl">
              <h3 className="mb-6 text-xl font-bold text-gray-900">
                {t("profile.achievements.title")}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {averageScore >= 90 && (
                  <div className="p-4 text-nordic-midnight rounded-lg bg-linear-to-r from-nordic-sunrise to-nordic-cloudberry">
                    <div className="flex items-center space-x-3">
                      <HeroTrophyIcon className="w-8 h-8" />
                      <div>
                        <h4 className="font-bold">
                          {t("profile.achievements.champion.title")}
                        </h4>
                        <p className="text-sm opacity-90">
                          {t("profile.achievements.champion.desc")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {totalTests >= 2 && (
                  <div className="p-4 text-nordic-midnight rounded-lg bg-linear-to-r from-nordic-sky to-nordic-teal">
                    <div className="flex items-center space-x-3">
                      <HeroBookIcon className="w-8 h-8" />
                      <div>
                        <h4 className="font-bold">
                          {t("profile.achievements.learner.title")}
                        </h4>
                        <p className="text-sm opacity-90">
                          {t("profile.achievements.learner.desc").replace(
                            "{count}",
                            totalTests.toString(),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <StavleCompanion
          page="profile"
          userResults={recentResults}
          familyProgress={familyProgress}
          childAccounts={children}
        />
      </div>
    </ProtectedRoute>
  );
}
