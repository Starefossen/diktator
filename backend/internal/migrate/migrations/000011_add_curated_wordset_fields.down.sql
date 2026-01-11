-- Rollback: Remove curated content metadata fields from word_sets

-- Remove check constraints
ALTER TABLE word_sets DROP CONSTRAINT IF EXISTS word_sets_target_grade_check;
ALTER TABLE word_sets DROP CONSTRAINT IF EXISTS word_sets_difficulty_check;

-- Remove indexes
DROP INDEX IF EXISTS idx_word_sets_target_grade;
DROP INDEX IF EXISTS idx_word_sets_difficulty;

-- Remove columns
ALTER TABLE word_sets DROP COLUMN IF EXISTS sentences;
ALTER TABLE word_sets DROP COLUMN IF EXISTS difficulty;
ALTER TABLE word_sets DROP COLUMN IF EXISTS spelling_focus;
ALTER TABLE word_sets DROP COLUMN IF EXISTS target_grade;
