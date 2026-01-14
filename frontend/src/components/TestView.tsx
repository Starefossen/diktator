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
import {
  HeroVolumeIcon,
  HeroDevicePhoneMobileIcon,
  HeroXMarkIcon,
  HeroArrowRightIcon,
} from "@/components/Icons";
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
import { Button } from "@/components/Button";
import Stavle from "@/components/Stavle";
import {
  BaseModal,
  ModalContent,
  ModalActions,
  ModalButton,
} from "@/components/modals/BaseModal";
import { TileFeedbackState } from "@/components/LetterTileInput";
import { isSentence } from "@/lib/sentenceConfig";
import { scoreSentence, SentenceScoringResult } from "@/lib/sentenceScoring";

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
  onNextWord: () => void;
  onPlayCurrentWord: () => void;
  onExitTest: () => void;
}

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
  onNextWord,
  onPlayCurrentWord,
  onExitTest,
}: TestViewProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Handler for exit confirmation
  const handleExitClick = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false);
    onExitTest();
  }, [onExitTest]);

  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

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

  // Generate audio URL for test modes
  const audioUrl = useMemo(() => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${apiBaseUrl}/api/wordsets/${activeTest.id}/words/${encodeURIComponent(expectedAnswer)}/audio?lang=${encodeURIComponent(activeTest.language)}`;
  }, [activeTest.id, activeTest.language, expectedAnswer]);

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
                  <Button variant="secondary-child" onClick={handleExitClick}>
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
                _correctCount={correctCount}
                _totalAnswers={answers.length}
                isLastWord={isLastWord}
                onNext={onNextWord}
                onExitTest={handleExitClick}
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
                    _correctCount={correctCount}
                    _totalAnswers={answers.length}
                    isLastWord={isLastWord}
                    onNext={onNextWord}
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

              {/* Action Buttons - Consistent order: Cancel (left), Play Again (middle), Next/Finish (right) */}
              {!showFeedback && (
                <div className="flex justify-between gap-2 sm:gap-4">
                  <Button variant="danger" onClick={handleExitClick}>
                    <HeroXMarkIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("test.cancel")}</span>
                  </Button>

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
                      <HeroArrowRightIcon className="h-4 w-4 sm:ml-2" />
                    </Button>
                  )}
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

      {/* Exit Confirmation Modal */}
      {showExitConfirm &&
        (() => {
          const correctCount = answers.filter((a) => a.isCorrect).length;
          const totalAnswers = answers.length;
          const totalWords = processedWords.length;
          const scorePercent =
            totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;

          // Context-aware message
          let message = "";
          let encouragement = "";

          if (totalAnswers === 0) {
            // Just started
            message = t("test.exitJustStarted");
            encouragement = t("test.exitEncouragement");
          } else if (totalAnswers >= totalWords - 1) {
            // Almost done
            message = t("test.exitAlmostDone");
            encouragement = t("test.exitKeepGoing");
          } else if (scorePercent >= 80) {
            // Doing great
            message = t("test.exitConfirmMessage")
              .replace("{{correct}}", String(correctCount))
              .replace("{{total}}", String(totalAnswers));
            encouragement = t("test.exitDoingGreat");
          } else {
            // Keep going
            message = t("test.exitConfirmMessage")
              .replace("{{correct}}", String(correctCount))
              .replace("{{total}}", String(totalAnswers));
            encouragement = t("test.exitKeepGoing");
          }

          return (
            <BaseModal
              isOpen={true}
              onClose={handleCancelExit}
              title={t("test.exitConfirm")}
              size="md"
            >
              <ModalContent>
                <div className="text-center">
                  {/* Stavle encouraging */}
                  <div className="mb-4 flex justify-center">
                    <Stavle pose="encouraging" size={96} animate />
                  </div>

                  {/* Encouraging message */}
                  <p className="text-lg text-gray-700 mb-4">{message}</p>

                  {/* Progress indicator (only show if there are answers) */}
                  {totalAnswers > 0 && (
                    <div className="p-4 border-2 border-nordic-sky/30 rounded-xl bg-nordic-sky/10 mb-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold text-nordic-sky">
                          {correctCount}
                        </span>
                        <span className="text-xl text-gray-600">/</span>
                        <span className="text-3xl font-bold text-gray-700">
                          {totalAnswers}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm font-medium text-nordic-midnight mt-3">
                    {encouragement}
                  </p>
                </div>
              </ModalContent>

              <ModalActions>
                <div className="flex flex-col-reverse sm:flex-row justify-center gap-3 w-full">
                  <ModalButton
                    onClick={handleConfirmExit}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    {t("test.exitConfirmButton")}
                  </ModalButton>
                  <ModalButton
                    onClick={handleCancelExit}
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    {t("test.continueTest")}
                  </ModalButton>
                </div>
              </ModalActions>
            </BaseModal>
          );
        })()}
    </div>
  );
}
