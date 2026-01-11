-- Migration: Update sentence word sets to use actual sentences as words
-- This replaces the placeholder single words with the actual sentences from the sentences JSON field

-- =============================================================================
-- ENKLE SETNINGER (Simple Sentences - Beginner)
-- =============================================================================

-- First, delete the placeholder words
DELETE FROM words WHERE word_set_id = 'global-wordset-enkle-setninger';

-- Insert the actual sentences as words
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-es-1', 'global-wordset-enkle-setninger', 'Katten sover på stolen.', 'Enkel setning med subjekt, verb og preposisjonsfrase', 0, '[{"language": "en", "text": "The cat sleeps on the chair."}]'::jsonb),
    ('global-es-2', 'global-wordset-enkle-setninger', 'Hunden spiser mat.', 'Enkel setning med subjekt, verb og objekt', 1, '[{"language": "en", "text": "The dog eats food."}]'::jsonb),
    ('global-es-3', 'global-wordset-enkle-setninger', 'Jeg liker is.', 'Kort setning med personlig pronomen', 2, '[{"language": "en", "text": "I like ice cream."}]'::jsonb),
    ('global-es-4', 'global-wordset-enkle-setninger', 'Ballen er rød.', 'Setning med adjektiv som beskriver', 3, '[{"language": "en", "text": "The ball is red."}]'::jsonb),
    ('global-es-5', 'global-wordset-enkle-setninger', 'Mor lager middag.', 'Setning om hverdagsaktivitet', 4, '[{"language": "en", "text": "Mom makes dinner."}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    word = EXCLUDED.word,
    definition = EXCLUDED.definition,
    translations = EXCLUDED.translations;

-- =============================================================================
-- MELLOM SETNINGER (Intermediate Sentences)
-- =============================================================================

DELETE FROM words WHERE word_set_id = 'global-wordset-mellom-setninger';

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-ms-1', 'global-wordset-mellom-setninger', 'Sommerfuglen flyr over blomstene i hagen.', 'Setning med flere preposisjonsfraser', 0, '[{"language": "en", "text": "The butterfly flies over the flowers in the garden."}]'::jsonb),
    ('global-ms-2', 'global-wordset-mellom-setninger', 'Barna leker med ballen på lekeplassen.', 'Setning med to preposisjonsfraser', 1, '[{"language": "en", "text": "The children play with the ball at the playground."}]'::jsonb),
    ('global-ms-3', 'global-wordset-mellom-setninger', 'Bestemor baker kake til bursdagen.', 'Setning med indirekte objekt', 2, '[{"language": "en", "text": "Grandma bakes cake for the birthday."}]'::jsonb),
    ('global-ms-4', 'global-wordset-mellom-setninger', 'Vi skal på ferie til sommeren.', 'Setning om framtidsplaner', 3, '[{"language": "en", "text": "We are going on vacation in the summer."}]'::jsonb),
    ('global-ms-5', 'global-wordset-mellom-setninger', 'Hunden løper etter katten i parken.', 'Setning med bevegelse og sted', 4, '[{"language": "en", "text": "The dog runs after the cat in the park."}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    word = EXCLUDED.word,
    definition = EXCLUDED.definition,
    translations = EXCLUDED.translations;

-- =============================================================================
-- AVANSERTE SETNINGER (Advanced Sentences)
-- =============================================================================

DELETE FROM words WHERE word_set_id = 'global-wordset-avanserte-setninger';

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-as-1', 'global-wordset-avanserte-setninger', 'Selv om været var dårlig, bestemte vi oss for å gå på tur.', 'Kompleks setning med innrømmelsessetning', 0, '[{"language": "en", "text": "Even though the weather was bad, we decided to go for a walk."}]'::jsonb),
    ('global-as-2', 'global-wordset-avanserte-setninger', 'Læreren forklarte at vi måtte gjøre leksene før helgen.', 'Setning med indirekte tale', 1, '[{"language": "en", "text": "The teacher explained that we had to do the homework before the weekend."}]'::jsonb),
    ('global-as-3', 'global-wordset-avanserte-setninger', 'Når jeg blir stor, vil jeg bli veterinær fordi jeg elsker dyr.', 'Kompleks setning med flere bisetninger', 2, '[{"language": "en", "text": "When I grow up, I want to become a veterinarian because I love animals."}]'::jsonb),
    ('global-as-4', 'global-wordset-avanserte-setninger', 'Familien reiste til hytta i fjellene for å feire jul sammen.', 'Setning med infinitivskonstruksjon', 3, '[{"language": "en", "text": "The family traveled to the cabin in the mountains to celebrate Christmas together."}]'::jsonb),
    ('global-as-5', 'global-wordset-avanserte-setninger', 'Etter at vi hadde spist frokost, gikk vi ut for å leke.', 'Setning med fortidsformer og tidsbisetning', 4, '[{"language": "en", "text": "After we had eaten breakfast, we went out to play."}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    word = EXCLUDED.word,
    definition = EXCLUDED.definition,
    translations = EXCLUDED.translations;
