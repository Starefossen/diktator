import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { LetterTileInput } from "../LetterTileInput";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { LetterTile } from "@/lib/challenges";

describe("LetterTileInput", () => {
  const mockOnSubmit = vi.fn();

  const createTiles = (word: string): LetterTile[] => {
    const wordTiles = word.split("").map((letter, i) => ({
      id: `word-${i}`,
      letter: letter.toLowerCase(),
      isDistractor: false,
    }));

    const distractors: LetterTile[] = [
      { id: "dist-1", letter: "x", isDistractor: true },
      { id: "dist-2", letter: "z", isDistractor: true },
    ];

    return [...wordTiles, ...distractors];
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    tiles: LetterTile[],
    expectedWord: string,
    disabled = false,
  ) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <LetterTileInput
          tiles={tiles}
          expectedWord={expectedWord}
          onSubmit={mockOnSubmit}
          disabled={disabled}
        />
      </LanguageProvider>,
    );
  };

  it("renders all tiles", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    expect(screen.getByText("c")).toBeInTheDocument();
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("t")).toBeInTheDocument();
    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.getByText("z")).toBeInTheDocument();
  });

  it("renders correct number of empty slots for expected word", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    const answerArea = screen.getByRole("group", { name: /answer/i });
    const slots = answerArea.querySelectorAll("button");
    expect(slots).toHaveLength(3);
  });

  it("places tile when clicked", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    const cTile = screen.getByText("c");
    fireEvent.click(cTile);

    const answerArea = screen.getByRole("group", { name: /answer/i });
    const placedC = answerArea.querySelector("button");
    expect(placedC?.textContent).toBe("c");
  });

  it("removes tile when placed tile is clicked", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    const cTile = screen.getByText("c");
    fireEvent.click(cTile);

    const answerArea = screen.getByRole("group", { name: /answer/i });
    const placedC = answerArea.querySelector("button");
    fireEvent.click(placedC!);

    const availableArea = screen.getByRole("group", { name: /available/i });
    expect(availableArea).toHaveTextContent("c");
  });

  it("clears all tiles when clear button is clicked", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    fireEvent.click(screen.getByText("c"));
    fireEvent.click(screen.getByText("a"));

    const clearButton = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearButton);

    const answerArea = screen.getByRole("group", { name: /answer/i });
    const slots = answerArea.querySelectorAll("button");
    slots.forEach((slot) => {
      expect(slot.textContent).toBe("");
    });
  });

  it("calls onSubmit with correct answer when check is clicked", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    fireEvent.click(screen.getByText("c"));
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("t"));

    const checkButton = screen.getByRole("button", { name: /check/i });
    fireEvent.click(checkButton);

    expect(mockOnSubmit).toHaveBeenCalledWith("cat", true);
  });

  it("calls onSubmit with incorrect answer when wrong letters are used", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    fireEvent.click(screen.getByText("x"));
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("t"));

    const checkButton = screen.getByRole("button", { name: /check/i });
    fireEvent.click(checkButton);

    expect(mockOnSubmit).toHaveBeenCalledWith("xat", false);
  });

  it("disables check button when answer is incomplete", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    fireEvent.click(screen.getByText("c"));
    fireEvent.click(screen.getByText("a"));

    const checkButton = screen.getByRole("button", { name: /check/i });
    expect(checkButton).toBeDisabled();
  });

  it("disables clear button when no tiles are placed", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeDisabled();
  });

  it("disables all interactions when disabled prop is true", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat", true);

    const availableArea = screen.getByRole("group", { name: /available/i });
    const buttons = availableArea.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("has no accessibility violations", async () => {
    const tiles = createTiles("cat");
    const { container } = renderComponent(tiles, "cat");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("provides screen reader status updates", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
  });
});
