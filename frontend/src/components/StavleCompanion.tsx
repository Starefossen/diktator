"use client";

import { useMemo, useState, useEffect } from "react";
import Stavle, { StavlePose } from "@/components/Stavle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import type { WordSet, TestResult, FamilyProgress } from "@/types";
import type { TranslationKey } from "@/locales";

interface StavleCompanionProps {
  wordSets: WordSet[];
  userResults?: TestResult[];
  familyProgress?: FamilyProgress[];
  className?: string;
}

interface CompanionState {
  pose: StavlePose;
  messageKey: TranslationKey;
  animate: boolean;
}

function getAverageScore(results: TestResult[]): number {
  if (results.length === 0) return 0;
  const total = results.reduce((sum, r) => sum + r.score, 0);
  return total / results.length;
}

function getRecentResults(results: TestResult[], days: number): TestResult[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return results.filter((r) => new Date(r.completedAt) > cutoff);
}

function determineCompanionState(
  role: "parent" | "child" | undefined,
  wordSets: WordSet[],
  userResults: TestResult[],
  familyProgress: FamilyProgress[],
): CompanionState {
  const hasWordSets = wordSets.length > 0;
  const hasResults = userResults.length > 0;
  const recentResults = getRecentResults(userResults, 7);
  const avgScore = getAverageScore(userResults);
  const recentAvgScore = getAverageScore(recentResults);

  if (role === "parent") {
    if (!hasWordSets) {
      return {
        pose: "pointing",
        messageKey: "stavle.companion.parent.noWordSets",
        animate: true,
      };
    }

    const hasChildProgress = familyProgress.some((fp) => fp.totalTests > 0);
    if (!hasChildProgress) {
      return {
        pose: "encouraging",
        messageKey: "stavle.companion.parent.waitingForChildren",
        animate: false,
      };
    }

    const avgFamilyScore =
      familyProgress.reduce((sum, fp) => sum + (fp.averageScore || 0), 0) /
      familyProgress.filter((fp) => fp.totalTests > 0).length;

    if (avgFamilyScore >= 90) {
      return {
        pose: "celebrating",
        messageKey: "stavle.companion.parent.familyExcelling",
        animate: true,
      };
    }

    return {
      pose: "reading",
      messageKey: "stavle.companion.parent.familyLearning",
      animate: false,
    };
  }

  if (!hasWordSets) {
    return {
      pose: "waving",
      messageKey: "stavle.companion.child.welcome",
      animate: true,
    };
  }

  if (!hasResults) {
    return {
      pose: "pointing",
      messageKey: "stavle.companion.child.readyToStart",
      animate: true,
    };
  }

  if (recentResults.length === 0) {
    return {
      pose: "encouraging",
      messageKey: "stavle.companion.child.comeBack",
      animate: false,
    };
  }

  if (recentAvgScore >= 90) {
    return {
      pose: "celebrating",
      messageKey: "stavle.companion.child.doingGreat",
      animate: true,
    };
  }

  if (recentAvgScore >= 70) {
    return {
      pose: "encouraging",
      messageKey: "stavle.companion.child.goodProgress",
      animate: false,
    };
  }

  if (avgScore > recentAvgScore + 10) {
    return {
      pose: "thinking",
      messageKey: "stavle.companion.child.keepPracticing",
      animate: false,
    };
  }

  return {
    pose: "reading",
    messageKey: "stavle.companion.child.practiceMore",
    animate: false,
  };
}

export function StavleCompanion({
  wordSets,
  userResults = [],
  familyProgress = [],
  className = "",
}: StavleCompanionProps) {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const companionState = useMemo(
    () =>
      determineCompanionState(
        userData?.role,
        wordSets,
        userResults,
        familyProgress,
      ),
    [userData?.role, wordSets, userResults, familyProgress],
  );

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 right-4 z-40 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } ${className}`}
    >
      {/* Blob-shaped speech bubble */}
      <div
        className="relative bg-linear-to-br from-nordic-sky/10 via-white to-nordic-teal/10 shadow-lg pl-4 py-3"
        style={{
          borderRadius: "40% 60% 70% 30% / 55% 35% 65% 45%",
          border: "2px solid rgba(125, 211, 252, 0.3)",
          paddingRight: "100px",
        }}
      >
        <div className="max-w-48">
          <p className="text-sm text-nordic-midnight leading-snug italic">
            &ldquo;{t(companionState.messageKey)}&rdquo;
          </p>
        </div>
        <div className="absolute -right-2 -bottom-4">
          <Stavle
            pose={companionState.pose}
            size={96}
            animate={companionState.animate}
          />
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-0 right-0 w-5 h-5 bg-nordic-mist/80 hover:bg-nordic-mist rounded-full flex items-center justify-center text-nordic-slate text-xs transition-colors shadow-sm"
            aria-label={t("stavle.companion.dismiss")}
          >
            ×
          </button>
        </div>
      </div>

      {/* Organic blob tail */}
      <div
        className="absolute -bottom-2 right-10 w-5 h-5 bg-linear-to-br from-white to-nordic-teal/10"
        style={{
          borderRadius: "60% 40% 70% 30% / 40% 60% 40% 60%",
          border: "2px solid rgba(125, 211, 252, 0.3)",
          borderTop: "none",
          borderLeft: "none",
        }}
      />
    </div>
  );
}
