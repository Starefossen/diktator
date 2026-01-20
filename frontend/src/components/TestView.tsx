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
import type {
  NavigationActions,
  TileFeedbackState,
  StandardFeedbackState,
} from "@/lib/testEngine/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { requiresUserInteractionForAudio } from "@/lib/audioPlayer";
import { HeroDevicePhoneMobileIcon } from "@/components/Icons";
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
import { TestModeRenderer } from "@/components/TestModeRenderer";
import { TestNavigationBar, ClearButton } from "@/components/TestNavigationBar";
import { TestExitModal } from "@/components/TestExitModal";
import { Button } from "@/components/Button";

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
  testMode: TestMode;
  wordDirections: ("toTarget" | "toSource")[];
  lastUserAnswer: string;
  feedbackDurationMs: number;
  onUserAnswerChange: (answer: string) => void;
  onSubmitAnswer: (directAnswer?: string) => void;
  onNextWord: () => void;
  onExitTest: () => void;
  /** Optional callback when audio starts playing (for parent state tracking) */
  onAudioStart?: () => void;
  /** Optional callback when audio finishes playing (for parent state tracking) */
  onAudioEnd?: () => void;
  /** Whether parent is playing audio (for iOS first-word autoplay spinner) */
  isParentAudioPlaying?: boolean;
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Creates a memoized spelling config from test configuration.
 *
 * Merges default spelling settings with any custom values from the test
 * configuration, ensuring consistent feedback behavior across all modes.
 *
 * @param testConfig - Optional test configuration from the word set
 * @returns Memoized spelling feedback configuration
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
 * Generates an incrementing key for resetting tile/word bank state.
 *
 * The key increments ONLY when moving to a new word, NOT when feedback is
 * dismissed for retry. This ensures tiles are preserved during retry attempts.
 *
 * Used as React key prop to force remounting of LetterTileInput/WordBankInput.
 *
 * @param currentWordIndex - Index of the current word in the test
 * @returns Incrementing key number for component remounting
 */
function useTileResetKey(currentWordIndex: number): number {
  const [tileKey, setTileKey] = useState(0);
  const prevWordIndexRef = useRef(currentWordIndex);

  useEffect(() => {
    // Only reset when moving to a different word
    if (currentWordIndex !== prevWordIndexRef.current) {
      prevWordIndexRef.current = currentWordIndex;
      setTileKey((prev) => prev + 1);
    }
  }, [currentWordIndex]);

  return tileKey;
}

/**
 * Unified feedback state hook for all input modes.
 *
 * Computes spelling analysis (diff, hints, almost-correct detection) for the
 * current incorrect answer. Returns two versions of feedback state:
 * - `tile`: Minimal state for LetterTileInput (no showCorrectAnswer/config)
 * - `standard`: Full state for WordBankInput, KeyboardInput, TranslationInput
 *
 * Returns null values when feedback should not be shown:
 * - showFeedback is false
 * - lastAnswerCorrect is true (correct answers use different UI)
 * - lastUserAnswer is empty
 *
 * @returns Object with tile and standard feedback states (or null)
 */
