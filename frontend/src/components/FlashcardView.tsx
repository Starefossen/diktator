"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type FlashcardPhase = "show" | "countdown" | "reveal" | "verify";

interface FlashcardViewProps {
  word: string;
  audioUrl?: string;
  onComplete: (knewIt: boolean, verified?: boolean) => void;
  onSkip?: () => void;
  showDuration?: number; // Duration to show word in ms (default: 3000)
  countdownFrom?: number; // Countdown start number (default: 3)
  allowVerify?: boolean; // Allow "type to verify" option (default: true)
  autoPlayAudio?: boolean; // Auto-play audio when word shows (default: true)
}

/**
 * FlashcardView - Quick Look mode for building familiarity
 *
 * Flow: Show word → Countdown → Reveal → Self-check (with optional verify)
 *
 * This is a lower-pressure mode for building confidence. Children see the word
 * briefly, then self-report whether they knew the spelling.
 *
 * @example
 * <FlashcardView
 *   word="skole"
 *   audioUrl="/api/audio/skole"
 *   onComplete={(knewIt, verified) => handleResult(knewIt, verified)}
 * />
 */
export function FlashcardView({
  word,
  audioUrl,
  onComplete,
  onSkip,
  showDuration = 3000,
  countdownFrom = 3,
  allowVerify = true,
  autoPlayAudio = true,
}: FlashcardViewProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<FlashcardPhase>("show");
  const [countdown, setCountdown] = useState(countdownFrom);
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const [progress, setProgress] = useState(100);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio
  const playAudio = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play failed - user interaction required or audio not available
      });
    }
  }, [audioUrl]);

  // Auto-play audio on show phase
  useEffect(() => {
    if (phase === "show" && autoPlayAudio) {
      playAudio();
    }
  }, [phase, autoPlayAudio, playAudio]);

  // Show phase timer with progress bar
  useEffect(() => {
    if (phase !== "show") return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / showDuration) * 100);
      setProgress(remaining);

      if (elapsed >= showDuration) {
        clearInterval(interval);
        setPhase("countdown");
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase, showDuration]);

  // Countdown phase
  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdown <= 0) {
      setPhase("reveal");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // Focus verify input when shown
  useEffect(() => {
    if (showVerifyInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showVerifyInput]);

  // Reset when word changes
  useEffect(() => {
    setPhase("show");
    setCountdown(countdownFrom);
    setShowVerifyInput(false);
    setVerifyInput("");
    setProgress(100);
  }, [word, countdownFrom]);

  const handleKnewIt = (knewIt: boolean) => {
    onComplete(knewIt, undefined);
  };

  const handleVerify = () => {
    const isCorrect =
      verifyInput.toLowerCase().trim() === word.toLowerCase().trim();
    onComplete(isCorrect, true);
  };

  const handleVerifyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-8">
      {/* Audio element */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      {/* SHOW PHASE */}
      {phase === "show" && (
        <>
          <p className="text-lg text-gray-500">{t("flashcard.show")}</p>

          {/* Word display with audio button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={playAudio}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200"
              aria-label={t("test.listenToWord")}
            >
              🔊
            </button>
            <span className="text-4xl font-bold tracking-wider text-gray-800">
              {word.split("").join(" ")}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-3 w-64 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      {/* COUNTDOWN PHASE */}
      {phase === "countdown" && (
        <>
          <p className="text-lg text-gray-500">{t("flashcard.countdown")}</p>

          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-sky-100">
            <span className="animate-pulse text-6xl font-bold text-sky-600">
              {countdown}
            </span>
          </div>
        </>
      )}

      {/* REVEAL PHASE */}
      {phase === "reveal" && !showVerifyInput && (
        <>
          {/* Word revealed */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={playAudio}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200"
              aria-label={t("test.listenToWord")}
            >
              🔊
            </button>
            <span className="text-4xl font-bold tracking-wider text-gray-800">
              {word.split("").join(" ")}
            </span>
          </div>

          {/* Self-check question */}
          <p className="text-xl font-medium text-gray-700">
            {t("flashcard.reveal")}
          </p>

          {/* Yes/No buttons */}
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => handleKnewIt(true)}
              className="flex min-h-14 min-w-32 items-center justify-center gap-2 rounded-2xl bg-green-500 px-8 py-4 text-xl font-semibold text-white shadow-lg hover:bg-green-600"
            >
              {t("flashcard.yes")} ✓
            </button>
            <button
              type="button"
              onClick={() => handleKnewIt(false)}
              className="flex min-h-14 min-w-32 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-xl font-semibold text-white shadow-lg hover:bg-amber-600"
            >
              {t("flashcard.no")} ✗
            </button>
          </div>

          {/* Optional verify toggle */}
          {allowVerify && (
            <button
              type="button"
              onClick={() => setShowVerifyInput(true)}
              className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300">
                {showVerifyInput && "✓"}
              </span>
              {t("flashcard.verify")}
            </button>
          )}
        </>
      )}

      {/* VERIFY INPUT (optional) */}
      {phase === "reveal" && showVerifyInput && (
        <>
          <p className="text-lg text-gray-500">{t("flashcard.verify")}</p>

          <input
            ref={inputRef}
            type="text"
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            onKeyDown={handleVerifyKeyDown}
            placeholder={t("flashcard.verifyPlaceholder")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-h-14 w-64 rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-xl focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowVerifyInput(false)}
              className="min-h-12 rounded-xl border-2 border-gray-200 px-6 py-3 font-medium text-gray-600 hover:bg-gray-50"
            >
              {t("test.backMobile")}
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={!verifyInput.trim()}
              className="min-h-12 rounded-xl bg-sky-500 px-8 py-3 font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {t("challenge.check")} ✓
            </button>
          </div>
        </>
      )}

      {/* Skip button (available in all phases except verify) */}
      {onSkip && !showVerifyInput && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600"
        >
          {t("challenge.clear")}
        </button>
      )}
    </div>
  );
}
