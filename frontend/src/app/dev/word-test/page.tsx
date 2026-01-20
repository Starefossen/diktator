"use client";

/**
 * Development Page: Word Test Mode Component Showcase
 *
 * IMPORTANT: This page should have 0% mocks. All UI shown here must use the
 * actual production components with their real props. If something looks wrong
 * here, it will look wrong in production. If this page uses fake/hardcoded UI,
 * it provides zero value for development.
 *
 * Each section demonstrates a test mode in its three states:
 * - Input: Initial state for user interaction
 * - Error: Feedback state showing incorrect answer
 * - Success: Feedback state showing correct answer
 */

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LetterTileInput,
  TileFeedbackState,
} from "@/components/LetterTileInput";
import { WordBankInput } from "@/components/WordBankInput";
import {
  MissingLettersInput,
  detectSpellingChallenge,
} from "@/components/MissingLettersInput";
import { FlashcardView } from "@/components/FlashcardView";
import { LookCoverWriteView } from "@/components/LookCoverWriteView";
import { ListeningTranslationInput } from "@/components/ListeningTranslationInput";
import {
  SpellingFeedback,
  CorrectFeedback,
} from "@/components/SpellingFeedback";
import { TestResultsView } from "@/components/TestResultsView";
import { HeroVolumeIcon } from "@/components/Icons";
import { generateLetterTiles, generateWordBank } from "@/lib/challenges";
import {
  analyzeSpelling,
  DEFAULT_SPELLING_CONFIG,
} from "@/lib/spellingAnalysis";
import { TIMING } from "@/lib/timingConfig";
import type { TestMode, TestAnswer, XPInfo } from "@/types";
import type { WordSet } from "@/types";

type ViewState = "input" | "error" | "success";

const TEST_WORD = "skole";
const TEST_SENTENCE = "Katten sover";
const WRONG_ANSWER = "skule";

