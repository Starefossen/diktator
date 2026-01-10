import React from "react";
import { WordSet } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  requiresUserInteractionForAudio,
  hasAudioAvailable,
} from "@/lib/audioPlayer";
import {
  HeroVolumeIcon,
  HeroDevicePhoneMobileIcon,
  HeroEyeIcon,
  HeroPlayIcon,
  HeroXMarkIcon,
} from "@/components/Icons";

interface PracticeViewProps {
  practiceMode: WordSet;
  practiceWords: string[];
  currentPracticeIndex: number;
  showPracticeWord: boolean;
  isAudioPlaying: boolean;
  onSetCurrentIndex: (index: number) => void;
  onSetShowWord: (show: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  onPlayAudio: () => void;
  onShuffle: () => void;
  onStartTest: (wordSet: WordSet) => void;
  onExit: () => void;
}

export function PracticeView({
  practiceMode,
  practiceWords,
  currentPracticeIndex,
  showPracticeWord,
  isAudioPlaying,
  onSetCurrentIndex,
  onSetShowWord,
  onNext,
  onPrevious,
  onPlayAudio,
  onShuffle,
  onStartTest,
  onExit,
}: PracticeViewProps) {
  const { t } = useLanguage();

  const currentWord = practiceWords[currentPracticeIndex];
  const wordItem = practiceMode.words.find((w) => w.word === currentWord);
  const hasAudio = hasAudioAvailable(wordItem);
  const hasGeneratedAudio = wordItem?.audio?.audioUrl;

  return (
    <div className="min-h-screen bg-nordic-birch">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {t("wordsets.practice.title")} - {practiceMode.name}
          </h1>
          <p className="text-gray-600">
            {t("test.progress")} {currentPracticeIndex + 1} {t("common.of")}{" "}
            {practiceWords.length}
          </p>
          <div className="w-full h-2 mt-4 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all duration-300 rounded-full bg-linear-to-r from-nordic-teal to-nordic-cloudberry"
              style={{
                width: `${((currentPracticeIndex + 1) / practiceWords.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Auto-play Notice for Safari/iOS */}
        {requiresUserInteractionForAudio() && (
          <div className="max-w-2xl mx-auto mb-4">
            <div className="p-3 text-sm border rounded-lg text-amber-700 bg-amber-50 border-amber-200">
              <div className="flex items-center">
                <HeroDevicePhoneMobileIcon className="w-5 h-5 mr-2 text-amber-600" />
                <span>{t("wordsets.practice.autoplayNotice")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Practice Card */}
        <div className="max-w-2xl mx-auto">
          <div className="p-8 text-center bg-white rounded-lg shadow-xl">
            {/* Audio Button */}
            <div className="mb-8">
              <div className="relative inline-block">
                {isAudioPlaying && (
                  <div className="absolute border-4 border-transparent rounded-full -inset-3 border-t-nordic-teal border-r-nordic-teal/80 animate-spin"></div>
                )}
                <button
                  onClick={onPlayAudio}
                  disabled={!hasAudio}
                  className={`relative p-6 text-6xl transition-all duration-200 transform rounded-full shadow-lg ${hasAudio
                      ? "text-nordic-midnight bg-linear-to-r from-nordic-teal to-nordic-cloudberry hover:from-nordic-teal/90 hover:to-nordic-cloudberry/90 hover:shadow-xl hover:scale-105"
                      : "text-gray-400 bg-gray-200 cursor-not-allowed"
                    }`}
                  title={
                    hasAudio ? t("wordsets.clickToPlay") : t("wordsets.noAudio")
                  }
                >
                  <HeroVolumeIcon className="w-16 h-16" />
                </button>
              </div>
              <p className="mt-4 text-gray-600">
                {hasAudio ? (
                  requiresUserInteractionForAudio() ? (
                    t("wordsets.practice.clickToHear")
                  ) : (
                    <span className="flex items-center justify-center">
                      <HeroVolumeIcon className="w-4 h-4 mr-1 text-gray-600" />
                      {t("wordsets.practice.autoPlayingReplay")}
                    </span>
                  )
                ) : (
                  t("wordsets.noAudio")
                )}
                {hasAudio && !hasGeneratedAudio && (
                  <span className="block mt-1 text-xs text-gray-500">
                    {t("wordsets.usingTextToSpeech")}
                  </span>
                )}
              </p>
            </div>

            {/* Word Display */}
            <div className="mb-8">
              <div className="duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
                <button
                  onClick={() => onSetShowWord(!showPracticeWord)}
                  className={`transition-all duration-500 cursor-pointer focus:outline-none focus:ring-4 focus:ring-nordic-teal/30 rounded-lg p-4 ${showPracticeWord ? "" : "hover:scale-105 hover:shadow-lg"
                    }`}
                  title={
                    showPracticeWord
                      ? t("wordsets.practice.clickToBlur")
                      : t("wordsets.practice.clickToReveal")
                  }
                >
                  <h2
                    className={`text-6xl font-bold text-gray-800 mb-4 transition-all duration-500 select-none ${showPracticeWord ? "filter-none" : "filter blur-xl"
                      }`}
                    style={{
                      textShadow: showPracticeWord
                        ? "none"
                        : "0 0 30px rgba(0,0,0,0.3)",
                      letterSpacing: showPracticeWord ? "normal" : "0.1em",
                    }}
                  >
                    {currentWord}
                  </h2>
                </button>
                <p className="mt-2 text-sm text-gray-500">
                  {showPracticeWord ? (
                    <span className="flex items-center justify-center">
                      <HeroEyeIcon className="w-4 h-4 mr-1 text-gray-500" />
                      {t("wordsets.practice.wordRevealed")}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <HeroEyeIcon className="w-4 h-4 mr-1 text-gray-500" />
                      {t("wordsets.practice.clickToRevealHint")}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={onPrevious}
                disabled={currentPracticeIndex === 0}
                className="flex items-center px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {t("wordsets.practice.previous")}
              </button>
              <button
                onClick={onShuffle}
                className="flex items-center px-4 py-2 font-medium text-nordic-midnight transition-colors bg-nordic-sky rounded-lg hover:bg-nordic-sky/90"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t("wordsets.practice.shuffle")}
              </button>
              <button
                onClick={onNext}
                disabled={currentPracticeIndex === practiceWords.length - 1}
                className="flex items-center px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("wordsets.practice.next")}
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button
                onClick={() => onStartTest(practiceMode)}
                className="flex items-center px-6 py-3 font-semibold text-nordic-midnight transition-all duration-200 rounded-lg shadow-lg bg-linear-to-r from-nordic-meadow to-nordic-sky hover:from-nordic-meadow/90 hover:to-nordic-sky/90 hover:shadow-xl hover:scale-105"
              >
                <HeroPlayIcon className="w-5 h-5 mr-2" />
                {t("wordsets.startTest")}
              </button>

              <button
                onClick={onExit}
                className="flex items-center px-6 py-3 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                <HeroXMarkIcon className="w-5 h-5 mr-2" />
                {t("wordsets.cancel")}
              </button>
            </div>
          </div>

          {/* Word List Preview */}
          <div className="p-4 mt-6 bg-white rounded-lg shadow">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              {t("wordsets.practice.wordList")} ({practiceWords.length}{" "}
              {t("wordsets.words.count")})
            </h3>
            <div className="flex flex-wrap gap-2">
              {practiceWords.map((word, index) => (
                <button
                  key={index}
                  onClick={() => onSetCurrentIndex(index)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${index === currentPracticeIndex
                      ? "bg-nordic-cloudberry text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
