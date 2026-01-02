-- Rollback: Recreate children table
-- Note: This will create an empty table. Data migration would need to be done separately.

CREATE TABLE IF NOT EXISTS children (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
