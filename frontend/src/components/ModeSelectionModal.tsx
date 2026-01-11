"use client";

import { useState, useEffect } from "react";
import { WordSet, WordMastery } from "@/types";
import { useLanguage, TranslationKey } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";
import {
  InputMethodSelector,
  InputMethodType,
} from "@/components/InputMethodSelector";
import { isSentence } from "@/lib/sentenceConfig";

export interface ModeSelectionResult {
  mode: "standard" | "dictation" | "translation";
  inputMethod?: InputMethodType | "auto";
  replayMode?: boolean;
}

interface ModeSelectionModalProps {
  isOpen: boolean;
  wordSet: WordSet | null;
  onClose: () => void;
  onSelectMode: (
    mode: "standard" | "dictation" | "translation",
    inputMethod?: InputMethodType | "auto",
    replayMode?: boolean,
  ) => void;
  /** Optional birth year for age-adaptive input method selection */
  userBirthYear?: number;
}

export function ModeSelectionModal({
  isOpen,
  wordSet,
  onClose,
  onSelectMode,
  userBirthYear,
}: ModeSelectionModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // State for dictation input method
  const [selectedInputMethod, setSelectedInputMethod] = useState<
    InputMethodType | "auto"
  >("auto");
  const [replayMode, setReplayMode] = useState(false);
  const [masteryData, setMasteryData] = useState<WordMastery[]>([]);
  const [isDictationExpanded, setIsDictationExpanded] = useState(false);
  const [isLoadingMastery, setIsLoadingMastery] = useState(false);

  // Determine if content is sentences (affects available input methods)
  const hasSentences =
    wordSet?.words.some((w) => isSentence(w.word)) ||
    (wordSet?.sentences && wordSet.sentences.length > 0);

  // Fetch mastery data when modal opens with dictation expanded
  useEffect(() => {
    async function fetchMastery() {
      if (!wordSet || !isDictationExpanded || !user) return;

      setIsLoadingMastery(true);
      try {
        const response = await fetch(`/api/mastery/${wordSet.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMasteryData(data.data || []);
        }
      } catch {
        // Silently fail - mastery is optional enhancement
      } finally {
        setIsLoadingMastery(false);
      }
    }

    fetchMastery();
  }, [wordSet, isDictationExpanded, user]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedInputMethod("auto");
      setReplayMode(false);
      setIsDictationExpanded(false);
      setMasteryData([]);
    }
  }, [isOpen]);

  if (!wordSet) return null;

  const defaultMode = wordSet.testConfiguration?.defaultMode || "standard";
  const hasTranslations = wordSet.words.some(
    (w) => w.translations && w.translations.length > 0,
  );

  const handleModeSelection = (
    mode: "standard" | "dictation" | "translation",
  ) => {
    if (mode === "dictation") {
      onSelectMode(mode, selectedInputMethod, replayMode);
    } else {
      onSelectMode(mode);
    }
    onClose();
  };

  const handleDictationClick = () => {
    // Toggle expansion on click
    setIsDictationExpanded(!isDictationExpanded);
  };

  const handleStartDictation = () => {
    handleModeSelection("dictation");
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("wordsets.mode.select")}
      size="md"
    >
      <ModalContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {t("wordsets.mode.description")}
          </p>

          {/* Standard Mode */}
          <button
            onClick={() => handleModeSelection("standard")}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors min-h-12 ${
              defaultMode === "standard"
                ? "border-nordic-sky bg-nordic-sky/10"
                : "border-gray-200 hover:border-nordic-sky/50 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {t("wordsets.mode.standard")}
                  {defaultMode === "standard" && (
                    <span className="ml-2 text-xs font-normal text-nordic-sky">
                      ({t("wordsets.mode.recommended")})
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("wordsets.mode.standard.desc")}
                </p>
              </div>
              <svg
                className="w-6 h-6 text-nordic-sky"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </button>

          {/* Dictation Mode - Expandable */}
          <div
            className={`rounded-lg border-2 transition-colors ${
              defaultMode === "dictation" || isDictationExpanded
                ? "border-nordic-sky bg-nordic-sky/5"
                : "border-gray-200"
            }`}
          >
            <button
              onClick={handleDictationClick}
              className="w-full text-left p-4 min-h-12"
              aria-expanded={isDictationExpanded}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {t("wordsets.mode.dictation")}
                    {defaultMode === "dictation" && (
                      <span className="ml-2 text-xs font-normal text-nordic-sky">
                        ({t("wordsets.mode.recommended")})
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {t("wordsets.mode.dictation.desc")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-nordic-sky"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isDictationExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </button>

            {/* Expanded dictation options */}
            {isDictationExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-200">
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {t("mastery.selectMethod" as TranslationKey)}
                  </h4>

                  {isLoadingMastery ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-5 h-5 border-2 border-nordic-sky border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <InputMethodSelector
                      masteryData={masteryData}
                      totalWords={wordSet.words.length}
                      isSentenceMode={hasSentences || false}
                      selectedMethod={selectedInputMethod}
                      onMethodChange={setSelectedInputMethod}
                      replayMode={replayMode}
                      onReplayModeChange={setReplayMode}
                      birthYear={userBirthYear}
                    />
                  )}
                </div>

                <button
                  onClick={handleStartDictation}
                  className="w-full mt-4 px-4 py-3 min-h-12 bg-nordic-sky text-white font-semibold rounded-lg hover:bg-nordic-sky/90 transition-colors"
                >
                  {t("wordsets.startTest" as TranslationKey)}
                </button>
              </div>
            )}
          </div>

          {/* Translation Mode */}
          <button
            onClick={() => handleModeSelection("translation")}
            disabled={!hasTranslations}
            title={
              !hasTranslations ? t("wordsets.mode.translation.unavailable") : ""
            }
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors min-h-12 ${
              !hasTranslations
                ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                : defaultMode === "translation"
                  ? "border-nordic-sky bg-nordic-sky/10"
                  : "border-gray-200 hover:border-nordic-sky/50 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {t("wordsets.mode.translation")}
                  {defaultMode === "translation" && hasTranslations && (
                    <span className="ml-2 text-xs font-normal text-nordic-sky">
                      ({t("wordsets.mode.recommended")})
                    </span>
                  )}
                  {!hasTranslations && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({t("wordsets.mode.unavailable")})
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("wordsets.mode.translation.desc")}
                  {!hasTranslations && (
                    <span className="block mt-1 text-xs text-red-600">
                      {t("wordsets.mode.translation.noTranslations")}
                    </span>
                  )}
                </p>
              </div>
              <svg
                className="w-6 h-6 text-nordic-sky"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </div>
          </button>
        </div>
      </ModalContent>

      <ModalActions>
        <ModalButton variant="secondary" onClick={onClose}>
          {t("wordsets.cancel")}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
