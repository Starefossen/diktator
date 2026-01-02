-- Rollback: Add storage_path column back to audio_files
-- Note: This will add the column but data will be empty

ALTER TABLE audio_files ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '';
