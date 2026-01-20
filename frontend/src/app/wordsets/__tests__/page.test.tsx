import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the hooks and modules before importing the component
const mockStartTest = vi.fn();
const mockStartPractice = vi.fn();

// Mock useSearchParams
const mockSearchParams = new Map<string, string>();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
  }),
}));

// Mock useAuth
vi.mock("@/contexts/OIDCAuthContext", () => ({
  useAuth: () => ({
    userData: { id: "test-user", role: "child", name: "Test Child" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock useLanguage
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useTestMode
vi.mock("@/hooks/useTestMode", () => ({
  useTestMode: () => ({
    startTest: mockStartTest,
    activeTest: null,
    testMode: null,
    showResult: false,
    processedWords: [],
    currentWordIndex: 0,
    userAnswer: "",
    onUserAnswerChange: vi.fn(),
    onSubmitAnswer: vi.fn(),
    onAudioStart: vi.fn(),
    onAudioEnd: vi.fn(),
    onNextWord: vi.fn(),
    answers: [],
    showFeedback: false,
    lastAnswerCorrect: false,
    handleExitTest: vi.fn(),
    isAudioPlaying: false,
  }),
}));

// Mock usePracticeMode
vi.mock("@/hooks/usePracticeMode", () => ({
  usePracticeMode: () => ({
    startPractice: mockStartPractice,
    practiceMode: null,
    currentWord: null,
    onNextWord: vi.fn(),
    onPracticeComplete: vi.fn(),
    handleExitPractice: vi.fn(),
  }),
}));

// Mock useWordSetsData - returns ONLY family wordsets, not curated
vi.mock("@/hooks/useWordSetsData", () => ({
  useWordSetsData: () => ({
    wordSets: [
      {
        id: "family-wordset-1",
        name: "Family Words",
        language: "no",
        words: [{ word: "test", definition: "test" }],
      },
    ],
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    createWordSet: vi.fn(),
    updateWordSet: vi.fn(),
    deleteWordSet: vi.fn(),
  }),
}));

// Mock API client
vi.mock("@/lib/api-generated", () => ({
  generatedApiClient: {
    getResults: vi.fn().mockResolvedValue({ data: [] }),
    getFamilyProgress: vi.fn().mockResolvedValue({ data: [] }),
    getWordSet: vi.fn().mockResolvedValue({
      data: {
        id: "global-wordset-enkle-setninger",
        name: "Enkle Setninger",
        language: "no",
        words: [
          { word: "hund", definition: "Et firbeint kjæledyr" },
          { word: "katt", definition: "Et firbeint kjæledyr som sier mjau" },
        ],
      },
    }),
    getCuratedWordSets: vi.fn().mockResolvedValue({
      data: [
        {
          id: "global-wordset-enkle-setninger",
          name: "Enkle Setninger",
          language: "no",
          words: [
            { word: "hund", definition: "Et firbeint kjæledyr" },
            { word: "katt", definition: "Et firbeint kjæledyr som sier mjau" },
          ],
        },
      ],
    }),
  },
}));

// Import after mocks
import WordSetsPage from "../page";

describe("WordSetsPage - URL-based test routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
  });

  it("starts test for family wordset when view=test with family wordset ID", async () => {
    // Set URL params for a family wordset
    mockSearchParams.set("view", "test");
    mockSearchParams.set("id", "family-wordset-1");
    mockSearchParams.set("mode", "flashcard");

    render(<WordSetsPage />);

    await waitFor(() => {
      expect(mockStartTest).toHaveBeenCalledWith(
        expect.objectContaining({ id: "family-wordset-1" }),
        "flashcard",
      );
    });
  });

  it("starts test for curated/global wordset when view=test with global wordset ID", async () => {
    // Set URL params for a CURATED wordset (not in family wordsets)
    mockSearchParams.set("view", "test");
    mockSearchParams.set("id", "global-wordset-enkle-setninger");
    mockSearchParams.set("mode", "flashcard");

    render(<WordSetsPage />);

    // This test currently FAILS because the page doesn't fetch curated wordsets
    // when trying to start a test via URL params
    await waitFor(
      () => {
        expect(mockStartTest).toHaveBeenCalledWith(
          expect.objectContaining({ id: "global-wordset-enkle-setninger" }),
          "flashcard",
        );
      },
      { timeout: 3000 },
    );
  });

  it("does not start test when wordset ID is not found and cannot be fetched", async () => {
    // Set URL params for a non-existent wordset
    mockSearchParams.set("view", "test");
    mockSearchParams.set("id", "non-existent-wordset");
    mockSearchParams.set("mode", "flashcard");

    render(<WordSetsPage />);

    // Wait a bit to ensure no call is made
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockStartTest).not.toHaveBeenCalled();
  });
});
