import { useState, useCallback, useRef, useEffect } from "react";
import { WordSet, TestAnswer, getEffectiveTestConfig, TestMode } from "@/types";
import type { ModelsSaveResultRequest as SaveResultRequest } from "@/generated";
import { generatedApiClient } from "@/lib/api-generated";
import {
  playWordAudio as playWordAudioHelper,
  stopAudio,
  initializeAudioForIOS,
  isAudioUnlocked,
} from "@/lib/audioPlayer";
import {
  playSuccessTone,
  playErrorSound,
  playCompletionTone,
} from "@/lib/audioTones";
import {
  analyzeSpelling,
  DEFAULT_SPELLING_CONFIG,
  ErrorType,
} from "@/lib/spellingAnalysis";
import { normalizeText } from "@/lib/sentenceScoring";
import { TIMING } from "@/lib/timingConfig";
import { calculateScores } from "@/lib/scoreCalculator";
import { getMode } from "@/lib/testEngine/registry";

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
  testMode: TestMode;
  wordDirections: ("toTarget" | "toSource")[]; // For translation mode only
  lastUserAnswer: string; // Most recent answer submitted for spelling feedback (empty string if none)

  // Actions
  startTest: (wordSet: WordSet, mode?: TestMode) => void;
  exitTest: () => void;
  restartTest: () => void;
  setUserAnswer: (answer: string) => void;
  handleSubmitAnswer: (directAnswer?: string) => void;
  handleNextWord: () => void;
  playCurrentWord: () => void;
  playTestWordAudio: (word: string, autoDelay?: number) => void;
}

