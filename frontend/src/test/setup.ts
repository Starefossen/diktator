import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi, expect } from "vitest";
import * as matchers from "vitest-axe/matchers";

// Extend Vitest matchers with axe-core accessibility matchers
expect.extend(matchers);

// Suppress console.log, console.warn, and console.error during tests to reduce noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = () => {}; // Suppress console.log
  console.warn = () => {}; // Suppress console.warn
  // Suppress React act() warnings and other console.error noise
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : "";
    // Filter out React act() warnings - these are expected in tests with async updates
    if (message.includes("was not wrapped in act(")) return;
    if (message.includes("wrap-tests-with-act")) return;
    // Call original for other errors
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
process.env.NEXT_PUBLIC_AUTH_MODE = "mock";
process.env.NEXT_PUBLIC_MOCK_USER_ID = "test-user-123";
process.env.NEXT_PUBLIC_MOCK_USER_EMAIL = "test@example.com";
process.env.NEXT_PUBLIC_MOCK_USER_NAME = "Test User";

// Define window.matchMedia for components that use it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
