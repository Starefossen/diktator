-- Remove audio processing columns since we now stream audio on-demand
ALTER TABLE word_sets DROP COLUMN IF EXISTS audio_processing;
ALTER TABLE word_sets DROP COLUMN IF EXISTS audio_processed_at;
