import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "vitest-axe";
import TestResultsList from "../TestResultsList";
import { TestResult, WordSet } from "@/types";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Mock useAuth to avoid requiring AuthProvider
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    userData: { role: "parent" },
    user: null,
    loading: false,
    error: null,
  }),
}));

const mockWordSets: WordSet[] = [
  {
    id: "ws-1",
    name: "Animals",
    language: "en",
    familyId: "family-1",
    createdBy: "user-1",
    words: [{ word: "cat" }, { word: "dog" }, { word: "bird" }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ws-2",
    name: "Colors",
    language: "en",
    familyId: "family-1",
    createdBy: "user-1",
    words: [{ word: "red" }, { word: "blue" }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const createMockResult = (overrides: Partial<TestResult> = {}): TestResult => ({
  id: "result-1",
  wordSetId: "ws-1",
  userId: "user-1",
  score: 80,
  totalWords: 5,
  correctWords: 4,
  mode: "standard",
  words: [
    {
      word: "cat",
      userAnswers: ["cat"],
      attempts: 1,
      correct: true,
      timeSpent: 3,
      finalAnswer: "cat",
    },
    {
      word: "dog",
      userAnswers: ["dog"],
      attempts: 1,
      correct: true,
      timeSpent: 4,
      finalAnswer: "dog",
    },
    {
      word: "bird",
      userAnswers: ["brd", "bird"],
      attempts: 2,
      correct: true,
      timeSpent: 8,
      finalAnswer: "bird",
    },
    {
      word: "fish",
      userAnswers: ["fsh"],
      attempts: 1,
      correct: false,
      timeSpent: 5,
      finalAnswer: "fsh",
    },
    {
      word: "elephant",
      userAnswers: ["elefant"],
      attempts: 1,
      correct: false,
      timeSpent: 6,
      finalAnswer: "elefant",
    },
  ],
  timeSpent: 120,
  completedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("TestResultsList", () => {
  const renderComponent = (
    results: TestResult[],
    options?: { showUserName?: boolean; userName?: string },
  ) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <TestResultsList
          results={results}
          wordSets={mockWordSets}
          showUserName={options?.showUserName}
          userName={options?.userName}
        />
      </LanguageProvider>,
    );
  };

  describe("empty state", () => {
    it("shows friendly empty state message when no results", () => {
      renderComponent([]);
      expect(
        screen.getByText(/No results here yet — time to take a test!/),
      ).toBeInTheDocument();
    });

    it("shows user-specific empty message when showUserName is true", () => {
      renderComponent([], { showUserName: true, userName: "Sophie" });
      expect(
        screen.getByText(/Sophie.*hasn't completed any tests yet/),
      ).toBeInTheDocument();
    });

    it("shows start message for current user empty state", () => {
      renderComponent([]);
      expect(
        screen.getByText(
          /Start taking spelling tests to see your results here!/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("results display", () => {
    it("displays word set name", () => {
      renderComponent([createMockResult()]);
      expect(screen.getByText("Animals")).toBeInTheDocument();
    });

    it("displays score percentage", () => {
      renderComponent([createMockResult({ score: 85 })]);
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });

    it("displays correct/total word count", () => {
      renderComponent([createMockResult()]);
      expect(screen.getByText("4/5")).toBeInTheDocument();
    });

    it("displays formatted time", () => {
      renderComponent([createMockResult({ timeSpent: 120 })]);
      expect(screen.getByText("2:00")).toBeInTheDocument();
    });
  });

  describe("performance labels", () => {
    it("shows Excellent label for scores >= 90", () => {
      renderComponent([createMockResult({ score: 95 })]);
      expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    });

    it("shows Good label for scores 70-89", () => {
      renderComponent([createMockResult({ score: 80 })]);
      expect(screen.getByText(/Good/)).toBeInTheDocument();
    });

    it("shows Needs Work label for scores < 70", () => {
      renderComponent([createMockResult({ score: 50 })]);
      expect(screen.getByText(/Needs Work/)).toBeInTheDocument();
    });
  });

  describe("word details", () => {
    it("shows words needing attention section", () => {
      renderComponent([createMockResult()]);
      expect(screen.getByText(/Words needing attention/)).toBeInTheDocument();
    });

    it("displays incorrect words in needing attention section", () => {
      renderComponent([createMockResult()]);
      expect(screen.getByText("fish")).toBeInTheDocument();
      expect(screen.getByText("elephant")).toBeInTheDocument();
    });

    it("shows words with multiple attempts in needing attention section", () => {
      renderComponent([createMockResult()]);
      const wordItems = screen.getAllByText("bird");
      expect(wordItems.length).toBeGreaterThanOrEqual(1);
    });

    it("shows user answers for incorrect words", () => {
      renderComponent([createMockResult()]);
      expect(screen.getByText("fsh")).toBeInTheDocument();
      expect(screen.getByText("elefant")).toBeInTheDocument();
    });
  });

  describe("multiple results", () => {
    it("renders multiple results", () => {
      const results = [
        createMockResult({ id: "r1", score: 90 }),
        createMockResult({ id: "r2", wordSetId: "ws-2", score: 70 }),
      ];
      renderComponent(results);
      expect(screen.getByText("Animals")).toBeInTheDocument();
      expect(screen.getByText("Colors")).toBeInTheDocument();
    });
  });

  describe("user name display", () => {
    it("shows user name when showUserName is true", () => {
      renderComponent([createMockResult()], {
        showUserName: true,
        userName: "Magnus",
      });
      expect(screen.getByText("Magnus")).toBeInTheDocument();
    });

    it("hides user name when showUserName is false", () => {
      renderComponent([createMockResult()], {
        showUserName: false,
        userName: "Magnus",
      });
      expect(screen.queryByText("Magnus")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has no accessibility violations with results", async () => {
      const { container } = renderComponent([createMockResult()]);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations with empty state", async () => {
      const { container } = renderComponent([]);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
