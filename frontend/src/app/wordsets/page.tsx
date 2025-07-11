"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  WordSet,
  TestConfiguration,
  DEFAULT_TEST_CONFIG,
  validateTestConfiguration,
  TestAnswer,
  SaveResultRequest,
  getEffectiveTestConfig,
} from "@/types";
import { generatedApiClient } from "@/lib/api-generated";
import {
  ModelsUpdateWordSetRequest,
  ModelsCreateWordSetRequest,
} from "@/generated";
import {
  playWordAudio as playWordAudioHelper,
  getWordSetAudioStats,
  stopAudio,
  initializeAudioForIOS,
  requiresUserInteractionForAudio,
} from "@/lib/audioPlayer";
import {
  playSuccessTone,
  playErrorSound,
  playCompletionTone,
} from "@/lib/audioTones";
import ProtectedRoute from "@/components/ProtectedRoute";
import WordSetEditor from "@/components/WordSetEditor";
import { FlagIcon } from "@/components/FlagIcon";
import {
  HeroBookIcon,
  HeroVolumeIcon,
  HeroPlayIcon,
  HeroTrashIcon,
  HeroSettingsIcon,
  HeroPencilIcon,
  ScoreIcon,
  HeroExclamationTriangleIcon,
  HeroXMarkIcon,
  HeroPlusIcon,
  HeroDevicePhoneMobileIcon,
  HeroEyeIcon,
} from "@/components/Icons";

