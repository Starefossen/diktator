-- Migration: Add wordset assignments
-- Allows parents to assign wordsets to specific children
-- Many-to-many relationship between wordsets and child users

CREATE TABLE IF NOT EXISTS wordset_assignments (
    wordset_id TEXT NOT NULL REFERENCES word_sets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by TEXT NOT NULL REFERENCES users(id), -- Parent who made the assignment

    PRIMARY KEY (wordset_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wordset_assignments_user ON wordset_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_wordset_assignments_wordset ON wordset_assignments(wordset_id);

-- Use a trigger to enforce that only children can be assigned to wordsets
-- (CHECK constraints cannot reference other tables)
CREATE OR REPLACE FUNCTION check_wordset_assignment_is_child()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT role FROM users WHERE id = NEW.user_id) != 'child' THEN
        RAISE EXCEPTION 'Only children can be assigned to wordsets';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_wordset_assignment_child
    BEFORE INSERT OR UPDATE ON wordset_assignments
    FOR EACH ROW
    EXECUTE FUNCTION check_wordset_assignment_is_child();
