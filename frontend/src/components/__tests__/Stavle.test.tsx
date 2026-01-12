import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import Stavle, { StavleWithMessage, StavlePose, StavleSize } from "../Stavle";
import { LanguageProvider } from "@/contexts/LanguageContext";

const renderWithLanguage = (ui: React.ReactElement, language = "en") => {
  return render(
    <LanguageProvider initialLanguage={language}>{ui}</LanguageProvider>,
  );
};

const setupMatchMedia = (prefersReducedMotion = false) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        prefersReducedMotion && query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe("Stavle Component", () => {
  beforeEach(() => {
    setupMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("rendering", () => {
    it("renders with correct test id", () => {
      renderWithLanguage(<Stavle pose="idle" />);
      const stavle = screen.getByTestId("stavle-idle");
      expect(stavle).toBeInTheDocument();
    });

    it("renders all poses correctly", () => {
      const poses: StavlePose[] = [
        "celebrating",
        "encouraging",
        "waving",
        "thinking",
        "reading",
        "pointing",
        "idle",
      ];

      poses.forEach((pose) => {
        const { unmount } = renderWithLanguage(<Stavle pose={pose} />);
        expect(screen.getByTestId(`stavle-${pose}`)).toBeInTheDocument();
        unmount();
      });
    });

    it("renders image with correct src for each pose", () => {
      const poses: StavlePose[] = [
        "celebrating",
        "encouraging",
        "waving",
        "thinking",
        "reading",
        "pointing",
        "idle",
      ];

      poses.forEach((pose) => {
        const { unmount } = renderWithLanguage(<Stavle pose={pose} />);
        const img = screen.getByRole("img");
        expect(img).toHaveAttribute(
          "src",
          expect.stringContaining(`stavle-${pose}.png`),
        );
        unmount();
      });
    });

    it("renders with different sizes", () => {
      const sizes: StavleSize[] = [48, 64, 96, 128, 160, 200];

      sizes.forEach((size) => {
        const { unmount } = renderWithLanguage(
          <Stavle pose="idle" size={size} />,
        );
        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("width", String(size));
        expect(img).toHaveAttribute("height", String(size));
        unmount();
      });
    });

    it("applies custom className", () => {
      renderWithLanguage(<Stavle pose="idle" className="my-custom-class" />);
      const stavle = screen.getByTestId("stavle-idle");
      expect(stavle).toHaveClass("my-custom-class");
    });
  });

  describe("accessibility", () => {
    it("has alt text by default", () => {
      renderWithLanguage(<Stavle pose="celebrating" />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Stavle the fox is celebrating");
    });

    it("uses Norwegian alt text when language is Norwegian", () => {
      renderWithLanguage(<Stavle pose="celebrating" />, "no");
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Stavle reven feirer");
    });

    it("can be hidden from screen readers with aria-hidden", () => {
      renderWithLanguage(<Stavle pose="idle" aria-hidden={true} />);
      const stavle = screen.getByTestId("stavle-idle");
      const img = stavle.querySelector("img");
      expect(img).toHaveAttribute("aria-hidden", "true");
      expect(img).toHaveAttribute("alt", "");
    });

    it("has no accessibility violations", async () => {
      const { container } = renderWithLanguage(<Stavle pose="waving" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has correct alt text for each pose", () => {
      const poseLabels: Record<StavlePose, string> = {
        celebrating: "Stavle the fox is celebrating",
        encouraging: "Stavle the fox is encouraging you",
        waving: "Stavle the fox is waving hello",
        thinking: "Stavle the fox is thinking",
        reading: "Stavle the fox is reading",
        pointing: "Stavle the fox is pointing",
        idle: "Stavle the fox",
      };

      Object.entries(poseLabels).forEach(([pose, expectedLabel]) => {
        const { unmount } = renderWithLanguage(
          <Stavle pose={pose as StavlePose} />,
        );
        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("alt", expectedLabel);
        unmount();
      });
    });
  });

  describe("animations", () => {
    let mockMatchMedia: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("applies animation class when animate=true", () => {
      renderWithLanguage(<Stavle pose="celebrating" animate />);
      const stavle = screen.getByTestId("stavle-celebrating");
      expect(stavle).toHaveClass("animate-stavle-bounce");
    });

    it("does not apply animation class when animate=false", () => {
      renderWithLanguage(<Stavle pose="celebrating" animate={false} />);
      const stavle = screen.getByTestId("stavle-celebrating");
      expect(stavle).not.toHaveClass("animate-stavle-bounce");
    });

    it("applies correct animation class for each animated pose", () => {
      const animatedPoses: Record<string, string> = {
        celebrating: "animate-stavle-bounce",
        encouraging: "animate-stavle-nod",
        idle: "animate-stavle-bob",
      };

      Object.entries(animatedPoses).forEach(([pose, animationClass]) => {
        const { unmount } = renderWithLanguage(
          <Stavle pose={pose as StavlePose} animate />,
        );
        const stavle = screen.getByTestId(`stavle-${pose}`);
        expect(stavle).toHaveClass(animationClass);
        unmount();
      });
    });

    it("does not apply animation when prefers-reduced-motion is set", () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithLanguage(<Stavle pose="celebrating" animate />);
      const stavle = screen.getByTestId("stavle-celebrating");
      expect(stavle).not.toHaveClass("animate-stavle-bounce");
    });
  });
});

describe("StavleWithMessage Component", () => {
  beforeEach(() => {
    setupMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Stavle with a message", () => {
    renderWithLanguage(
      <StavleWithMessage pose="waving" message="Welcome to Diktator!" />,
    );
    expect(screen.getByTestId("stavle-waving")).toBeInTheDocument();
    expect(screen.getByText("Welcome to Diktator!")).toBeInTheDocument();
  });

  it("positions message below by default", () => {
    const { container } = renderWithLanguage(
      <StavleWithMessage pose="waving" message="Hello!" />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex-col");
  });

  it("positions message above when specified", () => {
    const { container } = renderWithLanguage(
      <StavleWithMessage
        pose="waving"
        message="Hello!"
        messagePosition="above"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex-col-reverse");
  });

  it("positions message to the left when specified", () => {
    const { container } = renderWithLanguage(
      <StavleWithMessage
        pose="waving"
        message="Hello!"
        messagePosition="left"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex-row-reverse");
  });

  it("positions message to the right when specified", () => {
    const { container } = renderWithLanguage(
      <StavleWithMessage
        pose="waving"
        message="Hello!"
        messagePosition="right"
      />,
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex-row");
  });

  it("passes size and animate props to Stavle", () => {
    renderWithLanguage(
      <StavleWithMessage
        pose="celebrating"
        message="Great job!"
        size={64}
        animate
      />,
    );
    const stavle = screen.getByTestId("stavle-celebrating");
    const img = stavle.querySelector("img");
    expect(img).toHaveAttribute("width", "64");
    expect(stavle).toHaveClass("animate-stavle-bounce");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithLanguage(
      <StavleWithMessage pose="encouraging" message="Keep trying!" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
