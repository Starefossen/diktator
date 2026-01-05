-- Migration: Add unique constraint to prevent duplicate invitations
-- This ensures a user can only have one pending invitation per family

-- First, clean up any existing duplicate invitations
-- Keep only the most recent invitation for each (family_id, email, status) combination
DELETE FROM family_invitations
WHERE id NOT IN (
    SELECT DISTINCT ON (family_id, LOWER(email), status) id
    FROM family_invitations
    ORDER BY family_id, LOWER(email), status, created_at DESC
);

-- Add unique constraint for pending invitations
-- This prevents multiple pending invitations for the same email to the same family
CREATE UNIQUE INDEX idx_family_invitations_unique_pending
ON family_invitations (family_id, LOWER(email))
WHERE status = 'pending';

-- Note: We use a partial unique index (WHERE status = 'pending') because:
-- 1. Users should only have one pending invitation per family
-- 2. After accepting/declining, they could theoretically be re-invited
-- 3. This allows historical records of accepted/declined invitations
