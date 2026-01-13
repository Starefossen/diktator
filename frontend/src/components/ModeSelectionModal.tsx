"use client";

import { useEffect } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { WordSet, TestMode, TEST_MODES } from "@/types";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";
import { isSentence } from "@/lib/sentenceConfig";
import { getMode } from "@/lib/testEngine/registry";

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

  const recommendedMode = getRecommendedMode(wordSet);

  const handleModeSelection = (mode: TestMode) => {
    const modeDefinition = getMode(mode);
    if (modeDefinition) {
      const { available } = modeDefinition.isAvailable(wordSet);
      if (available) {
        onSelectMode(mode);
        onClose();
      }
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
            const modeDefinition = getMode(mode);
            if (!modeDefinition) return null;

            const { metadata } = modeDefinition;
            const { available, reasonKey } =
              modeDefinition.isAvailable(wordSet);
            const isRecommended = mode === recommendedMode;
            const IconComponent = metadata.icon;

            return (
              <button
                key={mode}
                onClick={() => handleModeSelection(mode)}
                disabled={!available}
                aria-label={
                  available
                    ? t(metadata.nameKey as TranslationKey)
                    : `${t(metadata.nameKey as TranslationKey)} - ${t(reasonKey as TranslationKey)}`
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
                  <IconComponent className="h-8 w-8" aria-hidden={true} />
                </div>

                {/* Mode name */}
                <span
                  className={`text-sm font-semibold text-center ${
                    available ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {t(metadata.nameKey as TranslationKey)}
                </span>

                {/* Description */}
                <span
                  className={`mt-1 text-xs text-center line-clamp-2 ${
                    available ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {t(metadata.descriptionKey as TranslationKey)}
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
