-- Rollback migration for global word sets

-- Remove global word sets first (they have NULL family_id)
DELETE FROM words WHERE word_set_id IN (SELECT id FROM word_sets WHERE is_global = true);
DELETE FROM word_sets WHERE is_global = true;

-- Delete system user
DELETE FROM users WHERE id = 'system';

-- Drop the index
DROP INDEX IF EXISTS idx_word_sets_global;

-- Remove the is_global column
ALTER TABLE word_sets DROP COLUMN IF EXISTS is_global;

-- Restore NOT NULL constraint on family_id
ALTER TABLE word_sets ALTER COLUMN family_id SET NOT NULL;

-- Restore original role constraint (without 'system')
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('parent', 'child', 'admin'));
