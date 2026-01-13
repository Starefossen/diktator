/**
 * Test Engine - Mode Registry
 *
 * Central registry for all test modes. All modes are automatically
 * registered on module load.
 */

import type { TestMode } from "@/types";
import type { TestModeDefinition, TestModeRegistry } from "./types";
import {
  letterTilesMode,
  wordBankMode,
  keyboardMode,
  missingLettersMode,
  flashcardMode,
  lookCoverWriteMode,
  translationMode,
} from "./modes";

/**
 * Global registry of all test modes
 * Modes are registered via registerMode() function
 */
const registry: TestModeRegistry = new Map();

/**
 * Initialize registry with all available modes
 */
function initializeRegistry(): void {
  const modes = [
    letterTilesMode,
    wordBankMode,
    keyboardMode,
    missingLettersMode,
    flashcardMode,
    lookCoverWriteMode,
    translationMode,
  ];

  modes.forEach((mode) => {
    if (!registry.has(mode.id)) {
      registry.set(mode.id, mode);
    }
  });
}

// Auto-register all modes on module load
initializeRegistry();

/**
 * Register a test mode in the global registry
 *
 * @param definition - Complete mode definition
 * @throws Error if mode with same ID is already registered
 */
export function registerMode(definition: TestModeDefinition): void {
  if (registry.has(definition.id)) {
    throw new Error(
      `Test mode "${definition.id}" is already registered. Each mode can only be registered once.`,
    );
  }

  registry.set(definition.id, definition);
}

/**
 * Get a mode definition from the registry
 *
 * @param mode - The mode ID to retrieve
 * @returns The mode definition, or undefined if not found
 */
export function getMode(mode: TestMode): TestModeDefinition | undefined {
  return registry.get(mode);
}

/**
 * Get all registered modes
 *
 * @returns Array of all mode definitions
 */
export function getAllModes(): TestModeDefinition[] {
  return Array.from(registry.values());
}

/**
 * Check if a mode is registered
 *
 * @param mode - The mode ID to check
 * @returns True if mode is registered
 */
export function hasMode(mode: TestMode): boolean {
  return registry.has(mode);
}

/**
 * Get the registry map (for advanced use cases)
 *
 * @returns The complete registry map
 */
export function getRegistry(): TestModeRegistry {
  return registry;
}

/**
 * Clear all registered modes (mainly for testing)
 */
export function clearRegistry(): void {
  registry.clear();
}
