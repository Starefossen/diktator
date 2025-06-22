"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  WordSet,
  TestAnswer,
  SaveResultRequest,
  getEffectiveTestConfig,
} from "@/types";
import { apiClient } from "@/lib/api";
import {
  playSuccessTone,
  playErrorSound,
  playCompletionTone,
} from "@/lib/audioTones";
import ProtectedRoute from "@/components/ProtectedRoute";
import { HeroVolumeIcon, ScoreIcon } from "@/components/Icons";

export default function TestPage() {
  return (
    <ProtectedRoute>
      <TestPageContent />
    </ProtectedRoute>
  );
}

function TestPageContent() {
  const { t } = useLanguage();
  const { user, userData } = useAuth();
  const router = useRouter();

  // State management
  const [wordSetId, setWordSetId] = useState<string>("");
  const [wordSet, setWordSet] = useState<WordSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [wordStartTime, setWordStartTime] = useState<Date | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentTries, setCurrentTries] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [processedWords, setProcessedWords] = useState<string[]>([]);
  const [testInitialized, setTestInitialized] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Refs for stable audio functionality
  const wordSetRef = useRef<WordSet | null>(null);
  const processedWordsRef = useRef<string[]>([]);
  const isPlayingAudioRef = useRef(false);
  const lastAutoPlayIndexRef = useRef(-1);

  // Derived values
  const testConfig = wordSet ? getEffectiveTestConfig(wordSet) : null;
  const familyId = userData?.familyId || "family-default";
  const userId = user?.uid || "";

  // URL parameter extraction and routing
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (id) {
      setWordSetId(id);
    } else {
      const timer = setTimeout(() => {
        console.log("No test ID found, redirecting to wordsets");
        router.push("/wordsets/");
      }, 1000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [router]);

  // WordSet loading logic
  const loadWordSet = useCallback(async () => {
    if (!wordSetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.getWordSets(familyId);

      if (response.data) {
        const foundWordSet = response.data.find((ws) => ws.id === wordSetId);

        if (foundWordSet) {
          setWordSet(foundWordSet);

          // Process words based on configuration
          const config = getEffectiveTestConfig(foundWordSet);
          const words = config.shuffleWords
            ? [...foundWordSet.words].sort(() => Math.random() - 0.5)
            : foundWordSet.words;

          setProcessedWords(words);

          // Update refs for stable access
          wordSetRef.current = foundWordSet;
          processedWordsRef.current = words;
        } else {
          console.log(
            `Word set ${wordSetId} not found, redirecting to wordsets`,
          );
          router.push("/wordsets/");
        }
      }
    } catch (error) {
      console.error("Failed to load word set:", error);
      router.push("/wordsets/");
    } finally {
      setLoading(false);
    }
  }, [wordSetId, familyId, router]);

  useEffect(() => {
    if (wordSetId) {
      loadWordSet();
    }
  }, [loadWordSet, wordSetId]);

  // Audio functionality - isolated and stable
  const playWordAudio = useCallback((word: string, autoDelay = 0) => {
    if (isPlayingAudioRef.current) return;

    const currentWordSet = wordSetRef.current;
    if (!currentWordSet || !("speechSynthesis" in window)) return;

    const playFn = () => {
      speechSynthesis.cancel();
      isPlayingAudioRef.current = true;
      setIsAudioPlaying(true);

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = currentWordSet.language === "no" ? "nb-NO" : "en-US";
      utterance.rate = 0.8;

      utterance.onend = () => {
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      };
      utterance.onerror = () => {
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      };

      speechSynthesis.speak(utterance);
    };

    if (autoDelay > 0) {
      setTimeout(playFn, autoDelay);
    } else {
      playFn();
    }
  }, []);

  const playCurrentWord = useCallback(() => {
    const words = processedWordsRef.current;
    if (words.length > currentWordIndex) {
      playWordAudio(words[currentWordIndex]);
    }
  }, [playWordAudio, currentWordIndex]);

  // Initialize test and handle auto-play (isolated from user input)
  useEffect(() => {
    if (wordSet && processedWords.length > 0 && !testInitialized) {
      // Initialize test timing
      setStartTime(new Date());
      setWordStartTime(new Date());
      setTestInitialized(true);

      // Auto-play first word if enabled
      if (testConfig?.autoPlayAudio) {
        lastAutoPlayIndexRef.current = 0;
        playWordAudio(processedWords[0], 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordSet, processedWords, testInitialized, testConfig]); // Removed playWordAudio dependency

  // Auto-play when moving to next word (completely isolated)
  useEffect(() => {
    // Get current config to avoid stale closure
    const currentConfig = wordSetRef.current
      ? getEffectiveTestConfig(wordSetRef.current)
      : null;

    if (
      testInitialized &&
      currentWordIndex > 0 &&
      currentConfig?.autoPlayAudio &&
      processedWordsRef.current.length > currentWordIndex &&
      lastAutoPlayIndexRef.current !== currentWordIndex // Prevent duplicate plays
    ) {
      lastAutoPlayIndexRef.current = currentWordIndex;
      playWordAudio(processedWordsRef.current[currentWordIndex], 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWordIndex, testInitialized]); // Minimal dependencies, removed testConfig and playWordAudio

  // Test functionality and utilities
  const handleSubmitAnswer = () => {
    if (!wordSet || !wordStartTime || !processedWords.length) return;

    const currentWord = processedWords[currentWordIndex];
    const isCorrect =
      userAnswer.toLowerCase().trim() === currentWord.toLowerCase();
    const newTries = currentTries + 1;

    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    setCurrentTries(newTries);

    // Play success tone for correct answers
    if (isCorrect) {
      playSuccessTone();
    } else {
      // Play error sound for incorrect answers
      playErrorSound();
    }

    setTimeout(() => {
      setShowFeedback(false);

      if (isCorrect || newTries >= (testConfig?.maxAttempts ?? 3)) {
        const timeSpent = Math.round(
          (new Date().getTime() - wordStartTime.getTime()) / 1000,
        );
        const answer: TestAnswer = {
          word: currentWord,
          userAnswer: userAnswer.trim(),
          isCorrect,
          timeSpent,
        };

        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);

        if (currentWordIndex < processedWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setUserAnswer("");
          setWordStartTime(new Date());
          setCurrentTries(0);
        } else {
          completeTest(newAnswers);
        }
      } else {
        // Incorrect answer but attempts remaining - clear input and replay audio
        setUserAnswer("");
        // Play the word again after a short delay to help the user
        playWordAudio(currentWord, 500);
      }
    }, 2000);
  };

  const completeTest = async (finalAnswers: TestAnswer[]) => {
    if (!wordSet || !startTime) return;

    const correctAnswers = finalAnswers.filter((a) => a.isCorrect);
    const incorrectWords = finalAnswers
      .filter((a) => !a.isCorrect)
      .map((a) => a.word);
    const totalTimeSpent = Math.round(
      (new Date().getTime() - startTime.getTime()) / 1000,
    );
    const score = Math.round(
      (correctAnswers.length / finalAnswers.length) * 100,
    );

    try {
      const resultData: SaveResultRequest = {
        wordSetId: wordSet.id,
        score,
        totalWords: finalAnswers.length,
        correctWords: correctAnswers.length,
        incorrectWords,
        timeSpent: totalTimeSpent,
      };

      await apiClient.saveResult(resultData, userId);
    } catch (error) {
      console.error("Failed to save test result:", error);
    }

    // Play completion tone when test is finished
    playCompletionTone();
    setShowResult(true);
  };

  // Navigation and utility functions
  const restartTest = () => {
    setCurrentWordIndex(0);
    setUserAnswer("");
    setAnswers([]);
    setStartTime(new Date());
    setWordStartTime(new Date());
    setShowResult(false);
    setCurrentTries(0);
    setShowFeedback(false);
    setTestInitialized(false);
    setIsAudioPlaying(false);

    // Reset audio tracking
    isPlayingAudioRef.current = false;
    lastAutoPlayIndexRef.current = -1;
    speechSynthesis.cancel();
  };

  const goBackToWordSets = () => {
    router.push("/wordsets");
  };

  // Render states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{t("test.loading")}</p>
        </div>
      </div>
    );
  }

  if (!wordSet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            {t("test.notFound")}
          </h1>
          <button
            onClick={goBackToWordSets}
            className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            {t("test.backToWordSets")}
          </button>
        </div>
      </div>
    );
  }

  // Results view
  if (showResult) {
    const correctAnswers = answers.filter((a) => a.isCorrect);
    const score = Math.round((correctAnswers.length / answers.length) * 100);

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full max-w-2xl p-8 mx-4 bg-white rounded-lg shadow-xl">
          <div className="mb-8 text-center">
            <div className="mb-4">
              <ScoreIcon score={score} className="w-16 h-16" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-800">
              {t("test.complete")}
            </h1>
            <h2 className="text-xl text-gray-600">{wordSet.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 text-center rounded-lg bg-green-50">
              <div className="text-3xl font-bold text-green-600">{score}%</div>
              <div className="text-gray-600">{t("test.score")}</div>
            </div>
            <div className="p-4 text-center rounded-lg bg-blue-50">
              <div className="text-3xl font-bold text-blue-600">
                {correctAnswers.length}/{answers.length}
              </div>
              <div className="text-gray-600">{t("test.correct")}</div>
            </div>
          </div>

          {/* Review all answers */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              {t("test.reviewResults")}
            </h3>
            <div className="space-y-2">
              {answers.map((answer, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    answer.isCorrect ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center">
                    {/* Green checkmark or red X */}
                    <div
                      className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                        answer.isCorrect ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {answer.isCorrect ? (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span
                        className={`font-medium ${
                          answer.isCorrect ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {answer.word}
                      </span>
                      {!answer.isCorrect && (
                        <span className="ml-2 text-gray-600">
                          {t("test.yourAnswer")} &quot;{answer.userAnswer}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => playWordAudio(answer.word)}
                    className={`px-3 py-1 transition-colors rounded ${
                      answer.isCorrect
                        ? "text-green-700 bg-green-100 hover:bg-green-200"
                        : "text-red-700 bg-red-100 hover:bg-red-200"
                    }`}
                  >
                    <HeroVolumeIcon
                      className={`w-4 h-4 ${
                        answer.isCorrect ? "text-green-700" : "text-red-700"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={restartTest}
              className="px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {t("test.restart")}
            </button>
            <button
              onClick={goBackToWordSets}
              className="px-6 py-3 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
            >
              {t("test.backToWordSets")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {wordSet.name}
          </h1>
          <p className="text-gray-600">
            {t("test.progress")} {currentWordIndex + 1} {t("common.of")}{" "}
            {processedWords.length}
          </p>
          <div className="w-full h-2 mt-4 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{
                width: `${((currentWordIndex + 1) / processedWords.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Test Area */}
        <div className="max-w-2xl mx-auto">
          <div className="p-8 text-center bg-white rounded-lg shadow-xl">
            <div className="mb-8">
              <div className="relative inline-block">
                {/* Animated spinner when audio is playing */}
                {isAudioPlaying && (
                  <div className="absolute border-4 border-transparent rounded-full -inset-3 border-t-blue-500 border-r-blue-400 animate-spin"></div>
                )}
                <button
                  onClick={playCurrentWord}
                  className="relative p-6 text-6xl text-white transition-all duration-200 transform rounded-full shadow-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:scale-105"
                >
                  <HeroVolumeIcon className="w-16 h-16 text-white" />
                </button>
              </div>
              <p className="mt-4 text-gray-600">{t("test.listenToWord")}</p>
            </div>

            {/* Unified Input/Feedback Container - Fixed Height to Prevent Layout Shift */}
            <div className="flex flex-col justify-center mb-6">
              {showFeedback ? (
                <div
                  className={`p-4 rounded-lg animate-in fade-in-0 slide-in-from-top-2 duration-300 ${
                    lastAnswerCorrect
                      ? "bg-green-100 border border-green-300"
                      : "bg-red-100 border border-red-300"
                  }`}
                >
                  <p
                    className={`font-semibold text-lg ${
                      lastAnswerCorrect ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {lastAnswerCorrect
                      ? t("test.correct")
                      : `${t("test.incorrect")} - ${t("test.tryAgain")} (${currentTries}/${testConfig?.maxAttempts ?? 3})`}
                  </p>
                </div>
              ) : (
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmitAnswer()}
                  className="w-full px-6 py-4 text-2xl text-center transition-all duration-200 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("test.typeWordHere")}
                  autoFocus
                />
              )}
            </div>

            {/* Always visible attempts remaining - prevents layout shift */}
            <div className="flex justify-center h-5 mb-8">
              <p className="text-sm text-gray-500">
                {t("test.attemptsRemaining")}:{" "}
                {(testConfig?.maxAttempts ?? 3) - currentTries}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={playCurrentWord}
                className="px-6 py-3 font-semibold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                disabled={showFeedback}
              >
                <HeroVolumeIcon className="inline w-4 h-4 mr-2" />
                {t("test.playAgain")}
              </button>
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || showFeedback}
                className="px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentWordIndex < processedWords.length - 1
                  ? t("test.nextWord")
                  : t("test.finishTest")}
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 text-center text-gray-600">
            {answers.length > 0 && (
              <p>
                {t("test.correctSoFar")}:{" "}
                {answers.filter((a) => a.isCorrect).length} / {answers.length}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
