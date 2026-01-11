# Sentence Dictation Implementation Plan

> **Status**: Complete (Phase 6 Done)
> **Created**: 2026-01-11
> **Last Updated**: 2026-01-12

## Overview

Extend Diktator from single-word dictation to full sentence dictation with progressive challenges, auto-generated content, age-adaptive unlocking, Norwegian curriculum alignment (LK20), and ord.uib.no dictionary integration.

## Goals

1. **Sentence support**: Allow parents to create sentence-based word sets with full-sentence TTS
2. **Progressive challenges**: Letter tiles → Word bank → Keyboard, unlocked by mastery
3. **Age-adaptive**: Auto-select input method based on child's birth year
4. **Dictionary validation**: Optional word validation via ord.uib.no with simplified response
5. **Curriculum alignment**: Curated content organized by Norwegian school grades (1-2, 3-4, 5-7 trinn)

## Target Personas

| Persona    | Age | Input Method            | Features                                               |
| ---------- | --- | ----------------------- | ------------------------------------------------------ |
| **Sofie**  | 7   | Letter tiles, Word bank | Large touch targets, immediate feedback, replay audio  |
| **Magnus** | 10  | Keyboard (default)      | Statistics, progress tracking, can replay easier modes |

## Implementation Phases

### Phase 1: Foundation 🔄

- [x] **1.1** Add global config in `frontend/src/lib/sentenceConfig.ts`
  - Mastery thresholds: `LETTER_TILES_REQUIRED: 2`, `WORD_BANK_REQUIRED: 2`
  - TTS limits: `MAX_SENTENCE_WORDS: 15`, `WARN_SENTENCE_WORDS: 12`
  - Distractors: `LETTER_DISTRACTORS: 4`, `WORD_DISTRACTORS: 3`
  - Dictionary: `DICTIONARY_RATE_LIMIT_MS: 500`
  - Helper functions: `isSentence()`, `getWordCount()`, `classifySentenceDifficulty()`

- [x] **1.2** Add `birth_year` column to User model
  - Migration: `backend/internal/migrate/migrations/000010_add_birth_year_and_mastery.up.sql`
  - Updated `User` struct in `backend/internal/models/models.go`
  - Updated types in `frontend/src/types/index.ts`
  - TODO: Add age dropdown (5-12) to child account creation flow

- [x] **1.3** Add `WordMastery` model for progressive unlocking
  - Migration: `backend/internal/migrate/migrations/000010_add_birth_year_and_mastery.up.sql`
  - Added `WordMastery` struct with `GetCurrentChallengeMode()` method
  - Fields: `id`, `user_id`, `word_set_id`, `word`, `letter_tiles_correct`, `word_bank_correct`, `keyboard_correct`
  - TODO: API endpoints: `GET /api/mastery/{wordId}`, `POST /api/mastery/{wordId}/increment`

### Phase 2: Dictionary Integration ✅

- [x] **2.1** Define simplified `DictionaryWord` type
  - Location: `backend/internal/models/dictionary.go`
  - Frontend types: `frontend/src/types/index.ts`
  ```go
  type DictionaryWord struct {
    Lemma       string   `json:"lemma"`
    WordClass   string   `json:"wordClass"`   // NOUN, VERB, ADJ, etc.
    Inflections []string `json:"inflections"` // [katt, katten, katter, kattene]
    Definition  string   `json:"definition"`  // Primary definition only
    ArticleID   int      `json:"articleId"`   // For linking to ordbokene.no
  }
  ```

- [x] **2.2** Create dictionary proxy service
  - Location: `backend/internal/services/dictionary/service.go`
  - Response types: `backend/internal/services/dictionary/types.go`
  - Proxy to ord.uib.no API
  - Rate limiting: 2 req/sec to upstream (token bucket)
  - LRU cache for responses (5MB default)
  - Parse complex article JSON → extract to simplified `DictionaryWord`
  - Graceful error handling: return `nil` on network failure

