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
import { isSentence } from "@/lib/sentenceConfig";
import { useButtonVariant } from "@/hooks/useButtonVariant";

interface CuratedWordSetCardProps {
  wordSet: WordSet;
  playingAudio: string | null;
  userResults?: TestResult[];
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
  compact?: boolean;
}

export function CuratedWordSetCard({
  wordSet,
  playingAudio,
  userResults,
  onStartTest,
  onStartPractice,
  onWordClick,
  compact = false,
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

  const buttonText = useButtonVariant(wordSet.id, !!latestResult);

  // Check if this is a sentence dictation set
  // Can be determined by: explicit sentences array, OR words containing multi-word content
  const hasSentencesArray = wordSet.sentences && wordSet.sentences.length > 0;
  const wordsAreSentences =
    wordSet.words.length > 0 && wordSet.words.some((w) => isSentence(w.word));
  const isSentenceSet = hasSentencesArray || wordsAreSentences;

  // Get difficulty styling
  const getDifficultyStyle = (difficulty: string | undefined) => {
    switch (difficulty) {
      case "beginner":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          label: t("mastery.difficulty.beginner"),
        };
      case "intermediate":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          label: t("mastery.difficulty.intermediate"),
        };
      case "advanced":
        return {
          bg: "bg-rose-100",
          text: "text-rose-700",
          label: t("mastery.difficulty.advanced"),
        };
      default:
        return null;
    }
  };

  const difficultyStyle = getDifficultyStyle(wordSet.difficulty);

  return (
    <div
      className={`card-child relative flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:border-nordic-sunrise hover:bg-nordic-sunrise/5 ${compact ? "p-4" : "p-5"}`}
    >
      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-nordic-midnight bg-nordic-sunrise rounded-full shadow-md">
        <HeroSparklesIcon className="w-4 h-4" />
        {t("wordsets.curated.officialBadge")}
      </div>

      <div className={`flex items-center gap-3 ${compact ? "mb-2" : "mb-4"}`}>
        {!compact && (
          <FlagIcon
            language={wordSet.language as "no" | "en"}
            className="w-8 h-8 shrink-0 -ml-2"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3
            className={`${compact ? "text-lg" : "text-xl"} font-bold text-nordic-midnight leading-tight`}
          >
            {wordSet.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-base text-gray-600">
              {isSentenceSet
                ? hasSentencesArray
                  ? `${wordSet.sentences!.length} ${wordSet.sentences!.length === 1 ? t("wordsets.sentence") : t("wordsets.sentences")}`
                  : `${wordSet.words.length} ${wordSet.words.length === 1 ? t("wordsets.sentence") : t("wordsets.sentences")}`
                : `${wordSet.words.length} ${wordSet.words.length === 1 ? t("results.word") : t("wordsets.words.count")}`}
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
          {/* Difficulty and grade level badges - hide in compact if space needed, but usually good to keep */}
          {!compact && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {difficultyStyle && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${difficultyStyle.bg} ${difficultyStyle.text}`}
                >
                  {difficultyStyle.label}
                </span>
              )}
              {wordSet.targetGrade && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  {wordSet.targetGrade}. {t("wordsets.grade")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col gap-2 mb-4 min-h-12">
          {wordSet.description && (
            <p className="text-base text-gray-600 italic">
              {wordSet.description}
            </p>
          )}
          {/* Only show word/sentence pills when there is no description */}
          {!wordSet.description && (
            <div className="flex flex-col gap-2">
              {wordSet.words.slice(0, 5).map((wordItem, index) => {
                const hasAudio = hasAudioAvailable(wordItem);
                const isPlaying = playingAudio === wordItem.word;
                const isItemSentence = isSentence(wordItem.word);

                return hasAudio ? (
                  <button
                    key={`${wordItem.word}-${index}`}
                    onClick={() => onWordClick(wordItem.word, wordSet)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 text-nordic-midnight ${isItemSentence ? "rounded-2xl text-left bg-nordic-sunrise/10 hover:bg-nordic-sunrise/20" : "rounded-full bg-nordic-sunrise/15 hover:bg-nordic-sunrise/25"} active:scale-95 ${isPlaying ? "ring-2 ring-nordic-sunrise bg-nordic-sunrise/30" : ""}`}
                    aria-label={`${t("aria.playAudio")} ${wordItem.word}`}
                    type="button"
                  >
                    <HeroVolumeIcon className="shrink-0 w-4 h-4 mr-1.5" />
                    <span className={isItemSentence ? "italic" : ""}>
                      {wordItem.word}
                    </span>
                  </button>
                ) : (
                  <span
                    key={`${wordItem.word}-${index}`}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 ${isItemSentence ? "rounded-2xl" : "rounded-full"}`}
                  >
                    <span className={isItemSentence ? "italic" : ""}>
                      {wordItem.word}
                    </span>
                  </span>
                );
              })}
              {wordSet.words.length > 5 && (
                <span className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-full self-start">
                  +{wordSet.words.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grow"></div>

      <div className={`flex gap-3 shrink-0 ${compact ? "mt-2" : ""}`}>
        <Button
          variant="primary-child"
          onClick={() => onStartTest(wordSet)}
          className={`flex-1 ${compact ? "px-3 py-2 min-h-10 min-w-0 text-sm" : ""}`}
        >
          <HeroPlayIcon
            className={`shrink-0 ${compact ? "w-4 h-4" : "w-5 h-5"}`}
          />
          {buttonText}
        </Button>

        {!compact && (
          <Button
            variant="secondary-child"
            onClick={() => onStartPractice(wordSet)}
            aria-label={t("wordsets.practice.buttonTooltip")}
            className="px-4"
          >
            <HeroBookIcon className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