function useUnifiedFeedbackState(
  showFeedback: boolean,
  lastAnswerCorrect: boolean,
  lastUserAnswer: string,
  expectedAnswer: string,
  currentTries: number,
  maxAttempts: number,
  spellingConfig: SpellingFeedbackConfig,
  showCorrectAnswer: boolean,
): { tile: TileFeedbackState | null; standard: StandardFeedbackState | null } {
  return useMemo(() => {
    if (!showFeedback || lastAnswerCorrect || !lastUserAnswer) {
      return { tile: null, standard: null };
    }

    const analysis = analyzeSpelling(
      lastUserAnswer,
      expectedAnswer,
      spellingConfig,
    );
    const hintKey = getHintForAttempt(analysis, currentTries, spellingConfig);

    // TileFeedbackState (subset for LetterTileInput)
    const tile: TileFeedbackState = {
      analysis,
      currentAttempt: currentTries,
      maxAttempts,
      hintKey,
      lastUserAnswer,
    };

    // StandardFeedbackState (full state for other modes)
    const standard: StandardFeedbackState = {
      ...tile,
      showCorrectAnswer: currentTries >= maxAttempts && showCorrectAnswer,
      config: spellingConfig,
    };

    return { tile, standard };
  }, [
    showFeedback,
    lastAnswerCorrect,
    lastUserAnswer,
    expectedAnswer,
    currentTries,
    maxAttempts,
    spellingConfig,
    showCorrectAnswer,
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
  testMode,
  wordDirections,
  lastUserAnswer,
  feedbackDurationMs,
  onUserAnswerChange,
  onSubmitAnswer,
  onNextWord,
  onExitTest,
  onAudioStart,
  onAudioEnd,
  isParentAudioPlaying = false,
}: TestViewProps) {
  const { t } = useLanguage();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Audio callbacks - update local state and notify parent
  const handleAudioStart = useCallback(() => {
    setIsAudioPlaying(true);
    onAudioStart?.();
  }, [onAudioStart]);

  const handleAudioEnd = useCallback(() => {
    setIsAudioPlaying(false);
    onAudioEnd?.();
    // Trigger focus restoration on input after audio ends
    setFocusTrigger((prev) => prev + 1);
  }, [onAudioEnd]);

  // Handler for "play again" button in navigation bar
  const handlePlayAudio = useCallback(() => {
    setPlayTrigger((prev) => prev + 1);
  }, []);

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

  // Prevent accidental navigation away from test
  useEffect(() => {
    // Warn on browser refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = "";
      return "";
    };

    // Handle browser back button - push a fake history entry and intercept popstate
    const handlePopState = () => {
      // Show the exit modal instead of navigating away
      setShowExitConfirm(true);
      // Push state again to prevent actual navigation
      window.history.pushState(null, "", window.location.href);
    };

    // Push initial state to enable popstate interception
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // State for clear button functionality from input components
  const [clearFn, setClearFn] = useState<(() => void) | null>(null);
  const [canClear, setCanClear] = useState(false);

  // Callback to receive clear function from input components
  const handleClearRef = useCallback((fn: () => void) => {
    setClearFn(() => fn);
  }, []);

  // Callback when canClear state changes in input components
  const handleCanClearChange = useCallback((value: boolean) => {
    setCanClear(value);
  }, []);

  // Validation (throws on invalid props)
  validateProps(activeTest, currentWordIndex, processedWords);

  // Derived configuration
  const testConfig = getEffectiveTestConfig(activeTest);
  const maxAttempts = testConfig?.maxAttempts ?? 3;

  // When words are shuffled, processedWords order differs from activeTest.words order.
  // We must find the word object that matches the current processed word string.
  const currentProcessedWord = processedWords[currentWordIndex];
  const currentWord = activeTest.words.find(
    (w) => w.word === currentProcessedWord,
  );

  if (!currentWord) {
    throw new Error(
      `TestView: No word found matching "${currentProcessedWord}" at index ${currentWordIndex}`,
    );
  }

  // Translation mode state
  // Default to configured targetLanguage, or infer from most common translation language
  const targetLanguage = useMemo(() => {
    const configured = activeTest.testConfiguration?.targetLanguage;
    if (configured) return configured;

    // For translation and listeningTranslation modes, find the most common translation language across all words
    if (testMode === "translation" || testMode === "listeningTranslation") {
      const languageCounts = new Map<string, number>();

      // Count how many words have translations in each language
      activeTest.words.forEach((word) => {
        if (word.translations) {
          word.translations.forEach((translation) => {
            const count = languageCounts.get(translation.language) || 0;
            languageCounts.set(translation.language, count + 1);
          });
        }
      });

      // Find the language that covers the most words
      let bestLanguage = "en";
      let maxCount = 0;
      languageCounts.forEach((count, lang) => {
        if (count > maxCount) {
          maxCount = count;
          bestLanguage = lang;
        }
      });

      return bestLanguage;
    }
    return undefined;
  }, [
    activeTest.testConfiguration?.targetLanguage,
    activeTest.words,
    testMode,
  ]);

  const wordDirection =
    wordDirections.length > currentWordIndex
      ? wordDirections[currentWordIndex]
      : "toTarget";

  const translation =
    (testMode === "translation" || testMode === "listeningTranslation") &&
      targetLanguage
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
  const tileKey = useTileResetKey(currentWordIndex);

  // Unified feedback state for all modes
  const { tile: tileFeedbackState, standard: standardFeedbackState } =
    useUnifiedFeedbackState(
      showFeedback,
      lastAnswerCorrect,
      lastUserAnswer,
      expectedAnswer,
      currentTries,
      maxAttempts,
      spellingConfig,
      testConfig?.showCorrectAnswer ?? false,
    );

  // Translation info for TranslationInput and ListeningTranslationInput
  const translationInfo = useMemo(() => {
    if (
      (testMode !== "translation" && testMode !== "listeningTranslation") ||
      !translation ||
      !targetLanguage
    ) {
      return undefined;
    }
    return {
      // For TranslationInput: showWord is displayed to user
      sourceWord: showWord!,
      // For ListeningTranslationInput: original word is needed for audio URL lookup
      originalWord: currentWord.word,
      direction: wordDirection,
      targetLanguage,
      sourceLanguage: activeTest.language,
      wordSetId: activeTest.id,
    };
  }, [
    testMode,
    translation,
    targetLanguage,
    showWord,
    currentWord.word,
    wordDirection,
    activeTest.language,
    activeTest.id,
  ]);

  // Focus input when feedback is hidden (ready for new input)
  useEffect(() => {
    if (!showFeedback) {
      setFocusTrigger((prev) => prev + 1);
    }
  }, [showFeedback]);

  // Generate audio URL for test modes
  // For translation modes, the URL path must ALWAYS use the original wordset word (currentWord.word)
  // because the backend indexes words by their original text, not by translations.
  // The `lang` parameter then determines which language to speak:
  // - For most modes: speak the original word in the wordset's language
  // - For translation toTarget: speak original word (Norwegian) - user types translation
  // - For translation toSource: speak translation (English) - user types original
  const audioUrl = useMemo(() => {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Always use the original word in the URL path (backend looks up by original word)
    const wordForPath = currentWord.word;

    // Determine which language to speak
    let langToSpeak: string = activeTest.language;
    if (
      (testMode === "translation" || testMode === "listeningTranslation") &&
      targetLanguage
    ) {
      // toTarget: user hears original (source), types translation (target)
      // toSource: user hears translation (target), types original (source)
      langToSpeak =
        wordDirection === "toTarget" ? activeTest.language : targetLanguage;
    }

    return `${apiBaseUrl}/api/wordsets/${activeTest.id}/words/${encodeURIComponent(wordForPath)}/audio?lang=${encodeURIComponent(langToSpeak)}`;
  }, [
    activeTest.id,
    activeTest.language,
    currentWord.word,
    testMode,
    targetLanguage,
    wordDirection,
  ]);

  // Computed values for rendering
  const progressPercent =
    ((currentWordIndex + 1) / processedWords.length) * 100;
  const isLastWord = currentWordIndex >= processedWords.length - 1;
  const correctCount = answers.filter((a) => a.isCorrect).length;

  // Check if selected mode is available for this wordset
  const modeAvailability = useMemo(() => {
    const modeDefinition = getMode(testMode);
    if (!modeDefinition) {
      return { available: false, reasonKey: "modes.unknownMode" };
    }
    if (modeDefinition.isAvailable) {
      return modeDefinition.isAvailable(activeTest);
    }
    return { available: true };
  }, [testMode, activeTest]);

  // Check if mode is specialized (flashcard, lookCoverWrite) - these have full-page custom UIs
  const isSpecializedMode =
    testMode === "flashcard" || testMode === "lookCoverWrite";

  // Modes with inline feedback (each component handles its own feedback rendering)
  // All standard modes now handle their own feedback internally via feedbackState props
  const hasInlineFeedback =
    testMode === "letterTiles" ||
    testMode === "wordBank" ||
    testMode === "keyboard" ||
    testMode === "translation" ||
    testMode === "listeningTranslation" ||
    testMode === "missingLetters";

  // Modes that support clear button
  const supportsClearButton =
    testMode === "letterTiles" ||
    testMode === "wordBank" ||
    testMode === "missingLetters";

  // Build navigation actions object for components
  const navigation: NavigationActions = useMemo(
    () => ({
      onCancel: handleExitClick,
      onPlayAudio: handlePlayAudio,
      onSubmit: () => onSubmitAnswer(),
      onNext: onNextWord,
      onClear: clearFn || undefined,
      showFeedback,
      isLastWord,
      canSubmit:
        testMode === "keyboard" ||
          testMode === "translation" ||
          testMode === "listeningTranslation"
          ? !!userAnswer.trim()
          : true,
      isSubmitting: false,
      isPlayingAudio: isAudioPlaying,
      lastAnswerCorrect,
    }),
    [
      handleExitClick,
      handlePlayAudio,
      onSubmitAnswer,
      onNextWord,
      clearFn,
      showFeedback,
      isLastWord,
      testMode,
      userAnswer,
      isAudioPlaying,
      lastAnswerCorrect,
    ],
  );

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

        {/* Mode Not Available Error */}
        {!modeAvailability.available && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg bg-white p-8 shadow-xl text-center">
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {t("modes.notAvailable")}
                </h2>
                <p className="text-gray-600">
                  {modeAvailability.reasonKey
                    ? t(modeAvailability.reasonKey as Parameters<typeof t>[0])
                    : t("modes.incompatibleWordset")}
                </p>
              </div>
              <Button variant="secondary" onClick={onExitTest}>
                {t("common.goBack")}
              </Button>
            </div>
          </div>
        )}

        {/* Specialized Modes (flashcard, lookCoverWrite, missingLetters) */}
        {modeAvailability.available && isSpecializedMode && (
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
                onExitTest={handleExitClick}
                showFeedback={showFeedback}
                lastAnswerCorrect={lastAnswerCorrect}
                tileFeedbackState={tileFeedbackState}
                tileKey={tileKey}
                testConfig={testConfig}
                navigation={navigation}
                onClearRef={handleClearRef}
                onCanClearChange={handleCanClearChange}
                feedbackDurationMs={feedbackDurationMs}
                focusTrigger={focusTrigger}
                onAudioStart={handleAudioStart}
                onAudioEnd={handleAudioEnd}
              />

              {!showFeedback && (
                <TestNavigationBar
                  {...navigation}
                  centerContent={
                    supportsClearButton && canClear && clearFn ? (
                      <ClearButton onClick={clearFn} disabled={showFeedback} />
                    ) : undefined
                  }
                />
              )}
            </div>

            <TestScoreSummary
              correctCount={correctCount}
              totalAnswers={answers.length}
            />

            {/* For specialized modes with internal feedback, only show navigation buttons */}
            {showFeedback && (
              <div className="mt-6 flex justify-center gap-4">
                <Button variant="secondary-child" onClick={handleExitClick}>
                  <span className="hidden sm:inline">
                    {t("test.playAgain")}
                  </span>
                </Button>

                <Button variant="primary-child" onClick={onNextWord}>
                  <span className="sm:hidden">
                    {isLastWord ? t("test.finishMobile") : t("test.nextMobile")}
                  </span>
                  <span className="hidden sm:inline">
                    {isLastWord ? t("test.finishTest") : t("test.nextWord")}
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Standard Test Area (letterTiles, wordBank, keyboard, translation) */}
        {modeAvailability.available && !isSpecializedMode && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg bg-white p-4 text-center shadow-xl sm:p-8">
              {/* Audio Button - visible for all modes except listeningTranslation (which has its own) */}
              {testMode !== "listeningTranslation" && (
                <TestAudioButton
                  audioUrl={audioUrl}
                  onAudioEnd={handleAudioEnd}
                  onAudioStart={handleAudioStart}
                  showInstruction={true}
                  definition={currentWord.definition ?? ""}
                  playTrigger={playTrigger}
                  isExternallyPlaying={isParentAudioPlaying}
                />
              )}

              {/* Input/Feedback Area - all modes handle their own feedback internally */}
              <div className="mb-6 flex flex-col justify-center">
                <TestModeRenderer
                  testMode={testMode}
                  currentWord={currentWord}
                  expectedAnswer={expectedAnswer}
                  audioUrl={audioUrl}
                  userAnswer={userAnswer}
                  onUserAnswerChange={onUserAnswerChange}
                  onSubmitAnswer={onSubmitAnswer}
                  onExitTest={handleExitClick}
                  showFeedback={showFeedback}
                  lastAnswerCorrect={lastAnswerCorrect}
                  tileFeedbackState={tileFeedbackState}
                  standardFeedbackState={standardFeedbackState}
                  translationInfo={translationInfo}
                  tileKey={tileKey}
                  testConfig={testConfig}
                  navigation={navigation}
                  onClearRef={handleClearRef}
                  onCanClearChange={handleCanClearChange}
                  feedbackDurationMs={feedbackDurationMs}
                  focusTrigger={focusTrigger}
                  onAudioStart={handleAudioStart}
                  onAudioEnd={handleAudioEnd}
                />
              </div>

              {/* Unified Navigation Bar - always visible for inline feedback modes */}
              {(!showFeedback || hasInlineFeedback) && (
                <TestNavigationBar
                  {...navigation}
                  centerContent={
                    supportsClearButton ? (
                      <ClearButton
                        onClick={clearFn || (() => { })}
                        disabled={showFeedback || !canClear || !clearFn}
                      />
                    ) : undefined
                  }
                  hideAudioButton
                />
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
      <TestExitModal
        isOpen={showExitConfirm}
        onConfirmExit={handleConfirmExit}
        onCancelExit={handleCancelExit}
        correctCount={correctCount}
        totalAnswers={answers.length}
        totalWords={processedWords.length}
      />
    </div>
  );
}
