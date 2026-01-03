-- Migration: Remove storage_path column from audio_files
-- This column was used for Google Cloud Storage integration which has been removed
-- Audio files are now served on-demand via TTS instead of being stored

ALTER TABLE audio_files DROP COLUMN IF EXISTS storage_path;
