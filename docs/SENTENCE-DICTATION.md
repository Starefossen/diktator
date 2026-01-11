# Sentence Dictation Implementation Plan

> **Status**: In Progress (Phase 2 Complete)
> **Created**: 2026-01-11
> **Last Updated**: 2026-01-11

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

### Phase 3: TTS Sentence Support ⬜

- [ ] **3.1** Extend TTS service for sentences
  - Add `GenerateSentenceAudio(sentence, language)` method
  - Use SSML: `<speak><prosody rate="0.9">{sentence}</prosody></speak>`
  - Cache key: `sentence:{hash}:{lang}:{voice}`
  - Keep 0.8x rate for single words, 0.9x for sentences

### Phase 4: Curated Content ⬜

- [ ] **4.1** Extend `CuratedWordSet` model
  - Add `target_grade` field: "1-2", "3-4", "5-7"
  - Add `spelling_focus` array: ["double_consonant", "silent_letter", etc.]
  - Add `difficulty` field: "beginner", "intermediate", "advanced"
  - Add `sentences` array with `SentenceItem` type

- [ ] **4.2** Add new spelling rule sets
  - "Ng og Nk": sang, lang, tenke, drikke, synke, ringe, finger, bank, tung
  - "Stum D": land, sand, rund, holde, vind, kind, bord, ord, gård, fjord
  - "Vokalforlengelse": tak/takk, bok/bokk, sol/sopp, mat/matt, bil/ball

- [ ] **4.3** Add thematic sets by grade
  - "Naturen": fjell, innsjø, elv, skog, strand, himmel, regn, snø, blomst, tre
  - "Kroppen": hjerne, hjerte, mage, albue, skulder, finger, ankel, rygg, kne
  - "Tid og Kalender": mandag, tirsdag, januar, februar, vår, sommer, høst, vinter

- [ ] **4.4** Add sentence sets by difficulty
  - Beginner (7-8 år): "Katten sover på stolen." (S+V+O, 4-5 words)
  - Intermediate (9-10 år): "Sommerfuglen flyr over blomstene i hagen." (6-8 words)
  - Advanced (11-12 år): "Selv om været var dårlig, bestemte vi oss for å gå på tur." (10-12 words)

### Phase 5: Progressive Input Components ⬜

- [ ] **5.1** Create challenge generator
  - Location: `frontend/src/lib/challenges.ts`
  - `generateLetterTiles(word)`: Scramble + phonetically similar Norwegian distractors (ø/o, æ/e, kj/k)
  - `generateWordBank(word, wordSet)`: 3 distractors from same set + Norwegian fillers ("og", "er", "på", "en", "et", "å")
  - `getNextChallengeMode(mastery)`: letterTiles until 2 correct → wordBank until 2 correct → keyboard
  - Support replay of easier modes after unlock

- [ ] **5.2** Create `LetterTileInput` component
  - Location: `frontend/src/components/LetterTileInput.tsx`
  - Tap-to-place interaction (no drag)
  - Slot-based answer area matching word length
  - 48px+ touch targets (min-h-12)
  - Phonetically similar Norwegian distractors
  - "Øv på nytt" replay toggle
  - Visual feedback: nordic colors for placed, green/red for correct/wrong

- [ ] **5.3** Create `WordBankInput` component
  - Location: `frontend/src/components/WordBankInput.tsx`
  - Wrapped flexbox layout with word pills
  - Answer slots showing expected word count
  - Tap-to-add, tap-to-remove interaction
  - Replay option after keyboard unlock
  - Selected state: `opacity-50 line-through`

### Phase 6: UI Integration ⬜

- [ ] **6.1** Add input method selector to ModeSelectionModal
  - Show current unlock level per word
  - Mastery progress bar
  - Replay mode toggle ("Øv på nytt")
  - Auto-select based on child's birth year (≤7 = letter tiles/word bank)

- [ ] **6.2** Add editor feedback UI in WordSetEditor
  - Word count badge for sentences
  - Difficulty auto-classification (beginner/intermediate/advanced)
  - Grade-level recommendation
  - Optional "Validate" button → calls dictionary proxy
  - On success: show inflections preview
  - On failure: warning "Kunne ikke validere - ordet kan fortsatt være riktig" with proceed option
  - Non-blocking: custom vocabulary allowed without validation

- [ ] **6.3** Create `SentenceTestView` component
  - Location: `frontend/src/components/SentenceTestView.tsx`
  - Integrates `LetterTileInput`, `WordBankInput`, or textarea based on mode
  - Full-sentence audio replay (no per-word segmentation)
  - Non-clearing display (don't clear on submit like single words)
  - Inline word-by-word feedback using `SpellingFeedback` patterns
  - Mode switching based on mastery

- [ ] **6.4** Implement alignment and scoring
  - Location: `frontend/src/lib/spelling.ts`
  - Longest Common Subsequence (LCS) algorithm for word alignment
  - Per-word `analyzeSpelling()` for Norwegian error hints
  - Partial credit: `(correct_words / total_words) × attempt_modifier`
  - Mastery increment on success (configurable threshold from global config)

- [ ] **6.5** Update i18n
  - Both `locales/en/` and `locales/no/`
  - Grade labels: "1.-2. trinn", "3.-4. trinn", "5.-7. trinn"
  - Mastery strings: "Du har mestret bokstavbrikker!", "Prøv ordbank nå"
  - Challenge mode names: "Bokstavbrikker", "Ordbank", "Tastatur"
  - Replay text: "Øv på nytt"
  - Dictionary validation: "Validerer...", "Kunne ikke validere", "Ord funnet i ordboken"
  - Sentence feedback: "X av Y ord riktig"

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
