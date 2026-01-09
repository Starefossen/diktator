-- Migration: Add error_types column to word_test_results table
-- This stores detected spelling error types for analytics (e.g., doubleConsonant, silentH)

ALTER TABLE word_test_results ADD COLUMN IF NOT EXISTS error_types TEXT[] DEFAULT '{}';

-- Create an index on error_types for efficient querying of error patterns
CREATE INDEX IF NOT EXISTS idx_word_test_results_error_types ON word_test_results USING GIN (error_types);
