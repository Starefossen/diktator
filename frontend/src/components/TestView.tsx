import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  WordSet,
  TestAnswer,
  getEffectiveTestConfig,
  TestConfiguration,
  TestMode,
} from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { requiresUserInteractionForAudio } from "@/lib/audioPlayer";
import { HeroVolumeIcon, HeroDevicePhoneMobileIcon } from "@/components/Icons";
import {
  analyzeSpelling,
  DEFAULT_SPELLING_CONFIG,
  SpellingFeedbackConfig,
  getHintForAttempt,
} from "@/lib/spellingAnalysis";
import { getMode } from "@/lib/testEngine/registry";
import { TestHeader } from "@/components/TestHeader";
import { TestAudioButton } from "@/components/TestAudioButton";
import { TestScoreSummary } from "@/components/TestScoreSummary";
import { TestFeedbackOverlay } from "@/components/TestFeedbackOverlay";
import { TestModeRenderer } from "@/components/TestModeRenderer";
import { TIMING } from "@/lib/timingConfig";
import { Button } from "@/components/Button";
import { TileFeedbackState } from "@/components/LetterTileInput";
import { WordBankInput } from "@/components/WordBankInput";
import { SentenceFeedback } from "@/components/SentenceFeedback";
import { generateLetterTiles, generateWordBank } from "@/lib/challenges";
import { isSentence } from "@/lib/sentenceConfig";
import { scoreSentence, SentenceScoringResult } from "@/lib/sentenceScoring";
import { FlashcardView } from "@/components/FlashcardView";
import { LookCoverWriteView } from "@/components/LookCoverWriteView";
import {
  MissingLettersInput,
  detectSpellingChallenge,
} from "@/components/MissingLettersInput";

// ============================================================================
// Types
// ============================================================================

interface TestViewProps {
  activeTest: WordSet;
  currentWordIndex: number;
  processedWords: string[];
  userAnswer: string;
  showFeedback: boolean;
  lastAnswerCorrect: boolean;
  currentTries: number;
  answers: TestAnswer[];
  isAudioPlaying: boolean;
  testMode: TestMode;
  wordDirections: ("toTarget" | "toSource")[];
  lastUserAnswer: string;
  onUserAnswerChange: (answer: string) => void;
  onSubmitAnswer: (directAnswer?: string) => void;
  onPlayCurrentWord: () => void;
  onExitTest: () => void;
}

/**
 * Effective input type derived from TestMode
 * letterTiles, wordBank, and keyboard are used for input
 * Other modes (flashcard, lookCoverWrite, missingLetters) have their own components
 */
type EffectiveInputType = "letterTiles" | "wordBank" | "keyboard";