- [x] **2.3** Add dictionary handlers
  - Location: `backend/handlers/dictionary.go`
  - `GET /api/dictionary/validate?w={word}&dict=bm` → `DictionaryWord` or null
  - `GET /api/dictionary/suggest?q={query}&dict=bm&n=5` → `[]DictionarySuggestion`
  - `GET /api/dictionary/stats` → Cache statistics

### Phase 3: TTS Sentence Support ✅

- [x] **3.1** Extend TTS service for sentences
  - Added `IsSentence(text)` and `GetWordCount(text)` helper functions
  - Added `GenerateSentenceAudio(sentence, language)` method using SSML prosody
  - Added `GenerateTextAudio(text, language)` auto-detection method
  - Uses SSML: `<speak><prosody rate="0.9">{sentence}</prosody></speak>`
  - Cache key: `sentence:{hash}:{lang}:{voice}` (distinct from word cache)
  - Validates max sentence length (15 words)
  - Speaking rates: 0.8x for single words, 0.9x for sentences

- [x] **3.2** Update audio endpoint for sentences
  - Extended `StreamWordAudio` handler to auto-detect sentences
  - Validates sentence word limit before TTS generation
  - Added `X-Is-Sentence` response header for debugging
  - Reuses existing caching infrastructure

- [x] **3.3** Add unit tests
  - Location: `backend/internal/services/tts/sentence_test.go`
  - Tests for `IsSentence()`, `GetWordCount()`, constants validation

### Phase 4: Curated Content ✅

- [x] **4.1** Extend `CuratedWordSet` model
  - Added `target_grade` field: "1-2", "3-4", "5-7"
  - Added `spelling_focus` array: ["doubleConsonant", "silentLetter", etc.]
  - Added `difficulty` field: "beginner", "intermediate", "advanced"
  - Added `sentences` array with `SentenceItem` type
  - Migration: `backend/internal/migrate/migrations/000011_add_curated_wordset_fields.up.sql`
  - Updated DB layer to read new fields in GetWordSet, GetWordSets, GetGlobalWordSets

- [x] **4.2** Add new spelling rule sets
  - "Ng og Nk": sang, lang, tenke, drikke, synke, ringe, finger, bank, tung, slange
  - "Stum D": land, sand, rund, holde, vind, kind, bord, ord, gård, fjord
  - "Vokalforlengelse": tak/takk, bok/bukk, sol/sopp, mat/matt, bil/ball pairs

- [x] **4.3** Add thematic sets by grade
  - "Naturen" (Grade 1-2): fjell, elv, skog, strand, himmel, regn, snø, blomst, tre, innsjø
  - "Kroppen" (Grade 3-4): hjerne, hjerte, mage, albue, skulder, finger, ankel, rygg, kne, hals
  - "Tid og Kalender" (Grade 3-4): mandag, tirsdag, januar, februar, vår, sommer, høst, vinter, morgen, kveld

- [x] **4.4** Add sentence sets by difficulty
  - "Enkle setninger" (Beginner, Grade 1-2): 4-5 word sentences with S+V+O patterns
  - "Mellom setninger" (Intermediate, Grade 3-4): 6-8 word sentences with prepositional phrases
  - "Avanserte setninger" (Advanced, Grade 5-7): 10-12 word sentences with subordinate clauses

### Phase 5: Progressive Input Components ✅

- [x] **5.1** Create challenge generator
  - Location: `frontend/src/lib/challenges.ts`
  - `generateLetterTiles(word)`: Scramble + phonetically similar Norwegian distractors (ø/o, æ/e, kj/k)
  - `generateWordBank(sentence, wordSet)`: 3 distractors from same set + Norwegian fillers ("og", "er", "på", "en", "et", "å")
  - `getNextChallengeMode(mastery)`: letterTiles until 2 correct → wordBank until 2 correct → keyboard
  - `isModeUnlocked(mastery, mode)`: Check if mode is available
  - `getMasteryProgress(mastery)`: Get progress info for UI display
  - `validateLetterTileAnswer()` and `validateWordBankAnswer()`: Validation helpers

