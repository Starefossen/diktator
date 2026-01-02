"use client";

import { WordSet } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";

interface ModeSelectionModalProps {
  isOpen: boolean;
  wordSet: WordSet | null;
  onClose: () => void;
  onSelectMode: (mode: "standard" | "dictation" | "translation") => void;
}

export function ModeSelectionModal({
  isOpen,
  wordSet,
  onClose,
  onSelectMode,
}: ModeSelectionModalProps) {
  const { t } = useLanguage();

  if (!wordSet) return null;

  const defaultMode = wordSet.testConfiguration?.defaultMode || "standard";
  const hasTranslations = wordSet.words.some(
    (w) => w.translations && w.translations.length > 0,
  );

  const handleModeSelection = (
    mode: "standard" | "dictation" | "translation",
  ) => {
    onSelectMode(mode);
    onClose();
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
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              defaultMode === "standard"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {t("wordsets.mode.standard")}
                  {defaultMode === "standard" && (
                    <span className="ml-2 text-xs font-normal text-indigo-600">
                      ({t("wordsets.mode.recommended")})
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("wordsets.mode.standard.desc")}
                </p>
              </div>
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Dictation Mode */}
          <button
            onClick={() => handleModeSelection("dictation")}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              defaultMode === "dictation"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {t("wordsets.mode.dictation")}
                  {defaultMode === "dictation" && (
                    <span className="ml-2 text-xs font-normal text-indigo-600">
                      ({t("wordsets.mode.recommended")})
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t("wordsets.mode.dictation.desc")}
                </p>
              </div>
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          </button>

          {/* Translation Mode */}
          <button
            onClick={() => handleModeSelection("translation")}
            disabled={!hasTranslations}
            title={
              !hasTranslations ? t("wordsets.mode.translation.unavailable") : ""
            }
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              !hasTranslations
                ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                : defaultMode === "translation"
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {t("wordsets.mode.translation")}
                  {defaultMode === "translation" && hasTranslations && (
                    <span className="ml-2 text-xs font-normal text-indigo-600">
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
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
