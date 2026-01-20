/**
 * Test Engine Modes
 *
 * Each mode defines:
 * - Metadata (icon, name, description)
 * - Input type (tiles, wordBank, keyboard, specialized)
 * - Mastery tracking (true for scored modes, false for self-report)
 * - Content requirements (what kind of content the mode works with)
 * - Availability logic (when the mode can be used)
 * - Challenge generation (optional, for modes that need setup)
 * - Expected answer calculation (optional, for modes with dynamic answers)
 */

export { letterTilesMode } from "./letterTilesMode";
export { wordBankMode } from "./wordBankMode";
export { keyboardMode } from "./keyboardMode";
export { missingLettersMode } from "./missingLettersMode";
export { flashcardMode } from "./flashcardMode";
export { lookCoverWriteMode } from "./lookCoverWriteMode";
export { translationMode } from "./translationMode";
export { listeningTranslationMode } from "./listeningTranslationMode";
