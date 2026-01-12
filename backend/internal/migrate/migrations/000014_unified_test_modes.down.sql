-- Rollback: Restore legacy mode values
-- Maps new modes back to legacy values for backward compatibility

-- Step 1: Map new modes back to legacy values
-- All typing/input modes -> 'dictation'
-- flashcard -> 'standard'
-- translation remains unchanged
UPDATE test_results SET mode = 'standard' WHERE mode = 'flashcard';
UPDATE test_results SET mode = 'dictation' WHERE mode IN (
  'letterTiles', 'wordBank', 'keyboard', 'missingLetters', 'lookCoverWrite'
);

-- Step 2: Drop new CHECK constraint
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_mode_check;

-- Step 3: Restore old CHECK constraint
ALTER TABLE test_results ADD CONSTRAINT test_results_mode_check
  CHECK (mode IN ('standard', 'dictation', 'translation'));

-- Step 4: Recreate original indexes
DROP INDEX IF EXISTS idx_test_results_mode;
CREATE INDEX idx_test_results_mode ON test_results(mode);
