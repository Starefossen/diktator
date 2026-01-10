import React from "react";
import { WordSet, FamilyProgress } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import {
  HeroBookIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroSettingsIcon,
  HeroPencilIcon,
  HeroTrashIcon,
  HeroChartBarIcon,
  HeroCheckIcon,
} from "@/components/Icons";
import { FlagIcon } from "@/components/FlagIcon";
import { hasAudioAvailable } from "@/lib/audioPlayer";

interface ParentWordSetCardProps {
  wordSet: WordSet;
  playingAudio: string | null;
  familyProgress?: FamilyProgress[];
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
  onOpenSettings: (wordSet: WordSet) => void;
  onOpenEdit: (wordSet: WordSet) => void;
  onOpenDelete: (wordSet: WordSet) => void;
  onViewAnalytics?: (wordSet: WordSet) => void;
}

export function ParentWordSetCard({
  wordSet,
  playingAudio,
  familyProgress,
  onStartTest,
  onStartPractice,
  onWordClick,
  onOpenSettings,
  onOpenEdit,
  onOpenDelete,
  onViewAnalytics,
}: ParentWordSetCardProps) {
  const { t } = useLanguage();

  // Get children's performance for this wordset
  const getChildrenPerformance = () => {
    if (!familyProgress) return [];

    return familyProgress
      .map((child) => {
        // Find the child's latest result for this wordset
        const latestResult = child.recentResults?.find(
          (result) => result.wordSetId === wordSet.id,
        );
        return {
          name: child.userName,
          score: latestResult?.score || null,
          attempts:
            child.recentResults?.filter((r) => r.wordSetId === wordSet.id)
              .length || 0,
          lastAttempt: latestResult?.completedAt || null,
        };
      })
      .filter((child) => child.score !== null || child.attempts > 0);
  };

  const childrenPerformance = getChildrenPerformance();

  // Get assignment count
  const assignmentCount = wordSet.assignedUserIds?.length || 0;

  return (
    <div className="flex flex-col p-6 transition-shadow duration-200 bg-white border border-gray-100 rounded-lg shadow-lg hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {wordSet.name}
            </h3>
            <p className="text-base text-gray-600">
              {wordSet.words.length}{" "}
              {wordSet.words.length === 1
                ? t("results.word")
                : t("wordsets.words.count")}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FlagIcon
            language={wordSet.language as "no" | "en"}
            className="w-5 h-4"
          />
          <p className="text-sm text-gray-600">
            {t("wordsets.created")}:{" "}
            {new Date(wordSet.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Assignment Status - Subtle indicator for parents */}
      {assignmentCount > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-3 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-md w-fit">
          <HeroCheckIcon className="w-3.5 h-3.5" />
          {t("wordsets.assignment.assigned")} ({assignmentCount})
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-3 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-md w-fit opacity-70">
          {t("wordsets.assignment.noAssignments")}
        </div>
      )}

      {/* Children's Performance Summary */}
      {childrenPerformance.length > 0 && (
        <div className="p-3 mb-4 rounded-lg bg-gray-50">
          <h4 className="mb-2 text-base font-semibold text-gray-700">
            {t("wordsets.childrenProgress")} ({childrenPerformance.length})
          </h4>
          <div className="space-y-1">
            {childrenPerformance.slice(0, 3).map((child, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium text-gray-600">{child.name}</span>
                <div className="flex items-center gap-2">
                  {child.score && (
                    <span
                      className={`px-2 py-1 rounded-full font-medium ${
                        child.score >= 90
                          ? "text-green-700 bg-green-100"
                          : child.score >= 70
                            ? "text-yellow-700 bg-yellow-100"
                            : "text-red-700 bg-red-100"
                      }`}
                    >
                      {child.score}%
                    </span>
                  )}
                  <span className="text-gray-500">
                    {child.attempts}{" "}
                    {child.attempts === 1
                      ? t("wordsets.attempt")
                      : t("wordsets.attempts")}
                  </span>
                  {child.score && child.score >= 90 && (
                    <HeroCheckIcon className="w-3 h-3 text-green-600" />
                  )}
                  {child.score && child.score < 70 && (
                    <HeroPencilIcon className="w-3 h-3 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
            {childrenPerformance.length > 3 && (
              <p className="mt-1 text-xs text-gray-500">
                +{childrenPerformance.length - 3} {t("wordsets.moreChildren")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content Info */}
      <div className="grow">
        <div className="flex flex-wrap gap-1 mb-4 overflow-y-auto max-h-16">
          {wordSet.words.slice(0, 8).map((wordItem, index) => {
            const hasAudio = hasAudioAvailable(wordItem);
            const hasGeneratedAudio = wordItem.audio?.audioUrl;
            const isPlaying = playingAudio === wordItem.word;

            if (hasAudio) {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onWordClick(wordItem.word, wordSet)}
                  className={`inline-flex items-center px-2 py-1 text-xs rounded transition-all duration-200 text-blue-700 bg-blue-100 cursor-pointer hover:bg-blue-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isPlaying ? "ring-2 ring-blue-500 shadow-md" : ""}`}
                  title={
                    hasGeneratedAudio ? "Generated audio" : "Text-to-speech"
                  }
                  aria-label={`Play pronunciation of ${wordItem.word}`}
                >
                  <HeroVolumeIcon
                    className={`w-3 h-3 mr-1 ${
                      hasGeneratedAudio ? "text-blue-500" : "text-gray-500"
                    }`}
                    aria-hidden="true"
                  />
                  {wordItem.word}
                  {isPlaying && <span className="sr-only"> (Playing)</span>}
                </button>
              );
            }

            return (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs rounded transition-all duration-200 text-gray-700 bg-gray-100"
                title={hasGeneratedAudio ? "Generated audio" : "Text-to-speech"}
              >
                {wordItem.word}
              </span>
            );
          })}
          {wordSet.words.length > 8 && (
            <span className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded">
              +{wordSet.words.length - 8} {t("wordsets.moreWords")}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons - Parent Focused */}
      <div className="flex flex-wrap gap-2 pt-4 mt-auto">
        <div className="inline-flex flex-1 rounded-md shadow-xs">
          <button
            onClick={() => onStartTest(wordSet)}
            className="relative inline-flex items-center justify-center flex-1 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 rounded-l-md bg-linear-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 focus:z-10"
          >
            <HeroPlayIcon className="w-4 h-4 mr-1" />
            {t("wordsets.startTest")}
          </button>
          <Menu as="div" className="relative block -ml-px">
            <MenuButton className="relative inline-flex items-center px-2 py-2 text-white rounded-r-md bg-linear-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 focus:z-10">
              <span className="sr-only">Open options</span>
              <ChevronDownIcon aria-hidden="true" className="w-5 h-5" />
            </MenuButton>
            <MenuItems
              transition
              className="absolute right-0 z-10 w-48 mt-2 -mr-1 transition origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black/5 focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              <div className="py-1">
                <MenuItem>
                  <button
                    onClick={() => onOpenSettings(wordSet)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                  >
                    <HeroSettingsIcon className="w-4 h-4 mr-2" />
                    {t("wordsets.settings")}
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={() => onOpenEdit(wordSet)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                  >
                    <HeroPencilIcon className="w-4 h-4 mr-2" />
                    {t("wordsets.edit")}
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={() => onOpenDelete(wordSet)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 data-focus:bg-red-50 data-focus:text-red-900 data-focus:outline-hidden"
                  >
                    <HeroTrashIcon className="w-4 h-4 mr-2" />
                    {t("wordsets.delete")}
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>

        {onViewAnalytics && (
          <button
            onClick={() => onViewAnalytics(wordSet)}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white transition-all duration-200 bg-indigo-500 rounded-lg shadow-md hover:bg-indigo-600 hover:shadow-lg"
            title="Analytics"
          >
            <HeroChartBarIcon className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onStartPractice(wordSet)}
          className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white transition-all duration-200 bg-purple-500 rounded-lg shadow-md hover:bg-purple-600 hover:shadow-lg"
          title={t("wordsets.practice.buttonTooltip")}
        >
          <HeroBookIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
