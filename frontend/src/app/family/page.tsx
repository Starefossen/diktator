"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChildAccount,
  CreateChildAccountRequest,
  FamilyProgress,
  FamilyStats,
} from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  HeroUsersIcon,
  HeroUserPlusIcon,
  HeroChartBarIcon,
  HeroTrashIcon,
  HeroEyeIcon,
  HeroUserIcon,
} from "@/components/Icons";

export default function FamilyPage() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [familyProgress, setFamilyProgress] = useState<FamilyProgress[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Check if user is a parent
  const isParent = userData?.role === "parent";

  // Create child form state
  const [childFormData, setChildFormData] = useState<CreateChildAccountRequest>(
    {
      email: "",
      displayName: "",
      password: "",
    },
  );

  const loadFamilyData = useCallback(async () => {
    if (!isParent) return;

    try {
      setLoading(true);

      // Load children, progress, and stats in parallel
      const [childrenResponse, progressResponse, statsResponse] =
        await Promise.all([
          generatedApiClient.getFamilyChildren(),
          generatedApiClient.getFamilyProgress(),
          generatedApiClient.getFamilyStats(),
        ]);

      if (childrenResponse.data?.data)
        setChildren(childrenResponse.data.data as ChildAccount[]);
      if (progressResponse.data?.data)
        setFamilyProgress(progressResponse.data.data as FamilyProgress[]);
      if (statsResponse.data?.data)
        setFamilyStats(statsResponse.data.data as FamilyStats);
    } catch (error) {
      console.error("Failed to load family data:", error);
    } finally {
      setLoading(false);
    }
  }, [isParent]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !childFormData.email.trim() ||
      !childFormData.displayName.trim() ||
      !childFormData.password.trim()
    ) {
      alert(t("family.child.create.required"));
      return;
    }

    try {
      setCreating(true);
      const response = await generatedApiClient.createChildAccount({
        email: childFormData.email,
        displayName: childFormData.displayName,
        password: childFormData.password,
        familyId: userData?.familyId || "",
      });

      if (response.data?.data) {
        setChildren([...children, response.data.data as ChildAccount]);
        setChildFormData({
          email: "",
          displayName: "",
          password: "",
        });
        setShowCreateForm(false);
        alert(t("family.child.create.success"));

        // Reload family data to get updated stats
        loadFamilyData();
      }
    } catch (error) {
      console.error("Failed to create child account:", error);
      alert(t("family.child.create.error"));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm(t("family.child.delete.confirm"))) {
      return;
    }

    try {
      await generatedApiClient.deleteChildAccount(childId);
      setChildren(children.filter((child) => child.id !== childId));
      alert(t("family.child.delete.success"));

      // Reload family data to get updated stats
      loadFamilyData();
    } catch (error) {
      console.error("Failed to delete child account:", error);
      alert(t("family.child.delete.error"));
    }
  };

  const viewChildProgress = () => {
    router.push(`/family/progress`);
  };

  // Redirect non-parents to profile page
  if (!loading && !isParent) {
    router.push("/profile");
    return null;
  }

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              {t("family.title")}
            </h1>
            <p className="text-lg text-gray-600">{t("family.subtitle")}</p>
          </div>

          {/* Family Statistics */}
          {familyStats && (
            <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center">
                  <HeroUsersIcon className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t("family.stats.members")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {familyStats.totalMembers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center">
                  <HeroUserIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t("family.stats.children")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {familyStats.totalChildren}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center">
                  <HeroChartBarIcon className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t("family.stats.testsCompleted")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {familyStats.totalTestsCompleted}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center">
                  <HeroChartBarIcon className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t("family.stats.averageScore")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(familyStats.averageFamilyScore)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Child Account Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:scale-105"
            >
              <HeroUserPlusIcon className="w-5 h-5 mr-2" />
              {showCreateForm
                ? t("family.child.create.cancel")
                : t("family.child.create.title")}
            </button>
          </div>

          {/* Create Child Form */}
          {showCreateForm && (
            <div className="p-6 mb-8 bg-white border border-gray-100 rounded-lg shadow-lg">
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                {t("family.child.create.title")}
              </h2>

              <form onSubmit={handleCreateChild} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("family.child.displayName")}
                  </label>
                  <input
                    type="text"
                    value={childFormData.displayName}
                    onChange={(e) =>
                      setChildFormData({
                        ...childFormData,
                        displayName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("family.child.displayName.placeholder")}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("family.child.email")}
                  </label>
                  <input
                    type="email"
                    value={childFormData.email}
                    onChange={(e) =>
                      setChildFormData({
                        ...childFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("family.child.email.placeholder")}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("family.child.password")}
                  </label>
                  <input
                    type="password"
                    value={childFormData.password}
                    onChange={(e) =>
                      setChildFormData({
                        ...childFormData,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("family.child.password.placeholder")}
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t("family.child.password.help")}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 bg-green-600 rounded-lg hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">
                          {t("family.child.create.creating")}
                        </span>
                      </>
                    ) : (
                      <>
                        <HeroUserPlusIcon className="w-4 h-4 mr-2" />
                        {t("family.child.create.button")}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex items-center px-6 py-3 font-semibold text-gray-700 transition-all duration-200 bg-gray-200 rounded-lg hover:bg-gray-300 hover:shadow-md"
                  >
                    {t("family.child.create.cancel")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Children List */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">
              {t("family.children.title")} ({children.length})
            </h2>

            {children.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-lg shadow-lg">
                <HeroUserIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-xl font-semibold text-gray-600">
                  {t("family.children.empty.title")}
                </h3>
                <p className="text-gray-500">
                  {t("family.children.empty.subtitle")}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {children.map((child) => {
                  const childProgress = familyProgress.find(
                    (p) => p.userId === child.id,
                  );

                  return (
                    <div
                      key={child.id}
                      className="p-6 transition-shadow duration-200 bg-white border border-gray-100 rounded-lg shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {child.displayName}
                          </h3>
                          <p className="text-sm text-gray-500">{child.email}</p>
                          <p className="text-xs text-gray-400">
                            {t("family.child.lastActive")}:{" "}
                            {new Date(child.lastActiveAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            child.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {child.isActive
                            ? t("family.child.active")
                            : t("family.child.inactive")}
                        </span>
                      </div>

                      {childProgress && (
                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {t("family.child.progress.tests")}
                            </span>
                            <span className="font-medium">
                              {childProgress.totalTests}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {t("family.child.progress.avgScore")}
                            </span>
                            <span className="font-medium">
                              {Math.round(childProgress.averageScore)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {t("family.child.progress.correctWords")}
                            </span>
                            <span className="font-medium">
                              {childProgress.correctWords}/
                              {childProgress.totalWords}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => viewChildProgress()}
                          className="flex items-center justify-center flex-1 px-4 py-2 font-medium text-white transition-all duration-200 bg-blue-500 rounded-lg hover:bg-blue-600 hover:shadow-md"
                        >
                          <HeroEyeIcon className="w-4 h-4 mr-2" />
                          {t("family.child.viewProgress")}
                        </button>
                        <button
                          onClick={() => handleDeleteChild(child.id)}
                          className="flex items-center justify-center px-4 py-2 font-medium text-white transition-all duration-200 bg-red-500 rounded-lg hover:bg-red-600 hover:shadow-md"
                          title={t("family.child.delete.title")}
                        >
                          <HeroTrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
