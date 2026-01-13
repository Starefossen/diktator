import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { HeroVolumeIcon } from "@/components/Icons";

interface TestAudioButtonProps {
  onClick: () => void;
  isPlaying: boolean;
  showInstruction?: boolean;
  definition?: string;
}

/**
 * TestAudioButton - Reusable audio playback button with loading animation
 *
 * Extracted from TestView to eliminate duplication across different test modes.
 */
export function TestAudioButton({
  onClick,
  isPlaying,
  showInstruction = true,
  definition,
}: TestAudioButtonProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-4">
        <div className="relative inline-block">
          {isPlaying && (
            <div className="absolute -inset-3 animate-spin rounded-full border-4 border-transparent border-r-nordic-sky/80 border-t-nordic-sky" />
          )}
          <button
            onClick={onClick}
            className="relative transform rounded-full bg-linear-to-r from-nordic-meadow to-nordic-sky p-4 text-4xl text-nordic-midnight shadow-lg transition-all duration-200 hover:scale-105 hover:from-nordic-meadow/90 hover:to-nordic-sky/90 hover:shadow-xl sm:p-6 sm:text-6xl"
            aria-label={t("test.listenToWord")}
          >
            <HeroVolumeIcon className="h-12 w-12 text-nordic-midnight sm:h-16 sm:w-16" />
          </button>
        </div>
      </div>

      {/* Instruction text */}
      {showInstruction && (
        <p className="mt-4 text-gray-600">
          <span className="sm:hidden">{t("test.listenToWordMobile")}</span>
          <span className="hidden sm:inline">{t("test.listenToWord")}</span>
        </p>
      )}

      {/* Definition/context hint */}
      {definition && (
        <div className="mx-auto mt-3 max-w-md rounded-lg border border-nordic-sky/30 bg-nordic-sky/10 px-4 py-2 text-sm">
          <p className="text-nordic-midnight">
            <span className="font-medium">{t("test.context")}</span>{" "}
            {definition}
          </p>
        </div>
      )}
    </div>
  );
}
