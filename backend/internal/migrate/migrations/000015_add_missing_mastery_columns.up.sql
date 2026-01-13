-- Migration: Add missing mastery columns for missingLetters and translation modes
-- Also fixes the "Æ, Ø og Å" wordset description (wrong ID in migration 000013)

-- Add new mastery tracking columns for missing_letters and translation modes
ALTER TABLE word_mastery ADD COLUMN IF NOT EXISTS missing_letters_correct INTEGER NOT NULL DEFAULT 0;
ALTER TABLE word_mastery ADD COLUMN IF NOT EXISTS translation_correct INTEGER NOT NULL DEFAULT 0;

-- Fix: Update description for the correct "Æ, Ø og Å" wordset ID
-- Migration 000013 incorrectly targeted 'global-wordset-norske-bokstaver' instead of 'global-wordset-aoa'
UPDATE word_sets SET description = 'Øv på ord med æ, ø og å - de norske spesialbokstavene.'
WHERE id = 'global-wordset-aoa';
