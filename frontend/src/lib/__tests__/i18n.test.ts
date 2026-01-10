import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { interpolateMessage, selectVariant, processMessage } from "../i18n";

describe("i18n utilities", () => {
  describe("interpolateMessage", () => {
    it("replaces single variable", () => {
      expect(interpolateMessage("Hello {name}!", { name: "World" })).toBe(
        "Hello World!",
      );
    });

    it("replaces multiple variables", () => {
      expect(
        interpolateMessage("Score: {score}%, Tests: {count}", {
          score: 95,
          count: 10,
        }),
      ).toBe("Score: 95%, Tests: 10");
    });

    it("leaves unreplaced variables as-is", () => {
      expect(interpolateMessage("Hello {name}!", {})).toBe("Hello {name}!");
    });

    it("handles undefined variables gracefully", () => {
      expect(interpolateMessage("Hello {name}!", { name: undefined })).toBe(
        "Hello {name}!",
      );
    });

    it("converts numbers to strings", () => {
      expect(interpolateMessage("{score}%", { score: 100 })).toBe("100%");
    });

    it("handles empty template", () => {
      expect(interpolateMessage("", { name: "Test" })).toBe("");
    });

    it("handles template with no variables", () => {
      expect(interpolateMessage("Hello World!", { name: "Test" })).toBe(
        "Hello World!",
      );
    });
  });

  describe("selectVariant", () => {
    describe("with string input", () => {
      it("returns the string directly", () => {
        expect(selectVariant("Hello")).toBe("Hello");
      });
    });

    describe("with array input", () => {
      it("returns empty string for empty array", () => {
        expect(selectVariant([])).toBe("");
      });

      it("returns the single element for single-element array", () => {
        expect(selectVariant(["Hello"])).toBe("Hello");
      });

      describe("with first strategy", () => {
        it("returns the first element", () => {
          expect(
            selectVariant(["First", "Second", "Third"], { strategy: "first" }),
          ).toBe("First");
        });
      });

      describe("with last strategy", () => {
        it("returns the last element", () => {
          expect(
            selectVariant(["First", "Second", "Third"], { strategy: "last" }),
          ).toBe("Third");
        });
      });

      describe("with random strategy", () => {
        beforeEach(() => {
          vi.spyOn(Math, "random");
        });

        afterEach(() => {
          vi.restoreAllMocks();
        });

        it("returns a random element based on Math.random", () => {
          vi.mocked(Math.random).mockReturnValue(0.5);
          expect(selectVariant(["A", "B", "C"], { strategy: "random" })).toBe(
            "B",
          );

          vi.mocked(Math.random).mockReturnValue(0);
          expect(selectVariant(["A", "B", "C"], { strategy: "random" })).toBe(
            "A",
          );

          vi.mocked(Math.random).mockReturnValue(0.99);
          expect(selectVariant(["A", "B", "C"], { strategy: "random" })).toBe(
            "C",
          );
        });

        it("defaults to random strategy when no strategy specified", () => {
          vi.mocked(Math.random).mockReturnValue(0.5);
          expect(selectVariant(["A", "B", "C"])).toBe("B");
        });
      });
    });
  });

  describe("processMessage", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("handles string message with interpolation", () => {
      expect(processMessage("Hello {name}!", { name: "Alex" })).toBe(
        "Hello Alex!",
      );
    });

    it("handles array messages with interpolation", () => {
      vi.mocked(Math.random).mockReturnValue(0);
      expect(
        processMessage(["Hello {name}!", "Hi {name}!"], { name: "Alex" }),
      ).toBe("Hello Alex!");

      vi.mocked(Math.random).mockReturnValue(0.5);
      expect(
        processMessage(["Hello {name}!", "Hi {name}!"], { name: "Alex" }),
      ).toBe("Hi Alex!");
    });

    it("respects strategy option", () => {
      expect(
        processMessage(
          ["First {name}!", "Last {name}!"],
          { name: "Alex" },
          { strategy: "last" },
        ),
      ).toBe("Last Alex!");
    });

    it("handles empty variables", () => {
      expect(processMessage("Hello World!")).toBe("Hello World!");
    });

    it("handles complex interpolation with numbers", () => {
      expect(
        processMessage("Score: {score}% ({count} tests)", {
          score: 95,
          count: 10,
        }),
      ).toBe("Score: 95% (10 tests)");
    });
  });
});
