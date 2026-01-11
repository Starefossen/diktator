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
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }) => (isOpen ? <div data-testid="base-modal">{children}</div> : null),
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
  name: "Spanish Words",
  language: "en",
  familyId: "family-1",
  createdBy: "user-1",
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockWordSetWithoutTranslations: WordSet = {
  id: "2",
  name: "Dictation Practice",
  language: "en",
  familyId: "family-1",
  createdBy: "user-1",
  words: [{ word: "practice" }, { word: "spelling" }],
  testConfiguration: {
    defaultMode: "dictation",
    autoPlayAudio: true,
    maxAttempts: 999,
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

  it("shows all three mode buttons", () => {
    renderModal(mockWordSetWithTranslations);
    expect(screen.getByText(/standard/i)).toBeInTheDocument();
    expect(screen.getByText(/dictation/i)).toBeInTheDocument();
    expect(screen.getByText(/translation/i)).toBeInTheDocument();
  });

  it("marks default mode as recommended", () => {
    renderModal(mockWordSetWithTranslations);
    const translationButton = screen
      .getByText(/translation/i)
      .closest("button");
    expect(translationButton?.textContent).toContain("Recommended");
  });

  it("calls onSelectMode with standard when standard button clicked", () => {
    renderModal(mockWordSetWithTranslations);
    const standardButton = screen.getByText(/^standard/i);
    fireEvent.click(standardButton);
    expect(mockOnSelectMode).toHaveBeenCalledWith("standard");
  });

  it("calls onSelectMode with dictation when dictation button clicked", async () => {
    renderModal(mockWordSetWithTranslations);
    // Click dictation to expand the options panel
    const dictationButton = screen.getByText(/dictation/i);
    fireEvent.click(dictationButton);

    // Wait for expansion and find the start button (text is "Start" from translations)
    // The button is inside the expanded dictation section
    const buttons = screen.getAllByRole("button");
    const startButton = buttons.find(
      (btn) =>
        btn.textContent?.toLowerCase().includes("start") &&
        !btn.textContent?.toLowerCase().includes("standard"),
    );

    expect(startButton).toBeDefined();
    if (startButton) fireEvent.click(startButton);

    expect(mockOnSelectMode).toHaveBeenCalledWith("dictation", "auto", false);
  });

  it("calls onSelectMode with translation when translation button clicked", () => {
    renderModal(mockWordSetWithTranslations);
    const translationButton = screen.getByText(/translation/i);
    fireEvent.click(translationButton);
    expect(mockOnSelectMode).toHaveBeenCalledWith("translation");
  });

  it("disables translation button when wordset has no translations", () => {
    renderModal(mockWordSetWithoutTranslations);
    const buttons = screen.getAllByText(/translation/i);
    const translationButton = buttons
      .find((el) => el.closest("button"))
      ?.closest("button");
    expect(translationButton).toBeDisabled();
  });

  it("enables translation button when wordset has translations", () => {
    renderModal(mockWordSetWithTranslations);
    const translationButton = screen
      .getByText(/translation/i)
      .closest("button");
    expect(translationButton).not.toBeDisabled();
  });

  it("shows recommended badge for dictation mode when it is default", () => {
    renderModal(mockWordSetWithoutTranslations);
    const dictationButton = screen.getByText(/dictation/i).closest("button");
    expect(dictationButton?.textContent).toContain("Recommended");
  });

  it("calls onClose when cancel button clicked", () => {
    renderModal(mockWordSetWithTranslations);
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("shows mode descriptions", () => {
    renderModal(mockWordSetWithTranslations);
    expect(
      screen.getByText(/spell words after hearing them/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/listen and type the spelling/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/translate words between languages/i),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderModal(mockWordSetWithTranslations);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
