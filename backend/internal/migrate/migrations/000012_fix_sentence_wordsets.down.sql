-- Rollback: Restore placeholder single words for sentence word sets
-- This reverses the sentence migration back to single word placeholders

-- =============================================================================
-- ENKLE SETNINGER - Restore single words
-- =============================================================================

DELETE FROM words WHERE word_set_id = 'global-wordset-enkle-setninger';

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-es-1', 'global-wordset-enkle-setninger', 'katten', 'Et lite kjæledyr som sier mjau', 0, '[{"language": "en", "text": "the cat"}]'::jsonb),
    ('global-es-2', 'global-wordset-enkle-setninger', 'hunden', 'Et firbeint kjæledyr som bjeffer', 1, '[{"language": "en", "text": "the dog"}]'::jsonb),
    ('global-es-3', 'global-wordset-enkle-setninger', 'ballen', 'Rund ting man leker med', 2, '[{"language": "en", "text": "the ball"}]'::jsonb),
    ('global-es-4', 'global-wordset-enkle-setninger', 'mor', 'Den kvinnelige forelderen', 3, '[{"language": "en", "text": "mom"}]'::jsonb),
    ('global-es-5', 'global-wordset-enkle-setninger', 'middag', 'Hovedmåltidet på dagen', 4, '[{"language": "en", "text": "dinner"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    word = EXCLUDED.word,
    definition = EXCLUDED.definition,
    translations = EXCLUDED.translations;

-- =============================================================================
-- MELLOM SETNINGER - Restore single words
-- =============================================================================

DELETE FROM words WHERE word_set_id = 'global-wordset-mellom-setninger';

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-ms-1', 'global-wordset-mellom-setninger', 'sommerfugl', 'Et vakkert insekt med fargerike vinger', 0, '[{"language": "en", "text": "butterfly"}]'::jsonb),
    ('global-ms-2', 'global-wordset-mellom-setninger', 'blomster', 'Vakre planter med farger', 1, '[{"language": "en", "text": "flowers"}]'::jsonb),
    ('global-ms-3', 'global-wordset-mellom-setninger', 'lekeplass', 'Sted med husker og sklier for barn', 2, '[{"language": "en", "text": "playground"}]'::jsonb),
    ('global-ms-4', 'global-wordset-mellom-setninger', 'bestemor', 'Mamma til mamma eller pappa', 3, '[{"language": "en", "text": "grandma"}]'::jsonb),
    ('global-ms-5', 'global-wordset-mellom-setninger', 'bursdag', 'Dagen du ble født', 4, '[{"language": "en", "text": "birthday"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    word = EXCLUDED.word,
    definition = EXCLUDED.definition,
    translations = EXCLUDED.translations;

-- =============================================================================
-- AVANSERTE SETNINGER - Restore single words
-- =============================================================================

DELETE FROM words WHERE word_set_id = 'global-wordset-avanserte-setninger';

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-as-1', 'global-wordset-avanserte-setninger', 'veterinær', 'Lege som behandler dyr', 0, '[{"language": "en", "text": "veterinarian"}]'::jsonb),
    ('global-as-2', 'global-wordset-avanserte-setninger', 'familien', 'Foreldre og barn sammen', 1, '[{"language": "en", "text": "the family"}]'::jsonb),
    ('global-as-3', 'global-wordset-avanserte-setninger', 'fjellene', 'Høye bakker av stein og jord', 2, '[{"language": "en", "text": "the mountains"}]'::jsonb),
    ('global-as-4', 'global-wordset-avanserte-setninger', 'frokost', 'Første måltidet på dagen', 3, '[{"language": "en", "text": "breakfast"}]'::jsonb),
    ('global-as-5', 'global-wordset-avanserte-setninger', 'læreren', 'Person som underviser på skolen', 4, '[{"language": "en", "text": "the teacher"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    word = EXCLUDED.word,
    definition = EXCLUDED.definition,
    translations = EXCLUDED.translations;
