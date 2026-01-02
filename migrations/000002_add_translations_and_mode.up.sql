-- Migration: Add translations support and test mode tracking
-- Adds translations array to words table for multi-language support
-- Adds mode column to test_results for analytics

-- Add translations column to words table
-- Structure: [{"language": "en", "text": "cat", "audioUrl": "...", "audioId": "..."}]
ALTER TABLE words ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '[]'::jsonb;

-- Add mode column to test_results table for tracking which mode was used
-- Values: 'standard', 'dictation', 'translation'
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'standard'
    CHECK (mode IN ('standard', 'dictation', 'translation'));

-- Add index for filtering test results by mode
CREATE INDEX IF NOT EXISTS idx_test_results_mode ON test_results(mode);
CREATE INDEX IF NOT EXISTS idx_test_results_user_mode ON test_results(user_id, mode);
