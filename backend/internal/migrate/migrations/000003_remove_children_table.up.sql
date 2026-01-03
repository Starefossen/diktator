-- Migration: Remove redundant children table
-- The children table is redundant because:
-- 1. All child data is already stored in the users table with role='child'
-- 2. The users table has parent_id for parent-child relationships
-- 3. Having two tables causes sync issues and confusion
--
-- After this migration, all child operations use the users table exclusively.

-- Drop the children table (data should already be in users table)
DROP TABLE IF EXISTS children;
