import React from "react";
import { WordSet, TestResult, FamilyProgress } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { ChildWordSetCard } from "@/components/WordSetCard/ChildWordSetCard";
import { ParentWordSetCard } from "@/components/WordSetCard/ParentWordSetCard";

interface WordSetCardProps {
  wordSet: WordSet;
  playingAudio: string | null;
  userResults?: TestResult[]; // User's test results for this wordset
  familyProgress?: FamilyProgress[]; // For parents - children's progress
  onStartTest: (wordSet: WordSet) => void;
  onStartPractice: (wordSet: WordSet) => void;
  onWordClick: (word: string, wordSet: WordSet) => void;
  onOpenSettings: (wordSet: WordSet) => void;
  onOpenEdit: (wordSet: WordSet) => void;
  onOpenDelete: (wordSet: WordSet) => void;
  onViewAnalytics?: (wordSet: WordSet) => void; // For parents
}

export function WordSetCard(props: WordSetCardProps) {
  const { userData } = useAuth();
  const isChild = userData?.role === "child";

  if (isChild) {
    return <ChildWordSetCard {...props} currentUserId={userData?.id} />;
  }

  return <ParentWordSetCard {...props} />;
}
