import { useMemo } from "react";
import { getMode } from "@/lib/testEngine/registry";
import { TIMING } from "@/lib/timingConfig";
import type { TestMode, WordItem } from "@/types";
import type {
  NavigationActions,
  TileFeedbackState,
  StandardFeedbackState,
} from "@/lib/testEngine/types";
import { LetterTileInput } from "./LetterTileInput";
import { WordBankInput } from "./WordBankInput";
import { MissingLettersInput } from "./MissingLettersInput";
import { FlashcardView } from "./FlashcardView";
import { LookCoverWriteView } from "./LookCoverWriteView";
import { KeyboardInput } from "./KeyboardInput";
import { TranslationInput } from "./TranslationInput";

// Re-export feedback types for consumers
export type { TileFeedbackState, StandardFeedbackState };

interface TestModeRendererProps {
  testMode: TestMode;
  currentWord: WordItem;
  expectedAnswer: string;
  audioUrl: string;
  userAnswer: string;
  onUserAnswerChange: (answer: string) => void;
  onSubmitAnswer: (directAnswer?: string) => void;
  onExitTest: () => void;
  showFeedback: boolean;
  lastAnswerCorrect?: boolean;
  tileFeedbackState: TileFeedbackState | null;
  /** Unified feedback state for standard input modes (wordBank, keyboard, translation) */
  standardFeedbackState?: StandardFeedbackState | null;
  tileKey: number;
  testConfig?: {
    autoPlayAudio?: boolean;
    enableAutocorrect?: boolean;
    flashcardShowDuration?: number;
    lookCoverWriteLookDuration?: number;
    showCorrectAnswer?: boolean;
  };
  /** Translation mode specific props */
  translationInfo?: {
    sourceWord: string;
    direction: "toTarget" | "toSource";
    targetLanguage: string;
  };
  /** Navigation actions for unified button handling */
  navigation?: NavigationActions;
  /** Callback to receive clear function from input components */
  onClearRef?: (clearFn: () => void) => void;
  /** Callback when canClear state changes in input components */
  onCanClearChange?: (canClear: boolean) => void;
  /** Dynamic feedback duration based on word length */
  feedbackDurationMs?: number;
}

export function TestModeRenderer({
  testMode,
  currentWord,
  expectedAnswer,
  audioUrl,
  userAnswer,
  onUserAnswerChange,
  onSubmitAnswer,
  onExitTest,
  showFeedback,
  lastAnswerCorrect = false,
  tileFeedbackState,
  standardFeedbackState = null,
  tileKey,
  testConfig,
  translationInfo,
  navigation,
  onClearRef,
  onCanClearChange,
  feedbackDurationMs = TIMING.FEEDBACK_DISPLAY_MS,
}: TestModeRendererProps) {
  const mode = getMode(testMode);

  // Memoize challenge data to prevent regenerating random tiles on every render.
  // The tileKey is included to allow intentional resets (e.g., on retry).
  const challengeData = useMemo(() => {
    if (!mode?.generateChallenge) return null;
    return mode.generateChallenge(expectedAnswer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedAnswer, testMode, tileKey]);

  if (!mode) {
    return null;
  }

  // Specialized modes with their own complete views
  if (testMode === "flashcard") {
    return (
      <FlashcardView
        key={currentWord.word}
        word={expectedAnswer}
        audioUrl={audioUrl}
        onSubmit={(answer: string, _isCorrect: boolean) => {
          onUserAnswerChange(answer);
          onSubmitAnswer();
        }}
        onSkip={onExitTest}
        showDuration={testConfig?.flashcardShowDuration ?? 3000}
        autoPlayAudio={testConfig?.autoPlayAudio ?? true}
        navigation={navigation}
      />
    );
  }

  if (testMode === "lookCoverWrite") {
    return (
      <LookCoverWriteView
        key={currentWord.word}
        word={expectedAnswer}
        audioUrl={audioUrl}
        onSubmit={(answer: string, _isCorrect: boolean) => {
          onUserAnswerChange(answer);
          onSubmitAnswer();
        }}
        onSkip={onExitTest}
        lookDuration={testConfig?.lookCoverWriteLookDuration ?? 4000}
        autoPlayAudio={testConfig?.autoPlayAudio ?? true}
        navigation={navigation}
      />
    );
  }

  // Standard input modes
  const inputType = mode.inputType;

  if (inputType === "tiles" && challengeData?.tiles) {
    return (
      <LetterTileInput
        key={tileKey}
        tiles={challengeData.tiles}
        expectedWord={expectedAnswer}
        onSubmit={(answer: string, _isCorrect: boolean) => {
          onSubmitAnswer(answer);
        }}
        disabled={showFeedback}
        feedbackState={tileFeedbackState}
        showingCorrectFeedback={showFeedback && lastAnswerCorrect}
        timerDurationMs={feedbackDurationMs}
        navigation={navigation}
        onClearRef={onClearRef}
        onCanClearChange={onCanClearChange}
      />
    );
  }

  if (inputType === "wordBank" && challengeData?.wordBankItems) {
    return (
      <WordBankInput
        key={tileKey}
        items={challengeData.wordBankItems}
        expectedWordCount={expectedAnswer.split(/\s+/).length}
        expectedAnswer={expectedAnswer}
        onSubmit={(answer: string, _isCorrect: boolean) => {
          onSubmitAnswer(answer);
        }}
        disabled={showFeedback}
        feedbackState={standardFeedbackState}
        showingCorrectFeedback={showFeedback && lastAnswerCorrect}
        navigation={navigation}
        onClearRef={onClearRef}
        onCanClearChange={onCanClearChange}
      />
    );
  }

  if (
    testMode === "missingLetters" &&
    challengeData?.blankedWord &&
    challengeData?.missingLetters
  ) {
    return (
      <MissingLettersInput
        key={currentWord.word}
        word={expectedAnswer}
        blankedWord={challengeData.blankedWord}
        missingLetters={challengeData.missingLetters}
        onSubmit={(answer: string, _isCorrect: boolean) => {
          onSubmitAnswer(answer);
        }}
        disabled={showFeedback}
        feedbackState={standardFeedbackState}
        showingCorrectFeedback={showFeedback && lastAnswerCorrect}
        onSkip={onExitTest}
        navigation={navigation}
        onClearRef={onClearRef}
        onCanClearChange={onCanClearChange}
      />
    );
  }

  // Translation mode
  if (testMode === "translation" && translationInfo) {
    return (
      <TranslationInput
        expectedAnswer={expectedAnswer}
        userAnswer={userAnswer}
        onUserAnswerChange={onUserAnswerChange}
        onSubmit={(answer: string, _isCorrect: boolean) => {
          onSubmitAnswer(answer);
        }}
        disabled={showFeedback}
        feedbackState={standardFeedbackState}
        showingCorrectFeedback={showFeedback && lastAnswerCorrect}
        sourceWord={translationInfo.sourceWord}
        direction={translationInfo.direction}
        targetLanguage={translationInfo.targetLanguage}
        navigation={navigation}
        testConfig={testConfig}
      />
    );
  }

  // Keyboard input (default mode)
  return (
    <KeyboardInput
      expectedWord={expectedAnswer}
      userAnswer={userAnswer}
      onUserAnswerChange={onUserAnswerChange}
      onSubmit={(answer: string, _isCorrect: boolean) => {
        onSubmitAnswer(answer);
      }}
      disabled={showFeedback}
      feedbackState={standardFeedbackState}
      showingCorrectFeedback={showFeedback && lastAnswerCorrect}
      navigation={navigation}
      testConfig={testConfig}
    />
  );
}
