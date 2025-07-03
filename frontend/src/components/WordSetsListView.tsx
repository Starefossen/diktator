import React from "react";
import { WordSet, TestResult, FamilyProgress } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { HeroBookIcon } from "@/components/Icons";
import { WordSetCard } from "@/components/WordSetCard";

interface WordSetsListViewProps {
  wordSets: WordSet[];
  playingAudio: string | null;
  userResults?: TestResult[]; // User's test results for personalization
  familyProgress?: FamilyProgress[]; // For parents - children's progress
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
  onOpenSettings: (wordSet: WordSet) => void;
  onOpenEdit: (wordSet: WordSet) => void;
  onOpenDelete: (wordSet: WordSet) => void;
  onViewAnalytics?: (wordSet: WordSet) => void; // For parents
}

export function WordSetsListView({
  wordSets,
  playingAudio,
  userResults,
  familyProgress,
  onStartTest,
  onStartPractice,
  onWordClick,
  onOpenSettings,
  onOpenEdit,
  onOpenDelete,
  onViewAnalytics,
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
          userResults={userResults}
          familyProgress={familyProgress}
          onStartTest={onStartTest}
          onStartPractice={onStartPractice}
          onWordClick={onWordClick}
          onOpenSettings={onOpenSettings}
          onOpenEdit={onOpenEdit}
          onOpenDelete={onOpenDelete}
          onViewAnalytics={onViewAnalytics}
        />
      ))}
    </div>
  );
}
