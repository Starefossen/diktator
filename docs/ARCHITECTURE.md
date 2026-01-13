# Diktator - Architecture Overview

## Purpose

Diktator helps children learn vocabulary through audio-based spelling tests. Parents create word sets, children practice spelling by listening and typing, and the system tracks progress over time.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│  (Next.js/SSG)  │     │    (Go/Gin)     │     │   (Cloud SQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      ├────────────────┬────────────────┐
         │                      ▼                ▼                ▼
         │               ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
         │               │   TTS API   │  │ ord.uib.no  │  │   Storage   │
         │               │ (on-demand) │  │ (dictionary)│  │  (GCS/R2)   │
         │               └─────────────┘  └─────────────┘  └─────────────┘
         ▼
  ┌─────────────────┐
  │  OIDC Provider  │
  │   (Zitadel)     │
  └─────────────────┘
```

| Component  | Technology           | Hosting   | Purpose                                      |
| ---------- | -------------------- | --------- | -------------------------------------------- |
| Frontend   | Next.js + TypeScript | Knative   | Static UI served as container                |
| Backend    | Go + Gin             | Knative   | API, business logic, TTS generation          |
| Database   | PostgreSQL           | Cloud SQL | User data, word sets, results                |
| TTS        | Cloud TTS API        | GCP (JIT) | Generate audio on-demand (words & sentences) |
| Auth       | OIDC (Zitadel)       | External  | User authentication                          |
| Dictionary | ord.uib.no           | External  | Norwegian word validation and inflections    |
| Storage    | GCS/R2               | Cloud     | Audio file caching                           |

## Data Model

### Core Entities

```
Family (1) ──────┬──────── (*) FamilyMember ──────── (1) User
                 │            (junction table)           │
                 │                                       │ role: parent | child
                 │                                       │
                 ├──────── (*) FamilyInvitation          ├──── (*) TestResult
                 │            (pending joins)            │          │
                 │                                       │          └── (*) WordAnswer
                 ├──────── (*) WordSet ──── (*) Word     │
                 │                 │                     │
                 │                 └── translations      │
                 │                     (no stored audio) │
                 │                                       │
                 └──────── (*) WordSetAssignment ────────┘
                           (junction: wordset ↔ child user)
```

**Family**: Groups users together via the `family_members` junction table. A family can have multiple parents with equal permissions and any number of children. Word sets and data are family-scoped. Each family has a `created_by` field tracking the original parent, who cannot be removed.

**FamilyMember**: Junction table linking users to families with their role (parent/child) and join date. Enables multi-parent families while maintaining role-based access control.

**User**: Account authenticated via OIDC. Role (parent/child) determines permissions. Users belong to one family; their `family_id` references the family they're currently in.

**FamilyInvitation**: Pending invitation to join a family as a parent or child. Invitations are matched by email address and accepted when the user registers or logs in. Invitations do not expire.

**WordSet**: A collection of words for testing. Has a language, optional translations, and test configuration.

**WordSetAssignment**: Junction table linking word sets to child users. Parents can assign specific word sets to children for targeted practice. Children see all family word sets but assigned ones are prioritized in the UI. Only children can be assigned (enforced by database constraint).

**TestResult**: Record of a completed test with score, mode used, and per-word answers.

### Test Modes

Three test modes determine what the child sees and types:

| Test Mode   | Child Sees           | Child Types |
| ----------- | -------------------- | ----------- |
| Standard    | Word text + audio    | Same word   |
| Dictation   | Audio only (no text) | Heard word  |
| Translation | Word in source lang  | Translation |

See [LEARNING.md](LEARNING.md) for pedagogical rationale behind each mode.

### Input Methods

Three input methods provide progressive scaffolding:

| Input Method | Description                            | Age Range |
| ------------ | -------------------------------------- | --------- |
| Letter Tiles | Tap-to-place scrambled letters         | 5-8       |
| Word Bank    | Tap-to-select words to build sentences | 7-10      |
| Keyboard     | Traditional text input                 | 9+        |

**Auto Mode**: Letter Tiles for single words, Word Bank for sentences.

**Progressive Unlocking**: 2 correct answers unlocks the next input method.

See [LEARNING.md](LEARNING.md) for detailed pedagogy and [DESIGN.md](DESIGN.md) for component specifications.

## Scoring & Mastery

### Per-Word Scoring

Each word in a test is scored based on how many attempts the child needed:

| Attempts | Score | Rationale                          |
| -------- | ----- | ---------------------------------- |
| 1st try  | 100%  | Perfect recall, no hints needed    |
| 2nd try  | 70%   | Minor error, self-corrected        |
| 3rd try  | 40%   | Struggled but eventually succeeded |
| 4+ tries | 0%    | Needs more practice                |

**Test Score** = Average of all word scores in the test.

### Mastery Tracking

Mastery measures a child's proficiency with a word across tests. Different input modes contribute different weights to mastery, reflecting their difficulty:

| Input Mode       | Mastery Weight | Rationale                                     |
| ---------------- | -------------- | --------------------------------------------- |
| Keyboard         | 100%           | Full recall with no scaffolding               |
| Translation      | 100%           | Full recall in target language                |
| Letter Tiles     | 75%            | Moderate scaffolding (letters provided)       |
| Word Bank        | 75%            | Moderate scaffolding (words provided)         |
| Missing Letters  | 50%            | High scaffolding (partial word shown)         |
| Flashcard        | 0%             | Self-reported, not verified                   |
| Look-Cover-Write | 0%             | Self-paced study mode, not counted as mastery |

**Word Mastery** = Weighted average of recent test scores for that word.

### Mastery Thresholds

Mastery level determines adaptive mode recommendations (see [DESIGN.md](DESIGN.md#adaptive-mode-recommendation)):

| Mastery Level | Threshold | Recommendation            |
| ------------- | --------- | ------------------------- |
| Low           | < 50%     | Letter Tiles (most help)  |
| Medium        | 50-80%    | Missing Letters/Flashcard |
| High          | > 80%     | Keyboard (full challenge) |

### TestResult Schema

Each completed test creates a `TestResult` record:

```sql
test_results (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  word_set_id   UUID NOT NULL REFERENCES word_sets(id),
  test_mode     TEXT NOT NULL,      -- 'standard', 'dictation', 'translation'
  input_method  TEXT NOT NULL,      -- 'letterTiles', 'wordBank', 'keyboard', etc.
  score         INTEGER NOT NULL,   -- 0-100, calculated from word_answers
  completed_at  TIMESTAMP NOT NULL,
  family_id     UUID NOT NULL       -- For family-scoped queries
)

word_answers (
  id             UUID PRIMARY KEY,
  test_result_id UUID NOT NULL REFERENCES test_results(id),
  word_id        UUID NOT NULL REFERENCES words(id),
  attempts       INTEGER NOT NULL,  -- 1, 2, 3, or 4+
  is_correct     BOOLEAN NOT NULL,  -- Final result
  user_answer    TEXT               -- What the child typed
)
```

## Security Model

### Authentication & Authorization

```
User ──▶ OIDC Provider ──▶ JWT Token ──▶ Backend validates ──▶ PostgreSQL (family-scoped)
```

1. **Authentication**: OIDC (Zitadel) issues JWT tokens
2. **Authorization**: Backend validates JWT, extracts user identity
3. **Data Isolation**: All queries scoped to user's family ID

### Security Boundaries

| Boundary | Protection                                                    |
| -------- | ------------------------------------------------------------- |
| Public   | API URLs, static assets (harmless to expose)                  |
| Session  | JWT tokens (expire, revocable)                                |
| Data     | Family-scoped queries (parents see family, children see self) |
| Secrets  | Database credentials (backend only, never exposed)            |

### Role-Based Access

| Resource                | Parent | Child |
| ----------------------- | ------ | ----- |
| Create/edit word sets   | ✅      | ❌     |
| Assign word sets        | ✅      | ❌     |
| Invite parents/children | ✅      | ❌     |
| Remove family members   | ✅*     | ❌     |
| View family progress    | ✅      | ❌     |
| Take tests              | ✅      | ✅     |
| View own results        | ✅      | ✅     |

_* Parents cannot remove the `created_by` parent_

### Multi-Parent Model

Families support multiple parent accounts with equal permissions. Parents can:

- Invite additional parents by email address
- Manage all family members (except the original creator)
- Create and edit word sets
- View progress for all family members

**Invitation Flow:**

1. Existing parent enters email address of new parent
2. System creates pending `FamilyInvitation` record
3. When invited user logs in (or registers), they see pending invitation
4. User accepts invitation and joins family as parent
5. User can only be member of one family (accepting new invitation leaves current family)

## Key Design Decisions

### Why Knative?

- Scale-to-zero for cost efficiency
- Standard Kubernetes deployment model
- Container-based, portable across cloud providers

### Why Go Backend?

- Fast, low memory footprint ideal for Knative
- Strong typing catches errors early
- Excellent for API servers

### Why Family-Scoped Data?

- Parents need visibility into children's progress
- Children shouldn't see other families' data
- Simplifies authorization logic

### Why OIDC?

- Industry standard, battle-tested security
- Separates auth concerns from application
- Supports multiple identity providers

### Text-to-Speech (TTS)

The TTS service supports both single words and full sentences:

| Content Type | Speaking Rate | Cache Key Format                 | Max Length |
| ------------ | ------------- | -------------------------------- | ---------- |
| Single Word  | 0.8x (slower) | `word:{hash}:{lang}:{voice}`     | N/A        |
| Sentence     | 0.9x (faster) | `sentence:{hash}:{lang}:{voice}` | 15 words   |

**Sentence Detection**: Content with spaces is automatically treated as a sentence.

**SSML Prosody**: Sentences use SSML for natural pacing:

```xml
<speak><prosody rate="0.9">{sentence}</prosody></speak>
```

## API Design Principles

1. **RESTful**: Standard HTTP verbs and status codes
2. **Family-scoped**: Most endpoints filter by authenticated user's family
3. **Validated**: All input validated before processing
4. **Documented**: OpenAPI/Swagger specification generated from code

## Infrastructure

See HOMELAB.md in the deploy/ directory for deployment architecture and instructions.

## Progressive Web App (PWA)

The frontend is a PWA with offline support:

- **Service Worker**: Caches static assets (HTML, CSS, JS) for offline access
- **Cache Strategy**: Network-first for navigation, cache-first for static files
- **Versioning**: Git commit SHA-based cache invalidation on deployments
- **Updates**: User-prompted (never auto-reload to preserve in-memory state)
- **Development**: Service worker disabled in dev mode to avoid interference

Cache headers ensure `sw.js` is never cached by browsers, allowing immediate updates. The service worker can be disabled remotely via `NEXT_PUBLIC_SW_ENABLED=false` if issues arise.

## For More Information

- **User stories & features**: See [USER-STORIES.md](USER-STORIES.md)
- **Learning methodology**: See [LEARNING.md](LEARNING.md)
- **Visual design system**: See [DESIGN.md](DESIGN.md)
- **Development setup**: See [README.md](../README.md)
- **API documentation**: Run `mise run dev` then visit <http://localhost:8080/docs>
- **Configuration**: Run `mise run --help` for available tasks