export default function WordSetsPage() {
  const { t } = useLanguage();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsWordSet, setSettingsWordSet] = useState<WordSet | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteWordSet, setDeleteWordSet] = useState<WordSet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null); // Track which word is currently playing

  // Test state
  const [activeTest, setActiveTest] = useState<WordSet | null>(null);
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

  // Flashcard practice state
  const [practiceMode, setPracticeMode] = useState<WordSet | null>(null);
  const [practiceWords, setPracticeWords] = useState<string[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [showPracticeWord, setShowPracticeWord] = useState(false);

  // Enhanced test state for detailed tracking
  const [currentWordAnswers, setCurrentWordAnswers] = useState<string[]>([]);
  const [currentWordAudioPlays, setCurrentWordAudioPlays] = useState(0);

  // Test refs for stable audio functionality
  const activeTestRef = useRef<WordSet | null>(null);
  const processedWordsRef = useRef<string[]>([]);
  const isPlayingAudioRef = useRef(false);
  const lastAutoPlayIndexRef = useRef(-1);

  // Settings form state
  const [settingsConfig, setSettingsConfig] =
    useState<TestConfiguration>(DEFAULT_TEST_CONFIG);
  const [formError, setFormError] = useState<string>("");

  // Edit form state - simplified since WordSetEditor handles the form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingWordSet, setEditingWordSet] = useState<WordSet | null>(null);
  const [updating, setUpdating] = useState(false);

  // Derived values
  const testConfig = activeTest ? getEffectiveTestConfig(activeTest) : null;

  const loadWordSets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await generatedApiClient.getWordSets();
      if (response.data?.data) {
        setWordSets(response.data.data as WordSet[]);
      }
    } catch (error) {
      console.error("Failed to load word sets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWordSets();
  }, [loadWordSets]);

  // Periodically refresh wordsets if any have pending audio processing
  useEffect(() => {
    const hasPendingAudio = wordSets.some(
      (ws) => ws.audioProcessing === "pending",
    );

    if (hasPendingAudio) {
      const interval = setInterval(() => {
        loadWordSets();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }

    return undefined; // Explicit return for when there's no pending audio
  }, [wordSets, loadWordSets]);

  const saveSettings = async () => {
    if (!settingsWordSet) return;

    try {
      const validatedConfig = validateTestConfiguration(settingsConfig);
      // TODO: Implement API call to update wordset configuration
      console.log(
        "Saving settings for wordset:",
        settingsWordSet.id,
        validatedConfig,
      );

      // Update local state
      setWordSets(
        wordSets.map((ws) =>
          ws.id === settingsWordSet.id
            ? { ...ws, testConfiguration: validatedConfig }
            : ws,
        ),
      );

      setShowSettingsModal(false);
      setSettingsWordSet(null);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  // Functions still needed for UI interactions (not editor)
  const openDeleteModal = (wordSet: WordSet) => {
    setDeleteWordSet(wordSet);
    setShowDeleteModal(true);
  };

  const handleDeleteWordSet = async () => {
    if (!deleteWordSet) return;

    try {
      setDeleting(true);
      await generatedApiClient.deleteWordSet(deleteWordSet.id);
      setWordSets(wordSets.filter((ws) => ws.id !== deleteWordSet.id));
      setShowDeleteModal(false);
      setDeleteWordSet(null);
      console.log("Word set deleted successfully");
    } catch (error) {
      console.error("Failed to delete word set:", error);
      // Could show error message in the modal
    } finally {
      setDeleting(false);
    }
  };

  const handleWordClick = async (word: string, wordSet: WordSet) => {
    // Only play if audio is available
    const wordItem = wordSet.words.find((w) => w.word === word);
    if (!wordItem?.audio?.audioId) {
      return; // No audio available
    }

    setPlayingAudio(word);

    await playWordAudioHelper(word, wordSet, {
      onEnd: () => {
        setPlayingAudio(null);
      },
      onError: (error: Error) => {
        setPlayingAudio(null);
        console.error("Failed to play audio for word:", word, error);
      },
    });
  };

  const openSettingsModal = (wordSet: WordSet) => {
    setSettingsWordSet(wordSet);
    setSettingsConfig(wordSet.testConfiguration || DEFAULT_TEST_CONFIG);
    setShowSettingsModal(true);
  };

  const openEditModal = (wordSet: WordSet) => {
    setEditingWordSet(wordSet);
    setFormError("");
    setShowEditForm(true);
  };

  // Editor wrapper functions
  const handleEditorCreateSave = async (data: ModelsCreateWordSetRequest) => {
    try {
      setCreating(true);
      const response = await generatedApiClient.createWordSet(data);
      if (response.data?.data) {
        setWordSets([response.data.data as WordSet, ...wordSets]);
        setShowCreateForm(false);
        console.log("Word set created successfully");
      }
    } catch (error) {
      console.error("Failed to create word set:", error);
      throw new Error(t("wordsets.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleEditorEditSave = async (data: ModelsUpdateWordSetRequest) => {
    if (!editingWordSet) return;

    try {
      setUpdating(true);
      const response = await generatedApiClient.updateWordSet(
        editingWordSet.id,
        data,
      );
      if (response.data?.data) {
        setWordSets(
          wordSets.map((ws) =>
            ws.id === editingWordSet.id ? (response.data.data as WordSet) : ws,
          ),
        );
        setShowEditForm(false);
        setEditingWordSet(null);
        console.log("Word set updated successfully");
      }
    } catch (error) {
      console.error("Failed to update word set:", error);
      throw new Error(t("wordsets.updateError"));
    } finally {
      setUpdating(false);
    }
  };

  const handleEditorCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingWordSet(null);
    setFormError("");
  };

  const startTest = (wordSet: WordSet) => {
    // Initialize audio for iOS Safari compatibility
    initializeAudioForIOS();

    // Set the active test and initialize test state
    setActiveTest(wordSet);

    // Process words based on configuration
    const config = getEffectiveTestConfig(wordSet);
    const wordStrings = wordSet.words.map((w) => w.word);
    const words = config.shuffleWords
      ? [...wordStrings].sort(() => Math.random() - 0.5)
      : wordStrings;

    setProcessedWords(words);
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

    // Reset enhanced tracking state
    setCurrentWordAnswers([]);
    setCurrentWordAudioPlays(0);

    // Update refs for stable access
    activeTestRef.current = wordSet;
    processedWordsRef.current = words;
    isPlayingAudioRef.current = false;
    lastAutoPlayIndexRef.current = -1;
    stopAudio();
  };

  // Test audio functionality
  const playTestWordAudio = useCallback((word: string, autoDelay = 0) => {
    if (isPlayingAudioRef.current) return;

    const currentWordSet = activeTestRef.current;
    if (!currentWordSet) return;

    // Increment audio play count for current word
    setCurrentWordAudioPlays((prev) => prev + 1);

    // Check if this is Safari and requires user interaction
    const needsUserInteraction =
      requiresUserInteractionForAudio() && autoDelay > 0;

    playWordAudioHelper(word, currentWordSet, {
      onStart: () => {
        isPlayingAudioRef.current = true;
        setIsAudioPlaying(true);
      },
      onEnd: () => {
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      },
      onError: (error: Error) => {
        console.error("Audio playback error:", error);
        isPlayingAudioRef.current = false;
        setIsAudioPlaying(false);
      },
      autoDelay: needsUserInteraction ? 0 : autoDelay, // Skip auto-delay on Safari
      speechRate: 0.8,
      requireUserInteraction: needsUserInteraction,
    });
  }, []);

  const playCurrentWord = useCallback(() => {
    const words = processedWordsRef.current;
    if (words.length > currentWordIndex) {
      playTestWordAudio(words[currentWordIndex]);
    }
  }, [playTestWordAudio, currentWordIndex]);

  // Initialize test and handle auto-play
  useEffect(() => {
    if (activeTest && processedWords.length > 0 && !testInitialized) {
      setTestInitialized(true);

      // Auto-play first word if enabled (skip on Safari due to autoplay restrictions)
      if (testConfig?.autoPlayAudio && !requiresUserInteractionForAudio()) {
        lastAutoPlayIndexRef.current = 0;
        playTestWordAudio(processedWords[0], 500);
      }
    }
  }, [
    activeTest,
    processedWords,
    testInitialized,
    testConfig,
    playTestWordAudio,
  ]);

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
      !requiresUserInteractionForAudio() // Skip auto-play on Safari
    ) {
      lastAutoPlayIndexRef.current = currentWordIndex;
      playTestWordAudio(processedWordsRef.current[currentWordIndex], 500);
    }
  }, [currentWordIndex, testInitialized, playTestWordAudio]);

  // Test functionality
  const handleSubmitAnswer = () => {
    if (!activeTest || !wordStartTime || !processedWords.length) return;

    const currentWord = processedWords[currentWordIndex];
    const isCorrect =
      userAnswer.toLowerCase().trim() === currentWord.toLowerCase();
    const newTries = currentTries + 1;

    // Track all answers for this word
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

      if (isCorrect || newTries >= (testConfig?.maxAttempts ?? 3)) {
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
          setCurrentWordIndex(currentWordIndex + 1);
          setUserAnswer("");
          setWordStartTime(new Date());
          setCurrentTries(0);
          setCurrentWordAnswers([]);
          setCurrentWordAudioPlays(0);
        } else {
          completeTest(newAnswersList);
        }
      } else {
        setUserAnswer("");
        // Auto-replay word if incorrect (skip on Safari due to autoplay restrictions)
        if (!requiresUserInteractionForAudio()) {
          playTestWordAudio(currentWord, 500);
        }
      }
    }, 2000);
  };

  const completeTest = async (finalAnswers: TestAnswer[]) => {
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
      // Convert TestAnswer to WordTestResult format
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
        incorrectWords, // Keep for backward compatibility
        words: wordsResults,
        timeSpent: totalTimeSpent,
      };

      await generatedApiClient.saveResult(resultData);
    } catch (error) {
      console.error("Failed to save test result:", error);
    }

    playCompletionTone();
    setShowResult(true);
  };

  const restartTest = () => {
    if (!activeTest) return;

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

    // Reset enhanced tracking state
    setCurrentWordAnswers([]);
    setCurrentWordAudioPlays(0);

    isPlayingAudioRef.current = false;
    lastAutoPlayIndexRef.current = -1;
    stopAudio();
  };

  const exitTest = () => {
    setActiveTest(null);
    setShowResult(false);
    stopAudio();
  };

  // Flashcard practice functionality
  const startPractice = (wordSet: WordSet) => {
    // Initialize audio for iOS Safari compatibility
    initializeAudioForIOS();

    // Set up practice mode
    setPracticeMode(wordSet);

    // Process words with shuffling if enabled
    const config = getEffectiveTestConfig(wordSet);
    const wordStrings = wordSet.words.map((w) => w.word);
    const words = config.shuffleWords
      ? [...wordStrings].sort(() => Math.random() - 0.5)
      : wordStrings;

    setPracticeWords(words);
    setCurrentPracticeIndex(0);
    setShowPracticeWord(false);
    stopAudio();
  };

  const exitPractice = () => {
    setPracticeMode(null);
    setPracticeWords([]);
    setCurrentPracticeIndex(0);
    setShowPracticeWord(false);
    stopAudio();
  };

  const nextPracticeWord = useCallback(() => {
    if (currentPracticeIndex < practiceWords.length - 1) {
      setCurrentPracticeIndex(currentPracticeIndex + 1);
      setShowPracticeWord(false);
    }
  }, [currentPracticeIndex, practiceWords.length]);

  const previousPracticeWord = useCallback(() => {
    if (currentPracticeIndex > 0) {
      setCurrentPracticeIndex(currentPracticeIndex - 1);
      setShowPracticeWord(false);
    }
  }, [currentPracticeIndex]);

  const playPracticeWordAudio = useCallback(() => {
    if (!practiceMode || practiceWords.length === 0) return;

    const currentWord = practiceWords[currentPracticeIndex];
    playWordAudioHelper(currentWord, practiceMode, {
      onStart: () => setIsAudioPlaying(true),
      onEnd: () => setIsAudioPlaying(false),
      onError: (error: Error) => {
        console.error("Practice audio playback error:", error);
        setIsAudioPlaying(false);
      },
      speechRate: 0.8,
    });
  }, [practiceMode, practiceWords, currentPracticeIndex]);

  const playPracticeWordAudioWithDelay = useCallback(
    (word: string, delay = 0) => {
      if (!practiceMode) return;

      // Check if auto-play is supported (not Safari/iOS)
      if (requiresUserInteractionForAudio()) {
        return; // Skip auto-play on Safari/iOS
      }

      const wordItem = practiceMode.words.find((w) => w.word === word);
      if (!wordItem?.audio?.audioUrl) {
        return; // No audio available
      }

      playWordAudioHelper(word, practiceMode, {
        onStart: () => setIsAudioPlaying(true),
        onEnd: () => setIsAudioPlaying(false),
        onError: (error: Error) => {
          console.error("Practice auto-play error:", error);
          setIsAudioPlaying(false);
        },
        speechRate: 0.8,
        autoDelay: delay,
      });
    },
    [practiceMode],
  );

  const shufflePracticeWords = useCallback(() => {
    const shuffled = [...practiceWords].sort(() => Math.random() - 0.5);
    setPracticeWords(shuffled);
    setCurrentPracticeIndex(0);
    setShowPracticeWord(false);

    // Auto-play first word after shuffle (with longer delay)
    setTimeout(() => {
      playPracticeWordAudioWithDelay(shuffled[0], 300);
    }, 1000);
  }, [practiceWords, playPracticeWordAudioWithDelay]);

  // Auto-play when entering practice mode
  useEffect(() => {
    if (
      practiceMode &&
      practiceWords.length > 0 &&
      currentPracticeIndex === 0
    ) {
      // Auto-play first word after a short delay
      const timer = setTimeout(() => {
        playPracticeWordAudioWithDelay(practiceWords[0], 500);
      }, 800); // Give UI time to render

      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for when no cleanup is needed
  }, [
    practiceMode,
    practiceWords,
    currentPracticeIndex,
    playPracticeWordAudioWithDelay,
  ]);

  // Auto-play when navigating to a new word
  useEffect(() => {
    if (practiceMode && practiceWords.length > 0 && currentPracticeIndex > 0) {
      // Auto-play new word after a short delay
      const timer = setTimeout(() => {
        playPracticeWordAudioWithDelay(
          practiceWords[currentPracticeIndex],
          300,
        );
      }, 500);

      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for when no cleanup is needed
  }, [
    currentPracticeIndex,
    practiceMode,
    practiceWords,
    playPracticeWordAudioWithDelay,
  ]);

  // Keyboard navigation for practice mode
  useEffect(() => {
    if (!practiceMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          previousPracticeWord();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextPracticeWord();
          break;
        case " ":
          e.preventDefault();
          if (e.shiftKey) {
            playPracticeWordAudio();
          } else {
            setShowPracticeWord(!showPracticeWord);
          }
          break;
        case "Escape":
          e.preventDefault();
          exitPractice();
          break;
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            shufflePracticeWords();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    practiceMode,
    showPracticeWord,
    currentPracticeIndex,
    practiceWords.length,
    nextPracticeWord,
    previousPracticeWord,
    playPracticeWordAudio,
    shufflePracticeWords,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">{t("wordsets.loading")}</p>
        </div>
      </div>
    );
  }

  // Flashcard Practice View
  if (practiceMode && practiceWords.length > 0) {
    const currentWord = practiceWords[currentPracticeIndex];
    const wordItem = practiceMode.words.find((w) => w.word === currentWord);
    const hasAudio = wordItem?.audio?.audioUrl;

    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container px-4 py-8 mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-800">
                {t("wordsets.practice.title")} - {practiceMode.name}
              </h1>
              <p className="text-gray-600">
                {t("test.progress")} {currentPracticeIndex + 1} {t("common.of")}{" "}
                {practiceWords.length}
              </p>
              <div className="w-full h-2 mt-4 bg-gray-200 rounded-full">
                <div
                  className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{
                    width: `${((currentPracticeIndex + 1) / practiceWords.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Auto-play Notice for Safari/iOS */}
            {requiresUserInteractionForAudio() && (
              <div className="max-w-2xl mx-auto mb-4">
                <div className="p-3 text-sm border rounded-lg text-amber-700 bg-amber-50 border-amber-200">
                  <div className="flex items-center">
                    <HeroDevicePhoneMobileIcon className="w-5 h-5 mr-2 text-amber-600" />
                    <span>{t("wordsets.practice.autoplayNotice")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Practice Card */}
            <div className="max-w-2xl mx-auto">
              <div className="p-8 text-center bg-white rounded-lg shadow-xl">
                {/* Audio Button */}
                <div className="mb-8">
                  <div className="relative inline-block">
                    {isAudioPlaying && (
                      <div className="absolute border-4 border-transparent rounded-full -inset-3 border-t-purple-500 border-r-purple-400 animate-spin"></div>
                    )}
                    <button
                      onClick={playPracticeWordAudio}
                      disabled={!hasAudio}
                      className={`relative p-6 text-6xl transition-all duration-200 transform rounded-full shadow-lg ${
                        hasAudio
                          ? "text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-xl hover:scale-105"
                          : "text-gray-400 bg-gray-200 cursor-not-allowed"
                      }`}
                      title={
                        hasAudio
                          ? t("wordsets.clickToPlay")
                          : t("wordsets.noAudio")
                      }
                    >
                      <HeroVolumeIcon className="w-16 h-16" />
                    </button>
                  </div>
                  <p className="mt-4 text-gray-600">
                    {hasAudio ? (
                      requiresUserInteractionForAudio() ? (
                        t("wordsets.practice.clickToHear")
                      ) : (
                        <span className="flex items-center justify-center">
                          <HeroVolumeIcon className="w-4 h-4 mr-1 text-gray-600" />
                          {t("wordsets.practice.autoPlayingReplay")}
                        </span>
                      )
                    ) : (
                      t("wordsets.noAudio")
                    )}
                  </p>
                </div>

                {/* Word Display */}
                <div className="mb-8">
                  <div className="duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
                    <button
                      onClick={() => setShowPracticeWord(!showPracticeWord)}
                      className={`transition-all duration-500 cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-200 rounded-lg p-4 ${
                        showPracticeWord
                          ? ""
                          : "hover:scale-105 hover:shadow-lg"
                      }`}
                      title={
                        showPracticeWord
                          ? t("wordsets.practice.clickToBlur")
                          : t("wordsets.practice.clickToReveal")
                      }
                    >
                      <h2
                        className={`text-6xl font-bold text-gray-800 mb-4 transition-all duration-500 select-none ${
                          showPracticeWord ? "filter-none" : "filter blur-xl"
                        }`}
                        style={{
                          textShadow: showPracticeWord
                            ? "none"
                            : "0 0 30px rgba(0,0,0,0.3)",
                          letterSpacing: showPracticeWord ? "normal" : "0.1em",
                        }}
                      >
                        {currentWord}
                      </h2>
                    </button>
                    <p className="mt-2 text-sm text-gray-500">
                      {showPracticeWord ? (
                        <span className="flex items-center justify-center">
                          <HeroEyeIcon className="w-4 h-4 mr-1 text-gray-500" />
                          {t("wordsets.practice.wordRevealed")}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <HeroEyeIcon className="w-4 h-4 mr-1 text-gray-500" />
                          {t("wordsets.practice.clickToRevealHint")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex flex-wrap justify-center gap-4">
                  {" "}
                  <button
                    onClick={previousPracticeWord}
                    disabled={currentPracticeIndex === 0}
                    className="flex items-center px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    {t("wordsets.practice.previous")}
                  </button>
                  <button
                    onClick={shufflePracticeWords}
                    className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {t("wordsets.practice.shuffle")}
                  </button>
                  <button
                    onClick={nextPracticeWord}
                    disabled={currentPracticeIndex === practiceWords.length - 1}
                    className="flex items-center px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("wordsets.practice.next")}
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <button
                    onClick={() => startTest(practiceMode)}
                    className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:scale-105"
                  >
                    <HeroPlayIcon className="w-5 h-5 mr-2" />
                    {t("wordsets.startTest")}
                  </button>

                  <button
                    onClick={exitPractice}
                    className="flex items-center px-6 py-3 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <HeroXMarkIcon className="w-5 h-5 mr-2" />
                    {t("wordsets.cancel")}
                  </button>
                </div>
              </div>

              {/* Word List Preview */}
              <div className="p-4 mt-6 bg-white rounded-lg shadow">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">
                  {t("wordsets.practice.wordList")} ({practiceWords.length}{" "}
                  {t("wordsets.words.count")})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {practiceWords.map((word, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentPracticeIndex(index);
                        setShowPracticeWord(false);
                        // Auto-play the selected word
                        setTimeout(() => {
                          playPracticeWordAudioWithDelay(word, 200);
                        }, 400);
                      }}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        index === currentPracticeIndex
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="p-4 mt-6 rounded-lg bg-blue-50">
                <h4 className="mb-2 text-sm font-semibold text-blue-800">
                  {t("wordsets.practice.keyboardShortcuts")}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                  <div>
                    <kbd className="px-1 bg-white rounded">←</kbd>{" "}
                    {t("wordsets.practice.keyPrevious")}
                  </div>
                  <div>
                    <kbd className="px-1 bg-white rounded">→</kbd>{" "}
                    {t("wordsets.practice.keyNext")}
                  </div>
                  <div>
                    <kbd className="px-1 bg-white rounded">Space</kbd>{" "}
                    {t("wordsets.practice.keyToggle")}
                  </div>
                  <div>
                    <kbd className="px-1 bg-white rounded">Shift+Space</kbd>{" "}
                    {t("wordsets.practice.keyAudio")}
                  </div>
                  <div>
                    <kbd className="px-1 bg-white rounded">Cmd+S</kbd>{" "}
                    {t("wordsets.practice.keyShuffle")}
                  </div>
                  <div>
                    <kbd className="px-1 bg-white rounded">Esc</kbd>{" "}
                    {t("wordsets.practice.keyExit")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Test Results View
  if (activeTest && showResult) {
    const correctAnswers = answers.filter((a) => a.isCorrect);
    const score = Math.round((correctAnswers.length / answers.length) * 100);

    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="w-full max-w-2xl p-8 mx-4 bg-white rounded-lg shadow-xl">
            <div className="mb-8 text-center">
              <div className="mb-4">
                <ScoreIcon score={score} className="w-16 h-16" />
              </div>
              <h1 className="mb-2 text-3xl font-bold text-gray-800">
                {t("test.complete")}
              </h1>
              <h2 className="text-xl text-gray-600">{activeTest.name}</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 text-center rounded-lg bg-green-50">
                <div className="text-3xl font-bold text-green-600">
                  {score}%
                </div>
                <div className="text-gray-600">{t("test.score")}</div>
              </div>
              <div className="p-4 text-center rounded-lg bg-blue-50">
                <div className="text-3xl font-bold text-blue-600">
                  {correctAnswers.length}/{answers.length}
                </div>
                <div className="text-gray-600">{t("test.correct")}</div>
              </div>
            </div>

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
                            {t("test.yourAnswer")} &quot;{answer.finalAnswer}
                            &quot;
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => playTestWordAudio(answer.word)}
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
                onClick={exitTest}
                className="px-6 py-3 font-semibold text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
              >
                {t("test.backToWordSets")}
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Test Interface View
  if (activeTest && !showResult) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container px-4 py-8 mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-800">
                {activeTest.name}
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

            {/* Safari Auto-play Notice */}
            {requiresUserInteractionForAudio() && testConfig?.autoPlayAudio && (
              <div className="max-w-2xl mx-auto mb-4">
                <div className="p-3 text-sm border rounded-lg text-amber-700 bg-amber-50 border-amber-200">
                  <div className="flex items-center">
                    <HeroDevicePhoneMobileIcon className="w-5 h-5 mr-2 text-amber-600" />
                    <span>{t("wordsets.safari.autoplayLimited")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Test Area */}
            <div className="max-w-2xl mx-auto">
              <div className="p-4 text-center bg-white rounded-lg shadow-xl sm:p-8">
                <div className="mb-8">
                  <div className="relative inline-block">
                    {isAudioPlaying && (
                      <div className="absolute border-4 border-transparent rounded-full -inset-3 border-t-blue-500 border-r-blue-400 animate-spin"></div>
                    )}
                    <button
                      onClick={playCurrentWord}
                      className="relative p-4 text-4xl text-white transition-all duration-200 transform rounded-full shadow-lg sm:p-6 sm:text-6xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-xl hover:scale-105"
                    >
                      <HeroVolumeIcon className="w-12 h-12 text-white sm:w-16 sm:h-16" />
                    </button>
                  </div>
                  <p className="mt-4 text-gray-600">
                    <span className="sm:hidden">
                      {t("test.listenToWordMobile")}
                    </span>
                    <span className="hidden sm:inline">
                      {t("test.listenToWord")}
                    </span>
                  </p>

                  {/* Show definition/context if available for current word */}
                  {activeTest &&
                    activeTest.words[currentWordIndex] &&
                    activeTest.words[currentWordIndex].definition && (
                      <div className="max-w-md px-4 py-2 mx-auto mt-3 text-sm border border-blue-200 rounded-lg bg-blue-50">
                        <p className="text-blue-800">
                          <span className="font-medium">
                            {t("test.context")}
                          </span>{" "}
                          {activeTest.words[currentWordIndex].definition}
                        </p>
                      </div>
                    )}
                </div>

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
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSubmitAnswer()
                      }
                      className="w-full px-4 py-3 text-xl text-center transition-all duration-200 border-2 border-gray-300 rounded-lg sm:px-6 sm:py-4 sm:text-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t("test.typeWordHere")}
                      autoFocus
                      autoCorrect={testConfig?.enableAutocorrect ? "on" : "off"}
                      autoCapitalize={
                        testConfig?.enableAutocorrect ? "on" : "off"
                      }
                      spellCheck={testConfig?.enableAutocorrect}
                    />
                  )}
                </div>

                <div className="flex justify-center h-5 mb-8">
                  <p className="text-sm text-gray-500">
                    {t("test.attemptsRemaining")}:{" "}
                    {(testConfig?.maxAttempts ?? 3) - currentTries}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                  {/* Play Again Button */}
                  <button
                    onClick={playCurrentWord}
                    className="flex items-center px-4 py-2 font-semibold text-white transition-colors bg-blue-500 rounded-lg sm:px-6 sm:py-3 hover:bg-blue-600"
                    disabled={showFeedback}
                  >
                    <HeroVolumeIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {t("test.playAgain")}
                    </span>
                  </button>

                  {/* Next/Finish Button */}
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || showFeedback}
                    className="px-4 py-2 font-semibold text-white transition-all duration-200 rounded-lg sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sm:hidden">
                      {currentWordIndex < processedWords.length - 1
                        ? t("test.nextMobile")
                        : t("test.finishMobile")}
                    </span>
                    <span className="hidden sm:inline">
                      {currentWordIndex < processedWords.length - 1
                        ? t("test.nextWord")
                        : t("test.finishTest")}
                    </span>
                  </button>

                  {/* Back Button */}
                  <button
                    onClick={exitTest}
                    className="px-4 py-2 font-semibold text-gray-600 transition-colors bg-gray-200 rounded-lg sm:px-6 sm:py-3 hover:bg-gray-300"
                  >
                    <span className="sm:hidden">{t("test.backMobile")}</span>
                    <span className="hidden sm:inline">
                      {t("test.backToWordSets")}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center text-gray-600">
                {answers.length > 0 && (
                  <p>
                    {t("test.correctSoFar")}:{" "}
                    {answers.filter((a) => a.isCorrect).length} /{" "}
                    {answers.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              {t("wordsets.title")}
            </h1>
            <p className="text-lg text-gray-600">{t("wordsets.subtitle")}</p>
          </div>

          {/* Create New Word Set Button */}
          <div className="mb-8">
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setFormError("");
              }}
              className="flex items-center px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl hover:scale-105"
            >
              <span className="mr-2">
                {showCreateForm ? (
                  <HeroXMarkIcon className="w-5 h-5" />
                ) : (
                  <HeroPlusIcon className="w-5 h-5" />
                )}
              </span>
              {showCreateForm ? t("wordsets.cancel") : t("wordsets.create")}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <WordSetEditor
              mode="create"
              onSave={handleEditorCreateSave}
              onCancel={handleEditorCancel}
              isLoading={creating}
              error={formError}
            />
          )}

          {/* Word Sets List */}
          {wordSets.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4">
                <HeroBookIcon className="w-16 h-16 mx-auto text-indigo-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-600">
                {t("wordsets.noTitle")}
              </h3>
              <p className="text-gray-500">{t("wordsets.noSubtitle")}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {wordSets.map((wordSet) => (
                <div
                  key={wordSet.id}
                  className="flex flex-col p-6 transition-shadow duration-200 bg-white border border-gray-100 rounded-lg shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {wordSet.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <FlagIcon
                        language={wordSet.language as "no" | "en"}
                        className="w-5 h-4"
                      />
                      <span className="px-2 py-1 text-xs text-blue-800 uppercase bg-blue-100 rounded">
                        {wordSet.language}
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow">
                    <p className="mb-4 text-gray-600">
                      {wordSet.words.length}{" "}
                      {wordSet.words.length === 1
                        ? t("results.word")
                        : t("wordsets.words.count")}
                      {(() => {
                        const audioStats = getWordSetAudioStats(wordSet);
                        return (
                          audioStats.hasAnyAudio && (
                            <span className="ml-2 text-sm text-blue-600">
                              • {audioStats.wordsWithAudio}{" "}
                              {t("wordsets.withAudio")}
                            </span>
                          )
                        );
                      })()}
                      {/* Show audio processing status */}
                      {wordSet.audioProcessing && (
                        <span
                          className={`ml-2 text-sm ${
                            wordSet.audioProcessing === "pending"
                              ? "text-yellow-600"
                              : wordSet.audioProcessing === "completed"
                                ? "text-green-600"
                                : "text-red-600"
                          }`}
                        >
                          •{" "}
                          {wordSet.audioProcessing === "pending"
                            ? t("wordsets.audioProcessing")
                            : wordSet.audioProcessing === "completed"
                              ? t("wordsets.audioReady")
                              : t("wordsets.audioProcessingFailed")}
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4 overflow-y-auto max-h-20">
                      {wordSet.words.slice(0, 10).map((wordItem, index) => {
                        const hasAudio = wordItem.audio?.audioUrl;
                        const isPlaying = playingAudio === wordItem.word;

                        return (
                          <span
                            key={index}
                            onClick={() =>
                              hasAudio
                                ? handleWordClick(wordItem.word, wordSet)
                                : undefined
                            }
                            className={`inline-flex items-center px-2 py-1 text-sm rounded transition-all duration-200 ${
                              hasAudio
                                ? "text-blue-700 bg-blue-100 cursor-pointer hover:bg-blue-200 hover:shadow-sm"
                                : "text-gray-700 bg-gray-100"
                            } ${isPlaying ? "ring-2 ring-blue-500 shadow-md" : ""}`}
                            title={
                              hasAudio
                                ? t("wordsets.clickToPlay")
                                : t("wordsets.noAudio")
                            }
                          >
                            {hasAudio && (
                              <HeroVolumeIcon
                                className={`w-3 h-3 mr-1 ${isPlaying ? "text-blue-600" : "text-blue-500"}`}
                              />
                            )}
                            {wordItem.word}
                          </span>
                        );
                      })}
                      {wordSet.words.length > 10 && (
                        <span className="px-2 py-1 text-sm text-gray-600 bg-gray-200 rounded">
                          +{wordSet.words.length - 10} {t("wordsets.moreWords")}
                        </span>
                      )}
                    </div>

                    {/* Audio processing indicator */}
                    {wordSet.audioProcessing === "pending" && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-amber-600">
                            {t("wordsets.audioProcessingInProgress")}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 rounded-full bg-amber-500 animate-pulse"
                            style={{ width: "100%" }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 mt-auto">
                    <button
                      onClick={() => startTest(wordSet)}
                      className="flex items-center justify-center flex-1 px-4 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-lg hover:scale-105"
                    >
                      <HeroPlayIcon className="w-4 h-4 mr-2 text-white" />
                      {t("wordsets.startTest")}
                    </button>
                    <button
                      onClick={() => startPractice(wordSet)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-purple-500 rounded-lg shadow-md hover:bg-purple-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.practice.buttonTooltip")}
                    >
                      <HeroBookIcon className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => openSettingsModal(wordSet)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-gray-500 rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.settings")}
                    >
                      <HeroSettingsIcon className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => openEditModal(wordSet)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.edit")}
                    >
                      <HeroPencilIcon className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(wordSet)}
                      className="flex items-center justify-center px-4 py-3 font-medium text-white transition-all duration-200 bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg hover:scale-105"
                      title={t("wordsets.delete")}
                    >
                      <HeroTrashIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Modal */}
        {showSettingsModal && settingsWordSet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                {t("wordsets.settings")} - {settingsWordSet.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("wordsets.config.maxAttempts")}
                  </label>
                  <select
                    value={settingsConfig.maxAttempts}
                    onChange={(e) =>
                      setSettingsConfig({
                        ...settingsConfig,
                        maxAttempts: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 {t("wordsets.config.attempt")}</option>
                    <option value={2}>2 {t("wordsets.config.attempts")}</option>
                    <option value={3}>
                      3 {t("wordsets.config.attempts")} (
                      {t("wordsets.config.default")})
                    </option>
                    <option value={4}>4 {t("wordsets.config.attempts")}</option>
                    <option value={5}>5 {t("wordsets.config.attempts")}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.autoPlayAudio}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          autoPlayAudio: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.autoPlayAudio")}
                    </span>
                  </label>
                  {requiresUserInteractionForAudio() &&
                    settingsConfig.autoPlayAudio && (
                      <div className="p-2 text-xs border rounded text-amber-600 bg-amber-50 border-amber-200">
                        <div className="flex items-start space-x-2">
                          <HeroExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{t("wordsets.safari.autoplayWarning")}</span>
                        </div>
                      </div>
                    )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.shuffleWords}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          shuffleWords: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.shuffleWords")}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.showCorrectAnswer}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          showCorrectAnswer: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.showCorrectAnswer")}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsConfig.enableAutocorrect}
                      onChange={(e) =>
                        setSettingsConfig({
                          ...settingsConfig,
                          enableAutocorrect: e.target.checked,
                        })
                      }
                      className="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t("wordsets.config.enableAutocorrect")}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    {t("wordsets.config.timeLimit")} (
                    {t("wordsets.config.optional")})
                  </label>
                  <input
                    type="number"
                    value={settingsConfig.timeLimit || ""}
                    onChange={(e) =>
                      setSettingsConfig({
                        ...settingsConfig,
                        timeLimit: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder={t("wordsets.config.noTimeLimit")}
                    min="1"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t("wordsets.config.timeLimitHelp")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  {t("wordsets.cancel")}
                </button>
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {t("wordsets.saveSettings")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit WordSet Modal */}
        {showEditForm && editingWordSet && (
          <WordSetEditor
            mode="edit"
            initialData={editingWordSet}
            onSave={handleEditorEditSave}
            onCancel={handleEditorCancel}
            isLoading={updating}
            error={formError}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteWordSet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <HeroTrashIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {t("wordsets.deleteConfirm")}
                </h3>
                <p className="mb-4 text-sm text-gray-500">
                  {t("wordsets.deleteConfirmMessage").replace(
                    "{name}",
                    deleteWordSet.name,
                  )}
                </p>

                <div className="p-3 mb-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {t("wordsets.deleteWarning")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteWordSet(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("wordsets.cancel")}
                </button>
                <button
                  onClick={handleDeleteWordSet}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      {t("wordsets.deleting")}
                    </>
                  ) : (
                    <>
                      <HeroTrashIcon className="w-4 h-4 mr-2 text-white" />
                      {t("wordsets.delete")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer with build info */}
        <footer className="pb-4 mt-12 text-center">
          <div className="text-xs text-gray-400">
            Build:{" "}
            {process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()}
            {process.env.NODE_ENV === "development" && " (dev)"}
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
