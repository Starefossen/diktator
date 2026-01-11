-- Rollback: Remove description column from word_sets
ALTER TABLE word_sets DROP COLUMN IF EXISTS description;
