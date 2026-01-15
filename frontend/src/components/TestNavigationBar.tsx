"use client";

import { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/Button";
import {
  HeroXMarkIcon,
  HeroVolumeIcon,
  HeroArrowRightIcon,
} from "@/components/Icons";
import type { NavigationActions } from "@/lib/testEngine/types";

interface TestNavigationBarProps extends NavigationActions {
  /**
   * Custom center content for mode-specific actions.
   * If not provided, only the audio button is shown in center.
   */
  centerContent?: ReactNode;

  /**
   * Hide the audio button in center (e.g., when mode handles audio differently)
   */
  hideAudioButton?: boolean;
}

/**
 * TestNavigationBar - Unified navigation bar for all test modes.
 *
 * Implements the design system's 3-column button layout:
 * - Left: Cancel button (danger) - exits test with confirmation
 * - Center: Mode-specific actions + Audio replay
 * - Right: Submit/Next button (primary) - advances test
 *
 * Features:
 * - Responsive labels: icons only on mobile, icons + text on desktop
 * - 48px minimum touch targets (WCAG 2.1 AA)
 * - Proper ARIA labels for accessibility
 * - Disabled states during submission
 * - Contextual button text (Next vs Finish, Submit vs Check)
 *
 * @example
 * <TestNavigationBar
 *   onCancel={handleExit}
 *   onPlayAudio={playWord}
 *   onSubmit={submitAnswer}
 *   onNext={nextWord}
 *   showFeedback={false}
 *   isLastWord={false}
 *   canSubmit={hasAnswer}
 *   centerContent={<ClearButton onClick={handleClear} />}
 * />
 */
export function TestNavigationBar({
  onCancel,
  onPlayAudio,
  onSubmit,
  onNext,
  showFeedback,
  isLastWord,
  canSubmit,
  isSubmitting = false,
  isPlayingAudio = false,
  centerContent,
  hideAudioButton = false,
}: TestNavigationBarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-4 mt-4">
      {/* Left: Cancel Button */}
      <Button
        variant="danger"
        onClick={onCancel}
        disabled={isSubmitting}
        aria-label={t("aria.exitTest")}
      >
        <HeroXMarkIcon className="h-4 w-4 sm:mr-2" aria-hidden="true" />
        <span className="hidden sm:inline">{t("test.cancel")}</span>
      </Button>

      {/* Center: Mode-specific actions + Audio */}
      <div className="flex items-center gap-2">
        {centerContent}

        {!hideAudioButton && (
          <Button
            variant="secondary-child"
            onClick={onPlayAudio}
            disabled={isSubmitting || isPlayingAudio}
            aria-label={t("aria.replayAudio")}
          >
            <HeroVolumeIcon
              className={`h-4 w-4 sm:mr-2 ${isPlayingAudio ? "animate-pulse" : ""}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("test.playAgain")}</span>
          </Button>
        )}
      </div>

      {/* Right: Submit/Next Button */}
      {showFeedback ? (
        <Button
          variant="primary-child"
          onClick={onNext}
          disabled={isSubmitting}
          aria-label={isLastWord ? t("aria.completeTest") : t("aria.nextWord")}
        >
          <span className="sm:hidden">
            {isLastWord ? t("test.finishMobile") : t("test.nextMobile")}
          </span>
          <span className="hidden sm:inline">
            {isLastWord ? t("test.finishTest") : t("test.nextWord")}
          </span>
          <HeroArrowRightIcon className="h-4 w-4 sm:ml-2" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          variant="primary-child"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          aria-label={t("aria.submitAnswer")}
          loading={isSubmitting}
        >
          <span className="sm:hidden">
            {isLastWord ? t("test.finishMobile") : t("test.nextMobile")}
          </span>
          <span className="hidden sm:inline">
            {isLastWord ? t("test.finishTest") : t("test.nextWord")}
          </span>
          <HeroArrowRightIcon className="h-4 w-4 sm:ml-2" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

/**
 * ClearButton - Reusable clear button for center slot.
 * Used by LetterTileInput, WordBankInput, MissingLettersInput.
 */
interface ClearButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ClearButton({ onClick, disabled = false }: ClearButtonProps) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap
        min-w-28 sm:min-w-32 px-4 py-3 sm:px-6 sm:py-3 min-h-12
        rounded-xl font-semibold text-base
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-sky focus-visible:ring-offset-2
        ${
          disabled
            ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
            : "bg-nordic-snow text-nordic-midnight border-2 border-nordic-mist cursor-pointer hover:border-nordic-sky hover:shadow-md hover:bg-white"
        }
      `}
      aria-label={t("aria.clearAnswer")}
    >
      {t("challenge.clear")}
    </button>
  );
}
