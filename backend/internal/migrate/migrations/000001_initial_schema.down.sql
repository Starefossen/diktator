-- Migration: Drop all tables (reverse of initial schema)

-- Drop foreign key constraints first
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_family;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_parent;
ALTER TABLE families DROP CONSTRAINT IF EXISTS fk_families_created_by;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS family_invitations;
DROP TABLE IF EXISTS audio_files;
DROP TABLE IF EXISTS word_test_results;
DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS words;
DROP TABLE IF EXISTS word_sets;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS users;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";
