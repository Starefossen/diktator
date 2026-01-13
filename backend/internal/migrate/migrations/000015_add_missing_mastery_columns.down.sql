-- Rollback: Remove mastery columns for missingLetters and translation modes
ALTER TABLE word_mastery DROP COLUMN IF EXISTS missing_letters_correct;
ALTER TABLE word_mastery DROP COLUMN IF EXISTS translation_correct;
