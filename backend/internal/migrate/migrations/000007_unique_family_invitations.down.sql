-- Rollback: Remove unique constraint on family invitations
DROP INDEX IF EXISTS idx_family_invitations_unique_pending;
