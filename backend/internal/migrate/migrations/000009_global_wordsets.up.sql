-- Migration: Add support for global (curated) word sets
-- Global word sets are available to all users and are read-only

-- Allow 'system' role for system-created content
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('parent', 'child', 'admin', 'system'));

-- Allow NULL family_id for global word sets
ALTER TABLE word_sets ALTER COLUMN family_id DROP NOT NULL;

-- Add is_global flag to mark word sets as globally available
ALTER TABLE word_sets ADD COLUMN is_global BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient querying of global word sets
CREATE INDEX IF NOT EXISTS idx_word_sets_global ON word_sets(is_global) WHERE is_global = true;

-- Add comment for documentation
COMMENT ON COLUMN word_sets.is_global IS 'When true, this word set is available to all users as read-only curated content';

-- Create system user for global content (with NULL family_id to avoid FK constraint)
INSERT INTO users (id, auth_id, email, display_name, family_id, role, is_active, created_at, last_active_at)
VALUES ('system', 'system', 'system@diktator.app', 'System', NULL, 'system', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert curated word sets for Norwegian language learners
-- These are challenging words that help children practice common spelling patterns

-- Word Set 1: Dobbelt konsonant (Double consonants)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration, created_at, updated_at)
VALUES (
    'global-wordset-dobbelt-konsonant',
    'Dobbelt konsonant',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Words for Dobbelt konsonant
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-dk-1', 'global-wordset-dobbelt-konsonant', 'takk', 'Høflighetsord man sier når man får noe', 0, '[{"language": "en", "text": "thanks"}]'::jsonb),
    ('global-dk-2', 'global-wordset-dobbelt-konsonant', 'katt', 'Et lite kjæledyr som sier mjau', 1, '[{"language": "en", "text": "cat"}]'::jsonb),
    ('global-dk-3', 'global-wordset-dobbelt-konsonant', 'redd', 'Følelse når noe er skummelt', 2, '[{"language": "en", "text": "scared"}]'::jsonb),
    ('global-dk-4', 'global-wordset-dobbelt-konsonant', 'gutt', 'Et mannlig barn', 3, '[{"language": "en", "text": "boy"}]'::jsonb),
    ('global-dk-5', 'global-wordset-dobbelt-konsonant', 'blikk', 'Når du ser på noe', 4, '[{"language": "en", "text": "gaze"}]'::jsonb),
    ('global-dk-6', 'global-wordset-dobbelt-konsonant', 'stopp', 'Når noe må slutte å bevege seg', 5, '[{"language": "en", "text": "stop"}]'::jsonb),
    ('global-dk-7', 'global-wordset-dobbelt-konsonant', 'hopp', 'Når du løfter deg opp fra bakken', 6, '[{"language": "en", "text": "jump"}]'::jsonb),
    ('global-dk-8', 'global-wordset-dobbelt-konsonant', 'troll', 'Et eventyrfigur fra norske folkeeventyr', 7, '[{"language": "en", "text": "troll"}]'::jsonb),
    ('global-dk-9', 'global-wordset-dobbelt-konsonant', 'gress', 'Grønne planter på bakken', 8, '[{"language": "en", "text": "grass"}]'::jsonb),
    ('global-dk-10', 'global-wordset-dobbelt-konsonant', 'klaff', 'Del av noe som åpnes og lukkes', 9, '[{"language": "en", "text": "flap"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set 2: Stumme bokstaver (Silent letters)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration, created_at, updated_at)
VALUES (
    'global-wordset-stumme-bokstaver',
    'Stumme bokstaver',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Words for Stumme bokstaver
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-sb-1', 'global-wordset-stumme-bokstaver', 'hjerte', 'Organet som pumper blod i kroppen', 0, '[{"language": "en", "text": "heart"}]'::jsonb),
    ('global-sb-2', 'global-wordset-stumme-bokstaver', 'gjerne', 'Når du vil gjøre noe med glede', 1, '[{"language": "en", "text": "gladly"}]'::jsonb),
    ('global-sb-3', 'global-wordset-stumme-bokstaver', 'kjøre', 'Å styre en bil eller sykkel', 2, '[{"language": "en", "text": "drive"}]'::jsonb),
    ('global-sb-4', 'global-wordset-stumme-bokstaver', 'hvit', 'Fargen på snø og melk', 3, '[{"language": "en", "text": "white"}]'::jsonb),
    ('global-sb-5', 'global-wordset-stumme-bokstaver', 'hvem', 'Spørreord om en person', 4, '[{"language": "en", "text": "who"}]'::jsonb),
    ('global-sb-6', 'global-wordset-stumme-bokstaver', 'hjelp', 'Støtte fra noen som hjelper deg', 5, '[{"language": "en", "text": "help"}]'::jsonb),
    ('global-sb-7', 'global-wordset-stumme-bokstaver', 'gjøre', 'Å utføre en handling', 6, '[{"language": "en", "text": "do"}]'::jsonb),
    ('global-sb-8', 'global-wordset-stumme-bokstaver', 'kjenne', 'Å føle eller vite om noe', 7, '[{"language": "en", "text": "know/feel"}]'::jsonb),
    ('global-sb-9', 'global-wordset-stumme-bokstaver', 'hvor', 'Spørreord om et sted', 8, '[{"language": "en", "text": "where"}]'::jsonb),
    ('global-sb-10', 'global-wordset-stumme-bokstaver', 'hvordan', 'Spørreord om måte', 9, '[{"language": "en", "text": "how"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set 3: Sammensatte ord (Compound words)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration, created_at, updated_at)
VALUES (
    'global-wordset-sammensatte-ord',
    'Sammensatte ord',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Words for Sammensatte ord
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-so-1', 'global-wordset-sammensatte-ord', 'sommerfugl', 'Et vakkert insekt med fargerike vinger', 0, '[{"language": "en", "text": "butterfly"}]'::jsonb),
    ('global-so-2', 'global-wordset-sammensatte-ord', 'badedrakt', 'Klær du har på når du bader', 1, '[{"language": "en", "text": "swimsuit"}]'::jsonb),
    ('global-so-3', 'global-wordset-sammensatte-ord', 'frokostbord', 'Bordet der familien spiser frokost', 2, '[{"language": "en", "text": "breakfast table"}]'::jsonb),
    ('global-so-4', 'global-wordset-sammensatte-ord', 'sjokoladekake', 'En søt kake laget med sjokolade', 3, '[{"language": "en", "text": "chocolate cake"}]'::jsonb),
    ('global-so-5', 'global-wordset-sammensatte-ord', 'isbjørn', 'Et stort hvitt dyr som bor i Arktis', 4, '[{"language": "en", "text": "polar bear"}]'::jsonb),
    ('global-so-6', 'global-wordset-sammensatte-ord', 'solbriller', 'Briller som beskytter mot solen', 5, '[{"language": "en", "text": "sunglasses"}]'::jsonb),
    ('global-so-7', 'global-wordset-sammensatte-ord', 'fotballkamp', 'En sportskonkurranse med fotball', 6, '[{"language": "en", "text": "football match"}]'::jsonb),
    ('global-so-8', 'global-wordset-sammensatte-ord', 'melkekartong', 'Beholder man kjøper melk i', 7, '[{"language": "en", "text": "milk carton"}]'::jsonb),
    ('global-so-9', 'global-wordset-sammensatte-ord', 'barnehage', 'Sted hvor små barn er mens foreldrene jobber', 8, '[{"language": "en", "text": "kindergarten"}]'::jsonb),
    ('global-so-10', 'global-wordset-sammensatte-ord', 'lekeplass', 'Sted med husker og sklier for barn', 9, '[{"language": "en", "text": "playground"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set 4: Diftonger (Diphthongs - ei, øy, au sounds)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration, created_at, updated_at)
VALUES (
    'global-wordset-diftonger',
    'Diftonger',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Words for Diftonger
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-di-1', 'global-wordset-diftonger', 'hei', 'Hilsen man sier når man møter noen', 0, '[{"language": "en", "text": "hi"}]'::jsonb),
    ('global-di-2', 'global-wordset-diftonger', 'nei', 'Det motsatte av ja', 1, '[{"language": "en", "text": "no"}]'::jsonb),
    ('global-di-3', 'global-wordset-diftonger', 'vei', 'Sted man kjører eller går på', 2, '[{"language": "en", "text": "road"}]'::jsonb),
    ('global-di-4', 'global-wordset-diftonger', 'øye', 'Kroppsdel man ser med', 3, '[{"language": "en", "text": "eye"}]'::jsonb),
    ('global-di-5', 'global-wordset-diftonger', 'øy', 'Land omgitt av vann', 4, '[{"language": "en", "text": "island"}]'::jsonb),
    ('global-di-6', 'global-wordset-diftonger', 'høy', 'Det motsatte av lav', 5, '[{"language": "en", "text": "tall"}]'::jsonb),
    ('global-di-7', 'global-wordset-diftonger', 'sau', 'Et dyr med ull som sier bæ', 6, '[{"language": "en", "text": "sheep"}]'::jsonb),
    ('global-di-8', 'global-wordset-diftonger', 'tau', 'Tykk snor man kan klatre i', 7, '[{"language": "en", "text": "rope"}]'::jsonb),
    ('global-di-9', 'global-wordset-diftonger', 'blei', 'Noe babyer har på rumpa', 8, '[{"language": "en", "text": "diaper"}]'::jsonb),
    ('global-di-10', 'global-wordset-diftonger', 'røyk', 'Grå sky som kommer fra ild', 9, '[{"language": "en", "text": "smoke"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set 5: Skj-lyden (The skj-sound - different spellings)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration, created_at, updated_at)
VALUES (
    'global-wordset-skj-lyden',
    'Skj-lyden',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Words for Skj-lyden
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-skj-1', 'global-wordset-skj-lyden', 'skjorte', 'Plagg med knapper man har på overkroppen', 0, '[{"language": "en", "text": "shirt"}]'::jsonb),
    ('global-skj-2', 'global-wordset-skj-lyden', 'skje', 'Bestikk man spiser suppe med', 1, '[{"language": "en", "text": "spoon"}]'::jsonb),
    ('global-skj-3', 'global-wordset-skj-lyden', 'skjære', 'Å dele noe med kniv', 2, '[{"language": "en", "text": "to cut"}]'::jsonb),
    ('global-skj-4', 'global-wordset-skj-lyden', 'ski', 'Utstyr man bruker på snø om vinteren', 3, '[{"language": "en", "text": "ski"}]'::jsonb),
    ('global-skj-5', 'global-wordset-skj-lyden', 'skinn', 'Det ytterste laget på kroppen', 4, '[{"language": "en", "text": "skin/leather"}]'::jsonb),
    ('global-skj-6', 'global-wordset-skj-lyden', 'sjø', 'Stort vann med saltvann', 5, '[{"language": "en", "text": "sea"}]'::jsonb),
    ('global-skj-7', 'global-wordset-skj-lyden', 'sjel', 'Den indre delen av et menneske', 6, '[{"language": "en", "text": "soul"}]'::jsonb),
    ('global-skj-8', 'global-wordset-skj-lyden', 'sjokolade', 'Brun godteri laget av kakao', 7, '[{"language": "en", "text": "chocolate"}]'::jsonb),
    ('global-skj-9', 'global-wordset-skj-lyden', 'skjerm', 'Flate på TV eller datamaskin', 8, '[{"language": "en", "text": "screen"}]'::jsonb),
    ('global-skj-10', 'global-wordset-skj-lyden', 'sjiraff', 'Høyt dyr med lang hals fra Afrika', 9, '[{"language": "en", "text": "giraffe"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set 6: Særnorske bokstaver (Norwegian letters æ, ø, å)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration, created_at, updated_at)
VALUES (
    'global-wordset-aoa',
    'Æ, Ø og Å',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Words for Særnorske bokstaver
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-aoa-1', 'global-wordset-aoa', 'bær', 'Små frukter som jordbær og blåbær', 0, '[{"language": "en", "text": "berry"}]'::jsonb),
    ('global-aoa-2', 'global-wordset-aoa', 'ørn', 'Stor fugl som spiser fisk', 1, '[{"language": "en", "text": "eagle"}]'::jsonb),
    ('global-aoa-3', 'global-wordset-aoa', 'lære', 'Å få ny kunnskap', 2, '[{"language": "en", "text": "to learn"}]'::jsonb),
    ('global-aoa-4', 'global-wordset-aoa', 'søt', 'Smak som sukker og godteri', 3, '[{"language": "en", "text": "sweet"}]'::jsonb),
    ('global-aoa-5', 'global-wordset-aoa', 'grønn', 'Fargen på gress og blader', 4, '[{"language": "en", "text": "green"}]'::jsonb),
    ('global-aoa-6', 'global-wordset-aoa', 'brød', 'Mat man baker av mel', 5, '[{"language": "en", "text": "bread"}]'::jsonb),
    ('global-aoa-7', 'global-wordset-aoa', 'båt', 'Fartøy som flyter på vann', 6, '[{"language": "en", "text": "boat"}]'::jsonb),
    ('global-aoa-8', 'global-wordset-aoa', 'blå', 'Fargen på himmelen', 7, '[{"language": "en", "text": "blue"}]'::jsonb),
    ('global-aoa-9', 'global-wordset-aoa', 'måne', 'Lyser på himmelen om natten', 8, '[{"language": "en", "text": "moon"}]'::jsonb),
    ('global-aoa-10', 'global-wordset-aoa', 'våt', 'Når noe er dekket av vann', 9, '[{"language": "en", "text": "wet"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