interface FeedbackState {
  isCurrentSentence: boolean;
  sentenceScoringResult: SentenceScoringResult | null;
  spellingConfig: SpellingFeedbackConfig;
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Creates a memoized spelling config from test configuration.
 * Consolidates config creation to avoid duplicate objects.
 */
function useSpellingConfig(
  testConfig: TestConfiguration | undefined,
): SpellingFeedbackConfig {
  return useMemo(
    () => ({
      ...DEFAULT_SPELLING_CONFIG,
      almostCorrectThreshold: testConfig?.almostCorrectThreshold ?? 2,
      showHintOnAttempt: testConfig?.showHintOnAttempt ?? 2,
      enableKeyboardProximity: testConfig?.enableKeyboardProximity ?? true,
    }),
    [
      testConfig?.almostCorrectThreshold,
      testConfig?.showHintOnAttempt,
      testConfig?.enableKeyboardProximity,
    ],
  );
}

/**
 * Derives the effective input type from TestMode.
 * letterTiles, wordBank, keyboard modes use those input types directly.
 * Other modes (translation, missingLetters, etc.) default to keyboard input.
 */
function useEffectiveInputType(testMode: TestMode): EffectiveInputType {
  return useMemo(() => {
    if (testMode === "letterTiles") return "letterTiles";
    if (testMode === "wordBank") return "wordBank";
    // All other modes (keyboard, flashcard, lookCoverWrite, missingLetters, translation)
    // use keyboard input for text entry
    return "keyboard";
  }, [testMode]);
}

/**
 * Generates a key that increments when tiles/word bank should reset.
 * Consolidates two separate effects into one unified trigger.
 */
function useTileResetKey(
  currentWordIndex: number,
  showFeedback: boolean,
): number {
  const [tileKey, setTileKey] = useState(0);

  useEffect(() => {
    // Reset when word changes OR when feedback is hidden (retry attempt)
    if (!showFeedback) {
      setTileKey((prev) => prev + 1);
    }
  }, [currentWordIndex, showFeedback]);

  return tileKey;
}

/**
 * Computes feedback state for current answer.
 * Handles both sentence scoring and single word analysis.
 */
function useFeedbackState(
  showFeedback: boolean,
  lastUserAnswer: string,
  expectedAnswer: string,
  currentTries: number,
  spellingConfig: SpellingFeedbackConfig,
): FeedbackState {
  const isCurrentSentence = useMemo(
    () => isSentence(expectedAnswer),
    [expectedAnswer],
  );

  const sentenceScoringResult = useMemo(() => {
    if (!showFeedback || !isCurrentSentence || !lastUserAnswer) {
      return null;
    }
    return scoreSentence(expectedAnswer, lastUserAnswer, currentTries);
  }, [
    showFeedback,
    isCurrentSentence,
    lastUserAnswer,
    expectedAnswer,
    currentTries,
  ]);

  return { isCurrentSentence, sentenceScoringResult, spellingConfig };
}

/**
 * Computes tile-specific feedback state for LetterTileInput.
 * Returns null when not showing feedback or when correct.
 */
function useTileFeedbackState(
  showFeedback: boolean,
  lastAnswerCorrect: boolean,
  lastUserAnswer: string,
  expectedAnswer: string,
  currentTries: number,
  maxAttempts: number,
  spellingConfig: SpellingFeedbackConfig,
): TileFeedbackState | null {
  return useMemo(() => {
    if (!showFeedback || lastAnswerCorrect || !lastUserAnswer) {
      return null;
    }

    const analysis = analyzeSpelling(
      lastUserAnswer,
      expectedAnswer,
      spellingConfig,
    );
    const hintKey = getHintForAttempt(analysis, currentTries, spellingConfig);

    return {
      analysis,
      currentAttempt: currentTries,
      maxAttempts,
      hintKey,
      lastUserAnswer,
    };
  }, [
    showFeedback,
    lastAnswerCorrect,
    lastUserAnswer,
    expectedAnswer,
    currentTries,
    maxAttempts,
    spellingConfig,
  ]);
}

// ============================================================================
// Validation
// ============================================================================

function validateProps(
  activeTest: WordSet,
  currentWordIndex: number,
  processedWords: string[],
): void {
  if (!activeTest?.words || activeTest.words.length === 0) {
    throw new Error("TestView: activeTest must have at least one word");
  }
  if (currentWordIndex < 0 || currentWordIndex >= activeTest.words.length) {
    throw new Error(
      `TestView: currentWordIndex (${currentWordIndex}) out of bounds [0, ${activeTest.words.length - 1}]`,
    );
  }
  if (!processedWords || processedWords.length === 0) {
    throw new Error("TestView: processedWords must not be empty");
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function TestView({
  activeTest,
  currentWordIndex,
  processedWords,
  userAnswer,
  showFeedback,
  lastAnswerCorrect,
  currentTries,
  answers,
  isAudioPlaying,
  testMode,
  wordDirections,
  lastUserAnswer,
  onUserAnswerChange,
  onSubmitAnswer,
  onPlayCurrentWord,
  onExitTest,
}: TestViewProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // Validation (throws on invalid props)
  validateProps(activeTest, currentWordIndex, processedWords);

  // Derived configuration
  const testConfig = getEffectiveTestConfig(activeTest);
  const maxAttempts = testConfig?.maxAttempts ?? 3;
  const currentWord = activeTest.words[currentWordIndex];

  if (!currentWord) {
    throw new Error(`TestView: No word found at index ${currentWordIndex}`);
  }

  // Translation mode state
  const targetLanguage = activeTest.testConfiguration?.targetLanguage;
  const wordDirection =
    wordDirections.length > currentWordIndex
      ? wordDirections[currentWordIndex]
      : "toTarget";

  const translation =
    testMode === "translation" && targetLanguage
      ? currentWord?.translations?.find((tr) => tr.language === targetLanguage)
      : undefined;

  const showWord =
    wordDirection === "toTarget" ? currentWord.word : translation?.text;

  // Expected answer computation
  const expectedAnswer = useMemo(() => {
    const mode = getMode(testMode);
    if (mode?.getExpectedAnswer && translation) {
      return mode.getExpectedAnswer(currentWord, {
        translationDirection: wordDirection,
        wordSet: activeTest,
      });
    }
    return currentWord.word;
  }, [testMode, translation, wordDirection, currentWord, activeTest]);

  // Custom hooks for derived state
  const spellingConfig = useSpellingConfig(testConfig);
  const effectiveInputType = useEffectiveInputType(testMode);
  const tileKey = useTileResetKey(currentWordIndex, showFeedback);
  const feedbackState = useFeedbackState(
    showFeedback,
    lastUserAnswer,
    expectedAnswer,
    currentTries,
    spellingConfig,
  );
  const tileFeedbackState = useTileFeedbackState(
    showFeedback,
    lastAnswerCorrect,
    lastUserAnswer,
    expectedAnswer,
    currentTries,
    maxAttempts,
    spellingConfig,
  );

  // Focus input when feedback is hidden (ready for new input)
  useEffect(() => {
    if (!showFeedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showFeedback]);

  // Generate challenge items (memoized)
  const letterTiles = useMemo(() => {
    if (effectiveInputType !== "letterTiles") return [];
    return generateLetterTiles(expectedAnswer);
  }, [expectedAnswer, effectiveInputType, tileKey]);

  const wordBankItems = useMemo(() => {
    if (effectiveInputType !== "wordBank") return [];
    return generateWordBank(expectedAnswer, activeTest);
  }, [expectedAnswer, effectiveInputType, activeTest, tileKey]);

  // Event handlers (memoized)
  const handleTileOrBankSubmit = useCallback(
    (answer: string, _isCorrect: boolean) => {
      // Pass answer directly to avoid React state timing issues
      onUserAnswerChange(answer);
      onSubmitAnswer(answer);
    },
    [onUserAnswerChange, onSubmitAnswer],
  );

  // Generate audio URL for test modes
  const audioUrl = useMemo(() => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${apiBaseUrl}/api/wordsets/${activeTest.id}/words/${encodeURIComponent(expectedAnswer)}/audio?lang=${encodeURIComponent(activeTest.language)}`;
  }, [activeTest.id, activeTest.language, expectedAnswer]);

  // Unified submission handler for all modes
  const handleSubmit = useCallback(
    (answer: string, _isCorrect: boolean) => {
      onUserAnswerChange(answer);
      onSubmitAnswer(answer);
    },
    [onUserAnswerChange, onSubmitAnswer],
  );

  // Computed values for rendering
  const progressPercent =
    ((currentWordIndex + 1) / processedWords.length) * 100;
  const isLastWord = currentWordIndex >= processedWords.length - 1;
  const correctCount = answers.filter((a) => a.isCorrect).length;

  // Check if mode is specialized (flashcard, lookCoverWrite, missingLetters) - these have full-page custom UIs
  const isSpecializedMode =
    testMode === "flashcard" ||
    testMode === "lookCoverWrite" ||
    testMode === "missingLetters";

  return (
    <div className="bg-nordic-birch">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Progress */}
        <TestHeader
          activeTest={activeTest}
          testMode={testMode}
          currentWordIndex={currentWordIndex}
          totalWords={processedWords.length}
          progressPercent={progressPercent}
          translationInfo={
            testMode === "translation" && translation
              ? {
                  wordDirection,
                  showWord: showWord!,
                  targetLanguage: targetLanguage!,
                }
              : undefined
          }
        />

        {/* Safari Auto-play Notice */}
        {requiresUserInteractionForAudio() && testConfig?.autoPlayAudio && (
          <div className="mx-auto mb-4 max-w-2xl">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <div className="flex items-center">
                <HeroDevicePhoneMobileIcon className="mr-2 h-5 w-5 text-amber-600" />
                <span>{t("wordsets.safari.autoplayLimited")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Specialized Modes (flashcard, lookCoverWrite, missingLetters) */}
        {isSpecializedMode && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg bg-white p-4 shadow-xl sm:p-8">
              <TestModeRenderer
                testMode={testMode}
                currentWord={currentWord}
                expectedAnswer={expectedAnswer}
                audioUrl={audioUrl}
                userAnswer={userAnswer}
                onUserAnswerChange={onUserAnswerChange}
                onSubmitAnswer={onSubmitAnswer}
                onExitTest={onExitTest}
                showFeedback={showFeedback}
                tileFeedbackState={tileFeedbackState}
                tileKey={tileKey}
                testConfig={testConfig}
              />

              {!showFeedback && (
                <div className="mt-6 flex justify-center">
                  <Button variant="secondary-child" onClick={onExitTest}>
                    <span className="sm:hidden">{t("test.backMobile")}</span>
                    <span className="hidden sm:inline">
                      {t("test.backToWordSets")}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            <TestScoreSummary
              correctCount={correctCount}
              totalAnswers={answers.length}
            />

            {showFeedback && (
              <TestFeedbackOverlay
                lastAnswerCorrect={lastAnswerCorrect}
                lastUserAnswer={lastUserAnswer}
                expectedAnswer={expectedAnswer}
                currentTries={currentTries}
                maxAttempts={maxAttempts}
                showCorrectAnswer={testConfig?.showCorrectAnswer ?? false}
                correctCount={correctCount}
                totalAnswers={answers.length}
                onExitTest={onExitTest}
                feedbackState={feedbackState}
              />
            )}
          </div>
        )}

        {/* Standard Test Area (letterTiles, wordBank, keyboard, translation) */}
        {!isSpecializedMode && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg bg-white p-4 text-center shadow-xl sm:p-8">
              {/* Audio Button */}
              {!showFeedback && (
                <TestAudioButton
                  onClick={onPlayCurrentWord}
                  isPlaying={isAudioPlaying}
                  showInstruction
                  definition={currentWord.definition}
                />
              )}

              {/* Input/Feedback Area */}
              <div className="mb-6 flex flex-col justify-center">
                {showFeedback ? (
                  <TestFeedbackOverlay
                    lastAnswerCorrect={lastAnswerCorrect}
                    lastUserAnswer={lastUserAnswer}
                    expectedAnswer={expectedAnswer}
                    currentTries={currentTries}
                    maxAttempts={maxAttempts}
                    showCorrectAnswer={testConfig?.showCorrectAnswer ?? false}
                    correctCount={correctCount}
                    totalAnswers={answers.length}
                    onExitTest={onExitTest}
                    feedbackState={feedbackState}
                  />
                ) : (
                  <TestModeRenderer
                    testMode={testMode}
                    currentWord={currentWord}
                    expectedAnswer={expectedAnswer}
                    audioUrl={audioUrl}
                    userAnswer={userAnswer}
                    onUserAnswerChange={onUserAnswerChange}
                    onSubmitAnswer={onSubmitAnswer}
                    onExitTest={onExitTest}
                    showFeedback={showFeedback}
                    tileFeedbackState={tileFeedbackState}
                    tileKey={tileKey}
                    testConfig={testConfig}
                  />
                )}
              </div>

              {/* Action Buttons */}
              {!showFeedback && (
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                  <Button variant="secondary-child" onClick={onPlayCurrentWord}>
                    <HeroVolumeIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {t("test.playAgain")}
                    </span>
                  </Button>

                  {(testMode === "keyboard" || testMode === "translation") && (
                    <Button
                      variant="primary-child"
                      onClick={() => onSubmitAnswer()}
                      disabled={!userAnswer.trim()}
                    >
                      <span className="sm:hidden">
                        {isLastWord
                          ? t("test.finishMobile")
                          : t("test.nextMobile")}
                      </span>
                      <span className="hidden sm:inline">
                        {isLastWord ? t("test.finishTest") : t("test.nextWord")}
                      </span>
                    </Button>
                  )}

                  <Button variant="secondary-child" onClick={onExitTest}>
                    <span className="sm:hidden">{t("test.backMobile")}</span>
                    <span className="hidden sm:inline">
                      {t("test.backToWordSets")}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            <TestScoreSummary
              correctCount={correctCount}
              totalAnswers={answers.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
