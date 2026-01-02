-- Restore audio processing columns (for rollback)
ALTER TABLE word_sets ADD COLUMN IF NOT EXISTS audio_processing VARCHAR(20);
ALTER TABLE word_sets ADD COLUMN IF NOT EXISTS audio_processed_at TIMESTAMP;
