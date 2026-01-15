import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { WordBankInput } from "../WordBankInput";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { WordBankItem } from "@/lib/challenges";
import type { NavigationActions } from "@/lib/testEngine/types";

describe("WordBankInput", () => {
  const mockOnSubmit = vi.fn();
  const mockOnClearRef = vi.fn();
  const mockOnCanClearChange = vi.fn();

  const createItems = (sentence: string): WordBankItem[] => {
    const words = sentence.split(" ");
    const sentenceItems = words.map((word, i) => ({
      id: `word-${i}`,
      word: word.toLowerCase(),
      isDistractor: false,
    }));

    const distractors: WordBankItem[] = [
      { id: "dist-1", word: "hund", isDistractor: true },
      { id: "dist-2", word: "katt", isDistractor: true },
    ];

    return [...sentenceItems, ...distractors];
  };

  const createNavigation = (): NavigationActions => ({
    onCancel: vi.fn(),
    onPlayAudio: vi.fn(),
    onSubmit: vi.fn(),
    onNext: vi.fn(),
    showFeedback: false,
    isLastWord: false,
    canSubmit: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    items: WordBankItem[],
    expectedWordCount: number,
    disabled = false,
    navigation?: NavigationActions,
    expectedAnswer = "jeg liker",
  ) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <WordBankInput
          items={items}
          expectedWordCount={expectedWordCount}
          expectedAnswer={expectedAnswer}
          onSubmit={mockOnSubmit}
          disabled={disabled}
          navigation={navigation}
          onClearRef={mockOnClearRef}
          onCanClearChange={mockOnCanClearChange}
        />
      </LanguageProvider>,
    );
  };

  it("renders all word items", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    expect(screen.getByText("jeg")).toBeInTheDocument();
    expect(screen.getByText("liker")).toBeInTheDocument();
    expect(screen.getByText("hund")).toBeInTheDocument();
    expect(screen.getByText("katt")).toBeInTheDocument();
  });

  it("shows placeholder slots when no words selected", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    // Should show 2 empty placeholder slots (dashes)
    const sentenceArea = screen.getByRole("group", { name: /sentence/i });
    const placeholders = sentenceArea.querySelectorAll("span");
    expect(placeholders).toHaveLength(2);
  });

  it("selects word when clicked", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    const jegButton = screen.getByText("jeg");
    fireEvent.click(jegButton);

    const sentenceArea = screen.getByRole("group", { name: /sentence/i });
    expect(sentenceArea).toHaveTextContent("jeg");
  });

  it("removes word when selected word is clicked", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    fireEvent.click(screen.getByText("jeg"));

    const sentenceArea = screen.getByRole("group", { name: /sentence/i });
    const selectedJeg = sentenceArea.querySelector("button");
    fireEvent.click(selectedJeg!);

    const availableArea = screen.getByRole("group", { name: /available/i });
    expect(availableArea).toHaveTextContent("jeg");
  });

  it("clears all words when clear function is called", () => {
    const items = createItems("jeg liker");
    let clearFn: (() => void) | null = null;
    const onClearRef = (fn: () => void) => {
      clearFn = fn;
    };

    render(
      <LanguageProvider initialLanguage="en">
        <WordBankInput
          items={items}
          expectedWordCount={2}
          onSubmit={mockOnSubmit}
          onClearRef={onClearRef}
          onCanClearChange={mockOnCanClearChange}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText("jeg"));

    // Verify word was selected
    let sentenceArea = screen.getByRole("group", { name: /sentence/i });
    expect(sentenceArea.querySelectorAll("button")).toHaveLength(1);

    // Call the clear function exposed via ref
    act(() => {
      clearFn!();
    });

    // Should show 2 empty placeholder slots again
    sentenceArea = screen.getByRole("group", { name: /sentence/i });
    const placeholders = sentenceArea.querySelectorAll("span");
    expect(placeholders).toHaveLength(2);
  });

  it("shows correct number of slots for expected words", () => {
    const items = createItems("jeg liker deg");
    renderComponent(items, 3);

    // Should show 3 empty placeholder slots
    const sentenceArea = screen.getByRole("group", { name: /sentence/i });
    const placeholders = sentenceArea.querySelectorAll("span");
    expect(placeholders).toHaveLength(3);

    // After selecting one word, should show 1 button and 2 placeholders
    fireEvent.click(screen.getByText("jeg"));
    const buttons = sentenceArea.querySelectorAll("button");
    const remainingPlaceholders = sentenceArea.querySelectorAll("span");
    expect(buttons).toHaveLength(1);
    expect(remainingPlaceholders).toHaveLength(2);
  });

  it("auto-submits when answer is complete with navigation prop", () => {
    const items = createItems("jeg liker");
    const navigation = createNavigation();
    renderComponent(items, 2, false, navigation);

    fireEvent.click(screen.getByText("jeg"));
    fireEvent.click(screen.getByText("liker"));

    // With navigation prop, auto-submits when complete
    expect(mockOnSubmit).toHaveBeenCalledWith("jeg liker", true);
  });

  it("notifies parent when canClear state changes", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    // Initially canClear should be false
    expect(mockOnCanClearChange).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByText("jeg"));

    // After selecting a word, canClear should be true
    expect(mockOnCanClearChange).toHaveBeenLastCalledWith(true);
  });

  it("exposes clear function via onClearRef", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    // onClearRef should have been called with a function
    expect(mockOnClearRef).toHaveBeenCalled();
    expect(typeof mockOnClearRef.mock.calls[0][0]).toBe("function");
  });

  it("disables all interactions when disabled prop is true", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2, true);

    const availableArea = screen.getByRole("group", { name: /available/i });
    const buttons = availableArea.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("has no accessibility violations", async () => {
    const items = createItems("jeg liker");
    const { container } = renderComponent(items, 2);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("provides screen reader status updates", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
  });

  it("maintains word order when building sentence", () => {
    const items = createItems("jeg liker deg");
    const navigation = createNavigation();
    renderComponent(items, 3, false, navigation, "liker jeg deg");

    fireEvent.click(screen.getByText("liker"));
    fireEvent.click(screen.getByText("jeg"));
    fireEvent.click(screen.getByText("deg"));

    // With navigation prop, auto-submits when complete
    expect(mockOnSubmit).toHaveBeenCalledWith("liker jeg deg", true);
  });
});
