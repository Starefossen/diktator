"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChildAccount,
  FamilyProgress,
  FamilyStats,
  FamilyInvitation,
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
  HeroPencilIcon,
} from "@/components/Icons";

export default function FamilyPage() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [familyProgress, setFamilyProgress] = useState<FamilyProgress[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);

  // Modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"child" | "parent">("child");
  const [submitting, setSubmitting] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    email: "",
    displayName: "",
  });

  // Check if user is a parent
  const isParent = userData?.role === "parent";

  const loadFamilyData = useCallback(async () => {
    if (!isParent) return;

    try {
      setLoading(true);

      // Load children, progress, stats, and invitations in parallel
      const [
        childrenResponse,
        progressResponse,
        statsResponse,
        invitationsResponse,
      ] = await Promise.all([
        generatedApiClient.getFamilyChildren(),
        generatedApiClient.getFamilyProgress(),
        generatedApiClient.getFamilyStats(),
        generatedApiClient.getFamilyInvitations(),
      ]);

      if (childrenResponse.data?.data)
        setChildren(childrenResponse.data.data as ChildAccount[]);
      if (progressResponse.data?.data)
        setFamilyProgress(progressResponse.data.data as FamilyProgress[]);
      if (statsResponse.data?.data)
        setFamilyStats(statsResponse.data.data as FamilyStats);
      if (invitationsResponse.data?.data)
        setInvitations(invitationsResponse.data.data as FamilyInvitation[]);
    } catch (error) {
      console.error("Failed to load family data:", error);
    } finally {
      setLoading(false);
    }
  }, [isParent]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  // Redirect non-parents to profile page using useEffect to avoid render-time navigation
  useEffect(() => {
    if (!loading && !isParent) {
      router.push("/profile/");
    }
  }, [loading, isParent, router]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!memberFormData.email.trim()) {
      setErrorMessage(
        t("family.child.email") +
        " " +
        t("profile.settings.validation.required"),
      );
      return;
    }
    if (selectedRole === "child" && !memberFormData.displayName.trim()) {
      setErrorMessage(
        t("family.child.displayName") +
        " " +
        t("profile.settings.validation.required"),
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      if (selectedRole === "child") {
        const response = await generatedApiClient.createChildAccount({
          email: memberFormData.email.trim(),
          displayName: memberFormData.displayName.trim(),
          role: "child",
          familyId: userData?.familyId || "",
        });

        if (response.data?.data) {
          setChildren([...children, response.data.data as ChildAccount]);
          alert(t("family.child.create.success"));
        }
      } else {
        await generatedApiClient.addFamilyMember({
          email: memberFormData.email.trim(),
          displayName: "",
          role: "parent",
          familyId: userData?.familyId || "",
        });
        alert(t("family.invitation.inviteParent.success"));
      }

      // Reset and close
      setMemberFormData({ email: "", displayName: "" });
      setShowAddMemberModal(false);
      setSelectedRole("child");

      // Reload family data
      loadFamilyData();
    } catch (error: unknown) {
      console.error("Failed to add family member:", error);
      const apiError =
        (
          error as {
            response?: { data?: { error?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (error as { message?: string })?.message ||
        (selectedRole === "child"
          ? t("family.child.create.error")
          : t("family.invitation.inviteParent.error"));
      setErrorMessage(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm(t("family.child.delete.confirm"))) {
      return;
    }

    try {
      setErrorMessage(null);
      await generatedApiClient.deleteChildAccount(childId);
      setChildren(children.filter((child) => child.id !== childId));
      alert(t("family.child.delete.success"));

      // Reload family data to get updated stats
      loadFamilyData();
    } catch (error: unknown) {
      console.error("Failed to delete child account:", error);
      const apiError =
        (
          error as {
            response?: { data?: { error?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (error as { message?: string })?.message ||
        t("family.child.delete.error");
      setErrorMessage(apiError);
    }
  };

  const viewChildProgress = (childId: string) => {
    router.push(`/family/progress?childId=${childId}`);
  };

  const handleEditChildName = async (childId: string) => {
    if (!editingName.trim()) {
      setErrorMessage(t("profile.settings.validation.required"));
      return;
    }

    try {
      setErrorMessage(null);
      await generatedApiClient.updateChildDisplayName(childId, {
        displayName: editingName.trim(),
      });

      // Update local state
      setChildren(
        children.map((child) =>
          child.id === childId
            ? { ...child, displayName: editingName.trim() }
            : child,
        ),
      );

      setEditingChildId(null);
      setEditingName("");
    } catch (error: unknown) {
      console.error("Failed to update child name:", error);
      const apiError =
        (
          error as {
            response?: { data?: { error?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (error as { message?: string })?.message ||
        t("family.child.editName.error");
      setErrorMessage(apiError);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setErrorMessage(null);
      await generatedApiClient.deleteFamilyInvitation(invitationId);
      setInvitations(invitations.filter((inv) => inv.id !== invitationId));
    } catch (error: unknown) {
      console.error("Failed to cancel invitation:", error);
      const apiError =
        (
          error as {
            response?: { data?: { error?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (error as { message?: string })?.message ||
        t("family.invitation.cancelError");
      setErrorMessage(apiError);
    }
  };

  // Redirect non-parents to profile page
  if (!loading && !isParent) {
    return null;
  }

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text">
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

          {/* Add Family Member Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bg-linear-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:scale-105"
            >
              <HeroUserPlusIcon className="w-5 h-5 mr-2" />
              {t("family.addMember.button")}
            </button>
          </div>

          {/* Add Member Modal */}
          {showAddMemberModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                  {t("family.addMember.title")}
                </h2>

                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("family.addMember.role")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("child")}
                      className={`px-4 py-3 font-medium rounded-lg transition-all ${selectedRole === "child"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {t("family.member.role.child")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("parent")}
                      className={`px-4 py-3 font-medium rounded-lg transition-all ${selectedRole === "parent"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {t("family.member.role.parent")}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-4 mb-4 border border-red-200 rounded-md bg-red-50">
                    <div className="flex">
                      <div className="shrink-0">
                        <svg
                          className="w-5 h-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {t("common.error")}
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          {errorMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleAddMember} className="space-y-4">
                  {selectedRole === "child" && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        {t("family.child.displayName")}
                      </label>
                      <input
                        type="text"
                        value={memberFormData.displayName}
                        onChange={(e) =>
                          setMemberFormData({
                            ...memberFormData,
                            displayName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("family.child.displayName.placeholder")}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      {t("family.child.email")}
                    </label>
                    <input
                      type="email"
                      value={memberFormData.email}
                      onChange={(e) =>
                        setMemberFormData({
                          ...memberFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        selectedRole === "child"
                          ? t("family.child.email.placeholder")
                          : t(
                            "family.invitation.inviteParent.email.placeholder",
                          )
                      }
                      required
                    />
                    {selectedRole === "child" && (
                      <p className="mt-1 text-sm text-gray-500">
                        {t("family.child.email.help")}
                      </p>
                    )}
                    {selectedRole === "parent" && (
                      <p className="mt-1 text-sm text-gray-500">
                        {t("family.invitation.inviteParent.help")}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center flex-1 px-6 py-3 font-semibold text-white transition-all duration-200 bg-green-600 rounded-lg hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">
                            {selectedRole === "child"
                              ? t("family.child.create.creating")
                              : t("family.invitation.inviteParent.sending")}
                          </span>
                        </>
                      ) : (
                        <>
                          <HeroUserPlusIcon className="w-4 h-4 mr-2" />
                          {selectedRole === "child"
                            ? t("family.child.create.button")
                            : t("family.invitation.inviteParent.button")}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setMemberFormData({ email: "", displayName: "" });
                        setErrorMessage(null);
                        setSelectedRole("child");
                      }}
                      className="flex items-center px-6 py-3 font-semibold text-gray-700 transition-all duration-200 bg-gray-200 rounded-lg hover:bg-gray-300 hover:shadow-md"
                    >
                      {t("family.child.create.cancel")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="p-6 mb-8 bg-white rounded-lg shadow-lg">
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">
                {t("family.invitation.title")}
              </h2>
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {invitation.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invitation.role === "parent"
                          ? t("family.member.role.parent")
                          : t("family.member.role.child")}{" "}
                        • {t("family.invitation.status.pending")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="px-3 py-1 text-sm text-red-600 transition border border-red-300 rounded hover:bg-red-50"
                    >
                      {t("family.invitation.cancel")}
                    </button>
                  </div>
                ))}
              </div>
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
                        <div className="flex-1">
                          {editingChildId === child.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 px-3 py-1 text-lg font-semibold border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                              />
                              <button
                                onClick={() => handleEditChildName(child.id)}
                                className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                              >
                                {t("family.child.editName.save")}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingChildId(null);
                                  setEditingName("");
                                }}
                                className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                {t("family.child.editName.cancel")}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-semibold text-gray-800">
                                {child.displayName}
                              </h3>
                              <button
                                onClick={() => {
                                  setEditingChildId(child.id);
                                  setEditingName(child.displayName);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title={t("family.child.editName")}
                              >
                                <HeroPencilIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                          <p className="text-sm text-gray-500">{child.email}</p>
                          <p className="text-xs text-gray-400">
                            {t("family.child.lastActive")}:{" "}
                            {new Date(child.lastActiveAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${child.isActive
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
                          onClick={() => viewChildProgress(child.id)}
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
