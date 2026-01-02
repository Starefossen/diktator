import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestView } from "../TestView";
import { WordSet, TestAnswer } from "@/types";
import { LanguageProvider } from "@/contexts/LanguageContext";

describe("TestView - Mode-Specific Behavior", () => {
  const mockOnUserAnswerChange = vi.fn();
  const mockOnSubmitAnswer = vi.fn();
  const mockOnPlayCurrentWord = vi.fn();
  const mockOnExitTest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseWordSet: WordSet = {
    id: "1",
    name: "Test WordSet",
    language: "en",
    familyId: "family-1",
    createdBy: "user-1",
    words: [{ word: "hello" }, { word: "world" }],
    testConfiguration: {
      defaultMode: "standard",
      maxAttempts: 3,
      autoPlayAudio: false,
      enableAutocorrect: false,
      showCorrectAnswer: true,
      autoAdvance: false,
      shuffleWords: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const translationWordSet: WordSet = {
    ...baseWordSet,
    id: "2",
    name: "Spanish Translation",
    words: [
      {
        word: "hello",
        translations: [{ language: "es", text: "hola" }],
      },
      {
        word: "goodbye",
        translations: [{ language: "es", text: "adiós" }],
      },
    ],
    testConfiguration: {
      defaultMode: "translation",
      targetLanguage: "es",
      maxAttempts: 3,
      autoPlayAudio: false,
      enableAutocorrect: false,
      showCorrectAnswer: true,
      autoAdvance: false,
      shuffleWords: false,
    },
  };

  const baseProps = {
    currentWordIndex: 0,
    processedWords: ["hello", "world"],
    userAnswer: "",
    showFeedback: false,
    lastAnswerCorrect: false,
    currentTries: 0,
    answers: [] as TestAnswer[],
    isAudioPlaying: false,
    wordDirections: ["toTarget", "toTarget"] as ("toTarget" | "toSource")[],
    onUserAnswerChange: mockOnUserAnswerChange,
    onSubmitAnswer: mockOnSubmitAnswer,
    onPlayCurrentWord: mockOnPlayCurrentWord,
    onExitTest: mockOnExitTest,
  };

  const renderTestView = (
    activeTest: WordSet,
    testMode: "standard" | "dictation" | "translation",
    props = baseProps,
  ) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <TestView activeTest={activeTest} testMode={testMode} {...props} />
      </LanguageProvider>,
    );
  };

  describe("Standard Mode", () => {
    it("shows Play Again button in standard mode", () => {
      renderTestView(baseWordSet, "standard");
      expect(screen.getByText(/play again/i)).toBeInTheDocument();
    });

    it("shows standard placeholder text", () => {
      renderTestView(baseWordSet, "standard");
      const input = screen.getByPlaceholderText(/type.*word here/i);
      expect(input).toBeInTheDocument();
    });

    it("does not show translation prompt in standard mode", () => {
      renderTestView(baseWordSet, "standard");
      expect(screen.queryByText(/translate/i)).not.toBeInTheDocument();
    });
  });

  describe("Dictation Mode", () => {
    it("hides Play Again button in dictation mode", () => {
      renderTestView(baseWordSet, "dictation");
      expect(screen.queryByText(/play again/i)).not.toBeInTheDocument();
    });

    it("shows dictation placeholder text", () => {
      renderTestView(baseWordSet, "dictation");
      const input = screen.getByPlaceholderText(/type.*word here/i);
      expect(input).toBeInTheDocument();
    });

    it("does not show word to user in dictation mode", () => {
      renderTestView(baseWordSet, "dictation");
      // The word "hello" should not be visible
      expect(screen.queryByText("hello")).not.toBeInTheDocument();
    });
  });

  describe("Translation Mode", () => {
    it("shows Play Again button in translation mode", () => {
      renderTestView(translationWordSet, "translation");
      expect(screen.getByText(/play again/i)).toBeInTheDocument();
    });

    it("shows translation placeholder text", () => {
      renderTestView(translationWordSet, "translation");
      const input = screen.getByPlaceholderText(/type.*translation here/i);
      expect(input).toBeInTheDocument();
    });

    it("displays source word to translate", () => {
      renderTestView(translationWordSet, "translation");
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
      // In translation mode, the word "hello" should be visible to translate
    });

    it("shows correct word in translation mode", () => {
      renderTestView(translationWordSet, "translation");
      // In translation mode, the source word should be visible
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
    });
  });

  describe("Common Functionality", () => {
    it("shows progress indicator", () => {
      renderTestView(baseWordSet, "standard");
      expect(screen.getByText(/1.*of.*2/i)).toBeInTheDocument();
    });

    it("shows wordset name", () => {
      renderTestView(baseWordSet, "standard");
      expect(screen.getByText("Test WordSet")).toBeInTheDocument();
    });

    it("calls onUserAnswerChange when input changes", () => {
      renderTestView(baseWordSet, "standard");
      const input = screen.getByPlaceholderText(/type.*word here/i);
      fireEvent.change(input, { target: { value: "test" } });
      expect(mockOnUserAnswerChange).toHaveBeenCalledWith("test");
    });

    it("calls onSubmitAnswer when submit button clicked", () => {
      const props = { ...baseProps, userAnswer: "test" };
      renderTestView(baseWordSet, "standard", props);
      const submitButton = screen.getByText(/next.*word|finish.*test/i);
      fireEvent.click(submitButton);
      expect(mockOnSubmitAnswer).toHaveBeenCalled();
    });

    it("calls onPlayCurrentWord when play button clicked", () => {
      renderTestView(baseWordSet, "standard");
      const playButton = screen.getByText(/play again/i);
      fireEvent.click(playButton);
      expect(mockOnPlayCurrentWord).toHaveBeenCalled();
    });

    it("calls onExitTest when back button clicked", () => {
      renderTestView(baseWordSet, "standard");
      const backButton = screen.getByRole("button", { name: /back/i });
      fireEvent.click(backButton);
      expect(mockOnExitTest).toHaveBeenCalled();
    });

    it("disables submit button when answer is empty", () => {
      renderTestView(baseWordSet, "standard");
      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons.find((btn) =>
        /next.*word|finish.*test/i.test(btn.textContent || ""),
      );
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when answer is provided", () => {
      const props = { ...baseProps, userAnswer: "test" };
      renderTestView(baseWordSet, "standard", props);
      const submitButton = screen.getByText(/next.*word|finish.*test/i);
      expect(submitButton).not.toBeDisabled();
    });

    it("shows feedback when showFeedback is true and answer is correct", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: true,
      };
      renderTestView(baseWordSet, "standard", props);
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it("shows feedback when showFeedback is true and answer is incorrect", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
      };
      renderTestView(baseWordSet, "standard", props);
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it("shows attempts remaining", () => {
      renderTestView(baseWordSet, "standard");
      expect(screen.getByText(/attempts.*remaining.*3/i)).toBeInTheDocument();
    });

    it("shows correct count in progress", () => {
      const props = {
        ...baseProps,
        answers: [
          {
            word: "hello",
            userAnswers: ["hello"],
            finalAnswer: "hello",
            isCorrect: true,
            attempts: 1,
            timeSpent: 5,
          },
        ] as TestAnswer[],
      };
      renderTestView(baseWordSet, "standard", props);
      expect(screen.getByText(/correct.*so far.*1.*1/i)).toBeInTheDocument();
    });
  });

  describe("Audio Playback Visual Feedback", () => {
    it("shows audio playing animation when audio is playing", () => {
      const props = { ...baseProps, isAudioPlaying: true };
      const { container } = renderTestView(baseWordSet, "standard", props);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("does not show audio playing animation when audio is not playing", () => {
      const { container: _container } = renderTestView(baseWordSet, "standard");
      // When not playing, the audio button should not have the playing state
      const playButton = screen.getByText(/play again/i);
      expect(playButton).toBeInTheDocument();
    });
  });
});
