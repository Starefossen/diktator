import React, { useRef, useState, useCallback, useEffect } from "react";
import { HeroVolumeIcon } from "@/components/Icons";

type AudioPlayButtonSize = "sm" | "md" | "lg";

interface AudioPlayButtonProps {
  /** URL of the audio file to play */
  audioUrl: string;
  /** Mandatory callback when audio finishes (success or error) - use for focus restoration */
  onAudioEnd: () => void;
  /** Accessible label for the button */
  ariaLabel: string;
  /** Button size variant */
  size?: AudioPlayButtonSize;
  /** Optional callback when audio starts playing */
  onAudioStart?: () => void;
  /** Optional callback when audio fails to load/play */
  onAudioError?: () => void;
  /** Auto-play audio on mount or when audioUrl changes */
  autoPlay?: boolean;
  /** Increment to trigger playback externally (e.g., from "play again" button) */
  playTrigger?: number;
  /** Whether audio is being played externally (e.g., by parent for iOS autoplay) - shows spinner */
  isExternallyPlaying?: boolean;
}

const sizeConfig: Record<
  AudioPlayButtonSize,
  { button: string; icon: string; spinner: string }
> = {
  sm: {
    button: "h-10 w-10",
    icon: "h-5 w-5",
    spinner: "-inset-2",
  },
  md: {
    button: "h-14 w-14",
    icon: "h-7 w-7",
    spinner: "-inset-2.5",
  },
  lg: {
    button: "p-4 sm:p-6",
    icon: "h-12 w-12 sm:h-16 sm:w-16",
    spinner: "-inset-3",
  },
};

/**
 * AudioPlayButton - Self-contained audio playback button with gradient styling
 *
 * Manages its own audio playback and state. The mandatory onAudioEnd callback
 * ensures that parent components can restore focus or perform cleanup when audio finishes.
 *
 * Size variants:
 * - sm: Small button (40x40px) for inline/compact usage
 * - md: Medium button (56x56px) for alongside word display
 * - lg: Large button with responsive padding for primary audio interaction
 */
export function AudioPlayButton({
  audioUrl,
  onAudioEnd,
  ariaLabel,
  size = "lg",
  onAudioStart,
  onAudioError,
  autoPlay = false,
  playTrigger = 0,
  isExternallyPlaying = false,
}: AudioPlayButtonProps) {
  const config = sizeConfig[size];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasAutoPlayedRef = useRef(false);
  const lastPlayTriggerRef = useRef(playTrigger);

  // Show spinner if playing internally OR externally
  const showSpinner = isPlaying || isExternallyPlaying;

  const playAudio = useCallback(() => {
    if (isPlaying) return;

    setIsPlaying(true);
    onAudioStart?.();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      onAudioEnd();
    };

    audio.onerror = () => {
      setIsPlaying(false);
      onAudioError?.();
      onAudioEnd();
    };

    audio.play().catch(() => {
      setIsPlaying(false);
      onAudioError?.();
      onAudioEnd();
    });
  }, [audioUrl, isPlaying, onAudioStart, onAudioEnd, onAudioError]);

  // Auto-play on mount or when audioUrl changes
  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      const timer = setTimeout(playAudio, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [audioUrl, autoPlay, playAudio]);

  // External trigger to play audio (e.g., "play again" button in navigation bar)
  useEffect(() => {
    if (playTrigger !== lastPlayTriggerRef.current) {
      lastPlayTriggerRef.current = playTrigger;
      playAudio();
    }
  }, [playTrigger, playAudio]);

  // Reset auto-play flag when audioUrl changes
  useEffect(() => {
    hasAutoPlayedRef.current = false;
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative inline-block">
      {showSpinner && (
        <div
          className={`absolute ${config.spinner} animate-spin rounded-full border-4 border-transparent border-r-nordic-sky/80 border-t-nordic-sky`}
        />
      )}
      <button
        type="button"
        onClick={playAudio}
        className={`
          relative flex items-center justify-center rounded-full
          bg-linear-to-r from-nordic-meadow to-nordic-sky
          text-nordic-midnight shadow-lg
          transition-all duration-200
          hover:scale-105 hover:from-nordic-meadow/90 hover:to-nordic-sky/90 hover:shadow-xl
          ${config.button}
        `}
        aria-label={ariaLabel}
      >
        <HeroVolumeIcon
          className={`${config.icon} text-nordic-midnight`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
