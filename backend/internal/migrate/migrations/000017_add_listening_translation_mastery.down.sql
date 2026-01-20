-- Remove listening_translation_correct column from word_mastery table
ALTER TABLE word_mastery DROP COLUMN IF EXISTS listening_translation_correct;

-- Revert the test_results mode check to exclude listeningTranslation
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_mode_check;
ALTER TABLE test_results ADD CONSTRAINT test_results_mode_check
CHECK (mode IN ('letterTiles', 'wordBank', 'keyboard', 'missingLetters', 'flashcard', 'lookCoverWrite', 'translation'));
