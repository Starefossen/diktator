"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { generatedApiClient } from "@/lib/api-generated";
import { HeroCheckIcon } from "@/components/Icons";
import type { ChildAccount } from "@/types";

interface ChildAssignmentSelectorProps {
  wordSetId: string;
  assignedUserIds: string[];
  onAssignmentChange?: (newAssignedUserIds: string[]) => void;
}

export function ChildAssignmentSelector({
  wordSetId,
  assignedUserIds,
  onAssignmentChange,
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
        const childrenData = response.data?.data as ChildAccount[] | undefined;
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

    try {
      setError(null);
      if (isCurrentlyAssigned) {
        // Unassign
        await generatedApiClient.unassignWordSetFromUser(wordSetId, childId);
        const newAssignedIds = localAssignedUserIds.filter(
          (id) => id !== childId,
        );
        setLocalAssignedUserIds(newAssignedIds);
        onAssignmentChange?.(newAssignedIds);
      } else {
        // Assign
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
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                isAssigned
                  ? "border-blue-500 bg-blue-50 hover:bg-blue-100"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isAssigned
                      ? "border-blue-500 bg-blue-500"
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
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  {t("wordsets.assignment.assigned")}
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
