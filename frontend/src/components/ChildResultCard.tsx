"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TestResult } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/locales";
import Stavle, { StavlePose } from "@/components/Stavle";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/16/solid";
import { celebratePerfectScore, celebrateExcellentScore } from "@/lib/confetti";

interface ChildResultCardProps {
  result: TestResult;
  wordSetName: string;
  isNew?: boolean;
}

function getScorePose(score: number): StavlePose {
  if (score === 100) return "celebrating";
  if (score >= 90) return "celebrating";
  if (score >= 70) return "encouraging";
  return "reading";
}

function getScoreColors(score: number) {
  if (score >= 90) {
    return {
      ring: "stroke-nordic-meadow",
      bg: "bg-nordic-meadow/20",
      text: "text-nordic-meadow",
      border: "border-nordic-meadow/40",
    };
  }
  if (score >= 70) {
    return {
      ring: "stroke-nordic-sunrise",
      bg: "bg-nordic-sunrise/20",
      text: "text-nordic-sunrise",
      border: "border-nordic-sunrise/40",
    };
  }
  return {
    ring: "stroke-nordic-cloudberry",
    bg: "bg-nordic-cloudberry/20",
    text: "text-nordic-cloudberry",
    border: "border-nordic-cloudberry/40",
  };
}

function formatRelativeDate(
  dateString: string,
  t: (key: TranslationKey) => string,
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return t("results.child.today");
  } else if (diffDays === 1) {
    return t("results.child.yesterday");
  } else if (diffDays < 7) {
    return `${diffDays} ${t("results.child.daysAgo")}`;
  } else {
    return date.toLocaleDateString();
  }
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const colors = getScoreColors(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={colors.ring}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-bold ${colors.text}`}>{score}%</span>
      </div>
    </div>
  );
}

export default function ChildResultCard({
  result,
  wordSetName,
  isNew = false,
}: ChildResultCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  const colors = getScoreColors(result.score);
  const pose = getScorePose(result.score);

  useEffect(() => {
    if (isNew && !confettiTriggered) {
      setConfettiTriggered(true);
      if (result.score === 100) {
        celebratePerfectScore();
      } else if (result.score >= 90) {
        celebrateExcellentScore();
      }
    }
  }, [isNew, result.score, confettiTriggered]);

  const handleTryAgain = () => {
    router.push(`/wordsets?view=test&id=${result.wordSetId}&mode=standard`);
  };

  const wordsNeedingAttention =
    result.words?.filter((w) => !w.correct || w.attempts > 1) || [];

  const getScoreLabel = () => {
    if (result.score >= 90) return t("results.child.amazing");
    if (result.score >= 70) return t("results.child.nice");
    return t("results.child.keepPracticing");
  };

  return (
    <div
      className={`rounded-2xl bg-nordic-snow p-5 shadow-md border-2 ${colors.border} transition-all hover:shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <Stavle pose={pose} size={48} animate={isNew} />

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-nordic-midnight truncate">
            {wordSetName}
          </h3>
          <p className="text-base text-gray-600">
            {formatRelativeDate(result.completedAt, t)}
          </p>
        </div>

        <ScoreRing score={result.score} />
      </div>

      <div className={`mt-4 p-3 rounded-xl ${colors.bg}`}>
        <p className={`text-lg font-semibold text-center ${colors.text}`}>
          {getScoreLabel()}
        </p>
        <p className="text-base text-center text-gray-700 mt-1">
          {result.correctWords} {t("results.child.outOf")} {result.totalWords}{" "}
          {t("results.child.wordsCorrect")}
        </p>
      </div>

      {wordsNeedingAttention.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-2 w-full py-3 min-h-12 text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            aria-expanded={expanded}
            aria-label={t("aria.toggleWordDetails")}
          >
            {expanded ? (
              <>
                {t("results.child.hideWords")}
                <ChevronUpIcon className="w-5 h-5" aria-hidden="true" />
              </>
            ) : (
              <>
                {t("results.child.seeWords")} ({wordsNeedingAttention.length})
                <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {wordsNeedingAttention.map((wordResult, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    wordResult.correct
                      ? "bg-nordic-sunrise/10 border-nordic-sunrise/30"
                      : "bg-nordic-cloudberry/10 border-nordic-cloudberry/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-nordic-midnight">
                      {wordResult.word}
                    </span>
                    <div className="flex items-center gap-2">
                      {wordResult.correct ? (
                        <CheckCircleIcon
                          className="w-5 h-5 text-nordic-sunrise"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircleIcon
                          className="w-5 h-5 text-nordic-cloudberry"
                          aria-hidden="true"
                        />
                      )}
                      {wordResult.attempts > 1 && (
                        <span className="text-sm text-gray-600">
                          {wordResult.attempts} {t("results.words.attempts")}
                        </span>
                      )}
                    </div>
                  </div>

                  {wordResult.userAnswers &&
                    wordResult.userAnswers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {wordResult.userAnswers.map((answer, ansIdx) => (
                          <span
                            key={ansIdx}
                            className={`px-3 py-1 text-sm rounded-full ${
                              answer.toLowerCase().trim() ===
                              wordResult.word.toLowerCase()
                                ? "bg-nordic-meadow/20 text-nordic-meadow"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {answer || t("results.words.empty")}
                          </span>
                        ))}
                      </div>
                    )}

                  {wordResult.audioPlayCount &&
                    wordResult.audioPlayCount > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                        <SpeakerWaveIcon
                          className="w-4 h-4"
                          aria-hidden="true"
                        />
                        {t("results.words.audioPlayed")}{" "}
                        {wordResult.audioPlayCount}x
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleTryAgain}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 min-h-12 text-base font-semibold text-nordic-midnight bg-nordic-sky/20 rounded-xl hover:bg-nordic-sky/30 transition-colors"
        aria-label={t("aria.tryAgain")}
      >
        <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
        {t("results.child.tryAgain")}
      </button>
    </div>
  );
}
