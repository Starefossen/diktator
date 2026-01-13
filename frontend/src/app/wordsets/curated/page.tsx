"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { WordSet, TestResult, TestMode } from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import { playWordAudio as playWordAudioHelper } from "@/lib/audioPlayer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TestView } from "@/components/TestView";
import { PracticeView } from "@/components/PracticeView";
import { TestResultsView } from "@/components/TestResultsView";
import { ModeSelectionModal } from "@/components/ModeSelectionModal";
import { CuratedWordSetCard } from "@/components/WordSetCard/CuratedWordSetCard";
import { HeroArrowLeftIcon, HeroSparklesIcon } from "@/components/Icons";

import { useTestMode } from "@/hooks/useTestMode";
import { usePracticeMode } from "@/hooks/usePracticeMode";

function CuratedPageContent() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get("view");
  const wordSetId = searchParams.get("id");
  const mode = searchParams.get("mode") as TestMode | null;

  const [curatedWordSets, setCuratedWordSets] = useState<WordSet[]>([]);
  const [userResults, setUserResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testMode = useTestMode();
  const practiceMode = usePracticeMode();

  const [modeSelectionOpen, setModeSelectionOpen] = useState(false);
  const [selectedWordSetForTest, setSelectedWordSetForTest] =
    useState<WordSet | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const isExitingRef = React.useRef(false);

  useEffect(() => {
    const loadCuratedWordSets = async () => {
      try {
        setLoading(true);
        const response = await generatedApiClient.getCuratedWordSets();
        if (response.data?.data) {
          setCuratedWordSets(response.data.data as WordSet[]);
        }
      } catch (err) {
        console.error("Failed to load curated word sets:", err);
        setError(t("wordsets.curated.loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadCuratedWordSets();
  }, [t]);

  useEffect(() => {
    const loadUserResults = async () => {
      if (!userData || userData.role !== "child") return;

      try {
        const resultsResponse = await generatedApiClient.getResults();
        if (resultsResponse.data?.data) {
          setUserResults(resultsResponse.data.data as TestResult[]);
        }
      } catch (err) {
        console.error("Failed to load user results:", err);
      }
    };

    loadUserResults();
  }, [userData]);

  useEffect(() => {
    if (isExitingRef.current) return;

    if (view === "test" && wordSetId && mode) {
      const wordSet = curatedWordSets.find((ws) => ws.id === wordSetId);
      if (wordSet && !testMode.activeTest) {
        testMode.startTest(wordSet, mode);
      }
    } else if (view === "practice" && wordSetId) {
      const wordSet = curatedWordSets.find((ws) => ws.id === wordSetId);
      if (wordSet && !practiceMode.practiceMode) {
        practiceMode.startPractice(wordSet);
      }
    }
  }, [view, wordSetId, mode, curatedWordSets, testMode, practiceMode]);

  useEffect(() => {
    if (!view) {
      isExitingRef.current = false;
    }
  }, [view]);

  const handleWordClick = useCallback(
    async (word: string, wordSet: WordSet) => {
      const wordItem = wordSet.words.find((w) => w.word === word);
      if (!wordItem?.audio?.audioId) {
        return;
      }

      setPlayingAudio(word);

      await playWordAudioHelper(word, wordSet, {
        onEnd: () => setPlayingAudio(null),
        onError: (error: Error) => {
          setPlayingAudio(null);
          console.error("Failed to play audio for word:", word, error);
        },
        preloadNext: true,
      });
    },
    [],
  );

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-nordic-birch"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-nordic-sky rounded-full animate-spin" />
          <p className="mt-4 text-gray-600 sr-only">{t("aria.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-nordic-birch">
          <div className="text-center">
            <p className="text-lg text-red-600">{error}</p>
            <Link
              href="/wordsets"
              className="mt-4 inline-flex items-center text-nordic-sky hover:underline"
            >
              <HeroArrowLeftIcon className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (practiceMode.practiceMode && practiceMode.practiceWords.length > 0) {
    return (
      <ProtectedRoute>
        <PracticeView
          practiceMode={practiceMode.practiceMode}
          practiceWords={practiceMode.practiceWords}
          currentPracticeIndex={practiceMode.currentPracticeIndex}
          showPracticeWord={practiceMode.showPracticeWord}
          isAudioPlaying={practiceMode.isAudioPlaying}
          onSetCurrentIndex={practiceMode.setCurrentPracticeIndex}
          onSetShowWord={practiceMode.setShowPracticeWord}
          onNext={practiceMode.nextPracticeWord}
          onPrevious={practiceMode.previousPracticeWord}
          onPlayAudio={practiceMode.playPracticeWordAudio}
          onShuffle={practiceMode.shufflePracticeWords}
          onStartTest={(wordSet) => {
            isExitingRef.current = true;
            practiceMode.exitPractice();
            setSelectedWordSetForTest(wordSet);
            setModeSelectionOpen(true);
            if (view === "practice") {
              router.replace("/wordsets/curated");
            }
          }}
          onExit={() => {
            isExitingRef.current = true;
            practiceMode.exitPractice();
            if (view === "practice") {
              router.replace("/wordsets/curated");
            }
          }}
        />
      </ProtectedRoute>
    );
  }

  if (testMode.activeTest && testMode.showResult) {
    return (
      <ProtectedRoute>
        <TestResultsView
          activeTest={testMode.activeTest}
          answers={testMode.answers}
          onRestart={testMode.restartTest}
          onExit={() => {
            isExitingRef.current = true;
            testMode.exitTest();
            if (view === "test") {
              router.replace("/wordsets/curated");
            }
          }}
          onPlayAudio={testMode.playTestWordAudio}
        />
      </ProtectedRoute>
    );
  }

  if (testMode.activeTest && !testMode.showResult) {
    return (
      <ProtectedRoute>
        <TestView
          activeTest={testMode.activeTest}
          currentWordIndex={testMode.currentWordIndex}
          processedWords={testMode.processedWords}
          userAnswer={testMode.userAnswer}
          showFeedback={testMode.showFeedback}
          lastAnswerCorrect={testMode.lastAnswerCorrect}
          currentTries={testMode.currentTries}
          answers={testMode.answers}
          isAudioPlaying={testMode.isAudioPlaying}
          testMode={testMode.testMode}
          wordDirections={testMode.wordDirections}
          lastUserAnswer={testMode.lastUserAnswer}
          onUserAnswerChange={testMode.setUserAnswer}
          onSubmitAnswer={testMode.handleSubmitAnswer}
          onNextWord={testMode.handleNextWord}
          onPlayCurrentWord={testMode.playCurrentWord}
          onExitTest={() => {
            isExitingRef.current = true;
            testMode.exitTest();
            if (view === "test") {
              router.replace("/wordsets/curated");
            }
          }}
        />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="bg-nordic-birch min-h-screen">
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-8">
            <Link
              href="/wordsets"
              className="inline-flex items-center text-nordic-sky hover:underline mb-4"
            >
              <HeroArrowLeftIcon className="w-4 h-4 mr-2" />
              {t("wordsets.curated.backToWordSets")}
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-nordic-sunrise/20 rounded-full">
                <HeroSparklesIcon className="w-8 h-8 text-nordic-sunrise" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-linear-to-r from-nordic-sky to-nordic-teal bg-clip-text">
                  {t("wordsets.curated.title")}
                </h1>
                <p className="text-lg text-gray-600">
                  {t("wordsets.curated.subtitle")}
                </p>
              </div>
            </div>
          </div>

          {curatedWordSets.length === 0 ? (
            <div className="py-12 text-center">
              <HeroSparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-xl font-semibold text-nordic-midnight">
                {t("wordsets.curated.noSets")}
              </h3>
              <p className="text-gray-600">
                {t("wordsets.curated.noSetsDescription")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {curatedWordSets.map((wordSet) => (
                <CuratedWordSetCard
                  key={wordSet.id}
                  wordSet={wordSet}
                  playingAudio={playingAudio}
                  userResults={userResults}
                  onStartTest={(ws) => {
                    setSelectedWordSetForTest(ws);
                    setModeSelectionOpen(true);
                  }}
                  onStartPractice={(ws) => {
                    router.push(`/wordsets/curated?view=practice&id=${ws.id}`);
                  }}
                  onWordClick={handleWordClick}
                />
              ))}
            </div>
          )}
        </div>

        {modeSelectionOpen && selectedWordSetForTest && (
          <ModeSelectionModal
            wordSet={selectedWordSetForTest}
            isOpen={modeSelectionOpen}
            onSelectMode={(mode: TestMode) => {
              const url = `/wordsets/curated?view=test&id=${selectedWordSetForTest.id}&mode=${mode}`;
              router.push(url);
              setModeSelectionOpen(false);
              setSelectedWordSetForTest(null);
            }}
            onClose={() => {
              setModeSelectionOpen(false);
              setSelectedWordSetForTest(null);
            }}
            userBirthYear={userData?.birthYear}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function CuratedPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center min-h-screen bg-nordic-birch"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 border-nordic-sky rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CuratedPageContent />
    </Suspense>
  );
}
