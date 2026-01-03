-- Rollback: Remove translations support and test mode tracking

-- Remove indexes
DROP INDEX IF EXISTS idx_test_results_user_mode;
DROP INDEX IF EXISTS idx_test_results_mode;

-- Remove mode column from test_results
ALTER TABLE test_results DROP COLUMN IF EXISTS mode;

-- Remove translations column from words
ALTER TABLE words DROP COLUMN IF EXISTS translations;
