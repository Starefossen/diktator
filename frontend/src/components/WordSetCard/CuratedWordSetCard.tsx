import React from "react";
import { WordSet, TestResult } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HeroBookIcon,
  HeroDumbbellIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroRocketIcon,
  HeroSparklesIcon,
  HeroTrophyIcon,
} from "@/components/Icons";
import { FlagIcon } from "@/components/FlagIcon";
import { hasAudioAvailable } from "@/lib/audioPlayer";
import { Button } from "@/components/Button";

interface CuratedWordSetCardProps {
  wordSet: WordSet;
  playingAudio: string | null;
  userResults?: TestResult[];
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
}

export function CuratedWordSetCard({
  wordSet,
  playingAudio,
  userResults,
  onStartTest,
  onStartPractice,
  onWordClick,
}: CuratedWordSetCardProps) {
  const { t } = useLanguage();

  const latestResult = userResults?.find(
    (result) => result.wordSetId === wordSet.id,
  );

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
    <div className="card-child relative flex flex-col h-full p-5 transition-all duration-300 hover:shadow-2xl hover:border-nordic-sunrise hover:bg-nordic-sunrise/5">
      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-nordic-midnight bg-nordic-sunrise rounded-full shadow-md">
        <HeroSparklesIcon className="w-4 h-4" />
        {t("wordsets.curated.officialBadge")}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <FlagIcon
          language={wordSet.language as "no" | "en"}
          className="w-8 h-8 shrink-0 -ml-2"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-nordic-midnight leading-tight">
            {wordSet.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-base text-gray-600">
              {wordSet.words.length}{" "}
              {wordSet.words.length === 1
                ? t("results.word")
                : t("wordsets.words.count")}
            </span>
            {performance ? (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold rounded-lg ${performance.color}`}
              >
                <performance.icon className="w-4 h-4" />
                {latestResult!.score}%
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold text-nordic-midnight bg-nordic-sunrise/20 rounded-lg">
                <HeroSparklesIcon className="w-4 h-4" />
                {t("wordsets.status.tryIt")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 min-h-12 content-start items-center">
        {wordSet.words.slice(0, 5).map((wordItem, index) => {
          const hasAudio = hasAudioAvailable(wordItem);
          const isPlaying = playingAudio === wordItem.word;

          return hasAudio ? (
            <button
              key={`${wordItem.word}-${index}`}
              onClick={() => onWordClick(wordItem.word, wordSet)}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 text-nordic-midnight bg-nordic-sunrise/15 hover:bg-nordic-sunrise/25 active:scale-95 ${isPlaying ? "ring-2 ring-nordic-sunrise bg-nordic-sunrise/30" : ""}`}
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
        {wordSet.words.length > 5 && (
          <span className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-full">
            +{wordSet.words.length - 5}
          </span>
        )}
      </div>

      <div className="grow"></div>

      <div className="flex gap-3 shrink-0">
        <Button
          variant="primary-child"
          onClick={() => onStartTest(wordSet)}
          className="flex-1"
        >
          <HeroPlayIcon className="w-5 h-5 shrink-0" />
          {latestResult ? t("test.tryAgain") : t("wordsets.go")}
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
