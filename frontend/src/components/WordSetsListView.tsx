import React from "react";
import { WordSet } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HeroBookIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroTrashIcon,
  HeroSettingsIcon,
  HeroPencilIcon,
} from "@/components/Icons";
import { FlagIcon } from "@/components/FlagIcon";
import { getWordSetAudioStats } from "@/lib/audioPlayer";

interface WordSetsListViewProps {
  wordSets: WordSet[];
  playingAudio: string | null;
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
  onOpenSettings: (wordSet: WordSet) => void;
  onOpenEdit: (wordSet: WordSet) => void;
  onOpenDelete: (wordSet: WordSet) => void;
}

export function WordSetsListView({
  wordSets,
  playingAudio,
  onStartTest,
  onStartPractice,
  onWordClick,
  onOpenSettings,
  onOpenEdit,
  onOpenDelete,
}: WordSetsListViewProps) {
  const { t } = useLanguage();

  if (wordSets.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4">
          <HeroBookIcon className="w-16 h-16 mx-auto text-indigo-500" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-600">
          {t("wordsets.noTitle")}
        </h3>
        <p className="text-gray-500">{t("wordsets.noSubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {wordSets.map((wordSet) => (
        <WordSetCard
          key={wordSet.id}
          wordSet={wordSet}
          playingAudio={playingAudio}
          onStartTest={onStartTest}
          onStartPractice={onStartPractice}
          onWordClick={onWordClick}
          onOpenSettings={onOpenSettings}
          onOpenEdit={onOpenEdit}
          onOpenDelete={onOpenDelete}
        />
      ))}
    </div>
  );
}

interface WordSetCardProps {
  wordSet: WordSet;
  playingAudio: string | null;
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
  onOpenSettings: (wordSet: WordSet) => void;
  onOpenEdit: (wordSet: WordSet) => void;
  onOpenDelete: (wordSet: WordSet) => void;
}

function WordSetCard({
  wordSet,
  playingAudio,
  onStartTest,
  onStartPractice,
  onWordClick,
  onOpenSettings,
  onOpenEdit,
  onOpenDelete,
}: WordSetCardProps) {
  const { t } = useLanguage();
  const audioStats = getWordSetAudioStats(wordSet);

  return (
    <div className="flex flex-col p-6 transition-shadow duration-200 bg-white border border-gray-100 rounded-lg shadow-lg hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{wordSet.name}</h3>
        <div className="flex items-center gap-2">
          <FlagIcon
            language={wordSet.language as "no" | "en"}
            className="w-5 h-4"
          />
          <span className="px-2 py-1 text-xs text-blue-800 uppercase bg-blue-100 rounded">
            {wordSet.language}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow">
        <p className="mb-4 text-gray-600">
          {wordSet.words.length}{" "}
          {wordSet.words.length === 1
            ? t("results.word")
            : t("wordsets.words.count")}
          {audioStats.hasAnyAudio && (
            <span className="ml-2 text-sm text-blue-600">
              • {audioStats.wordsWithAudio} {t("wordsets.withAudio")}
            </span>
          )}
          {wordSet.audioProcessing && (
            <span
              className={`ml-2 text-sm ${
                wordSet.audioProcessing === "pending"
                  ? "text-yellow-600"
                  : wordSet.audioProcessing === "completed"
                    ? "text-green-600"
                    : "text-red-600"
              }`}
            >
              •{" "}
              {wordSet.audioProcessing === "pending"
                ? t("wordsets.audioProcessing")
                : wordSet.audioProcessing === "completed"
                  ? t("wordsets.audioReady")
                  : t("wordsets.audioProcessingFailed")}
            </span>
          )}
        </p>

        {/* Word Pills */}
        <div className="flex flex-wrap gap-1 mb-4 overflow-y-auto max-h-20">
          {wordSet.words.slice(0, 10).map((wordItem, index) => {
            const hasAudio = wordItem.audio?.audioUrl;
            const isPlaying = playingAudio === wordItem.word;

            return (
              <span
                key={index}
                onClick={() =>
                  hasAudio ? onWordClick(wordItem.word, wordSet) : undefined
                }
                className={`inline-flex items-center px-2 py-1 text-sm rounded transition-all duration-200 ${
                  hasAudio
                    ? "text-blue-700 bg-blue-100 cursor-pointer hover:bg-blue-200 hover:shadow-sm"
                    : "text-gray-700 bg-gray-100"
                } ${isPlaying ? "ring-2 ring-blue-500 shadow-md" : ""}`}
                title={
                  hasAudio ? t("wordsets.clickToPlay") : t("wordsets.noAudio")
                }
              >
                {hasAudio && (
                  <HeroVolumeIcon
                    className={`w-3 h-3 mr-1 ${
                      isPlaying ? "text-blue-600" : "text-blue-500"
                    }`}
                  />
                )}
                {wordItem.word}
              </span>
            );
          })}
          {wordSet.words.length > 10 && (
            <span className="px-2 py-1 text-sm text-gray-600 bg-gray-200 rounded">
              +{wordSet.words.length - 10} {t("wordsets.moreWords")}
            </span>
          )}
        </div>

        {/* Audio Processing Indicator */}
        {wordSet.audioProcessing === "pending" && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-amber-600">
                {t("wordsets.audioProcessingInProgress")}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 rounded-full bg-amber-500 animate-pulse"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 mt-auto">
        <button
          onClick={() => onStartTest(wordSet)}
          className="flex items-center justify-center flex-1 px-4 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-lg hover:scale-105"
        >
          <HeroPlayIcon className="w-4 h-4 mr-2 text-white" />
          {t("wordsets.startTest")}
        </button>
        <button
          onClick={() => onStartPractice(wordSet)}
          className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-purple-500 rounded-lg shadow-md hover:bg-purple-600 hover:shadow-lg hover:scale-105"
          title={t("wordsets.practice.buttonTooltip")}
        >
          <HeroBookIcon className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => onOpenSettings(wordSet)}
          className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg hover:scale-105"
          title={t("wordsets.settings")}
        >
          <HeroSettingsIcon className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => onOpenEdit(wordSet)}
          className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg hover:scale-105"
          title={t("wordsets.edit")}
        >
          <HeroPencilIcon className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => onOpenDelete(wordSet)}
          className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg hover:scale-105"
          title={t("wordsets.delete")}
        >
          <HeroTrashIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
