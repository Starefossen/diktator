import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { LetterTileInput } from "../LetterTileInput";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { LetterTile } from "@/lib/challenges";
import type { NavigationActions } from "@/lib/testEngine/types";

describe("LetterTileInput", () => {
  const mockOnSubmit = vi.fn();
  const mockOnClearRef = vi.fn();
  const mockOnCanClearChange = vi.fn();

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

  // Mock navigation object for auto-submit tests
  const mockNavigation: NavigationActions = {
    onCancel: vi.fn(),
    onPlayAudio: vi.fn(),
    onSubmit: vi.fn(),
    onNext: vi.fn(),
    showFeedback: false,
    isLastWord: false,
    canSubmit: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    tiles: LetterTile[],
    expectedWord: string,
    disabled = false,
    navigation?: NavigationActions,
  ) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <LetterTileInput
          tiles={tiles}
          expectedWord={expectedWord}
          onSubmit={mockOnSubmit}
          disabled={disabled}
          onClearRef={mockOnClearRef}
          onCanClearChange={mockOnCanClearChange}
          navigation={navigation}
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

  it("clears all tiles when clear function is called", async () => {
    const tiles = createTiles("cat");
    let clearFn: (() => void) | null = null;
    const onClearRef = (fn: () => void) => {
      clearFn = fn;
    };

    render(
      <LanguageProvider initialLanguage="en">
        <LetterTileInput
          tiles={tiles}
          expectedWord="cat"
          onSubmit={mockOnSubmit}
          onClearRef={onClearRef}
          onCanClearChange={mockOnCanClearChange}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText("c"));
    fireEvent.click(screen.getByText("a"));

    // Call the clear function exposed via ref (wrapped in act for state update)
    await act(async () => {
      clearFn!();
    });

    const answerArea = screen.getByRole("group", { name: /answer/i });
    const slots = answerArea.querySelectorAll("button");
    slots.forEach((slot) => {
      expect(slot.textContent).toBe("");
    });
  });

  it("auto-submits when answer is complete", () => {
    const tiles = createTiles("cat");
    // Pass navigation prop to enable auto-submit behavior
    renderComponent(tiles, "cat", false, mockNavigation);

    fireEvent.click(screen.getByText("c"));
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("t"));

    // Auto-submits when complete (with navigation prop)
    expect(mockOnSubmit).toHaveBeenCalledWith("cat", true);
  });

  it("auto-submits with incorrect answer when wrong letters are used", () => {
    const tiles = createTiles("cat");
    // Pass navigation prop to enable auto-submit behavior
    renderComponent(tiles, "cat", false, mockNavigation);

    fireEvent.click(screen.getByText("x"));
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("t"));

    // Auto-submits when complete (with navigation prop)
    expect(mockOnSubmit).toHaveBeenCalledWith("xat", false);
  });

  it("notifies parent when canClear state changes", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    // Initially canClear should be false
    expect(mockOnCanClearChange).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByText("c"));

    // After placing a tile, canClear should be true
    expect(mockOnCanClearChange).toHaveBeenLastCalledWith(true);
  });

  it("exposes clear function via onClearRef", () => {
    const tiles = createTiles("cat");
    renderComponent(tiles, "cat");

    // onClearRef should have been called with a function
    expect(mockOnClearRef).toHaveBeenCalled();
    expect(typeof mockOnClearRef.mock.calls[0][0]).toBe("function");
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