const MOCK_WORDSET: WordSet = {
  id: "test-1",
  name: "Test Word Set",
  language: "no",
  words: [{ word: TEST_WORD }, { word: "hund" }, { word: "katt" }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "test-user",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-nordic-sky pb-2">
      {children}
    </h2>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-lg text-gray-600 mb-2">{children}</p>;
}

function StateLabel({ state }: { state: ViewState }) {
  const colors = {
    input: "bg-blue-100 text-blue-800 border-blue-300",
    error: "bg-red-100 text-red-800 border-red-300",
    success: "bg-green-100 text-green-800 border-green-300",
  };
  const labels = {
    input: "Input State",
    error: "Error State",
    success: "Success State",
  };
  return (
    <span
      className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${colors[state]}`}
    >
      {labels[state]}
    </span>
  );
}

function ModeCard({
  title,
  state,
  children,
}: {
  title: string;
  state: ViewState;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <StateLabel state={state} />
      </div>
      <div className="min-h-64">{children}</div>
    </div>
  );
}

function MockAudioButton() {
  return (
    <div className="mb-6 flex justify-center">
      <div className="relative inline-block">
        <button
          className="relative transform rounded-full bg-linear-to-r from-nordic-meadow to-nordic-sky p-4 text-nordic-midnight shadow-lg transition-all duration-200 hover:scale-105 sm:p-6"
          aria-label="Play audio (mock)"
        >
          <HeroVolumeIcon className="h-12 w-12 text-nordic-midnight sm:h-16 sm:w-16" />
        </button>
      </div>
    </div>
  );
}

function LetterTilesSection() {
  const tiles = generateLetterTiles(TEST_WORD);
  const wrongTiles = generateLetterTiles(WRONG_ANSWER);

  const errorAnalysis = analyzeSpelling(
    WRONG_ANSWER,
    TEST_WORD,
    DEFAULT_SPELLING_CONFIG,
  );
  const errorFeedbackState: TileFeedbackState = {
    analysis: errorAnalysis,
    currentAttempt: 1,
    maxAttempts: 3,
    hintKey: null,
    lastUserAnswer: WRONG_ANSWER,
  };

  return (
    <section className="mb-12">
      <SectionTitle>Letter Tiles (Build It)</SectionTitle>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="Letter Tiles" state="input">
          <MockAudioButton />
          <Instruction>Sett sammen bokstavene til ordet</Instruction>
          <LetterTileInput
            tiles={tiles}
            expectedWord={TEST_WORD}
            onSubmit={() => {}}
            disabled={false}
            feedbackState={null}
            showingCorrectFeedback={false}
          />
        </ModeCard>

        <ModeCard title="Letter Tiles" state="error">
          <MockAudioButton />
          <Instruction>Sett sammen bokstavene til ordet</Instruction>
          <LetterTileInput
            tiles={wrongTiles}
            expectedWord={TEST_WORD}
            onSubmit={() => {}}
            disabled={true}
            feedbackState={errorFeedbackState}
            showingCorrectFeedback={false}
            timerDurationMs={TIMING.FEEDBACK_DISPLAY_MS}
          />
        </ModeCard>

        <ModeCard title="Letter Tiles" state="success">
          <MockAudioButton />
          <Instruction>Sett sammen bokstavene til ordet</Instruction>
          <div className="flex flex-col gap-4">
            {/* Answer area with green tiles */}
            <div className="flex flex-wrap justify-center gap-2 p-4 pb-8 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 min-h-20">
              {TEST_WORD.split("").map((letter, i) => (
                <span
                  key={i}
                  className="min-w-12 min-h-12 w-12 h-12 rounded-lg font-bold text-xl uppercase flex items-center justify-center bg-green-100 text-green-800 border-2 border-green-400 shadow-md"
                >
                  {letter}
                </span>
              ))}
            </div>
            <CorrectFeedback />
          </div>
        </ModeCard>
      </div>
    </section>
  );
}

function WordBankSection() {
  const items = generateWordBank(TEST_SENTENCE, MOCK_WORDSET);

  return (
    <section className="mb-12">
      <SectionTitle>Word Bank (Pick Words)</SectionTitle>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="Word Bank" state="input">
          <MockAudioButton />
          <Instruction>Trykk på ordene for å bygge setningen</Instruction>
          <WordBankInput
            items={items}
            expectedWordCount={2}
            expectedAnswer={TEST_SENTENCE}
            onSubmit={() => {}}
            disabled={false}
          />
        </ModeCard>

        <ModeCard title="Word Bank" state="error">
          <MockAudioButton />
          <Instruction>Trykk på ordene for å bygge setningen</Instruction>
          <div className="flex flex-col gap-4">
            {/* Word pills with inline error feedback */}
            <div className="flex flex-wrap justify-center gap-2 p-4 bg-red-50 rounded-xl border-2 border-red-200 min-h-20">
              <span className="px-4 py-2 min-h-12 rounded-lg font-semibold text-base bg-green-100 text-green-800 border-2 border-green-400 shadow-md">
                Katten
              </span>
              <span className="px-4 py-2 min-h-12 rounded-lg font-semibold text-base bg-red-100 text-red-700 border-2 border-red-400 shadow-md relative">
                sovr
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-red-500 font-medium">
                  sover
                </span>
              </span>
            </div>

            {/* Legend - matches Letter Tiles */}
            <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-600 mt-2">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded" />
                Helt riktig
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded" />
                Ikke helt
              </span>
            </div>

            {/* Feedback status - below legend like Letter Tiles */}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="font-semibold text-red-700">
                Prøv igjen (1/3)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                Nesten der!
              </span>
            </div>
          </div>
        </ModeCard>

        <ModeCard title="Word Bank" state="success">
          <MockAudioButton />
          <Instruction>Trykk på ordene for å bygge setningen</Instruction>
          <div className="flex flex-col gap-4">
            {/* Answer area with green word pills */}
            <div className="flex flex-wrap justify-center gap-2 p-4 pb-8 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 min-h-20">
              {TEST_SENTENCE.split(" ").map((word, i) => (
                <span
                  key={i}
                  className="px-4 py-2 min-h-12 rounded-lg font-semibold text-base bg-green-100 text-green-800 border-2 border-green-400 shadow-md flex items-center justify-center"
                >
                  {word}
                </span>
              ))}
            </div>
            <CorrectFeedback />
          </div>
        </ModeCard>
      </div>
    </section>
  );
}

function KeyboardSection() {
  const { t } = useLanguage();

  return (
    <section className="mb-12">
      <SectionTitle>Keyboard (Type It)</SectionTitle>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="Keyboard" state="input">
          <MockAudioButton />
          <Instruction>Skriv ordet du hører</Instruction>
          <input
            type="text"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-xl"
            placeholder={t("test.typeWordHere")}
            defaultValue=""
          />
          <p className="mt-4 text-center text-sm text-gray-500">
            {t("test.attemptsRemaining")}: 3
          </p>
        </ModeCard>

        <ModeCard title="Keyboard" state="error">
          <MockAudioButton />
          <Instruction>Skriv ordet du hører</Instruction>
          <SpellingFeedback
            userAnswer={WRONG_ANSWER}
            expectedWord={TEST_WORD}
            analysis={analyzeSpelling(
              WRONG_ANSWER,
              TEST_WORD,
              DEFAULT_SPELLING_CONFIG,
            )}
            currentAttempt={1}
            maxAttempts={3}
          />
        </ModeCard>

        <ModeCard title="Keyboard" state="success">
          <MockAudioButton />
          <Instruction>Skriv ordet du hører</Instruction>
          <div className="flex flex-col gap-4">
            {/* Answer area with green tiles */}
            <div className="flex flex-wrap justify-center gap-2 p-4 pb-8 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 min-h-20">
              {TEST_WORD.split("").map((letter, i) => (
                <span
                  key={i}
                  className="min-w-12 min-h-12 w-12 h-12 rounded-lg font-bold text-xl uppercase flex items-center justify-center bg-green-100 text-green-800 border-2 border-green-400 shadow-md"
                >
                  {letter}
                </span>
              ))}
            </div>
            <CorrectFeedback />
          </div>
        </ModeCard>
      </div>
    </section>
  );
}

function MissingLettersSection() {
  const challenge = detectSpellingChallenge("mann") || {
    blankedWord: "ma__",
    missingLetters: "nn",
    challengeType: "doubleConsonant",
  };

  return (
    <section className="mb-12">
      <SectionTitle>Missing Letters (Fill the Gap)</SectionTitle>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="Missing Letters" state="input">
          <MockAudioButton />
          <MissingLettersInput
            word="mann"
            blankedWord={challenge.blankedWord}
            missingLetters={challenge.missingLetters}
            onSubmit={() => {}}
            autoFocus={false}
          />
        </ModeCard>

        <ModeCard title="Missing Letters" state="error">
          <MockAudioButton />
          <Instruction>Fyll inn de manglende bokstavene</Instruction>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-4 pb-8 min-h-20">
              <span className="inline-flex min-w-12 min-h-12 w-12 h-12 items-center justify-center rounded-lg bg-nordic-sky text-xl font-bold uppercase text-white shadow-md">
                m
              </span>
              <span className="inline-flex min-w-12 min-h-12 w-12 h-12 items-center justify-center rounded-lg bg-nordic-sky text-xl font-bold uppercase text-white shadow-md">
                a
              </span>
              <span className="inline-flex min-w-12 min-h-12 w-12 h-12 items-center justify-center rounded-lg bg-red-100 text-xl font-bold uppercase text-red-700 border-2 border-red-400 relative">
                m
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-red-500 font-medium">
                  n
                </span>
              </span>
              <span className="inline-flex min-w-12 min-h-12 w-12 h-12 items-center justify-center rounded-lg bg-red-100 text-xl font-bold uppercase text-red-700 border-2 border-red-400 relative">
                n
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-red-500 font-medium">
                  n
                </span>
              </span>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-nordic-sky rounded" />
                Gitt
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded" />
                Ikke helt
              </span>
            </div>
            {/* Feedback status */}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="font-semibold text-red-700">
                Prøv igjen (1/3)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                Nesten der!
              </span>
            </div>
          </div>
        </ModeCard>

        <ModeCard title="Missing Letters" state="success">
          <MockAudioButton />
          <MissingLettersInput
            word="mann"
            blankedWord={challenge.blankedWord}
            missingLetters={challenge.missingLetters}
            onSubmit={() => {}}
            autoFocus={false}
            initialHasSubmitted={true}
            initialIsCorrect={true}
          />
        </ModeCard>
      </div>
    </section>
  );
}

function FlashcardSection() {
  const { t } = useLanguage();

  return (
    <section className="mb-12">
      <SectionTitle>Flashcard (Quick Look)</SectionTitle>
      <p className="mb-4 text-gray-600">
        Flashcard has phases: show → countdown → reveal. Each phase shown below.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="Flashcard - Show Phase" state="input">
          <FlashcardView
            word={TEST_WORD}
            onSubmit={() => {}}
            showDuration={999999}
            autoPlayAudio={false}
          />
        </ModeCard>

        <ModeCard title="Flashcard - Self Report" state="error">
          <div className="flex min-h-64 flex-col items-center justify-center gap-6">
            <p className="text-lg text-gray-500">{t("flashcard.reveal")}</p>
            <p className="text-4xl font-bold tracking-wider text-gray-800">
              {TEST_WORD.split("").join(" ")}
            </p>
            <div className="flex gap-6">
              <button className="flex min-h-14 min-w-32 items-center justify-center gap-2 rounded-2xl bg-green-500 px-8 py-4 text-xl font-semibold text-white shadow-lg">
                {t("flashcard.yes")} ✓
              </button>
              <button className="flex min-h-14 min-w-32 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-xl font-semibold text-white shadow-lg">
                {t("flashcard.no")} ✗
              </button>
            </div>
          </div>
        </ModeCard>

        <ModeCard title="Flashcard - Verified" state="success">
          <FlashcardView
            word={TEST_WORD}
            onSubmit={() => {}}
            autoPlayAudio={false}
            initialPhase="check"
            initialIsCorrect={true}
          />
        </ModeCard>
      </div>
    </section>
  );
}

function LookCoverWriteSection() {
  return (
    <section className="mb-12">
      <SectionTitle>Look Cover Write (Memory Spell)</SectionTitle>
      <p className="mb-4 text-gray-600">
        LCW has phases: look → cover → write → check. Key phases shown below.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="LCW - Look Phase" state="input">
          <LookCoverWriteView
            word={TEST_WORD}
            onSubmit={() => {}}
            lookDuration={999999}
            autoPlayAudio={false}
          />
        </ModeCard>

        <ModeCard title="LCW - Check (Wrong)" state="error">
          <LookCoverWriteView
            word={TEST_WORD}
            onSubmit={() => {}}
            autoPlayAudio={false}
            initialPhase="check"
            initialIsCorrect={false}
            initialUserInput="skule"
          />
        </ModeCard>

        <ModeCard title="LCW - Check (Correct)" state="success">
          <LookCoverWriteView
            word={TEST_WORD}
            onSubmit={() => {}}
            autoPlayAudio={false}
            initialPhase="check"
            initialIsCorrect={true}
            initialUserInput={TEST_WORD}
          />
        </ModeCard>
      </div>
    </section>
  );
}

function TranslationSection() {
  const { t } = useLanguage();

  return (
    <section className="mb-12">
      <SectionTitle>Translation (Switch Languages)</SectionTitle>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="Translation" state="input">
          <MockAudioButton />
          <Instruction>Oversett ordet</Instruction>
          <div className="flex flex-col gap-4">
            {/* Source → Input area */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 pb-8 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 min-h-20">
              <span className="text-2xl font-semibold text-gray-600">
                skole
              </span>
              <span className="text-xl text-gray-400">→</span>
              <input
                type="text"
                className="px-4 py-2 min-h-12 rounded-lg border-2 border-gray-300 text-xl text-center w-32"
                placeholder={t("common.english")}
                defaultValue=""
              />
            </div>
            <p className="text-center text-sm text-gray-500">
              {t("test.attemptsRemaining")}: 3
            </p>
          </div>
        </ModeCard>

        <ModeCard title="Translation" state="error">
          <MockAudioButton />
          <Instruction>Oversett ordet</Instruction>
          <SpellingFeedback
            userAnswer="scool"
            expectedWord="school"
            analysis={analyzeSpelling(
              "scool",
              "school",
              DEFAULT_SPELLING_CONFIG,
            )}
            currentAttempt={1}
            maxAttempts={3}
          />
        </ModeCard>

        <ModeCard title="Translation" state="success">
          <MockAudioButton />
          <Instruction>Oversett ordet</Instruction>
          <div className="flex flex-col gap-4">
            {/* Source → Destination translation display */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 pb-8 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 min-h-20">
              <span className="text-2xl font-semibold text-gray-600">
                skole
              </span>
              <span className="text-xl text-gray-400">→</span>
              <span className="px-4 py-2 min-h-12 rounded-lg font-bold text-xl bg-green-100 text-green-800 border-2 border-green-400 shadow-md flex items-center justify-center">
                school
              </span>
            </div>
            <CorrectFeedback />
          </div>
        </ModeCard>
      </div>
    </section>
  );
}

function ListeningTranslationSection() {
  const { t } = useLanguage();

  return (
    <section className="mb-12">
      <SectionTitle>Listening Translation (Hear & Translate)</SectionTitle>
      <p className="mb-4 text-gray-600">
        User hears audio and types translation. Source word is hidden - audio is
        the only stimulus.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        <ModeCard title="Listening Translation" state="input">
          <MockAudioButton />
          <ListeningTranslationInput
            expectedAnswer="school"
            userAnswer=""
            onUserAnswerChange={() => {}}
            onSubmit={() => {}}
            sourceWord="skole"
            originalWord="skole"
            direction="toTarget"
            targetLanguage="en"
            sourceLanguage="no"
            wordSetId="test-wordset-id"
          />
        </ModeCard>

        <ModeCard title="Listening Translation" state="error">
          <MockAudioButton />
          <Instruction>Lytt og oversett</Instruction>
          <SpellingFeedback
            userAnswer="scool"
            expectedWord="school"
            analysis={analyzeSpelling(
              "scool",
              "school",
              DEFAULT_SPELLING_CONFIG,
            )}
            currentAttempt={1}
            maxAttempts={3}
          />
        </ModeCard>

        <ModeCard title="Listening Translation" state="success">
          <MockAudioButton />
          <Instruction>Lytt og oversett</Instruction>
          <div className="flex flex-col gap-4">
            {/* Language direction indicator */}
            <div className="flex items-center justify-center gap-3 text-gray-500">
              <span className="text-sm">{t("common.norwegian")}</span>
              <span className="text-lg">→</span>
              <span className="text-sm font-medium text-gray-700">
                {t("common.english")}
              </span>
            </div>
            {/* Success answer display */}
            <div className="flex justify-center">
              <span className="px-4 py-2 min-h-12 rounded-lg font-bold text-xl bg-green-100 text-green-800 border-2 border-green-400 shadow-md flex items-center justify-center">
                school
              </span>
            </div>
            <CorrectFeedback />
          </div>
        </ModeCard>
      </div>
    </section>
  );
}

function ResultsSection() {
  // Mock test data for high score scenario (100%)
  const highScoreAnswers: TestAnswer[] = [
    {
      word: "skole",
      userAnswers: ["skole"],
      isCorrect: true,
      timeSpent: 5,
      attempts: 1,
      finalAnswer: "skole",
      audioPlayCount: 1,
    },
    {
      word: "hund",
      userAnswers: ["hund"],
      isCorrect: true,
      timeSpent: 4,
      attempts: 1,
      finalAnswer: "hund",
      audioPlayCount: 1,
    },
    {
      word: "katt",
      userAnswers: ["katt"],
      isCorrect: true,
      timeSpent: 3,
      attempts: 1,
      finalAnswer: "katt",
      audioPlayCount: 1,
    },
    {
      word: "bil",
      userAnswers: ["bil"],
      isCorrect: true,
      timeSpent: 4,
      attempts: 1,
      finalAnswer: "bil",
      audioPlayCount: 1,
    },
    {
      word: "hus",
      userAnswers: ["hus"],
      isCorrect: true,
      timeSpent: 5,
      attempts: 1,
      finalAnswer: "hus",
      audioPlayCount: 1,
    },
    {
      word: "bok",
      userAnswers: ["bok"],
      isCorrect: true,
      timeSpent: 3,
      attempts: 1,
      finalAnswer: "bok",
      audioPlayCount: 1,
    },
    {
      word: "sol",
      userAnswers: ["sol"],
      isCorrect: true,
      timeSpent: 4,
      attempts: 1,
      finalAnswer: "sol",
      audioPlayCount: 1,
    },
    {
      word: "tre",
      userAnswers: ["tre"],
      isCorrect: true,
      timeSpent: 3,
      attempts: 1,
      finalAnswer: "tre",
      audioPlayCount: 1,
    },
    {
      word: "fjell",
      userAnswers: ["fjell"],
      isCorrect: true,
      timeSpent: 5,
      attempts: 1,
      finalAnswer: "fjell",
      audioPlayCount: 1,
    },
    {
      word: "vann",
      userAnswers: ["vann"],
      isCorrect: true,
      timeSpent: 4,
      attempts: 1,
      finalAnswer: "vann",
      audioPlayCount: 1,
    },
  ];

  // Mock test data for needs practice scenario (60%)
  const lowScoreAnswers: TestAnswer[] = [
    {
      word: "skole",
      userAnswers: ["skole"],
      isCorrect: true,
      timeSpent: 5,
      attempts: 1,
      finalAnswer: "skole",
      audioPlayCount: 1,
    },
    {
      word: "hund",
      userAnswers: ["hund"],
      isCorrect: true,
      timeSpent: 4,
      attempts: 1,
      finalAnswer: "hund",
      audioPlayCount: 1,
    },
    {
      word: "katt",
      userAnswers: ["kat", "katt"],
      isCorrect: true,
      timeSpent: 8,
      attempts: 2,
      finalAnswer: "katt",
      audioPlayCount: 2,
    },
    {
      word: "bil",
      userAnswers: ["bil"],
      isCorrect: true,
      timeSpent: 4,
      attempts: 1,
      finalAnswer: "bil",
      audioPlayCount: 1,
    },
    {
      word: "hus",
      userAnswers: ["huss", "hus"],
      isCorrect: true,
      timeSpent: 7,
      attempts: 2,
      finalAnswer: "hus",
      audioPlayCount: 2,
    },
    {
      word: "bok",
      userAnswers: ["bokk", "bok"],
      isCorrect: true,
      timeSpent: 6,
      attempts: 2,
      finalAnswer: "bok",
      audioPlayCount: 2,
    },
    {
      word: "sol",
      userAnswers: ["sol"],
      isCorrect: true,
      timeSpent: 3,
      attempts: 1,
      finalAnswer: "sol",
      audioPlayCount: 1,
    },
    {
      word: "tre",
      userAnswers: ["tre"],
      isCorrect: true,
      timeSpent: 4,
      attempts: 1,
      finalAnswer: "tre",
      audioPlayCount: 1,
    },
    {
      word: "fjell",
      userAnswers: ["fjel", "fjal", "fjell"],
      isCorrect: true,
      timeSpent: 12,
      attempts: 3,
      finalAnswer: "fjell",
      audioPlayCount: 3,
    },
    {
      word: "vann",
      userAnswers: ["van", "vann"],
      isCorrect: true,
      timeSpent: 8,
      attempts: 2,
      finalAnswer: "vann",
      audioPlayCount: 2,
    },
  ];

  const highScoreXpInfo: XPInfo = {
    awarded: 150,
    total: 345,
    level: 3,
    levelName: "Snow Hare",
    levelNameNo: "Snøhare",
    levelIconPath: "/levels/snow-hare.png",
    levelUp: false,
    nextLevelXp: 600,
    currentLevelXp: 200,
  };

  const lowScoreXpInfo: XPInfo = {
    awarded: 60,
    total: 255,
    level: 3,
    levelName: "Snow Hare",
    levelNameNo: "Snøhare",
    levelIconPath: "/levels/snow-hare.png",
    levelUp: false,
    nextLevelXp: 600,
    currentLevelXp: 200,
  };

  return (
    <section className="mb-12">
      <SectionTitle>Test Results View</SectionTitle>
      <div className="grid gap-6 md:grid-cols-2">
        <ModeCard title="Results - High Score (100%)" state="success">
          <TestResultsView
            activeTest={MOCK_WORDSET}
            answers={highScoreAnswers}
            onRestart={() => {}}
            onExit={() => {}}
            onPlayAudio={() => {}}
            xpInfo={highScoreXpInfo}
          />
        </ModeCard>

        <ModeCard title="Results - Needs Practice" state="error">
          <TestResultsView
            activeTest={MOCK_WORDSET}
            answers={lowScoreAnswers}
            onRestart={() => {}}
            onExit={() => {}}
            onPlayAudio={() => {}}
            xpInfo={lowScoreXpInfo}
          />
        </ModeCard>
      </div>
    </section>
  );
}

export default function WordTestPage() {
  const [selectedMode, setSelectedMode] = useState<TestMode | "all">("all");

  const modes: Array<{ id: TestMode | "all"; label: string }> = [
    { id: "all", label: "All Modes" },
    { id: "letterTiles", label: "Letter Tiles" },
    { id: "wordBank", label: "Word Bank" },
    { id: "keyboard", label: "Keyboard" },
    { id: "missingLetters", label: "Missing Letters" },
    { id: "flashcard", label: "Flashcard" },
    { id: "lookCoverWrite", label: "Look Cover Write" },
    { id: "translation", label: "Translation" },
    { id: "listeningTranslation", label: "Listening Translation" },
  ];

  return (
    <div className="min-h-screen bg-nordic-birch p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Word Test Mode Visual Inspector
        </h1>
        <p className="text-gray-600 mb-8">
          Visual overview of all test modes showing input, error, and success
          states.
        </p>

        {/* Mode Filter */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow flex flex-wrap gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMode === mode.id
                  ? "bg-nordic-sky text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {(selectedMode === "all" || selectedMode === "letterTiles") && (
          <LetterTilesSection />
        )}
        {(selectedMode === "all" || selectedMode === "wordBank") && (
          <WordBankSection />
        )}
        {(selectedMode === "all" || selectedMode === "keyboard") && (
          <KeyboardSection />
        )}
        {(selectedMode === "all" || selectedMode === "missingLetters") && (
          <MissingLettersSection />
        )}
        {(selectedMode === "all" || selectedMode === "flashcard") && (
          <FlashcardSection />
        )}
        {(selectedMode === "all" || selectedMode === "lookCoverWrite") && (
          <LookCoverWriteSection />
        )}
        {(selectedMode === "all" || selectedMode === "translation") && (
          <TranslationSection />
        )}
        {(selectedMode === "all" ||
          selectedMode === "listeningTranslation") && (
          <ListeningTranslationSection />
        )}
        {selectedMode === "all" && <ResultsSection />}
      </div>
    </div>
  );
}
