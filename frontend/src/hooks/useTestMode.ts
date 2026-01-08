import { useState, useCallback, useRef, useEffect } from "react";
import { WordSet, TestAnswer, getEffectiveTestConfig } from "@/types";
import type { ModelsSaveResultRequest as SaveResultRequest } from "@/generated";
import { generatedApiClient } from "@/lib/api-generated";
import {
  playWordAudio as playWordAudioHelper,
  stopAudio,
  initializeAudioForIOS,
  requiresUserInteractionForAudio,
} from "@/lib/audioPlayer";
import {
  playSuccessTone,
  playErrorSound,
  playCompletionTone,
} from "@/lib/audioTones";

export interface UseTestModeReturn {
  // State
  activeTest: WordSet | null;
  currentWordIndex: number;
  userAnswer: string;
  answers: TestAnswer[];
  showResult: boolean;
  currentTries: number;
  showFeedback: boolean;
  lastAnswerCorrect: boolean;
  processedWords: string[];
  testInitialized: boolean;
  isAudioPlaying: boolean;
  currentWordAnswers: string[];
  currentWordAudioPlays: number;
  testMode: "standard" | "dictation" | "translation";
  wordDirections: ("toTarget" | "toSource")[]; // For translation mode only

  // Actions
  startTest: (
    wordSet: WordSet,
    mode?: "standard" | "dictation" | "translation",
  ) => void;
  exitTest: () => void;
  restartTest: () => void;
  setUserAnswer: (answer: string) => void;
  handleSubmitAnswer: () => void;
  playCurrentWord: () => void;
  playTestWordAudio: (word: string, autoDelay?: number) => void;
}

