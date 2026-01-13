import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestView } from "../TestView";
import { WordSet, TestAnswer, TestMode } from "@/types";
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
      defaultMode: "keyboard",
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
    lastUserAnswer: "",
    onUserAnswerChange: mockOnUserAnswerChange,
    onSubmitAnswer: mockOnSubmitAnswer,
    onPlayCurrentWord: mockOnPlayCurrentWord,
    onExitTest: mockOnExitTest,
  };

  const renderTestView = (
    activeTest: WordSet,
    testMode: TestMode,
    props = baseProps,
  ) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <TestView activeTest={activeTest} testMode={testMode} {...props} />
      </LanguageProvider>,
    );
  };

  describe("Keyboard Mode", () => {
    it("shows Play Again button in keyboard mode", () => {
      renderTestView(baseWordSet, "keyboard");
      expect(screen.getByText(/play again/i)).toBeInTheDocument();
    });

    it("shows keyboard placeholder text", () => {
      renderTestView(baseWordSet, "keyboard");
      const input = screen.getByPlaceholderText("Type the word you heard");
      expect(input).toBeInTheDocument();
    });

    it("does not show translation prompt in keyboard mode", () => {
      renderTestView(baseWordSet, "keyboard");
      expect(screen.queryByText(/translate/i)).not.toBeInTheDocument();
    });
  });

  describe("Letter Tiles Mode", () => {
    it("shows letter tiles input in letterTiles mode", () => {
      renderTestView(baseWordSet, "letterTiles");
      // Should show available letters area
      expect(
        screen.getByRole("group", { name: /available/i }),
      ).toBeInTheDocument();
    });

    it("does not show keyboard input in letterTiles mode", () => {
      renderTestView(baseWordSet, "letterTiles");
      expect(
        screen.queryByPlaceholderText(/type.*word here/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Translation Mode", () => {
    it("shows Play Again button in translation mode", () => {
      renderTestView(translationWordSet, "translation");
      expect(screen.getByText(/play again/i)).toBeInTheDocument();
    });

    it("shows translation placeholder text", () => {
      renderTestView(translationWordSet, "translation");
      const input = screen.getByPlaceholderText("Type translation here");
      expect(input).toBeInTheDocument();
    });

    it("displays source word to translate", () => {
      renderTestView(translationWordSet, "translation");
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
    });

    it("shows correct word in translation mode", () => {
      renderTestView(translationWordSet, "translation");
      expect(screen.getByText(/hello/i)).toBeInTheDocument();
    });
  });

  describe("Common Functionality", () => {
    it("shows progress indicator", () => {
      renderTestView(baseWordSet, "keyboard");
      expect(screen.getByText(/1.*of.*2/i)).toBeInTheDocument();
    });

    it("shows wordset name", () => {
      renderTestView(baseWordSet, "keyboard");
      expect(screen.getByText("Test WordSet")).toBeInTheDocument();
    });

    it("calls onUserAnswerChange when input changes", () => {
      renderTestView(baseWordSet, "keyboard");
      const input = screen.getByPlaceholderText("Type the word you heard");
      fireEvent.change(input, { target: { value: "test" } });
      expect(mockOnUserAnswerChange).toHaveBeenCalledWith("test");
    });

    it("calls onSubmitAnswer when submit button clicked", () => {
      const props = { ...baseProps, userAnswer: "test" };
      renderTestView(baseWordSet, "keyboard", props);
      const submitButton = screen.getByText(/next.*word|finish.*test/i);
      fireEvent.click(submitButton);
      expect(mockOnSubmitAnswer).toHaveBeenCalled();
    });

    it("calls onPlayCurrentWord when play button clicked", () => {
      renderTestView(baseWordSet, "keyboard");
      const playButton = screen.getByText(/play again/i);
      fireEvent.click(playButton);
      expect(mockOnPlayCurrentWord).toHaveBeenCalled();
    });

    it("calls onExitTest when cancel button clicked and confirmed", () => {
      renderTestView(baseWordSet, "keyboard");
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should show confirmation modal
      expect(screen.getByText(/exit test/i)).toBeInTheDocument();

      // Click "Yes, Exit" button to confirm
      const confirmButton = screen.getByRole("button", { name: /yes.*exit/i });
      fireEvent.click(confirmButton);

      expect(mockOnExitTest).toHaveBeenCalled();
    });

    it("disables submit button when answer is empty", () => {
      renderTestView(baseWordSet, "keyboard");
      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons.find((btn) =>
        /next.*word|finish.*test/i.test(btn.textContent || ""),
      );
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when answer is provided", () => {
      const props = { ...baseProps, userAnswer: "test" };
      renderTestView(baseWordSet, "keyboard", props);
      const submitButton = screen.getByText(/next.*word|finish.*test/i);
      expect(submitButton).not.toBeDisabled();
    });

    it("shows feedback when showFeedback is true and answer is correct", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: true,
      };
      renderTestView(baseWordSet, "keyboard", props);
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it("shows feedback when showFeedback is true and answer is incorrect", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "helo",
      };
      renderTestView(baseWordSet, "keyboard", props);
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
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
      renderTestView(baseWordSet, "keyboard", props);
      expect(screen.getByText(/correct.*so far.*1.*1/i)).toBeInTheDocument();
    });
  });

  describe("Audio Playback Visual Feedback", () => {
    it("shows audio playing animation when audio is playing", () => {
      const props = { ...baseProps, isAudioPlaying: true };
      const { container } = renderTestView(baseWordSet, "keyboard", props);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("does not show audio playing animation when audio is not playing", () => {
      renderTestView(baseWordSet, "keyboard");
      const playButton = screen.getByText(/play again/i);
      expect(playButton).toBeInTheDocument();
    });
  });

  describe("Spelling Feedback Integration", () => {
    it("shows spelling feedback when answer is incorrect and lastUserAnswer provided", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "helo",
      };
      renderTestView(baseWordSet, "keyboard", props);
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
      expect(screen.getByText(/your answer/i)).toBeInTheDocument();
    });

    it("shows correct feedback for correct answers", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: true,
        currentTries: 1,
      };
      const { container } = renderTestView(baseWordSet, "keyboard", props);
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it("shows almost correct badge when answer is close", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "hell",
      };
      renderTestView(baseWordSet, "keyboard", props);
      expect(screen.getByText(/so close/i)).toBeInTheDocument();
    });
  });

  describe("Letter Tiles Mode Behavior", () => {
    it("renders LetterTileInput when testMode is letterTiles", () => {
      renderTestView(baseWordSet, "letterTiles");
      expect(
        screen.getByRole("group", { name: /available/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("group", { name: /answer/i }),
      ).toBeInTheDocument();
    });

    it("does not show keyboard input in letter tiles mode", () => {
      renderTestView(baseWordSet, "letterTiles");
      expect(
        screen.queryByPlaceholderText(/type.*word here/i),
      ).not.toBeInTheDocument();
    });

    it("does not show next/finish button in letter tiles mode", () => {
      renderTestView(baseWordSet, "letterTiles");
      expect(
        screen.queryByText(/next.*word|finish.*test/i),
      ).not.toBeInTheDocument();
    });

    it("hides attempts remaining message in letter tiles mode", () => {
      renderTestView(baseWordSet, "letterTiles");
      expect(
        screen.queryByText(/attempts.*remaining/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Word Bank Mode Behavior", () => {
    const sentenceWordSet: WordSet = {
      ...baseWordSet,
      words: [{ word: "katten sover" }, { word: "hunden løper" }],
    };

    it("renders WordBankInput when testMode is wordBank", () => {
      const props = {
        ...baseProps,
        processedWords: ["katten sover", "hunden løper"],
      };
      renderTestView(sentenceWordSet, "wordBank", props);
      expect(
        screen.getByRole("group", { name: /available/i }),
      ).toBeInTheDocument();
    });

    it("does not show keyboard input in word bank mode", () => {
      const props = {
        ...baseProps,
        processedWords: ["katten sover", "hunden løper"],
      };
      renderTestView(sentenceWordSet, "wordBank", props);
      expect(
        screen.queryByPlaceholderText(/type.*word here/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Sentence Feedback Integration", () => {
    const sentenceWordSet: WordSet = {
      ...baseWordSet,
      words: [
        { word: "Katten sover på sofaen" },
        { word: "Hunden løper fort" },
      ],
    };

    it("shows sentence feedback for sentence content when incorrect", () => {
      const props = {
        ...baseProps,
        processedWords: ["Katten sover på sofaen", "Hunden løper fort"],
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "Katten sover",
      };
      renderTestView(sentenceWordSet, "keyboard", props);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("shows correct feedback for fully correct sentence", () => {
      const props = {
        ...baseProps,
        processedWords: ["Katten sover på sofaen", "Hunden løper fort"],
        showFeedback: true,
        lastAnswerCorrect: true,
        currentTries: 1,
      };
      renderTestView(sentenceWordSet, "keyboard", props);
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it("shows word pills in sentence feedback", () => {
      const props = {
        ...baseProps,
        processedWords: ["Katten sover på sofaen", "Hunden løper fort"],
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "katten sover",
      };
      renderTestView(sentenceWordSet, "keyboard", props);
      expect(screen.getByText("katten")).toBeInTheDocument();
      expect(screen.getByText("sover")).toBeInTheDocument();
    });

    it("shows missing words in sentence feedback", () => {
      const props = {
        ...baseProps,
        processedWords: ["Katten sover på sofaen", "Hunden løper fort"],
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "katten sover",
      };
      renderTestView(sentenceWordSet, "keyboard", props);
      expect(screen.getByText("på")).toBeInTheDocument();
      expect(screen.getByText("sofaen")).toBeInTheDocument();
    });

    it("shows correct answer after max attempts for sentences", () => {
      const props = {
        ...baseProps,
        processedWords: ["Katten sover på sofaen", "Hunden løper fort"],
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 3,
        lastUserAnswer: "katten sover",
      };

      const wordSetWithConfig: WordSet = {
        ...sentenceWordSet,
        testConfiguration: {
          ...sentenceWordSet.testConfiguration,
          showCorrectAnswer: true,
        },
      };

      renderTestView(wordSetWithConfig, "keyboard", props);
      expect(screen.getByText("Katten sover på sofaen")).toBeInTheDocument();
    });
  });

  describe("Keyboard Mode Input Behavior", () => {
    it("renders text input in keyboard mode", () => {
      renderTestView(baseWordSet, "keyboard");
      expect(
        screen.getByPlaceholderText("Type the word you heard"),
      ).toBeInTheDocument();
    });

    it("shows next/finish button in keyboard mode", () => {
      const props = {
        ...baseProps,
        userAnswer: "test",
      };
      renderTestView(baseWordSet, "keyboard", props);
      expect(screen.getByText(/next.*word|finish.*test/i)).toBeInTheDocument();
    });

    it("calls onUserAnswerChange when typing in keyboard mode", () => {
      renderTestView(baseWordSet, "keyboard");
      const input = screen.getByPlaceholderText("Type the word you heard");
      fireEvent.change(input, { target: { value: "hello" } });
      expect(mockOnUserAnswerChange).toHaveBeenCalledWith("hello");
    });
  });
});
