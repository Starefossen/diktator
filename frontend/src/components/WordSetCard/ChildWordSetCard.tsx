import React from "react";
import { WordSet, TestResult } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HeroBookIcon,
  HeroDumbbellIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroRocketIcon,
  HeroTargetIcon,
  HeroStarIcon,
  HeroTrophyIcon,
  HeroCheckIcon,
} from "@/components/Icons";
import { FlagIcon } from "@/components/FlagIcon";
import { hasAudioAvailable } from "@/lib/audioPlayer";

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
        color: "text-amber-700 bg-nordic-sunrise/20 border-nordic-sunrise/40",
        icon: HeroTrophyIcon,
      };
    if (score >= 70)
      return {
        label: t("results.performance.good"),
        color: "text-emerald-700 bg-nordic-meadow/20 border-nordic-meadow/40",
        icon: HeroDumbbellIcon,
      };
    return {
      label: t("results.performance.needsWork"),
      color:
        "text-orange-700 bg-nordic-cloudberry/20 border-nordic-cloudberry/40",
      icon: HeroRocketIcon,
    };
  };

  const performance = latestResult
    ? getPerformanceLevel(latestResult.score)
    : null;

  // Determine which words need practice (prioritize words with lowest scores)
  const needsPracticeWords =
    latestResult && latestResult.score < 90
      ? wordSet.words.slice(
          0,
          Math.ceil((wordSet.words.length * (100 - latestResult.score)) / 100),
        )
      : [];

  // Sort words to show practice words first, then regular words (stable sort)
  const sortedWords = [...wordSet.words].sort((a, b) => {
    const aNeedsPractice = needsPracticeWords.some((w) => w.word === a.word);
    const bNeedsPractice = needsPracticeWords.some((w) => w.word === b.word);
    if (aNeedsPractice && !bNeedsPractice) return -1;
    if (!aNeedsPractice && bNeedsPractice) return 1;
    return 0;
  });

  // Calculate relative time for last active
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t("wordsets.time.today");
    if (diffInDays === 1) return t("wordsets.time.dayAgo");
    if (diffInDays < 7) return `${diffInDays} ${t("wordsets.time.daysAgo")}`;
    if (diffInDays < 14) return t("wordsets.time.weekAgo");
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1
        ? t("wordsets.time.weekAgo")
        : `${weeks} ${t("wordsets.time.weeksAgo")}`;
    }
    if (diffInDays < 60) return t("wordsets.time.monthAgo");
    const months = Math.floor(diffInDays / 30);
    return `${months} ${t("wordsets.time.monthsAgo")}`;
  };

  return (
    <div className="relative flex flex-col h-full p-4 transition-all duration-300 bg-white border-gray-100 shadow-lg borderounded-xl hover:shadow-2xl hover:border-nordic-sky hover:bg-nordic-sky/5">
      {/* Assignment Badge - Top Right Corner */}
      {isAssignedToMe && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold text-nordic-midnight bg-nordic-sky/20 border border-nordic-sky/40 rounded-md shadow-sm">
          <HeroCheckIcon className="w-3.5 h-3.5" />
          {t("wordsets.assignment.assignedToMe")}
        </div>
      )}

      {/* Header with Flag and Name */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1 min-w-0 gap-2">
          <FlagIcon
            language={wordSet.language as "no" | "en"}
            className="w-6 h-6 shrink-0"
          />
          <h3 className="text-lg font-bold text-gray-800 truncate">
            {wordSet.name}
          </h3>
        </div>
        {performance ? (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-bold rounded-lg border shrink-0 ${performance.color}`}
          >
            <performance.icon className="w-4 h-4" />
            {latestResult!.score}%
          </div>
        ) : (
          <div className="flex items-center shrink-0 gap-1.5 px-2.5 py-1.5 text-sm font-bold text-nordic-midnight bg-nordic-sky/20 border border-nordic-sky/40 rounded-lg">
            <HeroStarIcon className="w-4 h-4" />
            {t("wordsets.status.new")}
          </div>
        )}
      </div>

      {/* Word Count and Status */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-gray-700">
          {wordSet.words.length}{" "}
          {wordSet.words.length === 1
            ? t("results.word")
            : t("wordsets.words.count")}
        </p>
        <p className="text-sm text-gray-600">
          {latestResult ? (
            <>{getRelativeTime(new Date(latestResult.completedAt))}</>
          ) : (
            <>{t("wordsets.status.neverTaken")}</>
          )}
        </p>
      </div>

      {/* Word Preview Pills - Highlight words that need practice */}
      <div className="flex flex-wrap gap-1.5 mb-4 min-h-16 content-start">
        {sortedWords.slice(0, 8).map((wordItem, index) => {
          const hasAudio = hasAudioAvailable(wordItem);
          const isPlaying = playingAudio === wordItem.word;
          const needsPractice = needsPracticeWords.some(
            (w) => w.word === wordItem.word,
          );

          return hasAudio ? (
            <button
              key={`${wordItem.word}-${index}`}
              onClick={() => onWordClick(wordItem.word, wordSet)}
              className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                needsPractice
                  ? "text-orange-800 bg-nordic-cloudberry/20 border border-nordic-cloudberry/40 cursor-pointer hover:bg-nordic-cloudberry/30 animate-pulse"
                  : "text-nordic-midnight bg-nordic-sky/20 border border-nordic-sky/40 cursor-pointer hover:bg-nordic-sky/30 hover:border-nordic-sky/50"
              } ${isPlaying ? "ring-4 ring-nordic-sky ring-opacity-50" : ""}`}
              aria-label={`Play pronunciation of ${wordItem.word}`}
              type="button"
            >
              <HeroVolumeIcon className="shrink-0 w-3 h-3 mr-1.5" />
              {needsPractice && (
                <HeroTargetIcon className="shrink-0 w-3 h-3 mr-1.5 text-nordic-cloudberry" />
              )}
              <span className="truncate">{wordItem.word}</span>
            </button>
          ) : (
            <span
              key={`${wordItem.word}-${index}`}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg"
            >
              {needsPractice && (
                <HeroTargetIcon className="shrink-0 w-3 h-3 mr-1.5 text-orange-600" />
              )}
              <span className="truncate">{wordItem.word}</span>
            </span>
          );
        })}
        {wordSet.words.length > 8 && (
          <span className="px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-lg">
            +{wordSet.words.length - 8} {t("wordsets.moreWords")}
          </span>
        )}
      </div>

      {/* Spacer to push content to bottom */}
      <div className="grow"></div>

      {/* Action Buttons - Child Focused */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onStartTest(wordSet)}
          className="flex items-center justify-center flex-1 px-4 py-3 text-base font-bold text-nordic-midnight transition-all duration-300 rounded-lg shadow-lg bg-linear-to-r from-nordic-meadow to-nordic-sky hover:from-nordic-meadow/90 hover:to-nordic-sky/90 hover:shadow-xl hover:-translate-y-0.5 min-h-12.5"
        >
          <HeroPlayIcon className="w-4 h-4 mr-2 shrink-0" />
          <span className="truncate">
            {latestResult ? t("test.retakeTest") : t("wordsets.startTest")}
          </span>
        </button>

        <button
          onClick={() => onStartPractice(wordSet)}
          className="flex items-center justify-center px-4 py-3 text-base font-bold text-white transition-all duration-300 bg-nordic-cloudberry rounded-lg shadow-lg hover:bg-nordic-cloudberry/90 hover:shadow-xl hover:-translate-y-0.5 min-h-12.5 min-w-12.5"
          title={t("wordsets.practice.buttonTooltip")}
          aria-label={t("wordsets.practice.buttonTooltip")}
        >
          <HeroBookIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
