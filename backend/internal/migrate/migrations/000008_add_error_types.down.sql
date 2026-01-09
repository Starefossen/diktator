-- Rollback: Remove error_types column from word_test_results table

DROP INDEX IF EXISTS idx_word_test_results_error_types;
ALTER TABLE word_test_results DROP COLUMN IF EXISTS error_types;
