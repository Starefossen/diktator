"use client";

import React from "react";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import type { WordMastery } from "@/types";
import { MASTERY_CONFIG } from "@/lib/sentenceConfig";
import { HeroLockClosedIcon, HeroCheckCircleIcon } from "@/components/Icons";

export type InputMethodType = "letterTiles" | "wordBank" | "keyboard";

interface InputMethodSelectorProps {
  /** Aggregate mastery data for the word set */
  masteryData: WordMastery[];
  /** Number of words in the word set */
  totalWords: number;
  /** Whether the content is sentences (true) or single words (false) */
  isSentenceMode: boolean;
  /** Currently selected input method */
  selectedMethod: InputMethodType | "auto";
  /** Callback when method changes */
  onMethodChange: (method: InputMethodType | "auto") => void;
  /** Whether replay mode is enabled */
  replayMode: boolean;
  /** Callback when replay mode changes */
  onReplayModeChange: (enabled: boolean) => void;
  /** User's birth year for age-based recommendations */
  birthYear?: number;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

interface ModeInfo {
  mode: InputMethodType;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  isAvailable: boolean;
  isUnlocked: boolean;
  progress: { correct: number; required: number };
}

/**
 * Calculate aggregate mastery progress across all words
 */
function calculateAggregateMastery(
  masteryData: WordMastery[],
  totalWords: number,
): {
  letterTilesComplete: number;
  wordBankComplete: number;
  keyboardComplete: number;
} {
  let letterTilesComplete = 0;
  let wordBankComplete = 0;
  let keyboardComplete = 0;

  for (const m of masteryData) {
    if (m.letterTilesCorrect >= MASTERY_CONFIG.LETTER_TILES_REQUIRED) {
      letterTilesComplete++;
    }
    if (m.wordBankCorrect >= MASTERY_CONFIG.WORD_BANK_REQUIRED) {
      wordBankComplete++;
    }
    if (m.keyboardCorrect >= 1) {
      keyboardComplete++;
    }
  }

  return {
    letterTilesComplete,
    wordBankComplete,
    keyboardComplete,
  };
}

/**
 * Get the recommended input method based on mastery and user age
 */
function getRecommendedMethod(
  isSentenceMode: boolean,
  masteryData: WordMastery[],
  totalWords: number,
  birthYear?: number,
): InputMethodType {
  const aggregate = calculateAggregateMastery(masteryData, totalWords);

  // For sentences, only word bank and keyboard are available
  if (isSentenceMode) {
    // If most words have word bank mastery, suggest keyboard
    if (aggregate.wordBankComplete >= totalWords * 0.5) {
      return "keyboard";
    }
    return "wordBank";
  }

  // For single words, all modes available
  // Check if user is young (prefer simpler modes)
  if (birthYear) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age <= 7) {
      // Young children start with letter tiles
      if (aggregate.letterTilesComplete < totalWords * 0.5) {
        return "letterTiles";
      }
      return "wordBank";
    }
  }

  // For older users, check mastery progression
  if (aggregate.letterTilesComplete < totalWords * 0.5) {
    return "letterTiles";
  }
  if (aggregate.wordBankComplete < totalWords * 0.5) {
    return "wordBank";
  }
  return "keyboard";
}

/**
 * MasteryBadge shows progress dots (✓✓ = complete, ✓○ = partial, ○○ = empty)
 */
