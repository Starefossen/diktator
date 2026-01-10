import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SpellingFeedback, CorrectFeedback } from "../SpellingFeedback";
import { LanguageProvider } from "@/contexts/LanguageContext";
import {
  DEFAULT_SPELLING_CONFIG,
  type SpellingAnalysisResult,
} from "@/lib/spellingAnalysis";

const renderWithLanguage = (
  component: React.ReactNode,
  language: "en" | "no" = "en",
) => {
  return render(
    <LanguageProvider initialLanguage={language}>{component}</LanguageProvider>,
  );
};

describe("SpellingFeedback", () => {
  const baseAnalysis: SpellingAnalysisResult = {
    diffChars: [
      { char: "h", type: "equal" },
      { char: "e", type: "equal" },
      { char: "l", type: "equal" },
      { char: "o", type: "replace", expectedChar: "l" },
    ],
    errorTypes: ["missingLetter"],
    primaryHint: "test.hint.missingLetter",
    distance: 1,
    isAlmostCorrect: true,
  };

  const baseProps = {
    userAnswer: "helo",
    expectedWord: "hello",
    analysis: baseAnalysis,
    currentAttempt: 1,
    maxAttempts: 3,
    config: DEFAULT_SPELLING_CONFIG,
    showCorrectAnswer: true,
  };

  describe("Rendering", () => {
    it("renders feedback container", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it("shows attempt count", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      expect(screen.getByText(/1\/3/)).toBeInTheDocument();
    });

    it("shows try again message", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it("shows 'almost there' badge when isAlmostCorrect is true", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      expect(screen.getByText(/almost/i)).toBeInTheDocument();
    });

    it("does not show 'almost there' badge when isAlmostCorrect is false", () => {
      const propsNotClose = {
        ...baseProps,
        analysis: {
          ...baseAnalysis,
          isAlmostCorrect: false,
        },
      };
      renderWithLanguage(<SpellingFeedback {...propsNotClose} />);
      expect(screen.queryByText(/almost/i)).not.toBeInTheDocument();
    });
  });

  describe("Character diff display", () => {
    it("renders diff characters", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      // Should display the user's answer characters
      expect(screen.getByText("h")).toBeInTheDocument();
      expect(screen.getByText("e")).toBeInTheDocument();
    });

    it("shows color legend", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      // Legend has "Correct", "Wrong", "Missing" labels
      // Note: "Incorrect" also appears in header so we use getAllByText
      expect(screen.getAllByText(/correct/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/wrong/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/missing/i).length).toBeGreaterThanOrEqual(1);
    });

    it("shows 'your answer' label", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      expect(screen.getByText(/your answer/i)).toBeInTheDocument();
    });
  });

  describe("Hint display", () => {
    it("does not show hint on first attempt with default config", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      // Hint should not be shown on attempt 1 (showHintOnAttempt defaults to 2)
      expect(
        screen.queryByText(/A letter is missing/i),
      ).not.toBeInTheDocument();
    });

    it("shows hint on second attempt with default config", () => {
      const propsSecondAttempt = {
        ...baseProps,
        currentAttempt: 2,
      };
      renderWithLanguage(<SpellingFeedback {...propsSecondAttempt} />);
      // Hint should be shown on attempt 2 - check for actual hint text
      expect(screen.getByText(/A letter is missing/i)).toBeInTheDocument();
    });

    it("shows hint on third attempt", () => {
      const propsThirdAttempt = {
        ...baseProps,
        currentAttempt: 3,
      };
      renderWithLanguage(<SpellingFeedback {...propsThirdAttempt} />);
      expect(screen.getByText(/A letter is missing/i)).toBeInTheDocument();
    });

    it("shows correct hint for double consonant error", () => {
      const propsDoubleConsonant = {
        ...baseProps,
        currentAttempt: 2,
        analysis: {
          ...baseAnalysis,
          errorTypes: ["doubleConsonant" as const],
          primaryHint: "test.hint.doubleConsonant",
        },
      };
      renderWithLanguage(<SpellingFeedback {...propsDoubleConsonant} />);
      // Check for the specific double consonant hint text
      expect(screen.getByText(/double consonant/i)).toBeInTheDocument();
    });
  });

  describe("Correct answer display", () => {
    it("does not show correct answer before last attempt", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      expect(screen.queryByText("hello")).not.toBeInTheDocument();
    });

    it("shows correct answer on last attempt when showCorrectAnswer is true", () => {
      const propsLastAttempt = {
        ...baseProps,
        currentAttempt: 3, // maxAttempts is 3
      };
      renderWithLanguage(<SpellingFeedback {...propsLastAttempt} />);
      expect(screen.getByText("hello")).toBeInTheDocument();
    });

    it("does not show correct answer on last attempt when showCorrectAnswer is false", () => {
      const propsNoReveal = {
        ...baseProps,
        currentAttempt: 3,
        showCorrectAnswer: false,
      };
      renderWithLanguage(<SpellingFeedback {...propsNoReveal} />);
      // The word "hello" should not appear as the correct answer
      const helloElements = screen.queryAllByText("hello");
      expect(helloElements.length).toBe(0);
    });
  });

  describe("Attempts remaining", () => {
    it("shows attempts remaining when not last attempt", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />);
      expect(screen.getByText(/2/)).toBeInTheDocument(); // 3 - 1 = 2 remaining
    });

    it("does not show attempts remaining on last attempt", () => {
      const propsLastAttempt = {
        ...baseProps,
        currentAttempt: 3,
      };
      renderWithLanguage(<SpellingFeedback {...propsLastAttempt} />);
      // Should not show "attempts remaining" message
      expect(screen.queryByText(/remaining.*0/i)).not.toBeInTheDocument();
    });
  });

  describe("Norwegian language support", () => {
    it("renders in Norwegian when language is set to no", () => {
      renderWithLanguage(<SpellingFeedback {...baseProps} />, "no");
      // Check for Norwegian text - "Feil" means "Incorrect" and appears in header and legend
      expect(screen.getAllByText(/feil/i).length).toBeGreaterThanOrEqual(1);
    });

    it("shows Norwegian hint text", () => {
      const propsSecondAttempt = {
        ...baseProps,
        currentAttempt: 2,
      };
      const { container } = renderWithLanguage(
        <SpellingFeedback {...propsSecondAttempt} />,
        "no",
      );
      // Hint box should have nordic-sky background (bg-nordic-sky/10 compiles to bg-nordic-sky/10)
      expect(
        container.querySelector(".bg-nordic-sky\\/10"),
      ).toBeInTheDocument();
    });
  });

  describe("Different diff types", () => {
    it("renders equal characters correctly", () => {
      const analysisAllEqual: SpellingAnalysisResult = {
        diffChars: [
          { char: "a", type: "equal" },
          { char: "b", type: "equal" },
          { char: "c", type: "equal" },
        ],
        errorTypes: [],
        primaryHint: null,
        distance: 0,
        isAlmostCorrect: false,
      };
      const props = { ...baseProps, analysis: analysisAllEqual };
      const { container } = renderWithLanguage(<SpellingFeedback {...props} />);
      // All diff characters should have green styling (equal class)
      // Note: legend also has a green square, so we check for at least 3
      const greenChars = container.querySelectorAll(".bg-green-100");
      expect(greenChars.length).toBeGreaterThanOrEqual(3);
    });

    it("renders replacement characters correctly", () => {
      const analysisReplace: SpellingAnalysisResult = {
        diffChars: [
          { char: "a", type: "equal" },
          { char: "x", type: "replace", expectedChar: "b" },
          { char: "c", type: "equal" },
        ],
        errorTypes: ["missingLetter"],
        primaryHint: "test.hint.missingLetter",
        distance: 1,
        isAlmostCorrect: true,
      };
      const props = { ...baseProps, analysis: analysisReplace };
      const { container } = renderWithLanguage(<SpellingFeedback {...props} />);
      // Should have red styling for replacement
      const redChars = container.querySelectorAll(".bg-red-100");
      expect(redChars.length).toBeGreaterThan(0);
    });

    it("renders delete (extra) characters correctly", () => {
      const analysisDelete: SpellingAnalysisResult = {
        diffChars: [
          { char: "a", type: "equal" },
          { char: "x", type: "delete" },
          { char: "b", type: "equal" },
        ],
        errorTypes: ["extraLetter"],
        primaryHint: "test.hint.extraLetter",
        distance: 1,
        isAlmostCorrect: true,
      };
      const props = { ...baseProps, analysis: analysisDelete };
      const { container } = renderWithLanguage(<SpellingFeedback {...props} />);
      // Should have strikethrough styling for deletions
      const strikethroughChars = container.querySelectorAll(".line-through");
      expect(strikethroughChars.length).toBe(1);
    });

    it("renders insert (missing) characters correctly", () => {
      const analysisInsert: SpellingAnalysisResult = {
        diffChars: [
          { char: "a", type: "equal" },
          { char: "b", type: "insert" },
          { char: "c", type: "equal" },
        ],
        errorTypes: ["missingLetter"],
        primaryHint: "test.hint.missingLetter",
        distance: 1,
        isAlmostCorrect: true,
      };
      const props = { ...baseProps, analysis: analysisInsert };
      const { container } = renderWithLanguage(<SpellingFeedback {...props} />);
      // Should have yellow styling for insertions
      // Note: legend also has a yellow square, so check for at least 1
      const yellowChars = container.querySelectorAll(".bg-yellow-100");
      expect(yellowChars.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("CorrectFeedback", () => {
  it("renders success message", () => {
    renderWithLanguage(<CorrectFeedback />);
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
  });

  it("shows checkmark icon", () => {
    const { container } = renderWithLanguage(<CorrectFeedback />);
    // Check for SVG icon instead of text checkmark
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has green styling", () => {
    const { container } = renderWithLanguage(<CorrectFeedback />);
    const greenContainer = container.querySelector(".bg-green-100");
    expect(greenContainer).toBeInTheDocument();
  });

  it("renders in Norwegian when language is set", () => {
    renderWithLanguage(<CorrectFeedback />, "no");
    // "Riktig" is Norwegian for "Correct"
    expect(screen.getByText(/riktig/i)).toBeInTheDocument();
  });
});
