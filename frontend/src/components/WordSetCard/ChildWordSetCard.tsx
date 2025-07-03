import React from "react";
import { WordSet, TestResult } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HeroBookIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroRocketIcon,
  HeroTargetIcon,
  HeroStarIcon,
} from "@/components/Icons";
import { FlagIcon } from "@/components/FlagIcon";

interface ChildWordSetCardProps {
  wordSet: WordSet;
  playingAudio: string | null;
  userResults?: TestResult[];
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
}

export function ChildWordSetCard({
  wordSet,
  playingAudio,
  userResults,
  onStartTest,
  onStartPractice,
  onWordClick,
}: ChildWordSetCardProps) {
  const { t } = useLanguage();

  // Get latest result for this wordset
  const latestResult = userResults?.find(result => result.wordSetId === wordSet.id);

  // Calculate performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return {
      label: t("results.performance.excellent"),
      color: "text-green-700 bg-green-100 border-green-200",
      emoji: "⭐",
      icon: HeroStarIcon
    };
    if (score >= 70) return {
      label: t("results.performance.good"),
      color: "text-yellow-700 bg-yellow-100 border-yellow-200",
      emoji: "👍",
      icon: HeroTargetIcon
    };
    return {
      label: t("results.performance.needsWork"),
      color: "text-orange-700 bg-orange-100 border-orange-200",
      emoji: "🎯",
      icon: HeroRocketIcon
    };
  };

  const performance = latestResult ? getPerformanceLevel(latestResult.score) : null;

  // Determine which words need practice (prioritize words with lowest scores)
  const needsPracticeWords = latestResult && latestResult.score < 90
    ? wordSet.words
      .slice(0, Math.ceil(wordSet.words.length * (100 - latestResult.score) / 100))
    : [];

  // Sort words to show practice words first, then regular words (stable sort)
  const sortedWords = [...wordSet.words].sort((a, b) => {
    const aNeedsPractice = needsPracticeWords.some(w => w.word === a.word);
    const bNeedsPractice = needsPracticeWords.some(w => w.word === b.word);
    if (aNeedsPractice && !bNeedsPractice) return -1;
    if (!aNeedsPractice && bNeedsPractice) return 1;
    return 0;
  });

  // Calculate relative time for last active
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return "1 week ago";
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 60) return "1 month ago";
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className="relative flex flex-col p-6 transition-all duration-300 bg-white border-2 border-gray-100 shadow-lg rounded-xl hover:shadow-2xl hover:border-blue-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50">
      {/* Header with Flag and Name */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <FlagIcon
            language={wordSet.language as "no" | "en"}
            className="w-7 h-7"
          />
          <h3 className="text-xl font-bold text-gray-800">{wordSet.name}</h3>
        </div>
        {performance ? (
          <div className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl border ${performance.color}`}>
            <performance.icon className="w-5 h-5" />
            {latestResult!.score}%
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-blue-800 bg-blue-100 border border-blue-200 top-3 right-3 rounded-xl">
            <HeroStarIcon className="w-5 h-5" />
            New!
          </div>
        )}
      </div>

      {/* Word Count and Status */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-base font-medium text-gray-700">
          {wordSet.words.length} {wordSet.words.length === 1 ? t("results.word") : t("wordsets.words.count")}
        </p>
        <p className="text-sm text-gray-500">
          {latestResult ? (
            <>
              {getRelativeTime(new Date(latestResult.completedAt))}
            </>
          ) : (
            <>Never taken</>
          )}
        </p>
      </div>

      {/* Word Preview Pills - Highlight words that need practice */}
      <div className="flex flex-wrap gap-2 mb-auto">
        {sortedWords.slice(0, 8).map((wordItem, index) => {
          const hasAudio = wordItem.audio?.audioUrl;
          const isPlaying = playingAudio === wordItem.word;
          const needsPractice = needsPracticeWords.some(w => w.word === wordItem.word);

          return (
            <span
              key={index}
              onClick={() => hasAudio ? onWordClick(wordItem.word, wordSet) : undefined}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${needsPractice
                ? "text-orange-800 bg-orange-100 border-2 border-orange-300 cursor-pointer hover:bg-orange-200 animate-pulse"
                : hasAudio
                  ? "text-blue-800 bg-blue-100 border border-blue-200 cursor-pointer hover:bg-blue-200 hover:border-blue-300"
                  : "text-gray-600 bg-gray-100 border border-gray-200"
                } ${isPlaying ? "ring-4 ring-blue-400 ring-opacity-50" : ""}`}
            >
              {hasAudio && (
                <HeroVolumeIcon className="w-4 h-4 mr-2" />
              )}
              {needsPractice && (
                <HeroTargetIcon className="w-4 h-4 mr-2 text-orange-600" />
              )}
              {wordItem.word}
            </span>
          );
        })}
        {wordSet.words.length > 8 && (
          <span className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-xl">
            +{wordSet.words.length - 8} {t("wordsets.moreWords")}
          </span>
        )}
      </div>

      {/* Performance Insight - Simplified - Aligned to bottom */}
      {performance && (
        <div className={`p-4 mb-5 rounded-xl border-2 ${performance.color}`}>
          <div className="flex items-center gap-3">
            <performance.icon className="w-5 h-5" />
            <p className="text-base font-bold">
              {performance.label}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons - Child Focused */}
      <div className="flex gap-3">
        <button
          onClick={() => onStartTest(wordSet)}
          className="flex items-center justify-center flex-1 px-6 py-4 text-lg font-bold text-white transition-all duration-300 rounded-xl shadow-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:translate-y-[-2px]"
        >
          <HeroPlayIcon className="w-5 h-5 mr-3" />
          {latestResult ? t("test.retakeTest") : t("wordsets.startTest")}
        </button>

        <button
          onClick={() => onStartPractice(wordSet)}
          className="flex items-center justify-center px-6 py-4 text-lg font-bold text-white transition-all duration-300 bg-purple-500 rounded-xl shadow-lg hover:bg-purple-600 hover:shadow-xl hover:translate-y-[-2px]"
          title={t("wordsets.practice.buttonTooltip")}
        >
          <HeroBookIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
