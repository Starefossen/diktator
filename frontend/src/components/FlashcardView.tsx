"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import Stavle from "@/components/Stavle";
import type { NavigationActions } from "@/lib/testEngine/types";

type FlashcardPhase = "show" | "countdown" | "reveal" | "verify" | "check";

interface FlashcardViewProps {
  word: string;
  audioUrl?: string;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  onSkip?: () => void;
  showDuration?: number; // Duration to show word in ms (default: 3000)
  countdownFrom?: number; // Countdown start number (default: 3)
  allowVerify?: boolean; // Allow "type to verify" option (default: true)
  autoPlayAudio?: boolean; // Auto-play audio when word shows (default: true)
  /** Navigation actions for unified button handling */
  navigation?: NavigationActions;
  /** Initial phase for dev/demo purposes */
  initialPhase?: FlashcardPhase;
  /** Initial isCorrect state for dev/demo purposes (requires initialPhase="check") */
  initialIsCorrect?: boolean;
  /** Optional callback when audio starts playing (for parent state tracking) */
  onAudioStart?: () => void;
  /** Optional callback when audio finishes playing (for parent state tracking) */
  onAudioEnd?: () => void;
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
  onSubmit,
  onSkip,
  showDuration = 3000,
  countdownFrom = 3,
  allowVerify = true,
  autoPlayAudio = true,
  navigation,
  initialPhase = "show",
  initialIsCorrect,
  onAudioStart,
  onAudioEnd: onAudioEndProp,
}: FlashcardViewProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<FlashcardPhase>(initialPhase);
  const [countdown, setCountdown] = useState(countdownFrom);
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const [progress, setProgress] = useState(100);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    initialIsCorrect ?? null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  // Callback to restore focus after audio ends
  const handleAudioEnd = useCallback(() => {
    if (showVerifyInput && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
    onAudioEndProp?.();
  }, [showVerifyInput, onAudioEndProp]);

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

  // Reset when word changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPhase("show");
    setCountdown(countdownFrom);
    setShowVerifyInput(false);
    setVerifyInput("");
    setProgress(100);
    setIsCorrect(null);
  }, [word, countdownFrom]);

  const handleKnewIt = (knewIt: boolean) => {
    // Return word if they knew it, empty string if not
    onSubmit(knewIt ? word : "", knewIt);
  };

  const handleVerify = () => {
    const correct =
      verifyInput.toLowerCase().trim() === word.toLowerCase().trim();
    setIsCorrect(correct);
    setPhase("check");
    onSubmit(verifyInput, correct);
  };

  const handleVerifyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-8">
      {/* SHOW PHASE */}
      {phase === "show" && (
        <>
          <p className="text-lg text-gray-500">{t("flashcard.show")}</p>

          {/* Word display with audio button */}
          <div className="flex items-center gap-4">
            {audioUrl && (
              <AudioPlayButton
                audioUrl={audioUrl}
                onAudioEnd={handleAudioEnd}
                onAudioStart={onAudioStart}
                ariaLabel={t("test.listenToWord")}
                size="md"
                autoPlay={autoPlayAudio && phase === "show"}
              />
            )}
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
            {audioUrl && (
              <AudioPlayButton
                audioUrl={audioUrl}
                onAudioEnd={handleAudioEnd}
                onAudioStart={onAudioStart}
                ariaLabel={t("test.listenToWord")}
                size="md"
              />
            )}
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
              {t("flashcard.yes")}
              <CheckIconSolid className="w-6 h-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleKnewIt(false)}
              className="flex min-h-14 min-w-32 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-xl font-semibold text-white shadow-lg hover:bg-amber-600"
            >
              {t("flashcard.no")}
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
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
                {showVerifyInput && <CheckIcon className="w-3 h-3" />}
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
              className="min-h-12 rounded-xl bg-nordic-sky px-8 py-3 font-semibold text-white hover:bg-nordic-sky/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {t("challenge.check")}
              <CheckIconSolid className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {/* CHECK PHASE - Show success/fail after verify */}
      {phase === "check" && isCorrect !== null && (
        <div className="w-full flex flex-col items-center gap-8">
          {/* Word display */}
          <span className="text-4xl font-bold tracking-wider text-green-600">
            {word.split("").join(" ")}
          </span>

          {/* Full-width feedback box matching CorrectFeedback pattern */}
          <div
            className={`w-full rounded-lg overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300 ${isCorrect
              ? "bg-green-100 border border-green-300"
              : "bg-amber-100 border border-amber-300"
              }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-center gap-3">
                <Stavle
                  pose={isCorrect ? "celebrating" : "encouraging"}
                  size={64}
                  animate
                />
                <p
                  className={`text-lg font-semibold flex items-center gap-2 ${isCorrect ? "text-green-800" : "text-amber-800"
                    }`}
                >
                  {isCorrect ? (
                    <CheckIconSolid
                      className="w-7 h-7 text-green-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <XMarkIcon
                      className="w-7 h-7 text-amber-600"
                      aria-hidden="true"
                    />
                  )}
                  {isCorrect
                    ? t("test.feedback.correct")
                    : t("test.feedback.almostThere")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip button (available in all phases except verify and check) */}
      {(onSkip || navigation?.onCancel) &&
        !showVerifyInput &&
        phase !== "check" && (
          <button
            type="button"
            onClick={navigation?.onCancel || onSkip}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            {t("test.cancel")}
          </button>
        )}
    </div>
  );
}
