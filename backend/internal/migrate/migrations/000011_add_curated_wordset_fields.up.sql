-- Migration: Add curated content metadata fields to word_sets
-- These fields support curriculum-aligned content with grade levels and spelling focus areas

-- Add target grade level for Norwegian curriculum alignment (LK20)
-- Values: "1-2", "3-4", "5-7" corresponding to Norwegian school grades
ALTER TABLE word_sets ADD COLUMN IF NOT EXISTS target_grade TEXT;

-- Add spelling focus categories as a JSONB array
-- Values include: "doubleConsonant", "silentLetter", "compoundWord", "diphthong",
-- "skjSound", "norwegianChars", "ngNk", "silentD", "vowelLength"
ALTER TABLE word_sets ADD COLUMN IF NOT EXISTS spelling_focus JSONB DEFAULT '[]'::jsonb;

-- Add difficulty level for progressive challenge support
-- Values: "beginner", "intermediate", "advanced"
ALTER TABLE word_sets ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- Add sentences array for sentence dictation support
-- Each sentence has: sentence, translation, focusWords, difficulty, pattern, audio
ALTER TABLE word_sets ADD COLUMN IF NOT EXISTS sentences JSONB DEFAULT '[]'::jsonb;

-- Add check constraint for valid target_grade values
ALTER TABLE word_sets ADD CONSTRAINT word_sets_target_grade_check
    CHECK (target_grade IS NULL OR target_grade IN ('1-2', '3-4', '5-7'));

-- Add check constraint for valid difficulty values
ALTER TABLE word_sets ADD CONSTRAINT word_sets_difficulty_check
    CHECK (difficulty IS NULL OR difficulty IN ('beginner', 'intermediate', 'advanced'));

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_word_sets_target_grade ON word_sets(target_grade) WHERE target_grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_word_sets_difficulty ON word_sets(difficulty) WHERE difficulty IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN word_sets.target_grade IS 'Norwegian school grade level (LK20): 1-2, 3-4, or 5-7';
COMMENT ON COLUMN word_sets.spelling_focus IS 'Array of spelling challenge categories this set focuses on';
COMMENT ON COLUMN word_sets.difficulty IS 'Overall difficulty level: beginner, intermediate, or advanced';
COMMENT ON COLUMN word_sets.sentences IS 'Array of sentence items for sentence dictation mode';

-- Update existing curated word sets with metadata
UPDATE word_sets SET
    target_grade = '1-2',
    spelling_focus = '["doubleConsonant"]'::jsonb,
    difficulty = 'beginner'
WHERE id = 'global-wordset-dobbelt-konsonant';

UPDATE word_sets SET
    target_grade = '1-2',
    spelling_focus = '["silentLetter"]'::jsonb,
    difficulty = 'intermediate'
WHERE id = 'global-wordset-stumme-bokstaver';

UPDATE word_sets SET
    target_grade = '3-4',
    spelling_focus = '["compoundWord"]'::jsonb,
    difficulty = 'intermediate'
WHERE id = 'global-wordset-sammensatte-ord';

UPDATE word_sets SET
    target_grade = '1-2',
    spelling_focus = '["diphthong"]'::jsonb,
    difficulty = 'beginner'
WHERE id = 'global-wordset-diftonger';

UPDATE word_sets SET
    target_grade = '3-4',
    spelling_focus = '["skjSound"]'::jsonb,
    difficulty = 'intermediate'
WHERE id = 'global-wordset-skj-lyden';

UPDATE word_sets SET
    target_grade = '1-2',
    spelling_focus = '["norwegianChars"]'::jsonb,
    difficulty = 'beginner'
WHERE id = 'global-wordset-aoa';

-- =============================================================================
-- NEW SPELLING RULE SETS
-- =============================================================================

