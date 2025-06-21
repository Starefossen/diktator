"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase";
import { TestResult } from "@/types/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTestResults = useCallback(async () => {
    if (!user || !db) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "testResults"),
        where("userId", "==", user.uid),
        orderBy("completedAt", "desc"),
        limit(10),
      );

      const querySnapshot = await getDocs(q);
      const results: TestResult[] = [];

      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as TestResult);
      });

      setTestResults(results);
    } catch (err) {
      console.error("Error loading test results:", err);
      setError("Failed to load test results");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && db) {
      loadTestResults();
    }
  }, [user, loadTestResults]);

  const getAverageScore = () => {
    if (testResults.length === 0) return 0;
    const total = testResults.reduce((sum, result) => sum + result.score, 0);
    return Math.round(total / testResults.length);
  };

  const getTotalWords = () => {
    return testResults.reduce((sum, result) => sum + result.totalWords, 0);
  };

  const getTotalCorrect = () => {
    return testResults.reduce((sum, result) => sum + result.correctWords, 0);
  };

  return (
    <ProtectedRoute>
      <div className="py-12">
        <div className="max-w-4xl px-4 mx-auto">
          <h1 className="mb-8 text-3xl font-bold text-center">
            {t("profile.title")}
          </h1>

          {/* User Info */}
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
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-4">
            <div className="p-6 text-center bg-white rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-600">
                {testResults.length}
              </div>
              <div className="text-sm text-gray-600">
                {t("profile.stats.testsCompleted")}
              </div>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow-md">
              <div className="text-2xl font-bold text-green-600">
                {getAverageScore()}%
              </div>
              <div className="text-sm text-gray-600">
                {t("profile.stats.averageScore")}
              </div>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow-md">
              <div className="text-2xl font-bold text-purple-600">
                {getTotalWords()}
              </div>
              <div className="text-sm text-gray-600">
                {t("profile.stats.totalWords")}
              </div>
            </div>
            <div className="p-6 text-center bg-white rounded-lg shadow-md">
              <div className="text-2xl font-bold text-yellow-600">
                {getTotalCorrect()}
              </div>
              <div className="text-sm text-gray-600">
                {t("profile.stats.correctWords")}
              </div>
            </div>
          </div>

          {/* Recent Results */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-xl font-semibold">
              {t("profile.recentResults")}
            </h3>

            {loading ? (
              <div className="py-8 text-center">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-600">{error}</div>
            ) : testResults.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {t("profile.noResults")}
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{result.wordSetName}</div>
                      <div className="text-sm text-gray-600">
                        {result.language === "en" ? "🇬🇧 English" : "🇳🇴 Norsk"} •{" "}
                        {new Date(result.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${result.score >= 80 ? "text-green-600" : result.score >= 60 ? "text-yellow-600" : "text-red-600"}`}
                      >
                        {result.score}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.correctWords}/{result.totalWords}{" "}
                        {t("profile.correct")}
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
