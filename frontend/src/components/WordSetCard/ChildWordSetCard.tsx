import React from "react";
import { WordSet, TestResult } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HeroBookIcon,
  HeroDumbbellIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroRocketIcon,
  HeroStarIcon,
  HeroTrophyIcon,
} from "@/components/Icons";
import { FlagIcon } from "@/components/FlagIcon";
import { hasAudioAvailable } from "@/lib/audioPlayer";
import { Button } from "@/components/Button";

interface ChildWordSetCardProps {
  wordSet: WordSet;
  playingAudio: string | null;
  userResults?: TestResult[];
  currentUserId?: string; // Add user ID to check assignments
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
}

export function ChildWordSetCard({
  wordSet,
  playingAudio,
  userResults,
  currentUserId,
  onStartTest,
  onStartPractice,
  onWordClick,
}: ChildWordSetCardProps) {
  const { t } = useLanguage();

  // Check if this wordset is assigned to the current user
  const isAssignedToMe =
    currentUserId && wordSet.assignedUserIds?.includes(currentUserId);

  // Get latest result for this wordset
  const latestResult = userResults?.find(
    (result) => result.wordSetId === wordSet.id,
  );

  // Calculate performance level with nordic palette colors
  const getPerformanceLevel = (score: number) => {
    if (score >= 90)
      return {
        label: t("results.performance.excellent"),
        color: "text-amber-700 bg-nordic-sunrise/20",
        icon: HeroTrophyIcon,
      };
    if (score >= 70)
      return {
        label: t("results.performance.good"),
        color: "text-emerald-700 bg-nordic-meadow/20",
        icon: HeroDumbbellIcon,
      };
    return {
      label: t("results.performance.needsWork"),
      color: "text-orange-700 bg-nordic-cloudberry/20",
      icon: HeroRocketIcon,
    };
  };

  const performance = latestResult
    ? getPerformanceLevel(latestResult.score)
    : null;

  return (
    <div className="card-child relative flex flex-col h-full p-5 transition-all duration-300 hover:shadow-2xl hover:border-nordic-sky hover:bg-nordic-sky/5">
      {/* Assignment Badge - Top Right Corner */}
      {isAssignedToMe && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-white bg-nordic-sky rounded-full shadow-md">
          <HeroStarIcon className="w-4 h-4" />
          {t("wordsets.assignment.forYou")}
        </div>
      )}

      {/* Header - Big friendly name */}
      <div className="flex items-start gap-3 mb-3">
        <FlagIcon
          language={wordSet.language as "no" | "en"}
          className="w-8 h-8 shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-nordic-midnight leading-tight">
            {wordSet.name}
          </h3>
          <p className="text-base text-gray-600 mt-0.5">
            {wordSet.words.length}{" "}
            {wordSet.words.length === 1
              ? t("results.word")
              : t("wordsets.words.count")}
          </p>
        </div>
      </div>

      {/* Simple status - encouraging language */}
      <div className="mb-4">
        {performance ? (
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 text-base font-bold rounded-xl ${performance.color}`}
          >
            <performance.icon className="w-5 h-5" />
            {latestResult!.score}%
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-2 text-base font-bold text-nordic-midnight bg-nordic-sky/20 rounded-xl">
            <HeroStarIcon className="w-5 h-5" />
            {t("wordsets.status.tryIt")}
          </div>
        )}
      </div>

      {/* Word Preview - Simple, clean pills */}
      <div className="flex flex-wrap gap-2 mb-4 min-h-12 content-start">
        {wordSet.words.slice(0, 6).map((wordItem, index) => {
          const hasAudio = hasAudioAvailable(wordItem);
          const isPlaying = playingAudio === wordItem.word;

          return hasAudio ? (
            <button
              key={`${wordItem.word}-${index}`}
              onClick={() => onWordClick(wordItem.word, wordSet)}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 text-nordic-midnight bg-nordic-sky/15 hover:bg-nordic-sky/25 active:scale-95 ${isPlaying ? "ring-2 ring-nordic-sky bg-nordic-sky/30" : ""}`}
              aria-label={`${t("aria.playAudio")} ${wordItem.word}`}
              type="button"
            >
              <HeroVolumeIcon className="shrink-0 w-4 h-4 mr-1.5" />
              <span>{wordItem.word}</span>
            </button>
          ) : (
            <span
              key={`${wordItem.word}-${index}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full"
            >
              <span>{wordItem.word}</span>
            </span>
          );
        })}
        {wordSet.words.length > 6 && (
          <span className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-full">
            +{wordSet.words.length - 6}
          </span>
        )}
      </div>

      {/* Spacer to push content to bottom */}
      <div className="grow"></div>

      {/* Action Buttons - Big and friendly */}
      <div className="flex gap-3 shrink-0">
        <Button
          variant="primary-child"
          onClick={() => onStartTest(wordSet)}
          className="flex-1 text-lg"
        >
          <HeroPlayIcon className="w-5 h-5 mr-2 shrink-0" />
          <span>{latestResult ? t("test.tryAgain") : t("wordsets.go")}</span>
        </Button>

        <Button
          variant="secondary-child"
          onClick={() => onStartPractice(wordSet)}
          aria-label={t("wordsets.practice.buttonTooltip")}
          className="px-4"
        >
          <HeroBookIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
