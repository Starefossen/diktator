import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "vitest-axe";
import { SentenceFeedback, SentenceFeedbackCompact } from "../SentenceFeedback";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { SentenceScoringResult } from "@/lib/sentenceScoring";

const renderWithLanguage = (
  component: React.ReactNode,
  language: "en" | "no" = "en",
) => {
  return render(
    <LanguageProvider initialLanguage={language}>{component}</LanguageProvider>,
  );
};

describe("SentenceFeedback", () => {
  const createScoringResult = (
    overrides: Partial<SentenceScoringResult> = {},
  ): SentenceScoringResult => ({
    score: 50,
    adjustedScore: 50,
    correctCount: 2,
    totalExpected: 4,
    isFullyCorrect: false,
    orderAccuracy: 1,
    wordFeedback: [
      { word: "katten", status: "correct", expectedPosition: 0 },
      { word: "sover", status: "correct", expectedPosition: 1 },
      { word: "på", status: "missing", expectedPosition: 2 },
      { word: "sofaen", status: "missing", expectedPosition: 3 },
    ],
    ...overrides,
  });

  const baseProps = {
    result: createScoringResult(),
    currentAttempt: 1,
    maxAttempts: 3,
    showCorrectAnswer: false,
    expectedSentence: "Katten sover på sofaen",
    timerDurationMs: 2000,
  };

  describe("Rendering", () => {
    it("renders feedback container", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("shows correct count and total", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/4/)).toBeInTheDocument();
    });

    it("shows attempt counter for incorrect answers", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      expect(screen.getByText("1/3")).toBeInTheDocument();
    });

    it("does not show attempt counter for correct answers", () => {
      const perfectResult = createScoringResult({
        score: 100,
        isFullyCorrect: true,
        correctCount: 4,
        wordFeedback: [
          { word: "katten", status: "correct", expectedPosition: 0 },
          { word: "sover", status: "correct", expectedPosition: 1 },
          { word: "på", status: "correct", expectedPosition: 2 },
          { word: "sofaen", status: "correct", expectedPosition: 3 },
        ],
      });
      renderWithLanguage(
        <SentenceFeedback {...baseProps} result={perfectResult} />,
      );
      expect(screen.queryByText("1/3")).not.toBeInTheDocument();
    });
  });

  describe("Word feedback display", () => {
    it("renders word pills for expected words", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      expect(screen.getByText("katten")).toBeInTheDocument();
      expect(screen.getByText("sover")).toBeInTheDocument();
      expect(screen.getByText("på")).toBeInTheDocument();
      expect(screen.getByText("sofaen")).toBeInTheDocument();
    });

    it("shows extra words section when present", () => {
      const resultWithExtra = createScoringResult({
        wordFeedback: [
          { word: "katten", status: "correct", expectedPosition: 0 },
          { word: "sover", status: "correct", expectedPosition: 1 },
          {
            word: "den",
            status: "extra",
            expectedPosition: -1,
            userWord: "den",
          },
        ],
      });
      renderWithLanguage(
        <SentenceFeedback {...baseProps} result={resultWithExtra} />,
      );
      expect(screen.getByText(/extra words/i)).toBeInTheDocument();
      expect(screen.getByText("den")).toBeInTheDocument();
    });

    it("does not show extra words section when none present", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      expect(screen.queryByText(/extra words/i)).not.toBeInTheDocument();
    });

    it("shows misspelled words with correction", () => {
      const resultWithMisspelling = createScoringResult({
        wordFeedback: [
          {
            word: "katten",
            status: "misspelled",
            expectedPosition: 0,
            userWord: "katen",
          },
          { word: "sover", status: "correct", expectedPosition: 1 },
        ],
      });
      renderWithLanguage(
        <SentenceFeedback {...baseProps} result={resultWithMisspelling} />,
      );
      expect(screen.getByText("katen")).toBeInTheDocument();
      expect(screen.getByText("katten")).toBeInTheDocument();
    });
  });

  describe("Feedback message keys", () => {
    it("shows perfect message for fully correct", () => {
      const perfectResult = createScoringResult({
        score: 100,
        isFullyCorrect: true,
        correctCount: 4,
        totalExpected: 4,
        wordFeedback: [
          { word: "katten", status: "correct", expectedPosition: 0 },
          { word: "sover", status: "correct", expectedPosition: 1 },
          { word: "på", status: "correct", expectedPosition: 2 },
          { word: "sofaen", status: "correct", expectedPosition: 3 },
        ],
      });
      renderWithLanguage(
        <SentenceFeedback {...baseProps} result={perfectResult} />,
      );
      // Should show green success styling
      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-green");
    });

    it("shows amber styling for partial progress", () => {
      const partialResult = createScoringResult({
        correctCount: 3,
        totalExpected: 4,
      });
      renderWithLanguage(
        <SentenceFeedback {...baseProps} result={partialResult} />,
      );
      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-amber");
    });

    it("shows red styling for poor progress", () => {
      const poorResult = createScoringResult({
        correctCount: 1,
        totalExpected: 4,
      });
      renderWithLanguage(
        <SentenceFeedback {...baseProps} result={poorResult} />,
      );
      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-red");
    });
  });

  describe("Correct answer display", () => {
    it("does not show correct answer when showCorrectAnswer is false", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      expect(
        screen.queryByText("Katten sover på sofaen"),
      ).not.toBeInTheDocument();
    });

    it("shows correct answer when showCorrectAnswer is true and not fully correct", () => {
      const props = {
        ...baseProps,
        showCorrectAnswer: true,
      };
      renderWithLanguage(<SentenceFeedback {...props} />);
      expect(screen.getByText("Katten sover på sofaen")).toBeInTheDocument();
    });

    it("does not show correct answer when fully correct", () => {
      const perfectResult = createScoringResult({
        score: 100,
        isFullyCorrect: true,
        correctCount: 4,
        totalExpected: 4,
      });
      const props = {
        ...baseProps,
        result: perfectResult,
        showCorrectAnswer: true,
      };
      renderWithLanguage(<SentenceFeedback {...props} />);
      // The expected sentence should not be shown as a "correct answer" reveal
      const correctAnswerLabels = screen.queryAllByText(/correct answer/i);
      expect(correctAnswerLabels.length).toBe(0);
    });
  });

  describe("Norwegian language support", () => {
    it("renders in Norwegian when language is set to no", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />, "no");
      // Should have Norwegian text
      expect(screen.getByText(/av/i)).toBeInTheDocument(); // "of" in Norwegian
    });

    it("shows Norwegian extra words label", () => {
      const resultWithExtra = createScoringResult({
        wordFeedback: [
          { word: "katten", status: "correct", expectedPosition: 0 },
          { word: "ekstra", status: "extra", expectedPosition: -1 },
        ],
      });
      renderWithLanguage(
        <SentenceFeedback {...baseProps} result={resultWithExtra} />,
        "no",
      );
      expect(screen.getByText(/ekstra ord/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = renderWithLanguage(
        <SentenceFeedback {...baseProps} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("uses role=alert for screen reader announcement", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("has aria-live for dynamic updates", () => {
      renderWithLanguage(<SentenceFeedback {...baseProps} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Progress bar", () => {
    it("renders progress bar when timerDurationMs > 0", () => {
      const { container } = renderWithLanguage(
        <SentenceFeedback {...baseProps} />,
      );
      const progressBar = container.querySelector(".animate-progress-shrink");
      expect(progressBar).toBeInTheDocument();
    });

    it("does not render progress bar when timerDurationMs is 0", () => {
      const props = { ...baseProps, timerDurationMs: 0 };
      const { container } = renderWithLanguage(<SentenceFeedback {...props} />);
      const progressBar = container.querySelector(".animate-progress-shrink");
      expect(progressBar).not.toBeInTheDocument();
    });
  });
});

describe("SentenceFeedbackCompact", () => {
  const createScoringResult = (
    overrides: Partial<SentenceScoringResult> = {},
  ): SentenceScoringResult => ({
    score: 50,
    adjustedScore: 50,
    correctCount: 2,
    totalExpected: 4,
    isFullyCorrect: false,
    orderAccuracy: 1,
    wordFeedback: [
      { word: "katten", status: "correct", expectedPosition: 0 },
      { word: "sover", status: "correct", expectedPosition: 1 },
      { word: "på", status: "missing", expectedPosition: 2 },
      { word: "sofaen", status: "missing", expectedPosition: 3 },
    ],
    ...overrides,
  });

  it("shows correct count and total", () => {
    const result = createScoringResult();
    renderWithLanguage(<SentenceFeedbackCompact result={result} />);
    expect(screen.getByText("2/4")).toBeInTheDocument();
  });

  it("renders word status dots for expected words", () => {
    const result = createScoringResult();
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots.length).toBe(4);
  });

  it("shows green dots for correct words", () => {
    const result = createScoringResult({
      wordFeedback: [
        { word: "katten", status: "correct", expectedPosition: 0 },
        { word: "sover", status: "correct", expectedPosition: 1 },
      ],
    });
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const greenDots = container.querySelectorAll(".bg-green-500");
    expect(greenDots.length).toBe(2);
  });

  it("shows amber dots for misspelled words", () => {
    const result = createScoringResult({
      wordFeedback: [
        {
          word: "katten",
          status: "misspelled",
          expectedPosition: 0,
          userWord: "katen",
        },
      ],
    });
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const amberDots = container.querySelectorAll(".bg-amber-500");
    expect(amberDots.length).toBe(1);
  });

  it("shows red dots for missing words", () => {
    const result = createScoringResult({
      wordFeedback: [
        { word: "katten", status: "missing", expectedPosition: 0 },
      ],
    });
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const redDots = container.querySelectorAll(".bg-red-500");
    expect(redDots.length).toBe(1);
  });

  it("excludes extra words from dots display", () => {
    const result = createScoringResult({
      wordFeedback: [
        { word: "katten", status: "correct", expectedPosition: 0 },
        { word: "ekstra", status: "extra", expectedPosition: -1 },
      ],
    });
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots.length).toBe(1); // Only expected words shown
  });

  it("shows green text for fully correct", () => {
    const result = createScoringResult({
      isFullyCorrect: true,
      correctCount: 4,
      totalExpected: 4,
    });
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const text = container.querySelector(".text-green-600");
    expect(text).toBeInTheDocument();
  });

  it("shows amber text for partial progress", () => {
    const result = createScoringResult({
      correctCount: 3,
      totalExpected: 4,
    });
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const text = container.querySelector(".text-amber-600");
    expect(text).toBeInTheDocument();
  });

  it("shows red text for poor progress", () => {
    const result = createScoringResult({
      correctCount: 1,
      totalExpected: 4,
    });
    const { container } = renderWithLanguage(
      <SentenceFeedbackCompact result={result} />,
    );
    const text = container.querySelector(".text-red-600");
    expect(text).toBeInTheDocument();
  });
});