- [x] **5.2** Create `LetterTileInput` component
  - Location: `frontend/src/components/LetterTileInput.tsx`
  - Tap-to-place interaction (no drag)
  - Slot-based answer area matching word length
  - 48px+ touch targets (min-h-12)
  - Phonetically similar Norwegian distractors
  - Visual feedback: nordic colors for placed tiles
  - Accessibility: ARIA labels, screen reader status updates

- [x] **5.3** Create `WordBankInput` component
  - Location: `frontend/src/components/WordBankInput.tsx`
  - Wrapped flexbox layout with word pills
  - Word count indicator
  - Tap-to-add, tap-to-remove interaction
  - Clear and check action buttons
  - Accessibility: ARIA labels, screen reader status updates

### Phase 6: UI Integration ✅

- [x] **6.1** Add input method selector to ModeSelectionModal
  - Location: `frontend/src/components/ModeSelectionModal.tsx`
  - `InputMethodSelector` component with letter tiles, word bank, keyboard options
  - Age-appropriate default selection based on birth year
  - Mode icons and descriptions for each input method
  - TODO (deferred): Mastery progress bar, replay mode toggle

- [x] **6.2** Add editor feedback UI in WordSetEditor
  - Location: `frontend/src/components/WordSetEditor.tsx`
  - `WordBadge` component showing word count for sentences
  - Auto-classification: Enkel (≤5 words), Middels (6-8), Avansert (9+)
  - Uses `isSentence()`, `getWordCount()`, `classifySentenceDifficulty()` from sentenceConfig
  - TODO (deferred): Dictionary validation button, inflections preview

- [x] **6.3** Add sentence feedback to TestView
  - Location: `frontend/src/components/SentenceFeedback.tsx`
  - `SentenceFeedback` component with word-by-word analysis display
  - `SentenceFeedbackCompact` for results view with correct/total count
  - `WordPill` component with status-based styling (correct/missing/wrong/extra)
  - Integrated into `TestView.tsx` with conditional rendering based on `isSentence()`
  - Full-sentence audio replay via existing TTS infrastructure
  - Shows expected words, user's answer, and extra words sections

- [x] **6.4** Implement alignment and scoring
  - Location: `frontend/src/lib/sentenceScoring.ts`
  - Longest Common Subsequence (LCS) algorithm for word alignment
  - `scoreSentence(expected, actual)` returns `SentenceScoringResult`
  - Per-word `WordFeedback` with status: 'correct' | 'missing' | 'wrong'
  - Extra word tracking for words not in expected sentence
  - Helper functions: `normalizeWord()`, `findLCS()`, `getWordStatusClass()`, `getSentenceFeedbackKey()`

- [x] **6.5** Update i18n
  - Both `locales/en/` and `locales/no/`
  - Sentence feedback: "words correct", "Extra words:", "Correct answer:"
  - Grade labels: "1.-2. trinn", "3.-4. trinn", "5.-7. trinn" (in curated content)
  - Challenge mode names in ModeSelectionModal
  - Accessibility labels in aria.ts for sentence components

## Data Models

### SentenceItem

```typescript
interface SentenceItem {
  sentence: string;           // Full sentence text
  translation?: string;       // Optional translation
  focusWords?: string[];      // Words being tested
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  pattern?: string;           // e.g., "S+V+O", "subordinate clause"
}
```

### WordMastery

```typescript
interface WordMastery {
  id: string;
  userId: string;
  wordId: string;
  letterTilesCorrect: number;
  wordBankCorrect: number;
  keyboardCorrect: number;
  createdAt: string;
  updatedAt: string;
}
```

### Extended TestConfiguration

```typescript
interface TestConfiguration {
  // Existing fields...
  maxAttempts: number;
  showCorrectAnswer: boolean;
  autoAdvance: boolean;
  autoPlayAudio: boolean;
  shuffleWords: boolean;

  // New fields
  inputMethod?: 'keyboard' | 'wordBank' | 'letterTiles' | 'auto';
  allowReplay?: boolean;  // Allow practicing easier modes after unlock
}
```

## API Endpoints

### Dictionary (New)

