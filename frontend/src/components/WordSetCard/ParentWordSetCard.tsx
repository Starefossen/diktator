import React from "react";
import { WordSet, FamilyProgress } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HeroBookIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroSettingsIcon,
  HeroPencilIcon,
  HeroTrashIcon,
  HeroChartBarIcon,
} from "@/components/Icons";
import { FlagIcon } from "@/components/FlagIcon";
import { getWordSetAudioStats } from "@/lib/audioPlayer";

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
  const audioStats = getWordSetAudioStats(wordSet);

  // Get children's performance for this wordset
  const getChildrenPerformance = () => {
    if (!familyProgress) return [];

    return familyProgress.map(child => {
      // Find the child's latest result for this wordset
      const latestResult = child.recentResults?.find(result => result.wordSetId === wordSet.id);
      return {
        name: child.userName,
        score: latestResult?.score || null,
        attempts: child.recentResults?.filter(r => r.wordSetId === wordSet.id).length || 0,
        lastAttempt: latestResult?.completedAt || null,
      };
    }).filter(child => child.score !== null || child.attempts > 0);
  };

  const childrenPerformance = getChildrenPerformance();

  return (
    <div className="flex flex-col p-6 transition-shadow duration-200 bg-white border border-gray-100 rounded-lg shadow-lg hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <FlagIcon
            language={wordSet.language as "no" | "en"}
            className="w-5 h-4"
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{wordSet.name}</h3>
            <p className="text-sm text-gray-500">
              {wordSet.words.length} {wordSet.words.length === 1 ? t("results.word") : t("wordsets.words.count")}
              • Created: {new Date(wordSet.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs text-blue-800 uppercase bg-blue-100 rounded">
          {wordSet.language}
        </span>
      </div>

      {/* Children's Performance Summary */}
      {childrenPerformance.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Children&apos;s Progress ({childrenPerformance.length})
          </h4>
          <div className="space-y-1">
            {childrenPerformance.slice(0, 3).map((child, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">{child.name}</span>
                <div className="flex items-center gap-2">
                  {child.score && (
                    <span className={`px-2 py-1 rounded-full font-medium ${child.score >= 90 ? "text-green-700 bg-green-100" :
                        child.score >= 70 ? "text-yellow-700 bg-yellow-100" :
                          "text-red-700 bg-red-100"
                      }`}>
                      {child.score}%
                    </span>
                  )}
                  <span className="text-gray-500">
                    {child.attempts} {child.attempts === 1 ? "attempt" : "attempts"}
                  </span>
                  {child.score && child.score >= 90 && <span>⬆️</span>}
                  {child.score && child.score < 70 && <span>📝</span>}
                </div>
              </div>
            ))}
            {childrenPerformance.length > 3 && (
              <p className="text-xs text-gray-500 mt-1">
                +{childrenPerformance.length - 3} more children
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content Info */}
      <div className="flex-grow">
        <div className="flex flex-wrap gap-1 mb-4 overflow-y-auto max-h-16">
          {wordSet.words.slice(0, 8).map((wordItem, index) => {
            const hasAudio = wordItem.audio?.audioUrl;
            const isPlaying = playingAudio === wordItem.word;

            return (
              <span
                key={index}
                onClick={() => hasAudio ? onWordClick(wordItem.word, wordSet) : undefined}
                className={`inline-flex items-center px-2 py-1 text-xs rounded transition-all duration-200 ${hasAudio
                    ? "text-blue-700 bg-blue-100 cursor-pointer hover:bg-blue-200 hover:shadow-sm"
                    : "text-gray-700 bg-gray-100"
                  } ${isPlaying ? "ring-2 ring-blue-500 shadow-md" : ""}`}
              >
                {hasAudio && (
                  <HeroVolumeIcon className="w-3 h-3 mr-1 text-blue-500" />
                )}
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

        {/* Audio Status */}
        {audioStats.hasAnyAudio && (
          <p className="text-xs text-blue-600 mb-2">
            🔊 {audioStats.wordsWithAudio} {t("wordsets.withAudio")}
          </p>
        )}

        {/* Audio Processing Indicator */}
        {wordSet.audioProcessing === "pending" && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-amber-600">
                {t("wordsets.audioProcessingInProgress")}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 rounded-full bg-amber-500 animate-pulse" style={{ width: "100%" }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Parent Focused */}
      <div className="flex flex-wrap gap-2 pt-4 mt-auto">
        <button
          onClick={() => onStartTest(wordSet)}
          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-lg"
        >
          <HeroPlayIcon className="w-4 h-4 mr-1" />
          {t("wordsets.startTest")}
        </button>

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

        <button
          onClick={() => onOpenEdit(wordSet)}
          className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white transition-all duration-200 bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg"
          title={t("wordsets.edit")}
        >
          <HeroPencilIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => onOpenSettings(wordSet)}
          className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white transition-all duration-200 bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg"
          title={t("wordsets.settings")}
        >
          <HeroSettingsIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => onOpenDelete(wordSet)}
          className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white transition-all duration-200 bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg"
          title={t("wordsets.delete")}
        >
          <HeroTrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
