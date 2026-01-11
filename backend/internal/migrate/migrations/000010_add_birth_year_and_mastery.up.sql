-- Add birth_year to users table for age-adaptive features
ALTER TABLE users ADD COLUMN birth_year INTEGER;

-- Create word_mastery table for progressive challenge unlocking
CREATE TABLE word_mastery (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_set_id TEXT NOT NULL REFERENCES word_sets(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    letter_tiles_correct INTEGER NOT NULL DEFAULT 0,
    word_bank_correct INTEGER NOT NULL DEFAULT 0,
    keyboard_correct INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, word_set_id, word)
);

-- Index for efficient lookups by user
CREATE INDEX idx_word_mastery_user_id ON word_mastery(user_id);

-- Index for efficient lookups by word set
CREATE INDEX idx_word_mastery_word_set_id ON word_mastery(word_set_id);

-- Index for efficient lookups by user and word set
CREATE INDEX idx_word_mastery_user_word_set ON word_mastery(user_id, word_set_id);

