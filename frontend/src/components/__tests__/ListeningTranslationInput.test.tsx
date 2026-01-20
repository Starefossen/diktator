import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { ListeningTranslationInput } from "../ListeningTranslationInput";
import { LanguageProvider } from "@/contexts/LanguageContext";

describe("ListeningTranslationInput", () => {
  const mockOnSubmit = vi.fn();
  const mockOnUserAnswerChange = vi.fn();

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
  });

  const renderComponent = (props = {}) => {
    return render(
      <LanguageProvider initialLanguage="en">
        <ListeningTranslationInput {...defaultProps} {...props} />
      </LanguageProvider>,
    );
  };

  describe("Rendering", () => {
    it("renders translation input field", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/type the translation/i);
      expect(input).toBeInTheDocument();
    });

    it("shows language direction indicator", () => {
      renderComponent();
      expect(screen.getByText(/norwegian/i)).toBeInTheDocument();
      expect(screen.getByText(/english/i)).toBeInTheDocument();
      expect(screen.getByText("→")).toBeInTheDocument();
    });

    it("shows correct language for toTarget direction", () => {
      renderComponent({ direction: "toTarget" });
      const norwegianText = screen.getByText(/norwegian/i);
      const englishText = screen.getByText(/english/i);
      // Norwegian is spoken (first), English is typed (second, bold)
      expect(norwegianText).toBeInTheDocument();
      expect(englishText).toHaveClass("font-medium");
    });

    it("shows correct language for toSource direction", () => {
      renderComponent({ direction: "toSource" });
      const norwegianText = screen.getByText(/norwegian/i);
      const englishText = screen.getByText(/english/i);
      // English is spoken (first), Norwegian is typed (second, bold)
      expect(englishText).toBeInTheDocument();
      expect(norwegianText).toHaveClass("font-medium");
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

    it("input has proper focus ring styling", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/type the translation/i);

      expect(input).toHaveClass("focus:ring-2");
    });

    it("input meets minimum touch target size", () => {
      renderComponent();
      const input = screen.getByPlaceholderText(/type the translation/i);

      expect(input).toHaveClass("min-h-12");
    });
  });
});
