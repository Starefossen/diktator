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
import { IconButton } from "@/components/IconButton";

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

  // Get children's performance for this wordset (filter out parents)
  const getChildrenPerformance = () => {
    if (!familyProgress) return [];

    return familyProgress
      .filter((member) => member.role === "child")
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
    <div className="card-parent flex flex-col p-4 transition-shadow duration-200 hover:shadow-xl">
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {wordSet.name}
          </h3>
          <FlagIcon
            language={wordSet.language as "no" | "en"}
            className="w-4 h-3"
          />
        </div>
        <p className="text-xs text-gray-500">
          {new Date(wordSet.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Word count and assignment inline */}
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
        <span>
          {wordSet.words.length}{" "}
          {wordSet.words.length === 1
            ? t("results.word")
            : t("wordsets.words.count")}
        </span>
        <span className="text-gray-300">•</span>
        {assignmentCount > 0 ? (
          <span className="flex items-center gap-1 text-gray-700">
            <HeroCheckIcon className="w-3 h-3" />
            {t("wordsets.assignment.assigned")} ({assignmentCount})
          </span>
        ) : (
          <span className="text-gray-400">
            {t("wordsets.assignment.noAssignments")}
          </span>
        )}
      </div>

      {/* Children's Progress - Compact */}
      {childrenPerformance.length > 0 && (
        <div className="p-2 mb-3 rounded-lg bg-gray-50">
          <div className="space-y-1">
            {childrenPerformance.slice(0, 3).map((child, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium text-gray-600">{child.name}</span>
                <div className="flex items-center gap-1.5">
                  {child.score && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${child.score >= 90
                          ? "text-amber-700 bg-nordic-sunrise/20"
                          : child.score >= 70
                            ? "text-emerald-700 bg-nordic-meadow/20"
                            : "text-orange-700 bg-nordic-cloudberry/20"
                        }`}
                    >
                      {child.score}%
                    </span>
                  )}
                  <span className="text-gray-400">{child.attempts}×</span>
                </div>
              </div>
            ))}
            {childrenPerformance.length > 3 && (
              <p className="text-xs text-gray-400">
                +{childrenPerformance.length - 3}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Word Pills - Compact */}
      <div className="grow">
        <div className="flex flex-wrap gap-1 mb-3">
          {wordSet.words.slice(0, 6).map((wordItem, index) => {
            const hasAudio = hasAudioAvailable(wordItem);
            const hasGeneratedAudio = wordItem.audio?.audioUrl;
            const isPlaying = playingAudio === wordItem.word;

            if (hasAudio) {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onWordClick(wordItem.word, wordSet)}
                  className={`inline-flex items-center px-2 py-1 text-xs rounded transition-all duration-200 text-nordic-midnight bg-nordic-sky/20 cursor-pointer hover:bg-nordic-sky/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-nordic-sky ${isPlaying ? "ring-2 ring-nordic-sky shadow-md" : ""}`}
                  title={
                    hasGeneratedAudio ? "Generated audio" : "Text-to-speech"
                  }
                  aria-label={`Play pronunciation of ${wordItem.word}`}
                >
                  <HeroVolumeIcon
                    className={`w-3 h-3 mr-1 ${hasGeneratedAudio ? "text-nordic-sky" : "text-gray-500"
                      }`}
                    aria-hidden="true"
                  />
                  {wordItem.word}
                  {isPlaying && (
                    <span className="sr-only"> ({t("aria.playing")})</span>
                  )}
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
          {wordSet.words.length > 6 && (
            <span className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded">
              +{wordSet.words.length - 6}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-stretch gap-2 pt-3 mt-auto">
        <div className="inline-flex flex-1 rounded-xl shadow-xs">
          <button
            onClick={() => onStartTest(wordSet)}
            className="relative inline-flex items-center justify-center flex-1 px-3 min-h-10 text-sm font-semibold text-nordic-midnight transition-all duration-200 rounded-l-xl bg-linear-to-r from-nordic-meadow to-nordic-sky hover:from-nordic-meadow/90 hover:to-nordic-sky/90 focus:z-10"
          >
            <HeroPlayIcon className="w-4 h-4 mr-1" />
            {t("wordsets.startTest")}
          </button>
          <Menu as="div" className="relative block -ml-px">
            <MenuButton className="relative inline-flex items-center h-full px-2 text-nordic-midnight rounded-r-xl bg-linear-to-r from-nordic-meadow to-nordic-sky hover:from-nordic-meadow/90 hover:to-nordic-sky/90 focus:z-10">
              <span className="sr-only">{t("aria.openOptions")}</span>
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
          <IconButton
            variant="primary"
            onClick={() => onViewAnalytics(wordSet)}
            aria-label={t("aria.analytics")}
          >
            <HeroChartBarIcon className="w-4 h-4" />
          </IconButton>
        )}

        <IconButton
          variant="primary"
          onClick={() => onStartPractice(wordSet)}
          aria-label={t("wordsets.practice.buttonTooltip")}
          className="bg-nordic-cloudberry hover:bg-nordic-cloudberry/90"
        >
          <HeroBookIcon className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
}