export function useTestMode(): UseTestModeReturn {
  // Test state
  const [activeTest, setActiveTest] = useState<WordSet | null>(null);
  const [testMode, setTestMode] = useState<TestMode>("keyboard");
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
  const [currentWordErrorTypes, setCurrentWordErrorTypes] = useState<
    ErrorType[]
  >([]);

  // Refs for stable audio functionality
  const activeTestRef = useRef<WordSet | null>(null);
  const processedWordsRef = useRef<string[]>([]);
  const isPlayingAudioRef = useRef(false);
  const lastAutoPlayIndexRef = useRef(-1);
  const advancementTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync refs with state
  useEffect(() => {
    activeTestRef.current = activeTest;
  }, [activeTest]);

  useEffect(() => {
    processedWordsRef.current = processedWords;
  }, [processedWords]);

  const playTestWordAudio = useCallback(
    (word: string, autoDelay = 0, isAutoPlay = false) => {
      if (isPlayingAudioRef.current) return;

      const currentWordSet = activeTestRef.current;
      if (!currentWordSet) return;

      setCurrentWordAudioPlays((prev) => prev + 1);

      // Safety timeout to reset audio state in case callbacks don't fire
      const safetyTimeout = setTimeout(() => {
        if (isPlayingAudioRef.current) {
          console.warn("Audio playback timeout - resetting state");
          isPlayingAudioRef.current = false;
          setIsAudioPlaying(false);
        }
      }, TIMING.AUDIO_SAFETY_TIMEOUT_MS);

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
        autoDelay,
        speechRate: 0.8,
        isAutoPlay,
        preloadNext: true,
      });
    },
    [],
  );

  const playCurrentWord = useCallback(() => {
    const words = processedWordsRef.current;
    if (words.length > currentWordIndex) {
      // Manual click - not autoplay
      playTestWordAudio(words[currentWordIndex], 0, false);
    }
  }, [playTestWordAudio, currentWordIndex]);

  const startTest = useCallback((wordSet: WordSet, mode?: TestMode) => {
    // Mark user interaction (but don't waste gesture token on silent audio)
    initializeAudioForIOS();

    const selectedMode: TestMode =
      mode || wordSet.testConfiguration?.defaultMode || "keyboard";
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
    setCurrentWordErrorTypes([]);

    isPlayingAudioRef.current = false;
    lastAutoPlayIndexRef.current = -1;
    stopAudio();

    // CRITICAL: Play first word audio SYNCHRONOUSLY in the click handler!
    // This is the only way to ensure we have the user gesture token for autoplay.
    // The browser's transient user activation expires after a few seconds or after
    // being consumed by another audio play attempt.
    if (config?.autoPlayAudio && words.length > 0) {
      lastAutoPlayIndexRef.current = 0;
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[useTestMode] Playing first word SYNCHRONOUSLY in click handler",
        );
      }
      // Play directly - this happens in the user gesture context!
      playWordAudioHelper(words[0], wordSet, {
        onStart: () => {
          isPlayingAudioRef.current = true;
          setIsAudioPlaying(true);
        },
        onEnd: () => {
          isPlayingAudioRef.current = false;
          setIsAudioPlaying(false);
        },
        onError: (error: Error) => {
          console.error("[useTestMode] First word audio error:", error);
          isPlayingAudioRef.current = false;
          setIsAudioPlaying(false);
        },
        autoDelay: TIMING.TEST_START_AUDIO_DELAY_MS,
        speechRate: 0.8,
        isAutoPlay: false, // It's triggered by user click, so NOT autoplay!
        preloadNext: true,
      });
    }
  }, []);

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
    setCurrentWordErrorTypes([]);

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

      const scoreBreakdown = calculateScores(finalAnswers);
      const incorrectWords = finalAnswers
        .filter((a) => !a.isCorrect)
        .map((a) => a.word);
      const totalTimeSpent = Math.round(
        (new Date().getTime() - startTime.getTime()) / 1000,
      );
      // Use weighted score - 100% only if all words correct on first attempt
      const score = scoreBreakdown.weightedScore;

      try {
        const wordsResults = finalAnswers.map((answer) => ({
          word: answer.word,
          userAnswers: answer.userAnswers,
          attempts: answer.attempts,
          correct: answer.isCorrect,
          timeSpent: answer.timeSpent,
          finalAnswer: answer.finalAnswer,
          audioPlayCount: answer.audioPlayCount,
          errorTypes: answer.errorTypes,
        }));

        const resultData: SaveResultRequest = {
          wordSetId: activeTest.id,
          score,
          totalWords: finalAnswers.length,
          correctWords: scoreBreakdown.totalWords - scoreBreakdown.failed,
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

  const handleSubmitAnswer = useCallback(
    (directAnswer?: string) => {
      if (!activeTest || !wordStartTime || !processedWords.length) return;

      // Use directAnswer if provided (for word bank/letter tiles), otherwise use state
      const answerToSubmit =
        directAnswer !== undefined ? directAnswer : userAnswer;

      const currentWord = processedWords[currentWordIndex];

      // Get expected answer from mode definition
      const wordObj = activeTest.words.find((w) => w.word === currentWord);
      if (!wordObj) {
        console.error(`Word not found: ${currentWord}`);
        return;
      }

      const mode = getMode(testMode);
      const expectedAnswer = mode?.getExpectedAnswer
        ? mode.getExpectedAnswer(wordObj, {
            translationDirection:
              wordDirections.length > currentWordIndex
                ? wordDirections[currentWordIndex]
                : "toTarget",
            wordSet: activeTest,
          })
        : currentWord;

      // Use normalized comparison that ignores punctuation and case
      // This is especially important for sentences like "Katten sover." vs "katten sover"
      const normalizedUserAnswer = normalizeText(answerToSubmit);
      const normalizedExpected = normalizeText(expectedAnswer);
      const isCorrect = normalizedUserAnswer === normalizedExpected;
      const newTries = currentTries + 1;
      const newAnswers = [...currentWordAnswers, answerToSubmit.trim()];

      // Analyze spelling for incorrect answers and collect error types
      const newErrorTypes = [...currentWordErrorTypes];
      if (!isCorrect) {
        const spellingConfig = {
          ...DEFAULT_SPELLING_CONFIG,
          almostCorrectThreshold:
            activeTest.testConfiguration?.almostCorrectThreshold ?? 2,
          showHintOnAttempt:
            activeTest.testConfiguration?.showHintOnAttempt ?? 2,
          enableKeyboardProximity:
            activeTest.testConfiguration?.enableKeyboardProximity ?? true,
        };
        const analysis = analyzeSpelling(
          answerToSubmit.trim(),
          expectedAnswer,
          spellingConfig,
        );
        // Add new error types (avoid duplicates)
        for (const errorType of analysis.errorTypes) {
          if (!newErrorTypes.includes(errorType)) {
            newErrorTypes.push(errorType);
          }
        }
        setCurrentWordErrorTypes(newErrorTypes);
      }

      setCurrentWordAnswers(newAnswers);
      setLastAnswerCorrect(isCorrect);
      setShowFeedback(true);
      setCurrentTries(newTries);

      if (isCorrect) {
        playSuccessTone();
      } else {
        playErrorSound();
      }

      // Clear any existing advancement timer
      if (advancementTimerRef.current) {
        clearTimeout(advancementTimerRef.current);
      }

      advancementTimerRef.current = setTimeout(() => {
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
            finalAnswer: answerToSubmit.trim(),
            audioPlayCount: currentWordAudioPlays,
            errorTypes: newErrorTypes.length > 0 ? newErrorTypes : undefined,
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
            setCurrentWordErrorTypes([]);
            // Reset audio state for next word to prevent stuck spinner
            isPlayingAudioRef.current = false;
            setIsAudioPlaying(false);
          } else {
            completeTest(newAnswersList);
          }
        } else {
          setUserAnswer("");
          // Auto-replay after wrong answer - mark as autoplay
          playTestWordAudio(currentWord, TIMING.AUDIO_REPLAY_DELAY_MS, true);
        }
      }, TIMING.FEEDBACK_DISPLAY_MS);
    },
    [
      activeTest,
      wordStartTime,
      processedWords,
      currentWordIndex,
      userAnswer,
      currentTries,
      currentWordAnswers,
      currentWordAudioPlays,
      currentWordErrorTypes,
      answers,
      completeTest,
      playTestWordAudio,
      testMode,
      wordDirections,
    ],
  );

  const handleNextWord = useCallback(() => {
    if (!activeTest || !showFeedback) return;

    // Clear the auto-advancement timer
    if (advancementTimerRef.current) {
      clearTimeout(advancementTimerRef.current);
      advancementTimerRef.current = null;
    }

    // Immediately hide feedback
    setShowFeedback(false);

    const testConfig = getEffectiveTestConfig(activeTest);
    const maxAttempts = testConfig?.maxAttempts ?? 3;
    const currentWord = processedWords[currentWordIndex];

    if (lastAnswerCorrect || currentTries >= maxAttempts) {
      const timeSpent = wordStartTime
        ? Math.round((new Date().getTime() - wordStartTime.getTime()) / 1000)
        : 0;

      const answer: TestAnswer = {
        word: currentWord,
        userAnswers: currentWordAnswers,
        isCorrect: lastAnswerCorrect,
        timeSpent,
        attempts: currentTries,
        finalAnswer: currentWordAnswers[currentWordAnswers.length - 1] || "",
        audioPlayCount: currentWordAudioPlays,
        errorTypes:
          currentWordErrorTypes.length > 0 ? currentWordErrorTypes : undefined,
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
        setCurrentWordErrorTypes([]);
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      } else {
        completeTest(newAnswersList);
      }
    } else {
      setUserAnswer("");
      playTestWordAudio(currentWord, TIMING.AUDIO_REPLAY_DELAY_MS, true);
    }
  }, [
    activeTest,
    showFeedback,
    processedWords,
    currentWordIndex,
    lastAnswerCorrect,
    currentTries,
    wordStartTime,
    currentWordAnswers,
    currentWordAudioPlays,
    currentWordErrorTypes,
    answers,
    completeTest,
    playTestWordAudio,
  ]);

  // Initialize test - first word audio is now played in startTest
  useEffect(() => {
    if (activeTest && processedWords.length > 0 && !testInitialized) {
      // Mark as initialized after state is set
      setTimeout(() => setTestInitialized(true), 0);
    }
  }, [activeTest, processedWords, testInitialized]);

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
      lastAutoPlayIndexRef.current !== currentWordIndex
    ) {
      lastAutoPlayIndexRef.current = currentWordIndex;
      playTestWordAudio(
        processedWordsRef.current[currentWordIndex],
        TIMING.TEST_START_AUDIO_DELAY_MS,
        true, // isAutoPlay
      );
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
    lastUserAnswer:
      currentWordAnswers.length > 0
        ? currentWordAnswers[currentWordAnswers.length - 1]
        : "",

    // Actions
    startTest,
    exitTest,
    restartTest,
    setUserAnswer,
    handleSubmitAnswer,
    handleNextWord,
    playCurrentWord,
    playTestWordAudio,
  };
}
