"use client";

import { useEffect } from "react";
import {
  PuzzlePieceIcon,
  DocumentTextIcon,
  EyeIcon,
  LightBulbIcon,
  LanguageIcon,
  SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  WordSet,
  TestMode,
  TEST_MODES,
  TEST_MODE_INFO,
  ModeIconId,
} from "@/types";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";
import { isSentence } from "@/lib/sentenceConfig";

export interface ModeSelectionResult {
  mode: TestMode;
}

interface ModeSelectionModalProps {
  isOpen: boolean;
  wordSet: WordSet | null;
  onClose: () => void;
  onSelectMode: (mode: TestMode) => void;
  /** Optional birth year for age-adaptive mode recommendation */
  userBirthYear?: number;
}

/**
 * Map iconId to Heroicon component
 */
function getModeIcon(iconId: ModeIconId, className: string) {
  const iconMap: Record<ModeIconId, React.ElementType> = {
    puzzle: PuzzlePieceIcon,
    documentText: DocumentTextIcon,
    keyboard: SquaresPlusIcon, // Using SquaresPlusIcon as keyboard-like icon
    puzzleMissing: PuzzlePieceIcon, // Same as puzzle but semantically different
    eye: EyeIcon,
    lightBulb: LightBulbIcon,
    language: LanguageIcon,
  };

  const IconComponent = iconMap[iconId];
  return <IconComponent className={className} aria-hidden="true" />;
}

/**
 * Determine which modes are available based on word set content
 */
function getModeAvailability(
  wordSet: WordSet,
): Record<TestMode, { available: boolean; reasonKey?: string }> {
  const hasSentences =
    wordSet.words.some((w) => isSentence(w.word)) ||
    (wordSet.sentences?.length ?? 0) > 0;
  const hasTranslations = wordSet.words.some(
    (w) => w.translations && w.translations.length > 0,
  );
  const hasSingleWords = wordSet.words.some((w) => !isSentence(w.word));

  const availability: Record<
    TestMode,
    { available: boolean; reasonKey?: string }
  > = {
    letterTiles: {
      available: hasSingleWords,
      reasonKey: hasSingleWords
        ? undefined
        : "modeSelector.unavailable.singleWordOnly",
    },
    wordBank: {
      available: hasSentences,
      reasonKey: hasSentences
        ? undefined
        : "modeSelector.unavailable.sentenceOnly",
    },
    keyboard: { available: true },
    missingLetters: {
      available: hasSingleWords,
      reasonKey: hasSingleWords
        ? undefined
        : "modeSelector.unavailable.singleWordOnly",
    },
    flashcard: { available: true },
    lookCoverWrite: { available: true },
    translation: {
      available: hasTranslations,
      reasonKey: hasTranslations
        ? undefined
        : "modeSelector.unavailable.noTranslations",
    },
  };

  return availability;
}

/**
 * Get recommended mode based on content type and configuration
 */
function getRecommendedMode(wordSet: WordSet): TestMode {
  // Use configured default mode if set
  if (wordSet.testConfiguration?.defaultMode) {
    return wordSet.testConfiguration.defaultMode;
  }

  // Default recommendation based on content type
  const hasSentences =
    wordSet.words.some((w) => isSentence(w.word)) ||
    (wordSet.sentences && wordSet.sentences.length > 0);

  if (hasSentences) {
    return "wordBank";
  }

  // For single words, keyboard is the most versatile default
  return "keyboard";
}

export function ModeSelectionModal({
  isOpen,
  wordSet,
  onClose,
  onSelectMode,
}: ModeSelectionModalProps) {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const isParent = userData?.role === "parent";

  // Reset state when modal closes
  useEffect(() => {
    // No state to reset in the new implementation
  }, [isOpen]);

  if (!wordSet) return null;

  const availability = getModeAvailability(wordSet);
  const recommendedMode = getRecommendedMode(wordSet);

  const handleModeSelection = (mode: TestMode) => {
    if (availability[mode].available) {
      onSelectMode(mode);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modeSelector.title" as TranslationKey)}
      size="lg"
    >
      <ModalContent>
        {/* 7-tile grid: 2 columns on mobile, 4 columns on larger screens */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TEST_MODES.map((mode) => {
            const info = TEST_MODE_INFO[mode];
            const { available, reasonKey } = availability[mode];
            const isRecommended = mode === recommendedMode;

            return (
              <button
                key={mode}
                onClick={() => handleModeSelection(mode)}
                disabled={!available}
                aria-label={
                  available
                    ? t(info.nameKey as TranslationKey)
                    : `${t(info.nameKey as TranslationKey)} - ${t(reasonKey as TranslationKey)}`
                }
                className={`
                  relative flex flex-col items-center justify-center
                  min-h-28 p-3 rounded-xl border-2 transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-nordic-sky focus-visible:ring-offset-2
                  ${
                    available
                      ? isRecommended
                        ? "border-nordic-sky bg-nordic-sky/10 hover:bg-nordic-sky/20"
                        : "border-gray-200 hover:border-nordic-sky/50 hover:bg-gray-50"
                      : "border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed"
                  }
                `}
              >
                {/* Recommended badge */}
                {isRecommended && available && (
                  <span className="absolute -top-2 -right-2 flex items-center gap-0.5 rounded-full bg-nordic-sunrise px-2 py-0.5 text-xs font-semibold text-white">
                    <StarIcon className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only sm:inline">
                      {t("modeSelector.recommended" as TranslationKey)}
                    </span>
                  </span>
                )}

                {/* Icon */}
                <div
                  className={`mb-2 ${
                    available ? "text-nordic-sky" : "text-gray-400"
                  }`}
                >
                  {getModeIcon(info.iconId, "h-8 w-8")}
                </div>

                {/* Mode name */}
                <span
                  className={`text-sm font-semibold text-center ${
                    available ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {t(info.nameKey as TranslationKey)}
                </span>

                {/* Description */}
                <span
                  className={`mt-1 text-xs text-center line-clamp-2 ${
                    available ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {t(info.descKey as TranslationKey)}
                </span>

                {/* Unavailable reason - only shown to parents per DESIGN.md */}
                {!available && reasonKey && isParent && (
                  <span className="mt-1 text-xs text-center text-red-500">
                    {t(reasonKey as TranslationKey)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ModalContent>

      <ModalActions>
        <ModalButton variant="secondary" onClick={onClose}>
          {t("wordsets.cancel" as TranslationKey)}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
