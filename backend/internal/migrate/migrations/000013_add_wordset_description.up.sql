-- Migration: Add description column to word_sets for curated content
-- Also updates sentence word sets with proper descriptions

-- Add description column
ALTER TABLE word_sets ADD COLUMN IF NOT EXISTS description TEXT;

-- Update sentence word sets with descriptions
UPDATE word_sets SET description = 'Enkle setninger med 3-5 ord for barn i 1.-2. klasse. Øv på grunnleggende setningsstruktur som subjekt-verb-objekt.'
WHERE id = 'global-wordset-enkle-setninger';

UPDATE word_sets SET description = 'Setninger med 6-8 ord med preposisjonsfraser for barn i 3.-4. klasse. Mer komplekse setningsstrukturer.'
WHERE id = 'global-wordset-mellom-setninger';

UPDATE word_sets SET description = 'Avanserte setninger med 10-12 ord inkludert bisetninger for barn i 5.-7. klasse. Kompleks grammatikk og ordforråd.'
WHERE id = 'global-wordset-avanserte-setninger';

-- Add descriptions to spelling-focused word sets as well
UPDATE word_sets SET description = 'Øv på ord med dobbel konsonant, som "takk", "gutt" og "kopp".'
WHERE id = 'global-wordset-dobbelt-konsonant';

UPDATE word_sets SET description = 'Ord med stumme bokstaver: hj-, gj-, kj- og hv-lyder.'
WHERE id = 'global-wordset-stumme-bokstaver';

UPDATE word_sets SET description = 'Sammensatte norske ord som "fotball" og "blomsterkrans".'
WHERE id = 'global-wordset-sammensatte-ord';

UPDATE word_sets SET description = 'Ord med diftonger: ei, øy og au-lyder.'
WHERE id = 'global-wordset-diftonger';

UPDATE word_sets SET description = 'Ord med skj-lyden i forskjellige skrivemåter.'
WHERE id = 'global-wordset-skj-lyden';

UPDATE word_sets SET description = 'Øv på ord med æ, ø og å - de norske spesialbokstavene.'
WHERE id = 'global-wordset-norske-bokstaver';

UPDATE word_sets SET description = 'Ord med ng- og nk-lyder som "sang" og "bank".'
WHERE id = 'global-wordset-ng-nk';

UPDATE word_sets SET description = 'Ord med stum d på slutten som "land" og "rund".'
WHERE id = 'global-wordset-stum-d';

UPDATE word_sets SET description = 'Lær forskjellen mellom kort og lang vokal: tak/takk, bok/bukk.'
WHERE id = 'global-wordset-vokalforlengelse';

-- Thematic word sets
UPDATE word_sets SET description = 'Naturord for barn i 1.-2. klasse: fjell, skog, strand og mer.'
WHERE id = 'global-wordset-naturen';

UPDATE word_sets SET description = 'Kroppsdeler for barn i 3.-4. klasse: hjerne, hjerte, albue og mer.'
WHERE id = 'global-wordset-kroppen';

UPDATE word_sets SET description = 'Ukedager, måneder og årstider for barn i 3.-4. klasse.'
WHERE id = 'global-wordset-tid-kalender';
