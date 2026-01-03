-- Migration: Add wordset assignments
-- Allows parents to assign wordsets to specific children
-- Many-to-many relationship between wordsets and child users

CREATE TABLE IF NOT EXISTS wordset_assignments (
    wordset_id TEXT NOT NULL REFERENCES word_sets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by TEXT NOT NULL REFERENCES users(id), -- Parent who made the assignment

    PRIMARY KEY (wordset_id, user_id),

    -- Ensure only children can be assigned to wordsets
    CONSTRAINT wordset_assignments_child_only CHECK (
        (SELECT role FROM users WHERE id = user_id) = 'child'
    )
);

CREATE INDEX IF NOT EXISTS idx_wordset_assignments_user ON wordset_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_wordset_assignments_wordset ON wordset_assignments(wordset_id);
