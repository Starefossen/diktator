"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { generatedApiClient } from "@/lib/api-generated";
import { HeroCheckIcon } from "@/components/Icons";
import type { ChildAccount } from "@/types";

interface ChildAssignmentSelectorProps {
  wordSetId?: string;
  assignedUserIds: string[];
  onAssignmentChange?: (newAssignedUserIds: string[]) => void;
  pendingMode?: boolean;
}

export function ChildAssignmentSelector({
  wordSetId,
  assignedUserIds,
  onAssignmentChange,
  pendingMode = false,
}: ChildAssignmentSelectorProps) {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAssignedUserIds, setLocalAssignedUserIds] =
    useState<string[]>(assignedUserIds);

  // Fetch family children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      if (userData?.role !== "parent") return;

      try {
        setLoading(true);
        const response = await generatedApiClient.getFamilyChildren();
        const childrenData = response.data as ChildAccount[] | undefined;
        setChildren(childrenData || []);
      } catch (err) {
        console.error("Failed to fetch children:", err);
        setError("Failed to load children");
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [userData]);

  const handleToggleAssignment = async (childId: string) => {
    const isCurrentlyAssigned = localAssignedUserIds.includes(childId);

    if (pendingMode) {
      const newAssignedIds = isCurrentlyAssigned
        ? localAssignedUserIds.filter((id) => id !== childId)
        : [...localAssignedUserIds, childId];
      setLocalAssignedUserIds(newAssignedIds);
      onAssignmentChange?.(newAssignedIds);
      return;
    }

    if (!wordSetId) return;

    try {
      setError(null);
      if (isCurrentlyAssigned) {
        await generatedApiClient.unassignWordSetFromUser(wordSetId, childId);
        const newAssignedIds = localAssignedUserIds.filter(
          (id) => id !== childId,
        );
        setLocalAssignedUserIds(newAssignedIds);
        onAssignmentChange?.(newAssignedIds);
      } else {
        await generatedApiClient.assignWordSetToUser(wordSetId, childId);
        const newAssignedIds = [...localAssignedUserIds, childId];
        setLocalAssignedUserIds(newAssignedIds);
        onAssignmentChange?.(newAssignedIds);
      }
    } catch (err) {
      console.error("Failed to update assignment:", err);
      setError(
        isCurrentlyAssigned
          ? t("wordsets.assignment.unassignError")
          : t("wordsets.assignment.assignError"),
      );
    }
  };

  if (userData?.role !== "parent") {
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        {t("wordsets.loading")}...
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        {t("profile.family.noChildren")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {t("wordsets.assignment.assignToChildren")}
      </label>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {children.map((child) => {
          const isAssigned = localAssignedUserIds.includes(child.id);

          return (
            <button
              key={child.id}
              type="button"
              onClick={() => handleToggleAssignment(child.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isAssigned
                  ? "border-nordic-sky bg-nordic-sky/10 hover:bg-nordic-sky/20"
                  : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isAssigned
                      ? "border-nordic-sky bg-nordic-sky"
                      : "border-gray-300 bg-white"
                    }`}
                >
                  {isAssigned && (
                    <HeroCheckIcon className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {child.displayName}
                  </div>
                  <div className="text-xs text-gray-500">{child.email}</div>
                </div>
              </div>

              {isAssigned && (
                <span className="text-xs font-medium text-nordic-midnight bg-nordic-sky/20 px-2 py-1 rounded-full">
                  {pendingMode
                    ? t("wordsets.assignment.willBeAssigned")
                    : t("wordsets.assignment.assigned")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {t("wordsets.assignment.selectChildren")}
      </p>
    </div>
  );
}
