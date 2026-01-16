import React, { useMemo } from "react";
import Link from "next/link";
import { WordSet, TestResult } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCuratedWordSets } from "@/hooks/useCuratedWordSets";
import { CuratedWordSetCard } from "@/components/WordSetCard/CuratedWordSetCard";
import { HeroSparklesIcon, HeroArrowRightIcon } from "@/components/Icons";
import { rankWordSets } from "@/lib/recommendationEngine";

interface UserProfile {
  birthYear?: number;
  level?: number;
}

interface SuggestedWordSetsProps {
  userResults: TestResult[];
  userProfile?: UserProfile;
  playingAudio: string | null;
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
}

export function SuggestedWordSets({
  userResults,
  userProfile,
  playingAudio,
  onStartTest,
  onStartPractice,
  onWordClick,
}: SuggestedWordSetsProps) {
  const { t } = useLanguage();
  const { curatedWordSets, loading } = useCuratedWordSets();

  const suggestedSets = useMemo(() => {
    if (!curatedWordSets.length) return [];

    // If we have user profile data, use the smart ranking
    if (userProfile) {
      return rankWordSets(curatedWordSets, userProfile, userResults).slice(
        0,
        3,
      );
    }

    // Fallback: just take the first 3
    return curatedWordSets.slice(0, 3);
  }, [curatedWordSets, userProfile, userResults]);

  if (loading || suggestedSets.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeroSparklesIcon className="w-6 h-6 text-nordic-sunrise" />
          <h2 className="text-2xl font-bold text-nordic-midnight">
            {t("wordsets.curated.suggestedTitle")}
          </h2>
        </div>
        <Link
          href="/wordsets/curated"
          className="flex items-center text-sm font-semibold text-nordic-sky hover:text-nordic-teal transition-colors"
        >
          {t("wordsets.seeAll")}
          <HeroArrowRightIcon className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestedSets.map((wordSet) => (
          <div key={wordSet.id} className="h-full">
            <CuratedWordSetCard
              wordSet={wordSet}
              playingAudio={playingAudio}
              userResults={userResults}
              onStartTest={onStartTest}
              onStartPractice={onStartPractice}
              onWordClick={onWordClick}
              compact={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
