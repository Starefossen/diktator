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
} from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { requiresUserInteractionForAudio } from "@/lib/audioPlayer";
import { HeroVolumeIcon, HeroDevicePhoneMobileIcon } from "@/components/Icons";
import {
  analyzeSpelling,
  DEFAULT_SPELLING_CONFIG,
  SpellingFeedbackConfig,
} from "@/lib/spellingAnalysis";
import {
  SpellingFeedback,
  CorrectFeedback,
} from "@/components/SpellingFeedback";
import { TIMING } from "@/lib/timingConfig";
import { Button } from "@/components/Button";
import { LetterTileInput } from "@/components/LetterTileInput";
import { WordBankInput } from "@/components/WordBankInput";
import { SentenceFeedback } from "@/components/SentenceFeedback";
import { generateLetterTiles, generateWordBank } from "@/lib/challenges";
import { isSentence } from "@/lib/sentenceConfig";
import { scoreSentence, SentenceScoringResult } from "@/lib/sentenceScoring";
import type { InputMethod } from "@/lib/sentenceConfig";

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
  testMode: "standard" | "dictation" | "translation";
  wordDirections: ("toTarget" | "toSource")[];
  lastUserAnswer: string;
  inputMethod: InputMethod;
  onUserAnswerChange: (answer: string) => void;
  onSubmitAnswer: (directAnswer?: string) => void;
  onPlayCurrentWord: () => void;
  onExitTest: () => void;
}

type EffectiveInputMethod = Exclude<InputMethod, "auto">;

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
 * Resolves "auto" input method to concrete type based on content.
 * Sentences use word bank, single words use letter tiles.
 */
