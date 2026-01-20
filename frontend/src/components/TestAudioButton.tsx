import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AudioPlayButton } from "@/components/AudioPlayButton";

interface TestAudioButtonProps {
  /** URL of the audio file to play */
  audioUrl: string;
  /** Callback when audio finishes - use for focus restoration */
  onAudioEnd: () => void;
  /** Whether to show the instruction text (use false during feedback to hide but preserve space) */
  showInstruction: boolean;
  /** Definition/context hint (pass empty string during feedback to hide but preserve space) */
  definition: string;
  /** Optional callback when audio starts playing */
  onAudioStart?: () => void;
  /** Increment to trigger playback externally (e.g., from "play again" button) */
  playTrigger?: number;
  /** Whether audio is being played externally (e.g., by parent for iOS autoplay) - shows spinner */
  isExternallyPlaying?: boolean;
  /** Auto-play audio on mount or when audioUrl changes */
  autoPlay?: boolean;
  /** Custom i18n key for instruction text (defaults to test.listenToWord) */
  instructionKey?:
  | "test.listenToWord"
  | "test.translateWord"
  | "test.instruction.letterTiles"
  | "test.instruction.wordBank"
  | "test.instruction.keyboard"
  | "test.instruction.missingLetters";
  /** Whether to completely hide instruction and definition (not just invisible) */
  hideInstructionArea?: boolean;
}

/**
 * TestAudioButton - Audio playback button with instruction text and definition hint
 *
 * Extracted from TestView to eliminate duplication across different test modes.
 * Uses AudioPlayButton for the actual button, adds instruction and definition containers.
 * Always renders instruction and definition containers to prevent layout shift.
 */
export function TestAudioButton({
  audioUrl,
  onAudioEnd,
  showInstruction,
  definition,
  onAudioStart,
  playTrigger,
  isExternallyPlaying,
  autoPlay = false,
  instructionKey = "test.listenToWord",
  hideInstructionArea = false,
}: TestAudioButtonProps) {
  const { t } = useLanguage();

  // Get instruction text based on key
  const instructionText = t(instructionKey);
  const mobileInstructionText =
    instructionKey === "test.listenToWord"
      ? t("test.listenToWordMobile")
      : instructionText;

  return (
    <div className={hideInstructionArea ? "mb-4" : "mb-8"}>
      <div className="flex items-center justify-center gap-4">
        <AudioPlayButton
          audioUrl={audioUrl}
          onAudioEnd={onAudioEnd}
          onAudioStart={onAudioStart}
          ariaLabel={instructionText}
          size="lg"
          playTrigger={playTrigger}
          isExternallyPlaying={isExternallyPlaying}
          autoPlay={autoPlay}
        />
      </div>

      {/* Instruction text - hide completely if hideInstructionArea, otherwise use invisible for layout */}
      {!hideInstructionArea && (
        <p
          className={`mt-4 text-gray-600 ${showInstruction ? "" : "invisible"}`}
        >
          <span className="sm:hidden">{mobileInstructionText}</span>
          <span className="hidden sm:inline">{instructionText}</span>
        </p>
      )}

      {/* Definition/context hint - only render if we have a definition and not hiding instruction area */}
      {!hideInstructionArea && definition && (
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
