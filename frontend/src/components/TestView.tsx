import React, { useRef, useEffect, useMemo } from "react";
import { WordSet, TestAnswer, getEffectiveTestConfig } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { requiresUserInteractionForAudio } from "@/lib/audioPlayer";
import { HeroVolumeIcon, HeroDevicePhoneMobileIcon } from "@/components/Icons";
import {
  analyzeSpelling,
  SpellingAnalysisResult,
  DEFAULT_SPELLING_CONFIG,
} from "@/lib/spellingAnalysis";
import {
  SpellingFeedback,
  CorrectFeedback,
} from "@/components/SpellingFeedback";
import { TIMING } from "@/lib/timingConfig";
import { Button } from "@/components/Button";

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
  lastUserAnswer?: string; // The most recent answer submitted (for spelling feedback)
  onUserAnswerChange: (answer: string) => void;
  onSubmitAnswer: () => void;
  onPlayCurrentWord: () => void;
  onExitTest: () => void;
}

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
  const testConfig = getEffectiveTestConfig(activeTest);
  const currentWord = activeTest.words[currentWordIndex];
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when feedback is hidden (ready for new input)
  useEffect(() => {
    if (!showFeedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showFeedback]);

  // For translation mode, get direction from the hook
  const targetLanguage = activeTest.testConfiguration?.targetLanguage;
  const wordDirection =
    wordDirections.length > currentWordIndex
      ? wordDirections[currentWordIndex]
      : "toTarget";

  const translation =
    testMode === "translation" && targetLanguage
      ? currentWord?.translations?.find((tr) => tr.language === targetLanguage)
      : undefined;

  // Determine what to show based on direction
  const showWord =
    wordDirection === "toTarget" ? currentWord.word : translation?.text;

  // Get the expected answer for spelling analysis
  const expectedAnswer = useMemo(() => {
    if (testMode === "translation" && translation) {
      return wordDirection === "toTarget" ? translation.text : currentWord.word;
    }
    return currentWord.word;
  }, [testMode, translation, wordDirection, currentWord.word]);

  // Compute spelling analysis when showing feedback for incorrect answer
  const spellingAnalysis: SpellingAnalysisResult | null = useMemo(() => {
    if (!showFeedback || lastAnswerCorrect || !lastUserAnswer) {
      return null;
    }
    const config = {
      ...DEFAULT_SPELLING_CONFIG,
      almostCorrectThreshold: testConfig?.almostCorrectThreshold ?? 2,
      showHintOnAttempt: testConfig?.showHintOnAttempt ?? 2,
      enableKeyboardProximity: testConfig?.enableKeyboardProximity ?? true,
    };
    return analyzeSpelling(lastUserAnswer, expectedAnswer, config);
  }, [
    showFeedback,
    lastAnswerCorrect,
    lastUserAnswer,
    expectedAnswer,
    testConfig?.almostCorrectThreshold,
    testConfig?.showHintOnAttempt,
    testConfig?.enableKeyboardProximity,
  ]);

  // Spelling feedback config from test configuration
  const spellingConfig = useMemo(
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

  return (
    <div className="bg-nordic-birch">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {activeTest.name}
          </h1>
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
          <p className="text-gray-600">
            {t("test.progress")} {currentWordIndex + 1} {t("common.of")}{" "}
            {processedWords.length}
          </p>
          <div className="w-full h-2 mt-4 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all duration-300 rounded-full bg-linear-to-r from-nordic-sky to-nordic-teal"
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
              <div className="flex items-center justify-center gap-4">
                <div className="relative inline-block">
                  {isAudioPlaying && (
                    <div className="absolute border-4 border-transparent rounded-full -inset-3 border-t-nordic-sky border-r-nordic-sky/80 animate-spin"></div>
                  )}
                  <button
                    onClick={() => {
                      onPlayCurrentWord();
                      // Return focus to input after clicking audio
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, TIMING.INPUT_FOCUS_DELAY_MS);
                    }}
                    className="relative p-4 text-4xl text-nordic-midnight transition-all duration-200 transform rounded-full shadow-lg sm:p-6 sm:text-6xl bg-linear-to-r from-nordic-meadow to-nordic-sky hover:from-nordic-meadow/90 hover:to-nordic-sky/90 hover:shadow-xl hover:scale-105"
                  >
                    <HeroVolumeIcon className="w-12 h-12 text-nordic-midnight sm:w-16 sm:h-16" />
                  </button>
                </div>
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
              {activeTest.words[currentWordIndex]?.definition && (
                <div className="max-w-md px-4 py-2 mx-auto mt-3 text-sm border border-nordic-sky/30 rounded-lg bg-nordic-sky/10">
                  <p className="text-nordic-midnight">
                    <span className="font-medium">{t("test.context")}</span>{" "}
                    {activeTest.words[currentWordIndex].definition}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center mb-6">
              {showFeedback ? (
                lastAnswerCorrect ? (
                  <CorrectFeedback />
                ) : spellingAnalysis && lastUserAnswer ? (
                  <SpellingFeedback
                    userAnswer={lastUserAnswer}
                    expectedWord={expectedAnswer}
                    analysis={spellingAnalysis}
                    currentAttempt={currentTries}
                    maxAttempts={testConfig?.maxAttempts ?? 3}
                    config={spellingConfig}
                    showCorrectAnswer={
                      currentTries >= (testConfig?.maxAttempts ?? 3) &&
                      testConfig?.showCorrectAnswer
                    }
                    timerDurationMs={TIMING.FEEDBACK_DISPLAY_MS}
                  />
                ) : (
                  // Fallback to simple feedback if no analysis available
                  <div className="p-4 rounded-lg animate-in fade-in-0 slide-in-from-top-2 duration-300 bg-red-100 border border-red-300">
                    <p className="font-semibold text-lg text-red-800">
                      {t("test.incorrect")} - {t("test.tryAgain")} (
                      {currentTries}/{testConfig?.maxAttempts ?? 3})
                    </p>
                  </div>
                )
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => onUserAnswerChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onSubmitAnswer()}
                  className="w-full px-4 py-3 text-xl text-center transition-all duration-200 border-2 border-gray-300 rounded-lg sm:px-6 sm:py-4 sm:text-2xl focus:ring-2 focus:ring-nordic-teal focus:border-transparent"
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

            <div className="flex justify-center h-5 mb-8">
              {/* Only show attempts remaining when NOT showing feedback (SpellingFeedback has its own display) */}
              {!showFeedback && (
                <p className="text-sm text-gray-500">
                  {t("test.attemptsRemaining")}:{" "}
                  {(testConfig?.maxAttempts ?? 3) - currentTries}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {/* Play Again Button - Hidden in dictation mode since it auto-plays */}
              {testMode !== "dictation" && (
                <Button
                  variant="secondary-child"
                  onClick={() => {
                    onPlayCurrentWord();
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, TIMING.INPUT_FOCUS_DELAY_MS);
                  }}
                  disabled={showFeedback}
                >
                  <HeroVolumeIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {t("test.playAgain")}
                  </span>
                </Button>
              )}

              {/* Next/Finish Button */}
              <Button
                variant="primary-child"
                onClick={onSubmitAnswer}
                disabled={!userAnswer.trim() || showFeedback}
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
              </Button>

              {/* Back Button */}
              <Button variant="secondary-child" onClick={onExitTest}>
                <span className="sm:hidden">{t("test.backMobile")}</span>
                <span className="hidden sm:inline">
                  {t("test.backToWordSets")}
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-600">
            {answers.length > 0 && (
              <p>
                {t("test.correctSoFar")}:{" "}
                {answers.filter((a) => a.isCorrect).length} / {answers.length}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
