import React, { useMemo } from "react";
import { WordSet, TestResult, FamilyProgress } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { WordSetCard } from "@/components/WordSetCard";
import Stavle from "@/components/Stavle";

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
  const { userData } = useAuth();

  // Sort wordsets: assigned first (for children), then by createdAt DESC
  const sortedWordSets = useMemo(() => {
    if (userData?.role !== "child" || !userData?.id) {
      return wordSets; // Parents see default order
    }

    return [...wordSets].sort((a, b) => {
      const aAssigned = a.assignedUserIds?.includes(userData.id) ?? false;
      const bAssigned = b.assignedUserIds?.includes(userData.id) ?? false;

      // Assigned wordsets first
      if (aAssigned && !bAssigned) return -1;
      if (!aAssigned && bAssigned) return 1;

      // Then by createdAt DESC (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [wordSets, userData]);

  if (wordSets.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 flex justify-center">
          <Stavle pose="pointing" size={128} animate />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-nordic-midnight">
          {t("wordsets.noTitle")}
        </h3>
        <p className="text-gray-600">{t("wordsets.noSubtitle")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sortedWordSets.map((wordSet) => (
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
