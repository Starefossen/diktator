-- Migration: Unify test modes
-- Replaces legacy mode values with new unified 7-mode system
-- See docs/LEARNING.md for mode descriptions

-- Step 1: Migrate existing data to new mode values
-- 'standard' -> 'flashcard' (closest match - visual exposure mode)
-- 'dictation' -> 'keyboard' (audio-only typing mode)
-- 'translation' remains unchanged
UPDATE test_results SET mode = 'flashcard' WHERE mode = 'standard';
UPDATE test_results SET mode = 'keyboard' WHERE mode = 'dictation';

-- Step 2: Drop old CHECK constraint
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_mode_check;

-- Step 3: Add new CHECK constraint with all 7 modes
ALTER TABLE test_results ADD CONSTRAINT test_results_mode_check
  CHECK (mode IN (
    'letterTiles',      -- Build It: arrange scrambled letters
    'wordBank',         -- Pick Words: tap words to build sentence
    'keyboard',         -- Type It: full spelling production
    'missingLetters',   -- Fill the Gap: complete the blanks
    'flashcard',        -- Quick Look: see word, countdown, self-check
    'lookCoverWrite',   -- Memory Spell: see, hide, type from memory
    'translation'       -- Switch Languages: type in other language
  ));

-- Step 4: Update index for mode filtering (if needed)
DROP INDEX IF EXISTS idx_test_results_mode;
CREATE INDEX idx_test_results_mode ON test_results(mode);
