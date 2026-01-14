-- Remove XP indexes
DROP INDEX IF EXISTS idx_users_level;
DROP INDEX IF EXISTS idx_users_total_xp;

-- Remove XP columns from test_results
ALTER TABLE test_results DROP COLUMN IF EXISTS xp_awarded;

-- Remove XP columns from users
ALTER TABLE users DROP COLUMN IF EXISTS level;
ALTER TABLE users DROP COLUMN IF EXISTS total_xp;
