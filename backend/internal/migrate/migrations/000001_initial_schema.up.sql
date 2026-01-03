-- Migration: Initial PostgreSQL Schema
-- This schema mirrors the Firestore collections used in the original application
-- Uses TEXT for IDs to maintain compatibility with existing Firestore data and auth systems

-- Users table
-- Maps to Firestore 'users' collection
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    auth_id TEXT UNIQUE NOT NULL, -- Links to OIDC identity (subject claim)
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    family_id TEXT, -- References families(id), nullable for users not yet in a family
    role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'child', 'admin')),
    parent_id TEXT, -- References users(id), only for child accounts
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_family_role ON users(family_id, role);

-- Families table
-- Maps to Firestore 'families' collection
CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL, -- References users(id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_families_created_by ON families(created_by);

-- Family members junction table (replaces 'members' array in Firestore)
CREATE TABLE IF NOT EXISTS family_members (
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'parent',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);

-- Children table
-- DEPRECATED: This table is removed in migration 000003. Use users table with role='child' instead.
-- Maps to Firestore 'children' collection (separate from users for child-specific data)
CREATE TABLE IF NOT EXISTS children (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- Optional link to users table
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'child' CHECK (role = 'child'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);

-- Word sets table
-- Maps to Firestore 'wordsets' collection
CREATE TABLE IF NOT EXISTS word_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    language TEXT NOT NULL DEFAULT 'en',
    audio_processing TEXT CHECK (audio_processing IN ('pending', 'completed', 'failed') OR audio_processing IS NULL),
    audio_processed_at TIMESTAMPTZ,
    test_configuration JSONB, -- Stores flexible test configuration
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_word_sets_family ON word_sets(family_id);
CREATE INDEX IF NOT EXISTS idx_word_sets_family_created ON word_sets(family_id, created_at DESC);

-- Words table (normalized from embedded array in Firestore WordSet)
CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY,
    word_set_id TEXT NOT NULL REFERENCES word_sets(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    definition TEXT,
    position INT NOT NULL DEFAULT 0, -- Maintains word order

    -- Audio information (was embedded WordAudio struct)
    audio_url TEXT,
    audio_id TEXT,
    voice_id TEXT,
    audio_created_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_words_word_set ON words(word_set_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_words_word_set_position ON words(word_set_id, position);

-- Test results table
-- Maps to Firestore 'results' collection
CREATE TABLE IF NOT EXISTS test_results (
    id TEXT PRIMARY KEY,
    word_set_id TEXT NOT NULL REFERENCES word_sets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL, -- Percentage 0-100
    total_words INT NOT NULL,
    correct_words INT NOT NULL,
    time_spent INT NOT NULL DEFAULT 0, -- Seconds
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_completed ON test_results(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_word_set ON test_results(word_set_id);

-- Word test results table (normalized from embedded array in Firestore TestResult)
CREATE TABLE IF NOT EXISTS word_test_results (
    id TEXT PRIMARY KEY,
    test_result_id TEXT NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    user_answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of all attempts stored as JSON
    attempts INT NOT NULL DEFAULT 1,
    correct BOOLEAN NOT NULL DEFAULT false,
    time_spent INT NOT NULL DEFAULT 0, -- Seconds
    final_answer TEXT NOT NULL,
    hints_used INT DEFAULT 0,
    audio_play_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_word_test_results_test ON word_test_results(test_result_id);

-- Audio files table
-- Maps to Firestore 'audiofiles' collection
CREATE TABLE IF NOT EXISTS audio_files (
    id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    language TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_audio_files_word_lang_voice ON audio_files(word, language, voice_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_word ON audio_files(word);

-- Family invitations table
-- Maps to Firestore 'invitations' collection (if used)
CREATE TABLE IF NOT EXISTS family_invitations (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
    invited_by TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON family_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_family ON family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON family_invitations(status);

-- Add foreign key constraints after all tables exist
ALTER TABLE users ADD CONSTRAINT fk_users_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE families ADD CONSTRAINT fk_families_created_by FOREIGN KEY (created_by) REFERENCES users(id);
