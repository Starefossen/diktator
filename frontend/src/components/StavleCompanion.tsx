"use client";

import { useMemo, useState, useEffect } from "react";
import Stavle, { StavlePose } from "@/components/Stavle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { interpolateMessage } from "@/lib/i18n";
import type {
  WordSet,
  TestResult,
  FamilyProgress,
  ChildAccount,
} from "@/types";
import type { TranslationKey } from "@/locales";

type StavleCompanionPage = "wordsets" | "results" | "profile";

interface StavleCompanionProps {
  page?: StavleCompanionPage;
  wordSets?: WordSet[];
  userResults?: TestResult[];
  familyProgress?: FamilyProgress[];
  childAccounts?: ChildAccount[];
  className?: string;
}

interface CompanionState {
  pose: StavlePose;
  messageKey: TranslationKey;
  variables?: Record<string, string | number>;
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

function calculateImprovementTrend(results: TestResult[]): number {
  if (results.length < 2) return 0;
  const recent10 = results.slice(0, Math.min(10, results.length));
  const older10 = results.slice(10, Math.min(20, results.length));
  if (older10.length === 0) return 0;
  const recentAvg =
    recent10.reduce((sum, r) => sum + r.score, 0) / recent10.length;
  const olderAvg =
    older10.reduce((sum, r) => sum + r.score, 0) / older10.length;
  return Math.round(recentAvg - olderAvg);
}

function selectRandomVariant(baseKey: string): TranslationKey {
  const variant = Math.floor(Math.random() * 3) + 1;
  return `${baseKey}.${variant}` as TranslationKey;
}

function getWordsetsPageState(
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
        messageKey: "stavle.companion.wordsets.parent.noWordSets",
        animate: true,
      };
    }

    const hasChildProgress = familyProgress.some((fp) => fp.totalTests > 0);
    if (!hasChildProgress) {
      return {
        pose: "encouraging",
        messageKey: "stavle.companion.wordsets.parent.waitingForChildren",
        animate: false,
      };
    }

    const avgFamilyScore =
      familyProgress.reduce((sum, fp) => sum + (fp.averageScore || 0), 0) /
      familyProgress.filter((fp) => fp.totalTests > 0).length;

    if (avgFamilyScore >= 90) {
      return {
        pose: "celebrating",
        messageKey: "stavle.companion.wordsets.parent.familyExcelling",
        animate: true,
      };
    }

    return {
      pose: "reading",
      messageKey: "stavle.companion.wordsets.parent.familyLearning",
      animate: false,
    };
  }

  if (!hasWordSets) {
    return {
      pose: "waving",
      messageKey: "stavle.companion.wordsets.child.welcome",
      animate: true,
    };
  }

  if (!hasResults) {
    return {
      pose: "pointing",
      messageKey: "stavle.companion.wordsets.child.readyToStart",
      animate: true,
    };
  }

  if (recentResults.length === 0) {
    return {
      pose: "encouraging",
      messageKey: "stavle.companion.wordsets.child.comeBack",
      animate: false,
    };
  }

  if (recentAvgScore >= 90) {
    return {
      pose: "celebrating",
      messageKey: "stavle.companion.wordsets.child.doingGreat",
      animate: true,
    };
  }

  if (recentAvgScore >= 70) {
    return {
      pose: "encouraging",
      messageKey: "stavle.companion.wordsets.child.goodProgress",
      animate: false,
    };
  }

  if (avgScore > recentAvgScore + 10) {
    return {
      pose: "thinking",
      messageKey: "stavle.companion.wordsets.child.keepPracticing",
      animate: false,
    };
  }

  return {
    pose: "reading",
    messageKey: "stavle.companion.wordsets.child.practiceMore",
    animate: false,
  };
}

function getResultsPageState(
  role: "parent" | "child" | undefined,
  userResults: TestResult[],
  familyProgress: FamilyProgress[],
): CompanionState {
  const hasResults = userResults.length > 0;
  const avgScore = Math.round(getAverageScore(userResults));
  const improvementTrend = calculateImprovementTrend(userResults);

  if (role === "parent") {
    const hasFamilyResults = familyProgress.some((fp) => fp.totalTests > 0);
    if (!hasFamilyResults) {
      return {
        pose: "pointing",
        messageKey: selectRandomVariant(
          "stavle.companion.results.parent.noResults",
        ),
        animate: true,
      };
    }

    const avgFamilyScore = Math.round(
      familyProgress.reduce((sum, fp) => sum + (fp.averageScore || 0), 0) /
        familyProgress.filter((fp) => fp.totalTests > 0).length,
    );

    if (avgFamilyScore >= 90) {
      return {
        pose: "celebrating",
        messageKey: selectRandomVariant(
          "stavle.companion.results.parent.familyExcelling",
        ),
        variables: { score: avgFamilyScore },
        animate: true,
      };
    }

    if (avgFamilyScore >= 70) {
      return {
        pose: "encouraging",
        messageKey: selectRandomVariant(
          "stavle.companion.results.parent.goodProgress",
        ),
        animate: false,
      };
    }

    return {
      pose: "reading",
      messageKey: selectRandomVariant(
        "stavle.companion.results.parent.default",
      ),
      animate: false,
    };
  }

  if (!hasResults) {
    return {
      pose: "pointing",
      messageKey: selectRandomVariant(
        "stavle.companion.results.child.noResults",
      ),
      animate: true,
    };
  }

  if (userResults.length >= 10) {
    return {
      pose: "celebrating",
      messageKey: selectRandomVariant(
        "stavle.companion.results.child.manyTests",
      ),
      variables: { count: userResults.length },
      animate: true,
    };
  }

  if (avgScore >= 90) {
    return {
      pose: "celebrating",
      messageKey: selectRandomVariant(
        "stavle.companion.results.child.highScore",
      ),
      variables: { score: avgScore },
      animate: true,
    };
  }

  if (avgScore >= 70) {
    return {
      pose: "encouraging",
      messageKey: selectRandomVariant(
        "stavle.companion.results.child.goodScore",
      ),
      variables: { score: avgScore },
      animate: false,
    };
  }

  if (improvementTrend > 0) {
    return {
      pose: "encouraging",
      messageKey: selectRandomVariant(
        "stavle.companion.results.child.improving",
      ),
      variables: { trend: improvementTrend },
      animate: false,
    };
  }

  return {
    pose: "reading",
    messageKey: selectRandomVariant("stavle.companion.results.child.default"),
    animate: false,
  };
}

