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
}: TestAudioButtonProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-4">
        <AudioPlayButton
          audioUrl={audioUrl}
          onAudioEnd={onAudioEnd}
          onAudioStart={onAudioStart}
          ariaLabel={t("test.listenToWord")}
          size="lg"
          playTrigger={playTrigger}
          isExternallyPlaying={isExternallyPlaying}
          autoPlay={autoPlay}
        />
      </div>

      {/* Instruction text - always render to prevent layout shift */}
      <p className={`mt-4 text-gray-600 ${showInstruction ? "" : "invisible"}`}>
        <span className="sm:hidden">{t("test.listenToWordMobile")}</span>
        <span className="hidden sm:inline">{t("test.listenToWord")}</span>
      </p>

      {/* Definition/context hint - always render to prevent layout shift */}
      <div
        className={`mx-auto mt-3 max-w-md rounded-lg border border-nordic-sky/30 bg-nordic-sky/10 px-4 py-2 text-sm ${definition ? "" : "invisible"}`}
      >
        <p className="text-nordic-midnight">
          <span className="font-medium">{t("test.context")}</span>{" "}
          {definition || "\u00A0"}
        </p>
      </div>
    </div>
  );
}
