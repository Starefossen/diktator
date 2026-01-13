/**
 * Test Engine - Main Exports
 *
 * Unified test mode system with registry pattern for easy extension.
 * Import from this file to access all test engine functionality.
 */

// Export all types
export type {
  TestModeDefinition,
  TestInputProps,
  ChallengeData,
  TestModeContext,
  TestModeRegistry,
} from "./types";

// Export registry functions
export {
  registerMode,
  getMode,
  getAllModes,
  hasMode,
  getRegistry,
  clearRegistry,
} from "./registry";