function useEffectiveInputMethod(
  inputMethod: InputMethod,
  expectedAnswer: string,
): EffectiveInputMethod {
  return useMemo(() => {
    if (inputMethod === "auto") {
      return expectedAnswer.includes(" ") ? "wordBank" : "letterTiles";
    }
    return inputMethod;
  }, [inputMethod, expectedAnswer]);
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
// Sub-components (Feedback Display)
// ============================================================================

interface TestFeedbackDisplayProps {
  lastAnswerCorrect: boolean;
  feedbackState: FeedbackState;
  lastUserAnswer: string;
  expectedAnswer: string;
  currentTries: number;
  maxAttempts: number;
  showCorrectAnswer: boolean;
}

function TestFeedbackDisplay({
  lastAnswerCorrect,
  feedbackState,
  lastUserAnswer,
  expectedAnswer,
  currentTries,
  maxAttempts,
  showCorrectAnswer,
}: TestFeedbackDisplayProps) {
  const { t } = useLanguage();
  const { isCurrentSentence, sentenceScoringResult, spellingConfig } =
    feedbackState;

  if (lastAnswerCorrect) {
    return <CorrectFeedback />;
  }

  if (isCurrentSentence && sentenceScoringResult) {
    return (
      <SentenceFeedback
        result={sentenceScoringResult}
        currentAttempt={currentTries}
        maxAttempts={maxAttempts}
        showCorrectAnswer={currentTries >= maxAttempts && showCorrectAnswer}
        expectedSentence={expectedAnswer}
        timerDurationMs={TIMING.FEEDBACK_DISPLAY_MS}
      />
    );
  }

  // Compute spelling analysis only when needed (inside feedback component)
  const spellingAnalysis =
    lastUserAnswer && !lastAnswerCorrect
      ? analyzeSpelling(lastUserAnswer, expectedAnswer, spellingConfig)
      : null;

  if (spellingAnalysis && lastUserAnswer) {
    return (
      <SpellingFeedback
        userAnswer={lastUserAnswer}
        expectedWord={expectedAnswer}
        analysis={spellingAnalysis}
        currentAttempt={currentTries}
        maxAttempts={maxAttempts}
        config={spellingConfig}
        showCorrectAnswer={currentTries >= maxAttempts && showCorrectAnswer}
        timerDurationMs={TIMING.FEEDBACK_DISPLAY_MS}
      />
    );
  }

  // Fallback to simple feedback if no analysis available
  return (
    <div className="animate-in fade-in-0 slide-in-from-top-2 rounded-lg border border-red-300 bg-red-100 p-4 duration-300">
      <p className="text-lg font-semibold text-red-800">
        {t("test.incorrect")} - {t("test.tryAgain")} ({currentTries}/
        {maxAttempts})
      </p>
    </div>
  );
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
  inputMethod,
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
    if (testMode === "translation" && translation) {
      return wordDirection === "toTarget" ? translation.text : currentWord.word;
    }
    return currentWord.word;
  }, [testMode, translation, wordDirection, currentWord.word]);

  // Custom hooks for derived state
  const spellingConfig = useSpellingConfig(testConfig);
  const effectiveInputMethod = useEffectiveInputMethod(
    inputMethod,
    expectedAnswer,
  );
  const tileKey = useTileResetKey(currentWordIndex, showFeedback);
  const feedbackState = useFeedbackState(
    showFeedback,
    lastUserAnswer,
    expectedAnswer,
    currentTries,
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
    if (effectiveInputMethod !== "letterTiles") return [];
    return generateLetterTiles(expectedAnswer);
  }, [expectedAnswer, effectiveInputMethod, tileKey]);

  const wordBankItems = useMemo(() => {
    if (effectiveInputMethod !== "wordBank") return [];
    return generateWordBank(expectedAnswer, activeTest);
  }, [expectedAnswer, effectiveInputMethod, activeTest, tileKey]);

  // Event handlers (memoized)
  const handleTileOrBankSubmit = useCallback(
    (_isCorrect: boolean, answer: string) => {
      // Pass answer directly to avoid React state timing issues
      onUserAnswerChange(answer);
      onSubmitAnswer(answer);
    },
    [onUserAnswerChange, onSubmitAnswer],
  );

  const handleAudioPlayWithFocus = useCallback(() => {
    onPlayCurrentWord();
    if (effectiveInputMethod === "keyboard") {
      setTimeout(() => inputRef.current?.focus(), TIMING.INPUT_FOCUS_DELAY_MS);
    }
  }, [onPlayCurrentWord, effectiveInputMethod]);

  // Computed values for rendering
  const progressPercent =
    ((currentWordIndex + 1) / processedWords.length) * 100;
  const isLastWord = currentWordIndex >= processedWords.length - 1;
  const correctCount = answers.filter((a) => a.isCorrect).length;

  return (
    <div className="bg-nordic-birch">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Progress */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {activeTest.name}
          </h1>

          {/* Translation mode instruction */}
          {testMode === "translation" && translation && (
            <p className="mt-2 text-xl text-gray-700">
              {wordDirection === "toTarget" ? (
                <>
                  {t("test.translateToTarget")}:{" "}
                  <span className="font-semibold">{showWord}</span> →{" "}
                  {targetLanguage?.toUpperCase()}
                </>
              ) : (
                <>
                  {t("test.translateToSource")}:{" "}
                  <span className="font-semibold">{showWord}</span> →{" "}
                  {activeTest.language.toUpperCase()}
                </>
              )}
            </p>
          )}

          {/* Progress text */}
          <p className="text-gray-600">
            {t("test.progress")} {currentWordIndex + 1} {t("common.of")}{" "}
            {processedWords.length}
          </p>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-linear-to-r from-nordic-sky to-nordic-teal transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

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

        {/* Test Area */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-4 text-center shadow-xl sm:p-8">
            {/* Audio Play Button */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4">
                <div className="relative inline-block">
                  {isAudioPlaying && (
                    <div className="absolute -inset-3 animate-spin rounded-full border-4 border-transparent border-r-nordic-sky/80 border-t-nordic-sky" />
                  )}
                  <button
                    onClick={handleAudioPlayWithFocus}
                    className="relative transform rounded-full bg-linear-to-r from-nordic-meadow to-nordic-sky p-4 text-4xl text-nordic-midnight shadow-lg transition-all duration-200 hover:scale-105 hover:from-nordic-meadow/90 hover:to-nordic-sky/90 hover:shadow-xl sm:p-6 sm:text-6xl"
                  >
                    <HeroVolumeIcon className="h-12 w-12 text-nordic-midnight sm:h-16 sm:w-16" />
                  </button>
                </div>
              </div>

              {/* Instruction text */}
              <p className="mt-4 text-gray-600">
                <span className="sm:hidden">
                  {t("test.listenToWordMobile")}
                </span>
                <span className="hidden sm:inline">
                  {t("test.listenToWord")}
                </span>
              </p>

              {/* Definition/context hint */}
              {currentWord.definition && (
                <div className="mx-auto mt-3 max-w-md rounded-lg border border-nordic-sky/30 bg-nordic-sky/10 px-4 py-2 text-sm">
                  <p className="text-nordic-midnight">
                    <span className="font-medium">{t("test.context")}</span>{" "}
                    {currentWord.definition}
                  </p>
                </div>
              )}
            </div>

            {/* Input/Feedback Area */}
            <div className="mb-6 flex flex-col justify-center">
              {showFeedback ? (
                <TestFeedbackDisplay
                  lastAnswerCorrect={lastAnswerCorrect}
                  feedbackState={feedbackState}
                  lastUserAnswer={lastUserAnswer}
                  expectedAnswer={expectedAnswer}
                  currentTries={currentTries}
                  maxAttempts={maxAttempts}
                  showCorrectAnswer={testConfig?.showCorrectAnswer ?? false}
                />
              ) : effectiveInputMethod === "letterTiles" ? (
                <LetterTileInput
                  key={tileKey}
                  tiles={letterTiles}
                  expectedWord={expectedAnswer}
                  onSubmit={handleTileOrBankSubmit}
                  disabled={showFeedback}
                />
              ) : effectiveInputMethod === "wordBank" ? (
                <WordBankInput
                  key={tileKey}
                  items={wordBankItems}
                  expectedWordCount={expectedAnswer.split(/\s+/).length}
                  onSubmit={handleTileOrBankSubmit}
                  disabled={showFeedback}
                />
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => onUserAnswerChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onSubmitAnswer()}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-xl transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-nordic-teal sm:px-6 sm:py-4 sm:text-2xl"
                  placeholder={
                    testMode === "translation"
                      ? t("test.typeTranslationHere")
                      : t("test.typeWordHere")
                  }
                  autoFocus
                  autoCorrect={testConfig?.enableAutocorrect ? "on" : "off"}
                  autoCapitalize={testConfig?.enableAutocorrect ? "on" : "off"}
                  spellCheck={testConfig?.enableAutocorrect}
                />
              )}
            </div>

            {/* Attempts remaining indicator */}
            <div className="mb-8 flex h-5 justify-center">
              {!showFeedback && effectiveInputMethod === "keyboard" && (
                <p className="text-sm text-gray-500">
                  {t("test.attemptsRemaining")}: {maxAttempts - currentTries}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {/* Play Again Button - Hidden in dictation mode */}
              {testMode !== "dictation" && (
                <Button
                  variant="secondary-child"
                  onClick={handleAudioPlayWithFocus}
                  disabled={showFeedback}
                >
                  <HeroVolumeIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {t("test.playAgain")}
                  </span>
                </Button>
              )}

              {/* Submit Button - Only for keyboard input */}
              {effectiveInputMethod === "keyboard" && (
                <Button
                  variant="primary-child"
                  onClick={() => onSubmitAnswer()}
                  disabled={!userAnswer.trim() || showFeedback}
                >
                  <span className="sm:hidden">
                    {isLastWord ? t("test.finishMobile") : t("test.nextMobile")}
                  </span>
                  <span className="hidden sm:inline">
                    {isLastWord ? t("test.finishTest") : t("test.nextWord")}
                  </span>
                </Button>
              )}

              {/* Exit Button */}
              <Button variant="secondary-child" onClick={onExitTest}>
                <span className="sm:hidden">{t("test.backMobile")}</span>
                <span className="hidden sm:inline">
                  {t("test.backToWordSets")}
                </span>
              </Button>
            </div>
          </div>

          {/* Score Summary */}
          {answers.length > 0 && (
            <div className="mt-8 text-center text-gray-600">
              <p>
                {t("test.correctSoFar")}: {correctCount} / {answers.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
