import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { ModeSelectionModal } from "../ModeSelectionModal";
import { WordSet } from "@/types";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Mock useAuth to avoid requiring AuthProvider
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the BaseModal components
vi.mock("../modals/BaseModal", () => ({
  BaseModal: ({
    isOpen,
    onClose: _onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="base-modal" aria-label={title}>
        {children}
      </div>
    ) : null,
  ModalContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-content">{children}</div>
  ),
  ModalActions: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-actions">{children}</div>
  ),
  ModalButton: ({
    onClick,
    children,
    ...props
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const mockWordSetWithTranslations: WordSet = {
  id: "1",
  name: "Norwegian Words",
  language: "no",
  familyId: "family-1",
  createdBy: "user-1",
  words: [
    {
      word: "hei",
      translations: [{ language: "en", text: "hello" }],
    },
    {
      word: "farvel",
      translations: [{ language: "en", text: "goodbye" }],
    },
  ],
  testConfiguration: {
    defaultMode: "translation",
    targetLanguage: "en",
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

const mockWordSetWithoutTranslations: WordSet = {
  id: "2",
  name: "Spelling Practice",
  language: "no",
  familyId: "family-1",
  createdBy: "user-1",
  words: [{ word: "skole" }, { word: "lese" }],
  testConfiguration: {
    defaultMode: "keyboard",
    autoPlayAudio: true,
    maxAttempts: 3,
    enableAutocorrect: false,
    showCorrectAnswer: true,
    autoAdvance: false,
    shuffleWords: false,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockWordSetWithSentences: WordSet = {
  id: "3",
  name: "Sentence Practice",
  language: "no",
  familyId: "family-1",
  createdBy: "user-1",
  words: [{ word: "Jeg liker å lese bøker." }],
  sentences: [
    {
      sentence: "Jeg liker å lese bøker.",
      difficulty: "beginner",
    },
  ],
  testConfiguration: {
    defaultMode: "wordBank",
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

describe("ModeSelectionModal", () => {
  const mockOnSelectMode = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      userData: { role: "child", birthYear: 2015 },
    });
  });

  const renderModal = (wordSet: WordSet | null, isOpen = true) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <ModeSelectionModal
          isOpen={isOpen}
          wordSet={wordSet}
          onClose={mockOnClose}
          onSelectMode={mockOnSelectMode}
        />
      </LanguageProvider>,
    );
  };

  it("renders when open with wordset", () => {
    renderModal(mockWordSetWithTranslations);
    expect(screen.getByTestId("base-modal")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderModal(mockWordSetWithTranslations, false);
    expect(screen.queryByTestId("base-modal")).not.toBeInTheDocument();
  });

  it("does not render when wordset is null", () => {
    renderModal(null, true);
    expect(screen.queryByTestId("base-modal")).not.toBeInTheDocument();
  });

  it("shows all seven mode tiles", () => {
    renderModal(mockWordSetWithTranslations);
    expect(screen.getByText(/Build It/i)).toBeInTheDocument();
    expect(screen.getByText(/Pick Words/i)).toBeInTheDocument();
    expect(screen.getByText(/Type It/i)).toBeInTheDocument();
    expect(screen.getByText(/Fill the Gap/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Look/i)).toBeInTheDocument();
    expect(screen.getByText(/Memory Spell/i)).toBeInTheDocument();
    expect(screen.getByText(/Switch Languages/i)).toBeInTheDocument();
  });

  it("calls onSelectMode with keyboard when Type It clicked", () => {
    renderModal(mockWordSetWithTranslations);
    const keyboardButton = screen.getByText(/Type It/i).closest("button");
    if (keyboardButton) fireEvent.click(keyboardButton);
    expect(mockOnSelectMode).toHaveBeenCalledWith("keyboard");
  });

  it("calls onSelectMode with flashcard when Quick Look clicked", () => {
    renderModal(mockWordSetWithTranslations);
    const flashcardButton = screen.getByText(/Quick Look/i).closest("button");
    if (flashcardButton) fireEvent.click(flashcardButton);
    expect(mockOnSelectMode).toHaveBeenCalledWith("flashcard");
  });

  it("calls onSelectMode with translation when Switch Languages clicked", () => {
    renderModal(mockWordSetWithTranslations);
    const translationButton = screen
      .getByText(/Switch Languages/i)
      .closest("button");
    if (translationButton) fireEvent.click(translationButton);
    expect(mockOnSelectMode).toHaveBeenCalledWith("translation");
  });

  it("disables translation button when wordset has no translations", () => {
    renderModal(mockWordSetWithoutTranslations);
    const translationButton = screen
      .getByText(/Switch Languages/i)
      .closest("button");
    expect(translationButton).toBeDisabled();
  });

  it("enables translation button when wordset has translations", () => {
    renderModal(mockWordSetWithTranslations);
    const translationButton = screen
      .getByText(/Switch Languages/i)
      .closest("button");
    expect(translationButton).not.toBeDisabled();
  });

  it("disables wordBank button when wordset has no sentences", () => {
    renderModal(mockWordSetWithoutTranslations);
    const wordBankButton = screen.getByText(/Pick Words/i).closest("button");
    expect(wordBankButton).toBeDisabled();
  });

  it("enables wordBank button when wordset has sentences", () => {
    renderModal(mockWordSetWithSentences);
    const wordBankButton = screen.getByText(/Pick Words/i).closest("button");
    expect(wordBankButton).not.toBeDisabled();
  });

  it("disables letterTiles for sentence-only wordsets", () => {
    // Create a word set with only sentences (no single words)
    const sentenceOnlyWordSet: WordSet = {
      ...mockWordSetWithSentences,
      words: [{ word: "Jeg liker å lese bøker." }], // This is a sentence
    };
    renderModal(sentenceOnlyWordSet);
    const letterTilesButton = screen.getByText(/Build It/i).closest("button");
    expect(letterTilesButton).toBeDisabled();
  });

  it("calls onClose when cancel button clicked", () => {
    renderModal(mockWordSetWithTranslations);
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("shows mode descriptions", () => {
    renderModal(mockWordSetWithTranslations);
    expect(screen.getByText(/Arrange scrambled letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap words to build/i)).toBeInTheDocument();
    expect(screen.getByText(/Type the full spelling/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete the blanks/i)).toBeInTheDocument();
    expect(screen.getByText(/See, countdown, self-check/i)).toBeInTheDocument();
    expect(screen.getByText(/Memorize then type/i)).toBeInTheDocument();
    expect(screen.getByText(/Type in other language/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderModal(mockWordSetWithTranslations);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("does not call onSelectMode for disabled modes", () => {
    renderModal(mockWordSetWithoutTranslations);
    const translationButton = screen
      .getByText(/Switch Languages/i)
      .closest("button");
    if (translationButton) fireEvent.click(translationButton);
    expect(mockOnSelectMode).not.toHaveBeenCalled();
  });

  it("always enables keyboard, flashcard, and lookCoverWrite modes", () => {
    renderModal(mockWordSetWithoutTranslations);
    const keyboardButton = screen.getByText(/Type It/i).closest("button");
    const flashcardButton = screen.getByText(/Quick Look/i).closest("button");
    const lookCoverWriteButton = screen
      .getByText(/Memory Spell/i)
      .closest("button");

    expect(keyboardButton).not.toBeDisabled();
    expect(flashcardButton).not.toBeDisabled();
    expect(lookCoverWriteButton).not.toBeDisabled();
  });
});
