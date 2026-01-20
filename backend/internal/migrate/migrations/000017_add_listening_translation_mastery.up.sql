-- Add listening_translation_correct column to word_mastery table
-- This tracks mastery of the listeningTranslation mode (hear word, type translation)
-- which develops listening comprehension alongside translation skills

ALTER TABLE word_mastery
ADD COLUMN IF NOT EXISTS listening_translation_correct INTEGER NOT NULL DEFAULT 0;

-- Update the test_results mode check to allow the new mode
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_mode_check;
ALTER TABLE test_results ADD CONSTRAINT test_results_mode_check
CHECK (mode IN ('letterTiles', 'wordBank', 'keyboard', 'missingLetters', 'flashcard', 'lookCoverWrite', 'translation', 'listeningTranslation'));