export function useTestMode(): UseTestModeReturn {
  // Test state
  const [activeTest, setActiveTest] = useState<WordSet | null>(null);
  const [testMode, setTestMode] = useState<
    "standard" | "dictation" | "translation"
  >("standard");
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
  const [wordDirections, setWordDirections] = useState<
    ("toTarget" | "toSource")[]
  >([]);
  const [testInitialized, setTestInitialized] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentWordAnswers, setCurrentWordAnswers] = useState<string[]>([]);
  const [currentWordAudioPlays, setCurrentWordAudioPlays] = useState(0);

  // Refs for stable audio functionality
  const activeTestRef = useRef<WordSet | null>(null);
  const processedWordsRef = useRef<string[]>([]);
  const isPlayingAudioRef = useRef(false);
  const lastAutoPlayIndexRef = useRef(-1);

  // Sync refs with state
  useEffect(() => {
    activeTestRef.current = activeTest;
  }, [activeTest]);

  useEffect(() => {
    processedWordsRef.current = processedWords;
  }, [processedWords]);

  const playTestWordAudio = useCallback((word: string, autoDelay = 0) => {
    if (isPlayingAudioRef.current) return;

    const currentWordSet = activeTestRef.current;
    if (!currentWordSet) return;

    setCurrentWordAudioPlays((prev) => prev + 1);

    const needsUserInteraction =
      requiresUserInteractionForAudio() && autoDelay > 0;

    // Safety timeout to reset audio state in case callbacks don't fire
    const safetyTimeout = setTimeout(() => {
      if (isPlayingAudioRef.current) {
        console.warn("Audio playback timeout - resetting state");
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      }
    }, 10000); // 10 second timeout

    playWordAudioHelper(word, currentWordSet, {
      onStart: () => {
        isPlayingAudioRef.current = true;
        setIsAudioPlaying(true);
      },
      onEnd: () => {
        clearTimeout(safetyTimeout);
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      },
      onError: (error: Error) => {
        console.error("Audio playback error:", error);
        clearTimeout(safetyTimeout);
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      },
      autoDelay: needsUserInteraction ? 0 : autoDelay,
      speechRate: 0.8,
      requireUserInteraction: needsUserInteraction,
      preloadNext: true,
    });
  }, []);

  const playCurrentWord = useCallback(() => {
    const words = processedWordsRef.current;
    if (words.length > currentWordIndex) {
      playTestWordAudio(words[currentWordIndex]);
    }
  }, [playTestWordAudio, currentWordIndex]);

  const startTest = useCallback(
    (wordSet: WordSet, mode?: "standard" | "dictation" | "translation") => {
      initializeAudioForIOS();

      const selectedMode =
        mode || wordSet.testConfiguration?.defaultMode || "standard";
      setTestMode(selectedMode);
      setActiveTest(wordSet);

      const config = getEffectiveTestConfig(wordSet);
      const wordStrings = wordSet.words.map((w) => w.word);
      const words = config.shuffleWords
        ? [...wordStrings].sort(() => Math.random() - 0.5)
        : wordStrings;

      setProcessedWords(words);

      // For translation mode, generate direction for each word
      if (selectedMode === "translation") {
        const translationDirection =
          wordSet.testConfiguration?.translationDirection || "toTarget";
        const directions = words.map(() => {
          if (translationDirection === "mixed") {
            return Math.random() < 0.5 ? "toTarget" : "toSource";
          }
          return translationDirection as "toTarget" | "toSource";
        });
        setWordDirections(directions);
      } else {
        setWordDirections([]);
      }

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
      setCurrentWordAnswers([]);
      setCurrentWordAudioPlays(0);

      isPlayingAudioRef.current = false;
      lastAutoPlayIndexRef.current = -1;
      stopAudio();
    },
    [],
  );

  const resetTestState = useCallback(() => {
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
    setCurrentWordAnswers([]);
    setCurrentWordAudioPlays(0);

    isPlayingAudioRef.current = false;
    lastAutoPlayIndexRef.current = -1;
    stopAudio();
  }, []);

  const restartTest = useCallback(() => {
    if (!activeTest) return;
    resetTestState();
  }, [activeTest, resetTestState]);

  const exitTest = useCallback(() => {
    setActiveTest(null);
    setShowResult(false);
    stopAudio();
  }, []);

  const completeTest = useCallback(
    async (finalAnswers: TestAnswer[]) => {
      if (!activeTest || !startTime) return;

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
        const wordsResults = finalAnswers.map((answer) => ({
          word: answer.word,
          userAnswers: answer.userAnswers,
          attempts: answer.attempts,
          correct: answer.isCorrect,
          timeSpent: answer.timeSpent,
          finalAnswer: answer.finalAnswer,
          audioPlayCount: answer.audioPlayCount,
        }));

        const resultData: SaveResultRequest = {
          wordSetId: activeTest.id,
          score,
          totalWords: finalAnswers.length,
          correctWords: correctAnswers.length,
          mode: testMode as SaveResultRequest["mode"],
          incorrectWords,
          words: wordsResults,
          timeSpent: totalTimeSpent,
        };

        await generatedApiClient.saveResult(resultData);
      } catch (error) {
        console.error("Failed to save test result:", error);
      }

      playCompletionTone();
      setShowResult(true);
    },
    [activeTest, startTime, testMode],
  );

  const handleSubmitAnswer = useCallback(() => {
    if (!activeTest || !wordStartTime || !processedWords.length) return;

    const currentWord = processedWords[currentWordIndex];

    // Determine expected answer based on mode and direction
    let expectedAnswer = currentWord;
    if (
      testMode === "translation" &&
      wordDirections.length > currentWordIndex
    ) {
      const direction = wordDirections[currentWordIndex];
      const targetLanguage = activeTest.testConfiguration?.targetLanguage;
      const wordObj = activeTest.words.find((w) => w.word === currentWord);
      const translation = wordObj?.translations?.find(
        (tr) => tr.language === targetLanguage,
      );

      if (direction === "toTarget" && translation) {
        expectedAnswer = translation.text;
      } else if (direction === "toSource") {
        expectedAnswer = currentWord;
      }
    }

    const isCorrect =
      userAnswer.toLowerCase().trim() === expectedAnswer.toLowerCase();
    const newTries = currentTries + 1;
    const newAnswers = [...currentWordAnswers, userAnswer.trim()];

    setCurrentWordAnswers(newAnswers);
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    setCurrentTries(newTries);

    if (isCorrect) {
      playSuccessTone();
    } else {
      playErrorSound();
    }

    setTimeout(() => {
      setShowFeedback(false);

      const testConfig = getEffectiveTestConfig(activeTest);
      const maxAttempts = testConfig?.maxAttempts ?? 3;

      if (isCorrect || newTries >= maxAttempts) {
        const timeSpent = Math.round(
          (new Date().getTime() - wordStartTime.getTime()) / 1000,
        );

        const answer: TestAnswer = {
          word: currentWord,
          userAnswers: newAnswers,
          isCorrect,
          timeSpent,
          attempts: newTries,
          finalAnswer: userAnswer.trim(),
          audioPlayCount: currentWordAudioPlays,
        };

        const newAnswersList = [...answers, answer];
        setAnswers(newAnswersList);

        if (currentWordIndex < processedWords.length - 1) {
          setCurrentWordIndex((prev) => prev + 1);
          setUserAnswer("");
          setWordStartTime(new Date());
          setCurrentTries(0);
          setCurrentWordAnswers([]);
          setCurrentWordAudioPlays(0);
          // Reset audio state for next word to prevent stuck spinner
          isPlayingAudioRef.current = false;
          setIsAudioPlaying(false);
        } else {
          completeTest(newAnswersList);
        }
      } else {
        setUserAnswer("");
        if (!requiresUserInteractionForAudio()) {
          playTestWordAudio(currentWord, 500);
        }
      }
    }, 2000);
  }, [
    activeTest,
    wordStartTime,
    processedWords,
    currentWordIndex,
    userAnswer,
    currentTries,
    currentWordAnswers,
    currentWordAudioPlays,
    answers,
    completeTest,
    playTestWordAudio,
    testMode,
    wordDirections,
  ]);

  // Initialize test and handle auto-play
  useEffect(() => {
    if (activeTest && processedWords.length > 0 && !testInitialized) {
      setTimeout(() => setTestInitialized(true), 0);

      const testConfig = getEffectiveTestConfig(activeTest);
      if (testConfig?.autoPlayAudio && !requiresUserInteractionForAudio()) {
        lastAutoPlayIndexRef.current = 0;
        setTimeout(() => playTestWordAudio(processedWords[0], 500), 0);
      }
    }
  }, [activeTest, processedWords, testInitialized, playTestWordAudio]);

  // Auto-play when moving to next word
  useEffect(() => {
    const currentConfig = activeTestRef.current
      ? getEffectiveTestConfig(activeTestRef.current)
      : null;

    if (
      testInitialized &&
      currentWordIndex > 0 &&
      currentConfig?.autoPlayAudio &&
      processedWordsRef.current.length > currentWordIndex &&
      lastAutoPlayIndexRef.current !== currentWordIndex &&
      !requiresUserInteractionForAudio()
    ) {
      lastAutoPlayIndexRef.current = currentWordIndex;
      playTestWordAudio(processedWordsRef.current[currentWordIndex], 500);
    }
  }, [currentWordIndex, testInitialized, playTestWordAudio]);

  return {
    // State
    activeTest,
    currentWordIndex,
    userAnswer,
    answers,
    showResult,
    currentTries,
    showFeedback,
    lastAnswerCorrect,
    processedWords,
    testInitialized,
    isAudioPlaying,
    currentWordAnswers,
    currentWordAudioPlays,
    testMode,
    wordDirections,

    // Actions
    startTest,
    exitTest,
    restartTest,
    setUserAnswer,
    handleSubmitAnswer,
    playCurrentWord,
    playTestWordAudio,
  };
}
