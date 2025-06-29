"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { ChevronDownIcon } from "@heroicons/react/16/solid";

export default function FamilyProgressPage() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const router = useRouter();

  const [familyMembers, setFamilyMembers] = useState<FamilyProgress[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");

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

      if (progressResponse.data?.data)
        setFamilyMembers(progressResponse.data.data as FamilyProgress[]);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">{t("family.loading")}</p>
        </div>
      </div>
    );
  }

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

  // Filter results based on selected child
  const filteredResults =
    selectedChildId === "all"
      ? results
      : results.filter((result) => result.userId === selectedChildId);

  // Get user name for selected child
  const getSelectedChildName = () => {
    if (selectedChildId === "all") return t("family.progress.allChildren");
    const selectedMember = familyMembers.find(
      (member) => member.userId === selectedChildId,
    );
    return selectedMember?.userName || t("family.progress.unknown");
  };

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {t("family.children.title")} ({familyMembers.length})
                </h2>
                {selectedChildId !== "all" && (
                  <button
                    onClick={() => setSelectedChildId("all")}
                    className="px-3 py-1 text-sm text-blue-600 transition-colors border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    {t("family.progress.viewAll")}
                  </button>
                )}
              </div>
              <p className="mb-4 text-sm text-gray-500">
                {t("family.progress.instruction")}
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {familyMembers.map((member) => (
                  <div
                    key={member.userId}
                    onClick={() => setSelectedChildId(member.userId)}
                    className={`p-4 transition-all border rounded-lg cursor-pointer hover:shadow-md ${
                      selectedChildId === member.userId
                        ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center mb-3 space-x-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 font-bold text-white rounded-full ${
                          selectedChildId === member.userId
                            ? "bg-gradient-to-br from-blue-600 to-purple-600"
                            : "bg-gradient-to-br from-blue-500 to-purple-500"
                        }`}
                      >
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3
                          className={`font-semibold ${
                            selectedChildId === member.userId
                              ? "text-blue-900"
                              : "text-gray-800"
                          }`}
                        >
                          {member.userName}
                          {selectedChildId === member.userId && (
                            <span className="ml-2 text-xs font-medium text-blue-600">
                              (Selected)
                            </span>
                          )}
                        </h3>
                        <p
                          className={`text-sm ${
                            selectedChildId === member.userId
                              ? "text-blue-700"
                              : "text-gray-600"
                          }`}
                        >
                          {member.role}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Test Results */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {t("results.title")} ({filteredResults.length})
                </h2>

                {/* Child Selector */}
                {familyMembers.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="px-4 py-2 pr-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg appearance-none hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">
                        {t("family.progress.allChildren")}
                      </option>
                      {familyMembers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.userName}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
                  </div>
                )}
              </div>

              {selectedChildId !== "all" && (
                <p className="text-sm text-gray-600">
                  {t("family.progress.showingResultsFor")}{" "}
                  <span className="font-medium">{getSelectedChildName()}</span>
                </p>
              )}
            </div>

            <TestResultsList
              results={filteredResults.slice(0, 10)}
              wordSets={wordSets}
              showUserName={selectedChildId === "all"}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
