import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { axe } from "vitest-axe";
import { ListeningTranslationInput } from "../ListeningTranslationInput";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Mock Audio class
class MockAudio {
  src: string = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(src?: string) {
    if (src) this.src = src;
    // Register this instance for tracking
    MockAudio.lastInstance = this;
  }

  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();

  static lastInstance: MockAudio | null = null;

  // Helper to simulate audio ending
  simulateEnded() {
    this.onended?.();
  }

  // Helper to simulate audio error
  simulateError() {
    this.onerror?.();
  }
}

// Store original Audio
const originalAudio = globalThis.Audio;

describe("ListeningTranslationInput", () => {
  const mockOnSubmit = vi.fn();
  const mockOnUserAnswerChange = vi.fn();
  const mockOnAudioStart = vi.fn();
  const mockOnAudioEnd = vi.fn();

  const defaultProps = {
    expectedAnswer: "hello",
    userAnswer: "",
    onUserAnswerChange: mockOnUserAnswerChange,
    onSubmit: mockOnSubmit,
    sourceWord: "hei",
    originalWord: "hei",
    direction: "toTarget" as const,
    targetLanguage: "en",
    sourceLanguage: "no",
    wordSetId: "test-wordset-id",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    MockAudio.lastInstance = null;

    // Mock Audio constructor
    globalThis.Audio = MockAudio as unknown as typeof Audio;
  });

  afterEach(() => {
    vi.clearAllTimers();
    globalThis.Audio = originalAudio;
  });

  const renderComponent = (props = {}) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <ListeningTranslationInput {...defaultProps} {...props} />
      </LanguageProvider>,
    );
  };

  describe("Rendering", () => {
    it("renders audio play button", () => {
      renderComponent();
      const playButton = screen.getByRole("button", { name: /play audio/i });
      expect(playButton).toBeInTheDocument();
    });

    it("renders translation input field", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/type the translation/i);
      expect(input).toBeInTheDocument();
    });

    it("shows listen and translate instruction", () => {
      renderComponent();
      expect(screen.getByText(/listen and translate/i)).toBeInTheDocument();
    });

    it("shows the language being spoken", () => {
      renderComponent();
      expect(screen.getByText(/norwegian/i)).toBeInTheDocument();
    });

    it("shows the language to type in", () => {
      renderComponent();
      expect(screen.getByText(/english/i)).toBeInTheDocument();
    });
  });

  describe("Audio Playback", () => {
    it("plays audio when button is clicked", () => {
      renderComponent();
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);

      expect(MockAudio.lastInstance).not.toBeNull();
      expect(MockAudio.lastInstance?.play).toHaveBeenCalled();
    });

    it("calls onAudioStart when audio starts", () => {
      renderComponent({ onAudioStart: mockOnAudioStart });
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);

      expect(mockOnAudioStart).toHaveBeenCalled();
    });

    it("calls onAudioEnd when audio ends", async () => {
      renderComponent({ onAudioEnd: mockOnAudioEnd });
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);

      // Simulate audio ending
      act(() => {
        MockAudio.lastInstance?.simulateEnded();
      });

      expect(mockOnAudioEnd).toHaveBeenCalled();
    });

    it("refocuses input after audio ends", async () => {
      renderComponent();
      const playButton = screen.getByRole("button", { name: /play audio/i });
      const input = screen.getByPlaceholderText(/type the translation/i);

      fireEvent.click(playButton);

      // Simulate audio ending
      act(() => {
        MockAudio.lastInstance?.simulateEnded();
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });

    it("prevents multiple simultaneous plays", () => {
      renderComponent();
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);
      const firstInstance = MockAudio.lastInstance;
      fireEvent.click(playButton);

      // Should only be called once because isPlaying becomes true
      expect(firstInstance?.play).toHaveBeenCalledTimes(1);
    });
  });

  describe("Input Handling", () => {
    it("calls onUserAnswerChange when typing", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/type the translation/i);

      fireEvent.change(input, { target: { value: "test" } });

      expect(mockOnUserAnswerChange).toHaveBeenCalledWith("test");
    });

    it("submits on Enter key press with correct answer", () => {
      renderComponent({ userAnswer: "hello" });
      const input = screen.getByPlaceholderText(/type the translation/i);

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(mockOnSubmit).toHaveBeenCalledWith("hello", true);
    });

    it("does not submit on Enter if answer is empty", () => {
      renderComponent({ userAnswer: "" });
      const input = screen.getByPlaceholderText(/type the translation/i);

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("trims whitespace before submitting", () => {
      renderComponent({ userAnswer: "  hello  " });
      const input = screen.getByPlaceholderText(/type the translation/i);

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(mockOnSubmit).toHaveBeenCalledWith("hello", true);
    });

    it("marks incorrect answer as incorrect", () => {
      renderComponent({ userAnswer: "wrong" });
      const input = screen.getByPlaceholderText(/type the translation/i);

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(mockOnSubmit).toHaveBeenCalledWith("wrong", false);
    });

    it("is case-insensitive when comparing answers", () => {
      renderComponent({ userAnswer: "HELLO" });
      const input = screen.getByPlaceholderText(/type the translation/i);

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(mockOnSubmit).toHaveBeenCalledWith("HELLO", true);
    });
  });

  describe("Direction Handling", () => {
    it("constructs correct audio URL for toTarget direction", () => {
      renderComponent({ direction: "toTarget" });
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);

      // toTarget: plays source language (Norwegian word)
      expect(MockAudio.lastInstance?.src).toContain("lang=no");
    });

    it("constructs correct audio URL for toSource direction", () => {
      renderComponent({ direction: "toSource" });
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);

      // toSource: plays target language (English translation)
      expect(MockAudio.lastInstance?.src).toContain("lang=en");
    });

    it("uses originalWord in URL path regardless of direction", () => {
      // When direction is toSource, sourceWord might be the English translation
      // but the URL path must ALWAYS use originalWord (Norwegian) for backend lookup
      renderComponent({
        direction: "toSource",
        sourceWord: "Two robots", // English word shown to user
        originalWord: "To robotter", // Norwegian word for URL
        targetLanguage: "en",
        sourceLanguage: "no",
      });
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);

      // URL path must contain the Norwegian original word, not English
      expect(MockAudio.lastInstance?.src).toContain(
        encodeURIComponent("To robotter"),
      );
      expect(MockAudio.lastInstance?.src).not.toContain(
        encodeURIComponent("Two robots"),
      );
      // And lang should be 'en' for toSource (playing English audio)
      expect(MockAudio.lastInstance?.src).toContain("lang=en");
    });

    it("uses originalWord in URL path for toTarget direction", () => {
      renderComponent({
        direction: "toTarget",
        sourceWord: "To robotter", // Norwegian word shown to user
        originalWord: "To robotter", // Norwegian word for URL
        targetLanguage: "en",
        sourceLanguage: "no",
      });
      const playButton = screen.getByRole("button", { name: /play audio/i });

      fireEvent.click(playButton);

      // URL path must contain the Norwegian original word
      expect(MockAudio.lastInstance?.src).toContain(
        encodeURIComponent("To robotter"),
      );
      // And lang should be 'no' for toTarget (playing Norwegian audio)
      expect(MockAudio.lastInstance?.src).toContain("lang=no");
    });
  });

  describe("Feedback States", () => {
    it("shows correct feedback when showingCorrectFeedback is true", () => {
      renderComponent({ showingCorrectFeedback: true });

      expect(
        screen.queryByPlaceholderText(/type the translation/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("disables input when disabled prop is true", () => {
      renderComponent({ disabled: true });
      const input = screen.getByPlaceholderText(/type the translation/i);

      expect(input).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = renderComponent();
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("audio button has aria-label", () => {
      renderComponent();
      const playButton = screen.getByRole("button", { name: /play audio/i });

      expect(playButton).toHaveAttribute("aria-label");
    });

    it("input has proper focus ring styling", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/type the translation/i);

      expect(input).toHaveClass("focus:ring-2");
    });

    it("audio button meets minimum touch target size", () => {
      renderComponent();
      const playButton = screen.getByRole("button", { name: /play audio/i });

      // Button uses responsive padding (p-4 sm:p-6) matching TestAudioButton
      expect(playButton).toHaveClass("p-4");
    });
  });
});
