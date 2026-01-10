import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { TestResultsView, getScoreMessageKey } from "../TestResultsView";
import { WordSet, TestAnswer } from "@/types";
import { LanguageProvider } from "@/contexts/LanguageContext";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockWordSet: WordSet = {
  id: "1",
  name: "Test Word Set",
  language: "en",
  familyId: "family-1",
  createdBy: "user-1",
  words: [
    { word: "hello" },
    { word: "world" },
    { word: "spelling" },
    { word: "test" },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createMockAnswers = (correctCount: number): TestAnswer[] => {
  const answers: TestAnswer[] = [];
  for (let i = 0; i < 4; i++) {
    const isCorrect = i < correctCount;
    answers.push({
      word: mockWordSet.words[i].word,
      userAnswers: [isCorrect ? mockWordSet.words[i].word : "wrong"],
      isCorrect,
      timeSpent: 5,
      attempts: 1,
      finalAnswer: isCorrect ? mockWordSet.words[i].word : "wrong",
    });
  }
  return answers;
};

describe("TestResultsView", () => {
  const mockOnRestart = vi.fn();
  const mockOnExit = vi.fn();
  const mockOnPlayAudio = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      userData: { role: "child" },
    });
  });

  const renderComponent = (
    answers: TestAnswer[],
    role: "parent" | "child" = "child",
  ) => {
    mockUseAuth.mockReturnValue({
      userData: { role },
    });
    return render(
      <LanguageProvider initialLanguage="en">
        <TestResultsView
          activeTest={mockWordSet}
          answers={answers}
          onRestart={mockOnRestart}
          onExit={mockOnExit}
          onPlayAudio={mockOnPlayAudio}
        />
      </LanguageProvider>,
    );
  };

  describe("getScoreMessageKey", () => {
    it("returns excellent key for scores >= 90", () => {
      expect(getScoreMessageKey(90)).toBe("test.results.excellent");
      expect(getScoreMessageKey(95)).toBe("test.results.excellent");
      expect(getScoreMessageKey(100)).toBe("test.results.excellent");
    });

    it("returns great key for scores 80-89", () => {
      expect(getScoreMessageKey(80)).toBe("test.results.great");
      expect(getScoreMessageKey(85)).toBe("test.results.great");
      expect(getScoreMessageKey(89)).toBe("test.results.great");
    });

    it("returns good key for scores 70-79", () => {
      expect(getScoreMessageKey(70)).toBe("test.results.good");
      expect(getScoreMessageKey(75)).toBe("test.results.good");
      expect(getScoreMessageKey(79)).toBe("test.results.good");
    });

    it("returns keepGoing key for scores < 70", () => {
      expect(getScoreMessageKey(0)).toBe("test.results.keepGoing");
      expect(getScoreMessageKey(50)).toBe("test.results.keepGoing");
      expect(getScoreMessageKey(69)).toBe("test.results.keepGoing");
    });
  });

  describe("rendering", () => {
    it("renders the test complete heading", () => {
      renderComponent(createMockAnswers(4));
      expect(screen.getByText(/Test Complete/i)).toBeInTheDocument();
    });

    it("renders the word set name", () => {
      renderComponent(createMockAnswers(4));
      expect(screen.getByText("Test Word Set")).toBeInTheDocument();
    });

    it("renders score percentage", () => {
      const answers = createMockAnswers(4);
      renderComponent(answers);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("renders correct count out of total", () => {
      const answers = createMockAnswers(3);
      renderComponent(answers);
      expect(screen.getByText("3/4")).toBeInTheDocument();
    });
  });

  describe("graduated messages", () => {
    it("shows excellent message for 100% score", () => {
      renderComponent(createMockAnswers(4));
      expect(
        screen.getByText(/Amazing! 100% correct! You're a spelling star!/),
      ).toBeInTheDocument();
    });

    it("shows good message for 75% score", () => {
      renderComponent(createMockAnswers(3));
      expect(
        screen.getByText(/Good effort! 75% — practice makes perfect!/),
      ).toBeInTheDocument();
    });

    it("shows keepGoing message for 25% score", () => {
      renderComponent(createMockAnswers(1));
      expect(
        screen.getByText(/Keep going! 25% — every word you learn is progress!/),
      ).toBeInTheDocument();
    });

    it("shows keepGoing message for 0% score", () => {
      renderComponent(createMockAnswers(0));
      expect(
        screen.getByText(/Keep going! 0% — every word you learn is progress!/),
      ).toBeInTheDocument();
    });
  });

  describe("parent view", () => {
    it("shows score breakdown for parents", () => {
      renderComponent(createMockAnswers(4), "parent");
      expect(screen.getByText(/Score Breakdown/i)).toBeInTheDocument();
    });

    it("hides score breakdown for children", () => {
      renderComponent(createMockAnswers(4), "child");
      expect(screen.queryByText(/Score Breakdown/i)).not.toBeInTheDocument();
    });
  });

  describe("answer review", () => {
    it("renders all answers in review section", () => {
      renderComponent(createMockAnswers(2));
      expect(screen.getByText("hello")).toBeInTheDocument();
      expect(screen.getByText("world")).toBeInTheDocument();
      expect(screen.getByText("spelling")).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    it('shows "Your answer" for incorrect answers', () => {
      renderComponent(createMockAnswers(0));
      const yourAnswerTexts = screen.getAllByText(/Your answer/);
      expect(yourAnswerTexts.length).toBe(4);
    });
  });

  describe("interactions", () => {
    it("calls onRestart when restart button clicked", () => {
      renderComponent(createMockAnswers(4));
      const restartButton = screen.getByText(/Restart Test/i);
      fireEvent.click(restartButton);
      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });

    it("calls onExit when back button clicked", () => {
      renderComponent(createMockAnswers(4));
      const backButton = screen.getByText(/Back to Word Sets/i);
      fireEvent.click(backButton);
      expect(mockOnExit).toHaveBeenCalledTimes(1);
    });

    it("calls onPlayAudio with word when audio button clicked", () => {
      renderComponent(createMockAnswers(4));
      const audioButtons = screen.getAllByRole("button", {
        name: /Play pronunciation/,
      });
      fireEvent.click(audioButtons[0]);
      expect(mockOnPlayAudio).toHaveBeenCalledWith("hello");
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = renderComponent(createMockAnswers(4));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations with incorrect answers", async () => {
      const { container } = renderComponent(createMockAnswers(0));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("audio buttons have aria-labels", () => {
      renderComponent(createMockAnswers(4));
      const audioButtons = screen.getAllByRole("button", {
        name: /Play pronunciation/,
      });
      expect(audioButtons.length).toBe(4);
    });
  });
});
