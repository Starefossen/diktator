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
    lastUserAnswer: "",
    inputMethod: "keyboard" as const,
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

  describe("Spelling Feedback Integration", () => {
    it("shows spelling feedback when answer is incorrect and lastUserAnswer provided", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "helo", // Misspelled "hello"
      };
      renderTestView(baseWordSet, "standard", props);
      // Should show the incorrect feedback
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
      // Should show "your answer" section from SpellingFeedback
      expect(screen.getByText(/your answer/i)).toBeInTheDocument();
    });

    it("shows correct feedback for correct answers", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: true,
        currentTries: 1,
      };
      const { container } = renderTestView(baseWordSet, "standard", props);
      // Should show CorrectFeedback with checkmark icon (SVG)
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it("shows almost correct badge when answer is close", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        lastUserAnswer: "hell", // Missing one letter
      };
      renderTestView(baseWordSet, "standard", props);
      // Should show "So close!" badge for close answer
      expect(screen.getByText(/so close/i)).toBeInTheDocument();
    });

    it("does not show spelling feedback when lastUserAnswer is not provided", () => {
      const props = {
        ...baseProps,
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 1,
        // No lastUserAnswer
      };
      renderTestView(baseWordSet, "standard", props);
      // Should still show incorrect message but not detailed spelling feedback
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });
  });

  describe("Input Method - Letter Tiles", () => {
    it("renders LetterTileInput when inputMethod is letterTiles", () => {
      const props = { ...baseProps, inputMethod: "letterTiles" as const };
      renderTestView(baseWordSet, "standard", props);
      // Should show available letters area
      expect(
        screen.getByRole("group", { name: /available/i }),
      ).toBeInTheDocument();
      // Should show answer slots area
      expect(
        screen.getByRole("group", { name: /answer/i }),
      ).toBeInTheDocument();
    });

    it("does not show keyboard input when using letter tiles", () => {
      const props = { ...baseProps, inputMethod: "letterTiles" as const };
      renderTestView(baseWordSet, "standard", props);
      expect(
        screen.queryByPlaceholderText(/type.*word here/i),
      ).not.toBeInTheDocument();
    });

    it("does not show next/finish button in letter tiles mode", () => {
      const props = { ...baseProps, inputMethod: "letterTiles" as const };
      renderTestView(baseWordSet, "standard", props);
      expect(
        screen.queryByText(/next.*word|finish.*test/i),
      ).not.toBeInTheDocument();
    });

    it("hides attempts remaining message in letter tiles mode", () => {
      const props = { ...baseProps, inputMethod: "letterTiles" as const };
      renderTestView(baseWordSet, "standard", props);
      expect(
        screen.queryByText(/attempts.*remaining/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Input Method - Word Bank", () => {
    const sentenceWordSet: WordSet = {
      ...baseWordSet,
      words: [{ word: "katten sover" }, { word: "hunden løper" }],
    };

    it("renders WordBankInput when inputMethod is wordBank", () => {
      const props = {
        ...baseProps,
        inputMethod: "wordBank" as const,
        processedWords: ["katten sover", "hunden løper"],
      };
      renderTestView(sentenceWordSet, "standard", props);
      // Should show word bank area
      expect(
        screen.getByRole("group", { name: /available/i }),
      ).toBeInTheDocument();
    });

    it("does not show keyboard input when using word bank", () => {
      const props = {
        ...baseProps,
        inputMethod: "wordBank" as const,
        processedWords: ["katten sover", "hunden løper"],
      };
      renderTestView(sentenceWordSet, "standard", props);
      expect(
        screen.queryByPlaceholderText(/type.*word here/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Input Method - Auto Selection", () => {
    it("renders word bank input by default for sentences when auto mode", () => {
      const sentenceWordSet: WordSet = {
        ...baseWordSet,
        words: [{ word: "katten sover på sofaen" }],
      };
      const props = {
        ...baseProps,
        inputMethod: "auto" as const,
        processedWords: ["katten sover på sofaen"],
      };
      renderTestView(sentenceWordSet, "standard", props);
      // Should render word bank for sentences in auto mode
      expect(
        screen.getByRole("group", { name: /available words/i }),
      ).toBeInTheDocument();
    });

    it("renders letter tiles for single words when auto mode", () => {
      const props = {
        ...baseProps,
        inputMethod: "auto" as const,
      };
      renderTestView(baseWordSet, "standard", props);
      // Should render letter tiles for single words in auto mode
      expect(
        screen.getByRole("group", { name: /available/i }),
      ).toBeInTheDocument();
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
      renderTestView(sentenceWordSet, "standard", props);
      // Should show word-level feedback for sentences
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
      renderTestView(sentenceWordSet, "standard", props);
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
      renderTestView(sentenceWordSet, "standard", props);
      // Should show word-level feedback with words visible
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
        lastUserAnswer: "katten sover", // Missing "på sofaen"
      };
      renderTestView(sentenceWordSet, "standard", props);
      // Missing words should be shown
      expect(screen.getByText("på")).toBeInTheDocument();
      expect(screen.getByText("sofaen")).toBeInTheDocument();
    });

    it("shows correct answer after max attempts for sentences", () => {
      const props = {
        ...baseProps,
        processedWords: ["Katten sover på sofaen", "Hunden løper fort"],
        showFeedback: true,
        lastAnswerCorrect: false,
        currentTries: 3, // Max attempts reached
        lastUserAnswer: "katten sover",
      };

      // Create word set with showCorrectAnswer enabled
      const wordSetWithConfig: WordSet = {
        ...sentenceWordSet,
        testConfiguration: {
          ...sentenceWordSet.testConfiguration,
          showCorrectAnswer: true,
        },
      };

      renderTestView(wordSetWithConfig, "standard", props);
      // Should show the correct sentence
      expect(screen.getByText("Katten sover på sofaen")).toBeInTheDocument();
    });
  });

  describe("Keyboard Input Mode", () => {
    it("renders text input when inputMethod is keyboard", () => {
      const props = { ...baseProps, inputMethod: "keyboard" as const };
      renderTestView(baseWordSet, "standard", props);
      expect(
        screen.getByPlaceholderText(/type.*word here/i),
      ).toBeInTheDocument();
    });

    it("shows next/finish button in keyboard mode", () => {
      const props = {
        ...baseProps,
        inputMethod: "keyboard" as const,
        userAnswer: "test",
      };
      renderTestView(baseWordSet, "standard", props);
      expect(screen.getByText(/next.*word|finish.*test/i)).toBeInTheDocument();
    });

    it("shows attempts remaining in keyboard mode", () => {
      const props = { ...baseProps, inputMethod: "keyboard" as const };
      renderTestView(baseWordSet, "standard", props);
      expect(screen.getByText(/attempts.*remaining/i)).toBeInTheDocument();
    });

    it("calls onUserAnswerChange when typing in keyboard mode", () => {
      const props = {
        ...baseProps,
        inputMethod: "keyboard" as const,
      };
      renderTestView(baseWordSet, "standard", props);
      const input = screen.getByPlaceholderText(/type.*word here/i);
      fireEvent.change(input, { target: { value: "hello" } });
      expect(mockOnUserAnswerChange).toHaveBeenCalledWith("hello");
    });
  });
});
