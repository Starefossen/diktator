import { useRef } from "react";
import { getMode } from "@/lib/testEngine/registry";
import type { TestMode, WordItem } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { LetterTileInput, TileFeedbackState } from "./LetterTileInput";
import { WordBankInput } from "./WordBankInput";
import { MissingLettersInput } from "./MissingLettersInput";
import { FlashcardView } from "./FlashcardView";
import { LookCoverWriteView } from "./LookCoverWriteView";

interface TestModeRendererProps {
  testMode: TestMode;
  currentWord: WordItem;
  expectedAnswer: string;
  audioUrl: string;
  userAnswer: string;
  onUserAnswerChange: (answer: string) => void;
  onSubmitAnswer: () => void;
  onExitTest: () => void;
  showFeedback: boolean;
  tileFeedbackState: TileFeedbackState | null;
  tileKey: number;
  testConfig?: {
    autoPlayAudio?: boolean;
    enableAutocorrect?: boolean;
    flashcardShowDuration?: number;
    lookCoverWriteLookDuration?: number;
  };
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
  tileFeedbackState,
  tileKey,
  testConfig,
}: TestModeRendererProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const mode = getMode(testMode);

  if (!mode) {
    return null;
  }

  const challengeData = mode.generateChallenge?.(expectedAnswer);

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
          onUserAnswerChange(answer);
          onSubmitAnswer();
        }}
        disabled={showFeedback}
        feedbackState={tileFeedbackState}
      />
    );
  }

  if (inputType === "wordBank" && challengeData?.wordBankItems) {
    return (
      <WordBankInput
        key={tileKey}
        items={challengeData.wordBankItems}
        expectedWordCount={expectedAnswer.split(/\s+/).length}
        onSubmit={(answer: string, _isCorrect: boolean) => {
          onUserAnswerChange(answer);
          onSubmitAnswer();
        }}
        disabled={showFeedback}
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
          onUserAnswerChange(answer);
          onSubmitAnswer();
        }}
        onSkip={onExitTest}
      />
    );
  }

  // Keyboard input (default for keyboard and translation modes)
  return (
    <input
      ref={inputRef}
      type="text"
      value={userAnswer}
      onChange={(e) => onUserAnswerChange(e.target.value)}
      onKeyPress={(e) => e.key === "Enter" && onSubmitAnswer()}
      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-xl transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-nordic-teal sm:px-6 sm:py-4 sm:text-2xl min-h-12"
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
  );
}
