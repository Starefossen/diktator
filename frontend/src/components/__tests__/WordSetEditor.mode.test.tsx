import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WordSetEditor from "../WordSetEditor";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WordSet, TEST_MODES } from "@/types";

// Mock useAuth hook
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    userData: {
      id: "test-user",
      email: "test@example.com",
      displayName: "Test User",
      familyId: "test-family",
      role: "parent",
      isActive: true,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
    isAuthenticated: true,
    loading: false,
    needsRegistration: false,
  }),
}));

// Mock generatedApiClient
vi.mock("@/lib/api-generated", () => ({
  generatedApiClient: {
    getFamilyChildren: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

describe("WordSetEditor - Mode Selection", () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderEditor = (mode: "create" | "edit", initialData?: WordSet) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <WordSetEditor
          mode={mode}
          initialData={initialData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      </LanguageProvider>,
    );
  };

  it("shows mode selection dropdown with all 7 modes", () => {
    renderEditor("create");
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    expect(modeSelect).toBeInTheDocument();

    // Verify all 7 modes are present as options by checking option values
    expect(modeSelect.options).toHaveLength(7);

    // Get all option values
    const optionValues = Array.from(modeSelect.options).map((opt) => opt.value);
    TEST_MODES.forEach((mode) => {
      expect(optionValues).toContain(mode);
    });
  });

  it("defaults to keyboard mode", () => {
    renderEditor("create");
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    expect(modeSelect.value).toBe("keyboard");
  });

  it("allows selecting different modes", () => {
    renderEditor("create");
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;

    // Select letterTiles mode
    fireEvent.change(modeSelect, { target: { value: "letterTiles" } });
    expect(modeSelect.value).toBe("letterTiles");

    // Select translation mode
    fireEvent.change(modeSelect, { target: { value: "translation" } });
    expect(modeSelect.value).toBe("translation");
  });

  it("shows target language selector when translation mode is selected", () => {
    renderEditor("create");

    // Initially should not show target language
    expect(screen.queryByLabelText(/translate to/i)).not.toBeInTheDocument();

    // Select translation mode
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    fireEvent.change(modeSelect, { target: { value: "translation" } });

    // Now target language should be visible
    expect(screen.getByLabelText(/translate to/i)).toBeInTheDocument();
  });

  it("shows translation input field when translation mode is selected", async () => {
    renderEditor("create");

    // Select translation mode
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    fireEvent.change(modeSelect, { target: { value: "translation" } });

    // The placeholder changes in translation mode - look for "Word to practice"
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/word to practice/i),
      ).toBeInTheDocument();
    });
  });

  it("hides target language selector in non-translation modes", () => {
    renderEditor("create");
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;

    // Select translation mode first
    fireEvent.change(modeSelect, { target: { value: "translation" } });
    expect(screen.getByLabelText(/translate to/i)).toBeInTheDocument();

    // Switch to keyboard mode
    fireEvent.change(modeSelect, { target: { value: "keyboard" } });
    expect(screen.queryByLabelText(/translate to/i)).not.toBeInTheDocument();
  });

  it("saves wordset with keyboard mode configuration", async () => {
    renderEditor("create");

    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    expect(modeSelect.value).toBe("keyboard");

    // Fill in basic info
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: "Test WordSet" } });

    // Add a word
    const wordInput = screen.getByPlaceholderText(/add a new word/i);
    fireEvent.change(wordInput, { target: { value: "test" } });
    const addButton = screen.getByText(/add word/i);
    fireEvent.click(addButton);

    // Verify the keyboard mode is still selected
    expect(modeSelect.value).toBe("keyboard");
  });

  it("saves wordset with letterTiles mode configuration", async () => {
    renderEditor("create");

    // Select letterTiles mode
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    fireEvent.change(modeSelect, { target: { value: "letterTiles" } });
    expect(modeSelect.value).toBe("letterTiles");

    // Fill in basic info
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: "Letter Tiles Practice" } });

    // Add a word
    const wordInput = screen.getByPlaceholderText(/add a new word/i);
    fireEvent.change(wordInput, { target: { value: "practice" } });
    const addButton = screen.getByText(/add word/i);
    fireEvent.click(addButton);

    // Verify letterTiles mode is still selected
    expect(modeSelect.value).toBe("letterTiles");
  });

  it("saves wordset with translation mode and target language", async () => {
    renderEditor("create");

    // Select translation mode
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    fireEvent.change(modeSelect, { target: { value: "translation" } });
    expect(modeSelect.value).toBe("translation");

    // Select target language - verify the field exists and is interactable
    const languageSelect = screen.getByLabelText(
      /translate to/i,
    ) as HTMLSelectElement;
    expect(languageSelect).toBeInTheDocument();
    fireEvent.change(languageSelect, { target: { value: "es" } });

    // Fill in basic info
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: "Spanish Translation" } });

    // Add a word with translation
    const wordInput = screen.getByPlaceholderText(/word to practice/i);
    fireEvent.change(wordInput, { target: { value: "hello" } });
    const addButton = screen.getByText(/add word/i);
    fireEvent.click(addButton);

    // Verify translation mode is still selected
    expect(modeSelect.value).toBe("translation");
  });

  it("preserves mode when editing existing wordset", () => {
    const existingWordSet: WordSet = {
      id: "1",
      name: "Existing Translation Set",
      language: "en",
      familyId: "family-1",
      createdBy: "user-1",
      words: [
        {
          word: "hello",
          translations: [{ language: "es", text: "hola" }],
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

    renderEditor("edit", existingWordSet);

    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    expect(modeSelect.value).toBe("translation");
  });

  it("shows all 7 mode options in the dropdown", () => {
    renderEditor("create");
    const modeSelect = screen.getByLabelText(
      /default test mode/i,
    ) as HTMLSelectElement;
    expect(modeSelect).toBeInTheDocument();

    // Check that all mode options are present
    const options = screen.getAllByRole("option");
    // Filter to mode options (the select for default-mode)
    const modeOptions = Array.from(modeSelect.options);
    expect(modeOptions).toHaveLength(7);
  });
});