function getProfilePageState(
  role: "parent" | "child" | undefined,
  displayName: string | undefined,
  userResults: TestResult[],
  familyProgress: FamilyProgress[],
  childAccounts: ChildAccount[],
): CompanionState {
  const hasResults = userResults.length > 0;
  const avgScore = Math.round(getAverageScore(userResults));
  const recentResults = getRecentResults(userResults, 7);
  const name = displayName || "";

  if (role === "parent") {
    if (childAccounts.length === 0) {
      return {
        pose: "pointing",
        messageKey: selectRandomVariant(
          "stavle.companion.profile.parent.noChildren",
        ),
        animate: true,
      };
    }

    const avgFamilyScore = Math.round(
      familyProgress.reduce((sum, fp) => sum + (fp.averageScore || 0), 0) /
        Math.max(familyProgress.filter((fp) => fp.totalTests > 0).length, 1),
    );

    if (avgFamilyScore >= 90) {
      return {
        pose: "celebrating",
        messageKey: selectRandomVariant(
          "stavle.companion.profile.parent.childrenExcelling",
        ),
        variables: { score: avgFamilyScore },
        animate: true,
      };
    }

    const hasAnyFamilyActivity = familyProgress.some((fp) => fp.totalTests > 0);
    if (hasAnyFamilyActivity) {
      return {
        pose: "encouraging",
        messageKey: selectRandomVariant(
          "stavle.companion.profile.parent.activeFamily",
        ),
        animate: false,
      };
    }

    return {
      pose: "reading",
      messageKey: selectRandomVariant(
        "stavle.companion.profile.parent.default",
      ),
      animate: false,
    };
  }

  if (!hasResults) {
    return {
      pose: "waving",
      messageKey: selectRandomVariant("stavle.companion.profile.child.welcome"),
      variables: { name },
      animate: true,
    };
  }

  if (avgScore >= 90) {
    return {
      pose: "celebrating",
      messageKey: selectRandomVariant(
        "stavle.companion.profile.child.highPerformer",
      ),
      variables: { score: avgScore },
      animate: true,
    };
  }

  if (recentResults.length >= 3) {
    return {
      pose: "encouraging",
      messageKey: selectRandomVariant("stavle.companion.profile.child.active"),
      animate: false,
    };
  }

  if (recentResults.length === 0 && hasResults) {
    return {
      pose: "encouraging",
      messageKey: selectRandomVariant(
        "stavle.companion.profile.child.inactive",
      ),
      animate: false,
    };
  }

  return {
    pose: "reading",
    messageKey: selectRandomVariant("stavle.companion.profile.child.default"),
    animate: false,
  };
}

function determineCompanionState(
  page: StavleCompanionPage,
  role: "parent" | "child" | undefined,
  displayName: string | undefined,
  wordSets: WordSet[],
  userResults: TestResult[],
  familyProgress: FamilyProgress[],
  childAccounts: ChildAccount[],
): CompanionState {
  switch (page) {
    case "results":
      return getResultsPageState(role, userResults, familyProgress);
    case "profile":
      return getProfilePageState(
        role,
        displayName,
        userResults,
        familyProgress,
        childAccounts,
      );
    case "wordsets":
    default:
      return getWordsetsPageState(role, wordSets, userResults, familyProgress);
  }
}

export function StavleCompanion({
  page = "wordsets",
  wordSets = [],
  userResults = [],
  familyProgress = [],
  childAccounts = [],
  className = "",
}: StavleCompanionProps) {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const companionState = useMemo(
    () =>
      determineCompanionState(
        page,
        userData?.role,
        userData?.displayName,
        wordSets,
        userResults,
        familyProgress,
        childAccounts,
      ),
    // Only recalculate when page changes or data length changes to avoid re-randomizing variants
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      page,
      userData?.role,
      wordSets.length,
      userResults.length,
      familyProgress.length,
      childAccounts.length,
    ],
  );

  const message = useMemo(() => {
    const rawMessage = t(companionState.messageKey);
    if (companionState.variables) {
      return interpolateMessage(rawMessage, companionState.variables);
    }
    return rawMessage;
  }, [t, companionState.messageKey, companionState.variables]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 right-4 z-40 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
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
            &ldquo;{message}&rdquo;
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
