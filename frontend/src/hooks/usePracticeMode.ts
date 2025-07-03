import { useState, useCallback, useEffect } from "react";
import { WordSet, getEffectiveTestConfig } from "@/types";
import {
  playWordAudio as playWordAudioHelper,
  stopAudio,
  initializeAudioForIOS,
  requiresUserInteractionForAudio,
} from "@/lib/audioPlayer";

export interface UsePracticeModeReturn {
  // State
  practiceMode: WordSet | null;
  practiceWords: string[];
  currentPracticeIndex: number;
  showPracticeWord: boolean;
  isAudioPlaying: boolean;

  // Actions
  startPractice: (wordSet: WordSet) => void;
  exitPractice: () => void;
  nextPracticeWord: () => void;
  previousPracticeWord: () => void;
  setCurrentPracticeIndex: (index: number) => void;
  setShowPracticeWord: (show: boolean) => void;
  playPracticeWordAudio: () => void;
  shufflePracticeWords: () => void;
}

export function usePracticeMode(): UsePracticeModeReturn {
  const [practiceMode, setPracticeMode] = useState<WordSet | null>(null);
  const [practiceWords, setPracticeWords] = useState<string[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [showPracticeWord, setShowPracticeWord] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const playPracticeWordAudioWithDelay = useCallback(
    (word: string, delay = 0) => {
      if (!practiceMode) return;

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

  const startPractice = useCallback((wordSet: WordSet) => {
    initializeAudioForIOS();

    setPracticeMode(wordSet);

    const config = getEffectiveTestConfig(wordSet);
    const wordStrings = wordSet.words.map((w) => w.word);
    const words = config.shuffleWords
      ? [...wordStrings].sort(() => Math.random() - 0.5)
      : wordStrings;

    setPracticeWords(words);
    setCurrentPracticeIndex(0);
    setShowPracticeWord(false);
    stopAudio();
  }, []);

  const exitPractice = useCallback(() => {
    setPracticeMode(null);
    setPracticeWords([]);
    setCurrentPracticeIndex(0);
    setShowPracticeWord(false);
    stopAudio();
  }, []);

  const nextPracticeWord = useCallback(() => {
    if (currentPracticeIndex < practiceWords.length - 1) {
      setCurrentPracticeIndex((prev) => prev + 1);
      setShowPracticeWord(false);
    }
  }, [currentPracticeIndex, practiceWords.length]);

  const previousPracticeWord = useCallback(() => {
    if (currentPracticeIndex > 0) {
      setCurrentPracticeIndex((prev) => prev - 1);
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
      const timer = setTimeout(() => {
        playPracticeWordAudioWithDelay(practiceWords[0], 500);
      }, 800);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    practiceMode,
    practiceWords,
    currentPracticeIndex,
    playPracticeWordAudioWithDelay,
  ]);

  // Auto-play when navigating to a new word
  useEffect(() => {
    if (practiceMode && practiceWords.length > 0 && currentPracticeIndex > 0) {
      const timer = setTimeout(() => {
        playPracticeWordAudioWithDelay(
          practiceWords[currentPracticeIndex],
          300,
        );
      }, 500);

      return () => clearTimeout(timer);
    }
    return undefined;
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
            setShowPracticeWord((prev) => !prev);
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
    exitPractice,
  ]);

  return {
    // State
    practiceMode,
    practiceWords,
    currentPracticeIndex,
    showPracticeWord,
    isAudioPlaying,

    // Actions
    startPractice,
    exitPractice,
    nextPracticeWord,
    previousPracticeWord,
    setCurrentPracticeIndex,
    setShowPracticeWord,
    playPracticeWordAudio,
    shufflePracticeWords,
  };
}