| Method | Endpoint                   | Description                                     |
| ------ | -------------------------- | ----------------------------------------------- |
| GET    | `/api/dictionary/validate` | Validate word, return simplified DictionaryWord |
| GET    | `/api/dictionary/suggest`  | Autocomplete suggestions                        |

### Mastery (New)

| Method | Endpoint                          | Description                              |
| ------ | --------------------------------- | ---------------------------------------- |
| GET    | `/api/mastery`                    | Get all mastery records for current user |
| GET    | `/api/mastery/{wordId}`           | Get mastery for specific word            |
| POST   | `/api/mastery/{wordId}/increment` | Increment mastery counter                |

## Configuration Constants

```typescript
// frontend/src/lib/config.ts

export const MASTERY_CONFIG = {
  LETTER_TILES_REQUIRED: 2,  // Correct answers to unlock word bank
  WORD_BANK_REQUIRED: 2,     // Correct answers to unlock keyboard
};

export const TTS_CONFIG = {
  MAX_SENTENCE_WORDS: 15,    // Hard limit for TTS
  WARN_SENTENCE_WORDS: 12,   // Show warning in editor
  SINGLE_WORD_RATE: 0.8,     // Speaking rate for words
  SENTENCE_RATE: 0.9,        // Speaking rate for sentences
};

export const CHALLENGE_CONFIG = {
  LETTER_DISTRACTORS: 4,     // Extra letters in letter tile mode
  WORD_DISTRACTORS: 3,       // Extra words in word bank mode
  NORWEGIAN_FILLERS: ['og', 'er', 'på', 'en', 'et', 'å', 'i', 'til'],
};

export const DICTIONARY_CONFIG = {
  RATE_LIMIT_MS: 500,        // Min time between requests
  CACHE_TTL_HOURS: 24,       // Cache duration
  BASE_URL: '/api/dictionary',
};
```

## Norwegian Curriculum Alignment (LK20)

| Grade       | Age      | Competencies                                          | Word/Sentence Complexity                         |
| ----------- | -------- | ----------------------------------------------------- | ------------------------------------------------ |
| 1.-2. trinn | 5-7 år   | Sound out syllables, blend letters, basic punctuation | CVC words, 3-5 word sentences                    |
| 3.-4. trinn | 8-9 år   | Double consonants, compounds, verb/noun inflection    | Compounds, 5-8 word sentences                    |
| 5.-7. trinn | 10-12 år | Spelling rules, word inflection, text structure       | Complex words, 10-12 word sentences with clauses |

## Spelling Challenge Categories

### Existing (Already Implemented)

- Dobbelt konsonant (Double consonants)
- Stumme bokstaver (Silent letters: hj-, gj-, kj-, hv-)
- Sammensatte ord (Compound words)
- Diftonger (Diphthongs: ei, øy, au)
- Skj-lyden (Skj-sound variations)
- Æ, Ø og Å (Norwegian special characters)

### New (To Be Added)

- Ng og Nk (ng/nk sound distinction)
- Stum D (Silent d endings)
- Vokalforlengelse (Vowel lengthening: tak/takk)

## Out of Scope (Future Iterations)

- **Inflection drills mode**: Auto-generate challenges using dictionary inflections (katt → kattene)
- **Per-word audio segmentation**: Click individual words in sentences for targeted replay
- **Teacher/classroom mode**: Curriculum progress reports for schools
- **Ordbank API integration**: Full ordbank.uib.no API (requires API key application)

## Testing Strategy

1. **Unit tests**: Challenge generator, LCS alignment, mastery calculation
2. **Component tests**: LetterTileInput, WordBankInput with vitest-axe accessibility
3. **Integration tests**: Dictionary proxy, TTS sentence generation
4. **E2E tests**: Full test flow with progressive unlocking

## Migration Strategy

1. All migrations run automatically on backend startup
2. New fields are nullable/optional for backward compatibility
3. Existing word sets continue to work without modification
4. Curated content added via seed command

## Rollout Plan

1. **Alpha**: Internal testing with development data
2. **Beta**: Limited rollout to test families
3. **GA**: Full release with curated content
