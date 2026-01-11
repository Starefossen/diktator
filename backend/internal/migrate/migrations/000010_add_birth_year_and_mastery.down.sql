-- Remove word_mastery table
DROP TABLE IF EXISTS word_mastery;

-- Remove birth_year from users table
ALTER TABLE users DROP COLUMN IF EXISTS birth_year;
