import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { WordBankInput } from "../WordBankInput";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { WordBankItem } from "@/lib/challenges";

describe("WordBankInput", () => {
  const mockOnSubmit = vi.fn();

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    items: WordBankItem[],
    expectedWordCount: number,
    disabled = false,
  ) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <WordBankInput
          items={items}
          expectedWordCount={expectedWordCount}
          onSubmit={mockOnSubmit}
          disabled={disabled}
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

  it("clears all words when clear button is clicked", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    fireEvent.click(screen.getByText("jeg"));
    fireEvent.click(screen.getByText("liker"));

    const clearButton = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearButton);

    // Should show 2 empty placeholder slots again
    const sentenceArea = screen.getByRole("group", { name: /sentence/i });
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

  it("calls onSubmit when check is clicked", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    fireEvent.click(screen.getByText("jeg"));
    fireEvent.click(screen.getByText("liker"));

    const checkButton = screen.getByRole("button", { name: /check/i });
    fireEvent.click(checkButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(true, "jeg liker");
  });

  it("disables check button when no words selected", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    const checkButton = screen.getByRole("button", { name: /check/i });
    expect(checkButton).toBeDisabled();
  });

  it("disables clear button when no words selected", () => {
    const items = createItems("jeg liker");
    renderComponent(items, 2);

    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeDisabled();
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
    renderComponent(items, 3);

    fireEvent.click(screen.getByText("liker"));
    fireEvent.click(screen.getByText("jeg"));
    fireEvent.click(screen.getByText("deg"));

    const checkButton = screen.getByRole("button", { name: /check/i });
    fireEvent.click(checkButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(true, "liker jeg deg");
  });
});