function MasteryBadge({
  correct,
  required,
}: {
  correct: number;
  required: number;
}) {
  const filled = Math.min(correct, required);
  const empty = required - filled;

  return (
    <span className="flex gap-0.5 items-center ml-2">
      {Array.from({ length: filled }).map((_, i) => (
        <span
          key={`filled-${i}`}
          className="w-2 h-2 rounded-full bg-green-500"
          aria-hidden="true"
        />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span
          key={`empty-${i}`}
          className="w-2 h-2 rounded-full bg-gray-300"
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * InputMethodSelector allows users to choose their input method for dictation tests.
 *
 * Features:
 * - Shows available modes based on content type (words vs sentences)
 * - Displays mastery progress with visual badges
 * - Lock icons for modes not yet unlocked
 * - Age-adaptive recommendations
 * - Replay mode toggle for practicing earlier stages
 */
export function InputMethodSelector({
  masteryData,
  totalWords,
  isSentenceMode,
  selectedMethod,
  onMethodChange,
  replayMode,
  onReplayModeChange,
  birthYear,
  disabled = false,
}: InputMethodSelectorProps) {
  const { t } = useLanguage();

  const aggregate = calculateAggregateMastery(masteryData, totalWords);
  const recommendedMethod = getRecommendedMethod(
    isSentenceMode,
    masteryData,
    totalWords,
    birthYear,
  );

  // Build mode info based on content type
  const modes: ModeInfo[] = [];

  if (!isSentenceMode) {
    // Letter tiles - only for single words
    const letterTilesUnlocked = true; // Always available for words
    modes.push({
      mode: "letterTiles",
      labelKey: "mastery.letterTiles" as TranslationKey,
      descriptionKey: "mastery.letterTiles.desc" as TranslationKey,
      isAvailable: true,
      isUnlocked: letterTilesUnlocked,
      progress: {
        correct: aggregate.letterTilesComplete,
        required: totalWords,
      },
    });
  }

  // Word bank - available for both words and sentences
  const wordBankUnlocked =
    isSentenceMode ||
    aggregate.letterTilesComplete >= Math.ceil(totalWords * 0.5);
  modes.push({
    mode: "wordBank",
    labelKey: "mastery.wordBank" as TranslationKey,
    descriptionKey: "mastery.wordBank.desc" as TranslationKey,
    isAvailable: true,
    isUnlocked: wordBankUnlocked || replayMode,
    progress: {
      correct: aggregate.wordBankComplete,
      required: totalWords,
    },
  });

  // Keyboard - always available
  const keyboardUnlocked = isSentenceMode
    ? aggregate.wordBankComplete >= Math.ceil(totalWords * 0.5)
    : aggregate.wordBankComplete >= Math.ceil(totalWords * 0.5);
  modes.push({
    mode: "keyboard",
    labelKey: "mastery.keyboard" as TranslationKey,
    descriptionKey: "mastery.keyboard.desc" as TranslationKey,
    isAvailable: true,
    isUnlocked: keyboardUnlocked || replayMode,
    progress: {
      correct: aggregate.keyboardComplete,
      required: totalWords,
    },
  });

  // Determine if we should show the auto option
  const effectiveMethod =
    selectedMethod === "auto" ? recommendedMethod : selectedMethod;

  return (
    <div className="space-y-4">
      {/* Method selection */}
      <div
        className="space-y-2"
        role="radiogroup"
        aria-label={t("mastery.selectMethod" as TranslationKey)}
      >
        {modes.map((modeInfo) => {
          const isSelected = effectiveMethod === modeInfo.mode;
          const isRecommended = recommendedMethod === modeInfo.mode;
          const canSelect =
            modeInfo.isUnlocked && modeInfo.isAvailable && !disabled;

          return (
            <button
              key={modeInfo.mode}
              type="button"
              onClick={() => canSelect && onMethodChange(modeInfo.mode)}
              disabled={!canSelect}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={!canSelect}
              className={`
                w-full p-3 rounded-lg border-2 text-left transition-all
                min-h-12
                focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                ${
                  isSelected
                    ? "border-nordic-sky bg-nordic-sky/10"
                    : canSelect
                      ? "border-gray-200 hover:border-nordic-sky/50 hover:bg-gray-50"
                      : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Radio indicator */}
                  <span
                    className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? "border-nordic-sky" : "border-gray-400"}
                    `}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-nordic-sky" />
                    )}
                  </span>

                  {/* Mode label */}
                  <span className="font-medium text-gray-900">
                    {t(modeInfo.labelKey)}
                  </span>

                  {/* Recommended badge */}
                  {isRecommended && !replayMode && (
                    <span className="px-2 py-0.5 text-xs font-medium text-nordic-sky bg-nordic-sky/10 rounded-full">
                      {t("mastery.recommended" as TranslationKey)}
                    </span>
                  )}
                </div>

                {/* Right side: lock or progress */}
                <div className="flex items-center gap-2">
                  {!modeInfo.isUnlocked && !replayMode ? (
                    <HeroLockClosedIcon className="w-5 h-5 text-gray-400" />
                  ) : modeInfo.progress.correct >=
                    modeInfo.progress.required ? (
                    <HeroCheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <MasteryBadge
                      correct={modeInfo.progress.correct}
                      required={Math.min(
                        MASTERY_CONFIG.LETTER_TILES_REQUIRED,
                        modeInfo.progress.required,
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mt-1 ml-6 text-sm text-gray-600">
                {t(modeInfo.descriptionKey)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Replay mode toggle */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
        <input
          type="checkbox"
          id="replay-mode"
          checked={replayMode}
          onChange={(e) => onReplayModeChange(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 rounded border-gray-300 text-nordic-sky focus:ring-nordic-sky"
        />
        <label
          htmlFor="replay-mode"
          className="text-sm text-gray-700 cursor-pointer"
        >
          {t("mastery.replayMode" as TranslationKey)}
        </label>
      </div>
    </div>
  );
}