-- Word Set: Ng og Nk (ng/nk sound distinction)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, created_at, updated_at)
VALUES (
    'global-wordset-ng-nk',
    'Ng og Nk',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '3-4',
    '["ngNk"]'::jsonb,
    'intermediate',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-ng-1', 'global-wordset-ng-nk', 'sang', 'Musikk man synger med munnen', 0, '[{"language": "en", "text": "song"}]'::jsonb),
    ('global-ng-2', 'global-wordset-ng-nk', 'lang', 'Det motsatte av kort', 1, '[{"language": "en", "text": "long"}]'::jsonb),
    ('global-ng-3', 'global-wordset-ng-nk', 'tenke', 'Å bruke hjernen til å forstå noe', 2, '[{"language": "en", "text": "to think"}]'::jsonb),
    ('global-ng-4', 'global-wordset-ng-nk', 'drikke', 'Å svelge væske som vann eller melk', 3, '[{"language": "en", "text": "to drink"}]'::jsonb),
    ('global-ng-5', 'global-wordset-ng-nk', 'synke', 'Å gå ned under vann', 4, '[{"language": "en", "text": "to sink"}]'::jsonb),
    ('global-ng-6', 'global-wordset-ng-nk', 'ringe', 'Når telefonen lager lyd', 5, '[{"language": "en", "text": "to ring/call"}]'::jsonb),
    ('global-ng-7', 'global-wordset-ng-nk', 'finger', 'En av de fem delene på hånden', 6, '[{"language": "en", "text": "finger"}]'::jsonb),
    ('global-ng-8', 'global-wordset-ng-nk', 'bank', 'Sted hvor man oppbevarer penger', 7, '[{"language": "en", "text": "bank"}]'::jsonb),
    ('global-ng-9', 'global-wordset-ng-nk', 'tung', 'Det motsatte av lett', 8, '[{"language": "en", "text": "heavy"}]'::jsonb),
    ('global-ng-10', 'global-wordset-ng-nk', 'slange', 'Et langt dyr uten ben som kryper', 9, '[{"language": "en", "text": "snake"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set: Stum D (Silent d endings)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, created_at, updated_at)
VALUES (
    'global-wordset-stum-d',
    'Stum D',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '3-4',
    '["silentD"]'::jsonb,
    'intermediate',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-sd-1', 'global-wordset-stum-d', 'land', 'Et område eller en nasjon', 0, '[{"language": "en", "text": "country/land"}]'::jsonb),
    ('global-sd-2', 'global-wordset-stum-d', 'sand', 'Små korn man finner på stranden', 1, '[{"language": "en", "text": "sand"}]'::jsonb),
    ('global-sd-3', 'global-wordset-stum-d', 'rund', 'Form som en sirkel eller ball', 2, '[{"language": "en", "text": "round"}]'::jsonb),
    ('global-sd-4', 'global-wordset-stum-d', 'holde', 'Å ha noe i hendene', 3, '[{"language": "en", "text": "to hold"}]'::jsonb),
    ('global-sd-5', 'global-wordset-stum-d', 'vind', 'Luft som beveger seg', 4, '[{"language": "en", "text": "wind"}]'::jsonb),
    ('global-sd-6', 'global-wordset-stum-d', 'kind', 'Del av ansiktet ved siden av nesen', 5, '[{"language": "en", "text": "cheek"}]'::jsonb),
    ('global-sd-7', 'global-wordset-stum-d', 'bord', 'Møbel man spiser ved', 6, '[{"language": "en", "text": "table"}]'::jsonb),
    ('global-sd-8', 'global-wordset-stum-d', 'ord', 'Det man skriver og snakker med', 7, '[{"language": "en", "text": "word"}]'::jsonb),
    ('global-sd-9', 'global-wordset-stum-d', 'gård', 'Sted med dyr og jorder', 8, '[{"language": "en", "text": "farm"}]'::jsonb),
    ('global-sd-10', 'global-wordset-stum-d', 'fjord', 'Lang bukt med vann mellom fjell', 9, '[{"language": "en", "text": "fjord"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set: Vokalforlengelse (Vowel lengthening - tak/takk pairs)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, created_at, updated_at)
VALUES (
    'global-wordset-vokalforlengelse',
    'Vokalforlengelse',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '5-7',
    '["vowelLength", "doubleConsonant"]'::jsonb,
    'advanced',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-vf-1', 'global-wordset-vokalforlengelse', 'tak', 'Toppen av et hus', 0, '[{"language": "en", "text": "roof"}]'::jsonb),
    ('global-vf-2', 'global-wordset-vokalforlengelse', 'takk', 'Høflighetsord når man får noe', 1, '[{"language": "en", "text": "thanks"}]'::jsonb),
    ('global-vf-3', 'global-wordset-vokalforlengelse', 'bok', 'Noe man leser med mange sider', 2, '[{"language": "en", "text": "book"}]'::jsonb),
    ('global-vf-4', 'global-wordset-vokalforlengelse', 'bukk', 'En hannlig geit', 3, '[{"language": "en", "text": "billy goat"}]'::jsonb),
    ('global-vf-5', 'global-wordset-vokalforlengelse', 'sol', 'Stjernen som gir oss lys og varme', 4, '[{"language": "en", "text": "sun"}]'::jsonb),
    ('global-vf-6', 'global-wordset-vokalforlengelse', 'sopp', 'Vokser i skogen, noen kan spises', 5, '[{"language": "en", "text": "mushroom"}]'::jsonb),
    ('global-vf-7', 'global-wordset-vokalforlengelse', 'mat', 'Det vi spiser for å bli mette', 6, '[{"language": "en", "text": "food"}]'::jsonb),
    ('global-vf-8', 'global-wordset-vokalforlengelse', 'matt', 'Trøtt og sliten', 7, '[{"language": "en", "text": "weary/tired"}]'::jsonb),
    ('global-vf-9', 'global-wordset-vokalforlengelse', 'bil', 'Kjøretøy med fire hjul', 8, '[{"language": "en", "text": "car"}]'::jsonb),
    ('global-vf-10', 'global-wordset-vokalforlengelse', 'ball', 'Rund ting man leker med', 9, '[{"language": "en", "text": "ball"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- THEMATIC SETS BY GRADE
-- =============================================================================

-- Word Set: Naturen (Nature - Grade 1-2)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, created_at, updated_at)
VALUES (
    'global-wordset-naturen',
    'Naturen',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '1-2',
    '["norwegianChars"]'::jsonb,
    'beginner',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-nat-1', 'global-wordset-naturen', 'fjell', 'Høy bakke av stein og jord', 0, '[{"language": "en", "text": "mountain"}]'::jsonb),
    ('global-nat-2', 'global-wordset-naturen', 'elv', 'Vann som renner gjennom landet', 1, '[{"language": "en", "text": "river"}]'::jsonb),
    ('global-nat-3', 'global-wordset-naturen', 'skog', 'Område med mange trær', 2, '[{"language": "en", "text": "forest"}]'::jsonb),
    ('global-nat-4', 'global-wordset-naturen', 'strand', 'Kant ved sjøen med sand', 3, '[{"language": "en", "text": "beach"}]'::jsonb),
    ('global-nat-5', 'global-wordset-naturen', 'himmel', 'Det blå over hodene våre', 4, '[{"language": "en", "text": "sky"}]'::jsonb),
    ('global-nat-6', 'global-wordset-naturen', 'regn', 'Vann som faller fra skyene', 5, '[{"language": "en", "text": "rain"}]'::jsonb),
    ('global-nat-7', 'global-wordset-naturen', 'snø', 'Hvitt og kaldt som faller om vinteren', 6, '[{"language": "en", "text": "snow"}]'::jsonb),
    ('global-nat-8', 'global-wordset-naturen', 'blomst', 'Vakker plante med farger', 7, '[{"language": "en", "text": "flower"}]'::jsonb),
    ('global-nat-9', 'global-wordset-naturen', 'tre', 'Stor plante med stamme og blader', 8, '[{"language": "en", "text": "tree"}]'::jsonb),
    ('global-nat-10', 'global-wordset-naturen', 'innsjø', 'Stort vann omgitt av land', 9, '[{"language": "en", "text": "lake"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set: Kroppen (Body - Grade 3-4)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, created_at, updated_at)
VALUES (
    'global-wordset-kroppen',
    'Kroppen',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '3-4',
    '["silentLetter", "compoundWord"]'::jsonb,
    'intermediate',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-kr-1', 'global-wordset-kroppen', 'hjerne', 'Organet i hodet som tenker', 0, '[{"language": "en", "text": "brain"}]'::jsonb),
    ('global-kr-2', 'global-wordset-kroppen', 'hjerte', 'Organet som pumper blod', 1, '[{"language": "en", "text": "heart"}]'::jsonb),
    ('global-kr-3', 'global-wordset-kroppen', 'mage', 'Hvor maten havner etter vi spiser', 2, '[{"language": "en", "text": "stomach"}]'::jsonb),
    ('global-kr-4', 'global-wordset-kroppen', 'albue', 'Leddet midt på armen', 3, '[{"language": "en", "text": "elbow"}]'::jsonb),
    ('global-kr-5', 'global-wordset-kroppen', 'skulder', 'Øverst på armen ved halsen', 4, '[{"language": "en", "text": "shoulder"}]'::jsonb),
    ('global-kr-6', 'global-wordset-kroppen', 'finger', 'En av fem deler på hånden', 5, '[{"language": "en", "text": "finger"}]'::jsonb),
    ('global-kr-7', 'global-wordset-kroppen', 'ankel', 'Leddet mellom fot og legg', 6, '[{"language": "en", "text": "ankle"}]'::jsonb),
    ('global-kr-8', 'global-wordset-kroppen', 'rygg', 'Baksiden av kroppen', 7, '[{"language": "en", "text": "back"}]'::jsonb),
    ('global-kr-9', 'global-wordset-kroppen', 'kne', 'Leddet midt på benet', 8, '[{"language": "en", "text": "knee"}]'::jsonb),
    ('global-kr-10', 'global-wordset-kroppen', 'hals', 'Mellom hodet og skuldrene', 9, '[{"language": "en", "text": "neck/throat"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set: Tid og Kalender (Time and Calendar - Grade 3-4)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, created_at, updated_at)
VALUES (
    'global-wordset-tid-kalender',
    'Tid og Kalender',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '3-4',
    '["norwegianChars"]'::jsonb,
    'intermediate',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-tk-1', 'global-wordset-tid-kalender', 'mandag', 'Første dag i uken', 0, '[{"language": "en", "text": "Monday"}]'::jsonb),
    ('global-tk-2', 'global-wordset-tid-kalender', 'tirsdag', 'Andre dag i uken', 1, '[{"language": "en", "text": "Tuesday"}]'::jsonb),
    ('global-tk-3', 'global-wordset-tid-kalender', 'januar', 'Første måned i året', 2, '[{"language": "en", "text": "January"}]'::jsonb),
    ('global-tk-4', 'global-wordset-tid-kalender', 'februar', 'Andre måned i året', 3, '[{"language": "en", "text": "February"}]'::jsonb),
    ('global-tk-5', 'global-wordset-tid-kalender', 'vår', 'Årstid mellom vinter og sommer', 4, '[{"language": "en", "text": "spring"}]'::jsonb),
    ('global-tk-6', 'global-wordset-tid-kalender', 'sommer', 'Varm årstid med ferie', 5, '[{"language": "en", "text": "summer"}]'::jsonb),
    ('global-tk-7', 'global-wordset-tid-kalender', 'høst', 'Årstid med fallende blader', 6, '[{"language": "en", "text": "autumn/fall"}]'::jsonb),
    ('global-tk-8', 'global-wordset-tid-kalender', 'vinter', 'Kald årstid med snø', 7, '[{"language": "en", "text": "winter"}]'::jsonb),
    ('global-tk-9', 'global-wordset-tid-kalender', 'morgen', 'Tidlig på dagen', 8, '[{"language": "en", "text": "morning"}]'::jsonb),
    ('global-tk-10', 'global-wordset-tid-kalender', 'kveld', 'Sent på dagen før natten', 9, '[{"language": "en", "text": "evening"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SENTENCE SETS BY DIFFICULTY
-- =============================================================================

-- Word Set: Enkle setninger (Simple Sentences - Beginner)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, sentences, created_at, updated_at)
VALUES (
    'global-wordset-enkle-setninger',
    'Enkle setninger',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '1-2',
    '[]'::jsonb,
    'beginner',
    '[
        {"sentence": "Katten sover på stolen.", "translation": "The cat sleeps on the chair.", "difficulty": "beginner", "pattern": "S+V+PP", "focusWords": ["katten", "sover", "stolen"]},
        {"sentence": "Hunden spiser mat.", "translation": "The dog eats food.", "difficulty": "beginner", "pattern": "S+V+O", "focusWords": ["hunden", "spiser", "mat"]},
        {"sentence": "Jeg liker is.", "translation": "I like ice cream.", "difficulty": "beginner", "pattern": "S+V+O", "focusWords": ["jeg", "liker"]},
        {"sentence": "Ballen er rød.", "translation": "The ball is red.", "difficulty": "beginner", "pattern": "S+V+Adj", "focusWords": ["ballen", "rød"]},
        {"sentence": "Mor lager middag.", "translation": "Mom makes dinner.", "difficulty": "beginner", "pattern": "S+V+O", "focusWords": ["mor", "lager", "middag"]}
    ]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add placeholder words for sentence sets (required for test flow)
INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-es-1', 'global-wordset-enkle-setninger', 'katten', 'Et lite kjæledyr som sier mjau', 0, '[{"language": "en", "text": "the cat"}]'::jsonb),
    ('global-es-2', 'global-wordset-enkle-setninger', 'hunden', 'Et firbeint kjæledyr som bjeffer', 1, '[{"language": "en", "text": "the dog"}]'::jsonb),
    ('global-es-3', 'global-wordset-enkle-setninger', 'ballen', 'Rund ting man leker med', 2, '[{"language": "en", "text": "the ball"}]'::jsonb),
    ('global-es-4', 'global-wordset-enkle-setninger', 'mor', 'Den kvinnelige forelderen', 3, '[{"language": "en", "text": "mom"}]'::jsonb),
    ('global-es-5', 'global-wordset-enkle-setninger', 'middag', 'Hovedmåltidet på dagen', 4, '[{"language": "en", "text": "dinner"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set: Mellom setninger (Intermediate Sentences)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, sentences, created_at, updated_at)
VALUES (
    'global-wordset-mellom-setninger',
    'Mellom setninger',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '3-4',
    '[]'::jsonb,
    'intermediate',
    '[
        {"sentence": "Sommerfuglen flyr over blomstene i hagen.", "translation": "The butterfly flies over the flowers in the garden.", "difficulty": "intermediate", "pattern": "S+V+PP+PP", "focusWords": ["sommerfuglen", "blomstene", "hagen"]},
        {"sentence": "Barna leker med ballen på lekeplassen.", "translation": "The children play with the ball at the playground.", "difficulty": "intermediate", "pattern": "S+V+PP+PP", "focusWords": ["barna", "ballen", "lekeplassen"]},
        {"sentence": "Bestemor baker kake til bursdagen.", "translation": "Grandma bakes cake for the birthday.", "difficulty": "intermediate", "pattern": "S+V+O+PP", "focusWords": ["bestemor", "baker", "bursdagen"]},
        {"sentence": "Vi skal på ferie til sommeren.", "translation": "We are going on vacation in the summer.", "difficulty": "intermediate", "pattern": "S+V+PP+PP", "focusWords": ["ferie", "sommeren"]},
        {"sentence": "Hunden løper etter katten i parken.", "translation": "The dog runs after the cat in the park.", "difficulty": "intermediate", "pattern": "S+V+PP+PP", "focusWords": ["hunden", "katten", "parken"]}
    ]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-ms-1', 'global-wordset-mellom-setninger', 'sommerfugl', 'Et vakkert insekt med fargerike vinger', 0, '[{"language": "en", "text": "butterfly"}]'::jsonb),
    ('global-ms-2', 'global-wordset-mellom-setninger', 'blomster', 'Vakre planter med farger', 1, '[{"language": "en", "text": "flowers"}]'::jsonb),
    ('global-ms-3', 'global-wordset-mellom-setninger', 'lekeplass', 'Sted med husker og sklier for barn', 2, '[{"language": "en", "text": "playground"}]'::jsonb),
    ('global-ms-4', 'global-wordset-mellom-setninger', 'bestemor', 'Mamma til mamma eller pappa', 3, '[{"language": "en", "text": "grandma"}]'::jsonb),
    ('global-ms-5', 'global-wordset-mellom-setninger', 'bursdag', 'Dagen du ble født', 4, '[{"language": "en", "text": "birthday"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Word Set: Avanserte setninger (Advanced Sentences)
INSERT INTO word_sets (id, name, family_id, is_global, created_by, language, test_configuration,
                       target_grade, spelling_focus, difficulty, sentences, created_at, updated_at)
VALUES (
    'global-wordset-avanserte-setninger',
    'Avanserte setninger',
    NULL,
    true,
    'system',
    'no',
    '{"defaultMode": "dictation", "maxAttempts": 3, "autoPlayAudio": true}'::jsonb,
    '5-7',
    '[]'::jsonb,
    'advanced',
    '[
        {"sentence": "Selv om været var dårlig, bestemte vi oss for å gå på tur.", "translation": "Even though the weather was bad, we decided to go for a walk.", "difficulty": "advanced", "pattern": "subordinate clause", "focusWords": ["selv", "været", "bestemte", "tur"]},
        {"sentence": "Læreren forklarte at vi måtte gjøre leksene før helgen.", "translation": "The teacher explained that we had to do the homework before the weekend.", "difficulty": "advanced", "pattern": "reported speech", "focusWords": ["læreren", "forklarte", "leksene", "helgen"]},
        {"sentence": "Når jeg blir stor, vil jeg bli veterinær fordi jeg elsker dyr.", "translation": "When I grow up, I want to become a veterinarian because I love animals.", "difficulty": "advanced", "pattern": "complex with subordinates", "focusWords": ["veterinær", "elsker"]},
        {"sentence": "Familien reiste til hytta i fjellene for å feire jul sammen.", "translation": "The family traveled to the cabin in the mountains to celebrate Christmas together.", "difficulty": "advanced", "pattern": "S+V+PP+PP+infinitive", "focusWords": ["familien", "hytta", "fjellene", "feire"]},
        {"sentence": "Etter at vi hadde spist frokost, gikk vi ut for å leke.", "translation": "After we had eaten breakfast, we went out to play.", "difficulty": "advanced", "pattern": "past perfect + main clause", "focusWords": ["etter", "hadde", "frokost", "leke"]}
    ]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO words (id, word_set_id, word, definition, position, translations) VALUES
    ('global-as-1', 'global-wordset-avanserte-setninger', 'veterinær', 'Lege som behandler dyr', 0, '[{"language": "en", "text": "veterinarian"}]'::jsonb),
    ('global-as-2', 'global-wordset-avanserte-setninger', 'familien', 'Foreldre og barn sammen', 1, '[{"language": "en", "text": "the family"}]'::jsonb),
    ('global-as-3', 'global-wordset-avanserte-setninger', 'fjellene', 'Høye bakker av stein og jord', 2, '[{"language": "en", "text": "the mountains"}]'::jsonb),
    ('global-as-4', 'global-wordset-avanserte-setninger', 'frokost', 'Første måltidet på dagen', 3, '[{"language": "en", "text": "breakfast"}]'::jsonb),
    ('global-as-5', 'global-wordset-avanserte-setninger', 'læreren', 'Person som underviser på skolen', 4, '[{"language": "en", "text": "the teacher"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;