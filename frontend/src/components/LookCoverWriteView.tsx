"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import Stavle from "@/components/Stavle";
import type { NavigationActions } from "@/lib/testEngine/types";

type LCWPhase = "look" | "cover" | "write" | "check";

interface LookCoverWriteViewProps {
  word: string;
  audioUrl?: string;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  onSkip?: () => void;
  lookDuration?: number; // Duration to show word in ms (default: 4000)
  autoPlayAudio?: boolean; // Auto-play audio when word shows (default: true)
  /** Navigation actions for unified button handling */
  navigation?: NavigationActions;
  /** Initial phase for dev/demo purposes */
  initialPhase?: LCWPhase;
  /** Initial isCorrect state for dev/demo purposes (requires initialPhase="check") */
  initialIsCorrect?: boolean;
  /** Initial user input for dev/demo purposes (requires initialPhase="check") */
  initialUserInput?: string;
  /** Optional callback when audio starts playing (for parent state tracking) */
  onAudioStart?: () => void;
  /** Optional callback when audio finishes playing (for parent state tracking) */
  onAudioEnd?: () => void;
}

/**
 * LookCoverWriteView - Memory Spell mode based on Look-Say-Cover-Write-Check method
 *
 * Flow: Look (see word + audio) → Cover (hide word) → Write (type from memory) → Check (compare)
 *
 * This is a more rigorous mode than Flashcard - requires actually typing the word
 * from memory. Based on the evidence-based "Look, Say, Cover, Write, Check" method
 * widely used in schools.
 *
 * @example
 * <LookCoverWriteView
 *   word="skole"
 *   audioUrl="/api/audio/skole"
 *   onComplete={(answer, correct) => handleResult(answer, correct)}
 * />
 */
export function LookCoverWriteView({
  word,
  audioUrl,
  onSubmit,
  onSkip,
  lookDuration = 4000,
  autoPlayAudio = true,
  navigation,
  initialPhase = "look",
  initialIsCorrect,
  initialUserInput = "",
  onAudioStart,
  onAudioEnd: onAudioEndProp,
}: LookCoverWriteViewProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<LCWPhase>(initialPhase);
  const [userInput, setUserInput] = useState(initialUserInput);
  const [progress, setProgress] = useState(100);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    initialIsCorrect ?? null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  // Callback to restore focus after audio ends
  const handleAudioEnd = useCallback(() => {
    if (phase === "write" && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
    onAudioEndProp?.();
  }, [phase, onAudioEndProp]);

  // Look phase timer with progress bar
  useEffect(() => {
    if (phase !== "look") return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / lookDuration) * 100);
      setProgress(remaining);

      if (elapsed >= lookDuration) {
        clearInterval(interval);
        setPhase("cover");
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase, lookDuration]);

  // Focus input when entering write phase
  useEffect(() => {
    if (phase === "write" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // Reset when word changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setPhase("look");
    setUserInput("");
    setProgress(100);
    setIsCorrect(null);
  }, [word]);

  const handleReady = () => {
    setPhase("write");
  };

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    const correct =
      userInput.toLowerCase().trim() === word.toLowerCase().trim();
    setIsCorrect(correct);
    setPhase("check");
    onSubmit(userInput, correct);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Helper to display word with letter spacing
  const spacedWord = (w: string) => w.split("").join(" ");

  return (
    <div className="flex min-h-96 flex-col items-center justify-center gap-8">
      {/* LOOK PHASE - Show the word */}
      {phase === "look" && (
        <>
          <div className="rounded-xl bg-sky-50 px-6 py-2 text-sm font-medium uppercase tracking-wider text-sky-600">
            {t("lookCoverWrite.look")}
          </div>

          {/* Word display with audio button */}
          <div className="flex items-center gap-4">
            {audioUrl && (
              <AudioPlayButton
                audioUrl={audioUrl}
                onAudioEnd={handleAudioEnd}
                onAudioStart={onAudioStart}
                ariaLabel={t("test.listenToWord")}
                size="md"
                autoPlay={autoPlayAudio && phase === "look"}
              />
            )}
            <span className="text-4xl font-bold tracking-wider text-gray-800">
              {spacedWord(word)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-3 w-64 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-sm text-gray-500">{t("lookCoverWrite.look")}</p>
        </>
      )}

      {/* COVER PHASE - Word hidden, ready prompt */}
      {phase === "cover" && (
        <>
          <div className="rounded-xl bg-amber-50 px-6 py-2 text-sm font-medium uppercase tracking-wider text-amber-600">
            {t("lookCoverWrite.cover")}
          </div>

          {/* Thinking illustration - using question mark circle */}
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-amber-100 to-amber-200 text-amber-600">
            <span className="text-6xl font-bold">?</span>
          </div>

          <p className="text-xl font-medium text-gray-700">
            {t("lookCoverWrite.cover")}
          </p>

          <button
            type="button"
            onClick={handleReady}
            className="min-h-14 rounded-2xl bg-sky-500 px-12 py-4 text-xl font-semibold text-white shadow-lg hover:bg-sky-600"
          >
            {t("lookCoverWrite.ready")}
          </button>
        </>
      )}

      {/* WRITE PHASE - Type the word from memory */}
      {phase === "write" && (
        <>
          <div className="rounded-xl bg-green-50 px-6 py-2 text-sm font-medium uppercase tracking-wider text-green-600">
            {t("lookCoverWrite.write")}
          </div>

          <p className="text-xl font-medium text-gray-700">
            {t("lookCoverWrite.write")}
          </p>

          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("test.typeWordHere")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-h-14 w-72 rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-2xl focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="min-h-12 rounded-xl bg-nordic-sky px-8 py-3 font-semibold text-white hover:bg-nordic-sky/90 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {t("challenge.check")}
            <CheckIconSolid className="w-5 h-5" aria-hidden="true" />
          </button>
        </>
      )}

      {/* CHECK PHASE - Compare answers */}
      {phase === "check" && (
        <div className="w-full flex flex-col items-center gap-8">
          {/* Phase header */}
          <div
            className={`rounded-xl px-6 py-2 text-sm font-medium uppercase tracking-wider ${isCorrect
              ? "bg-green-50 text-green-600"
              : "bg-amber-50 text-amber-600"
              }`}
          >
            {t("lookCoverWrite.check")}
          </div>

          {/* Side-by-side comparison */}
          <div className="w-full flex flex-col gap-4 rounded-2xl bg-gray-50 p-6">
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-sm text-gray-500">
                {t("lookCoverWrite.yourAnswer")}:
              </span>
              <span
                className={`text-2xl font-semibold tracking-wider ${isCorrect ? "text-green-600" : "text-red-500"
                  }`}
              >
                {spacedWord(userInput)}
              </span>
              {isCorrect ? (
                <CheckIconSolid
                  className="w-6 h-6 text-green-500"
                  aria-hidden="true"
                />
              ) : (
                <XMarkIcon
                  className="w-6 h-6 text-red-500"
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-sm text-gray-500">
                {t("lookCoverWrite.correct")}:
              </span>
              <span className="text-2xl font-semibold tracking-wider text-gray-800">
                {spacedWord(word)}
              </span>
              {audioUrl && (
                <AudioPlayButton
                  audioUrl={audioUrl}
                  onAudioEnd={handleAudioEnd}
                  onAudioStart={onAudioStart}
                  ariaLabel={t("test.listenToWord")}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Full-width Stavle feedback box */}
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

      {/* Skip button (not in check phase) */}
      {(onSkip || navigation?.onCancel) && phase !== "check" && (
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
