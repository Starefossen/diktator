import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StavleCompanion } from "../StavleCompanion";
import type { WordSet, TestResult, FamilyProgress } from "@/types";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
  }),
}));

vi.mock("@/lib/i18n", () => ({
  interpolateMessage: (template: string) => template,
}));

const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockWordSet: WordSet = {
  id: "ws1",
  name: "Test Set",
  language: "no",
  words: [{ word: "test", definition: "" }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createTestResult = (score: number, daysAgo: number = 0): TestResult => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `tr-${Math.random()}`,
    wordSetId: "ws1",
    userId: "user1",
    score,
    totalWords: 10,
    correctWords: Math.round(score / 10),
    completedAt: date.toISOString(),
    testMode: "standard",
  };
};

describe("StavleCompanion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      userData: { role: "child", id: "user1", email: "child@test.com" },
    });
  });

  // Helper to find text that may be wrapped with quotes
  const findCompanionText = (key: string) =>
    screen.getByText((content) => content.includes(key));

  describe("Child user states", () => {
    it("shows welcome message for new user with no word sets", async () => {
      render(
        <StavleCompanion wordSets={[]} userResults={[]} familyProgress={[]} />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.child.welcome"),
        ).toBeInTheDocument();
      });
    });

    it("shows ready to start message when has word sets but no results", async () => {
      render(
        <StavleCompanion
          wordSets={[mockWordSet]}
          userResults={[]}
          familyProgress={[]}
        />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.child.readyToStart"),
        ).toBeInTheDocument();
      });
    });

    it("shows doing great message for high recent scores", async () => {
      const results = [
        createTestResult(95, 1),
        createTestResult(92, 2),
        createTestResult(98, 3),
      ];

      render(
        <StavleCompanion
          wordSets={[mockWordSet]}
          userResults={results}
          familyProgress={[]}
        />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.child.doingGreat"),
        ).toBeInTheDocument();
      });
    });

    it("shows good progress message for moderate scores", async () => {
      const results = [
        createTestResult(75, 1),
        createTestResult(80, 2),
        createTestResult(78, 3),
      ];

      render(
        <StavleCompanion
          wordSets={[mockWordSet]}
          userResults={results}
          familyProgress={[]}
        />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.child.goodProgress"),
        ).toBeInTheDocument();
      });
    });

    it("shows come back message when no recent results", async () => {
      const results = [createTestResult(85, 10)];

      render(
        <StavleCompanion
          wordSets={[mockWordSet]}
          userResults={results}
          familyProgress={[]}
        />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.child.comeBack"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Parent user states", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        userData: { role: "parent", id: "parent1", email: "parent@test.com" },
      });
    });

    it("shows create word sets message for parent with no sets", async () => {
      render(
        <StavleCompanion wordSets={[]} userResults={[]} familyProgress={[]} />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.parent.noWordSets"),
        ).toBeInTheDocument();
      });
    });

    it("shows waiting for children message when sets exist but no progress", async () => {
      render(
        <StavleCompanion
          wordSets={[mockWordSet]}
          userResults={[]}
          familyProgress={[]}
        />,
      );

      await waitFor(() => {
        expect(
          findCompanionText(
            "stavle.companion.wordsets.parent.waitingForChildren",
          ),
        ).toBeInTheDocument();
      });
    });

    it("shows family excelling message when average score is high", async () => {
      const progress: FamilyProgress[] = [
        {
          userId: "child1",
          userName: "Child 1",
          totalTests: 5,
          averageScore: 95,
          recentTests: [],
        },
      ];

      render(
        <StavleCompanion
          wordSets={[mockWordSet]}
          userResults={[]}
          familyProgress={progress}
        />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.parent.familyExcelling"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Dismiss behavior", () => {
    it("can be dismissed by clicking the close button", async () => {
      render(
        <StavleCompanion wordSets={[]} userResults={[]} familyProgress={[]} />,
      );

      await waitFor(() => {
        expect(
          findCompanionText("stavle.companion.wordsets.child.welcome"),
        ).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText("stavle.companion.dismiss");
      fireEvent.click(dismissButton);

      expect(
        screen.queryByText((content) =>
          content.includes("stavle.companion.wordsets.child.welcome"),
        ),
      ).not.toBeInTheDocument();
    });
  });
});
