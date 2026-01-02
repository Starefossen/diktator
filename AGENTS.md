# Diktator - Coding Agent Instructions

You are an expert full-stack developer working on **Diktator**, a Norwegian vocabulary learning app for children with gamified spelling tests and practice modes.

## Commands You Can Run

```bash
# Testing (run these to verify changes)
cd backend && go test ./...                  # Backend tests - must pass 100%
cd frontend && pnpm test                     # Frontend tests - must pass 100%

# Database
mise run db:migrate                          # Run migrations after creating them
docker compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d diktator -c "\d tablename"

# Build
cd backend && go build -o bin/seed ./cmd/seed && ./bin/seed   # Rebuild and seed
cd frontend && pnpm build                    # Build frontend

# Development
mise run dev                                 # Full stack (PostgreSQL + frontend + backend)
mise run backend                             # Backend with hot reload (:8080)
mise run frontend                            # Frontend dev server (:3000)
```

## Project Knowledge

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4+
- Backend: Go 1.25+, Gin HTTP framework
- Database: PostgreSQL with pgx/v5 driver
- Auth: OIDC (Zitadel), mock mode for development (`AUTH_MODE=mock`)
- Infrastructure: Google Cloud (Cloud Run, Cloud Storage, Cloud SQL), Terraform

**File Structure:**
```
frontend/src/
  app/           # Next.js App Router pages (NOT Pages Router)
  components/    # Reusable UI components
  contexts/      # React contexts (Auth, Language)
  lib/           # Utilities, API clients, OIDC config
  locales/       # i18n files (en.json, no.json)
backend/
  cmd/server/    # Application entrypoint
  handlers/      # HTTP route handlers
  internal/      # Private application code
    middleware/  # Auth middleware (OIDC)
    models/      # Data models
    services/    # Business logic (db, tts, storage)
terraform/       # Infrastructure (modular files)
migrations/      # Database migrations (000N_*.up.sql, 000N_*.down.sql)
```

**Documentation:**
- Architecture & data model: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Personas & user stories: [docs/USER-STORIES.md](docs/USER-STORIES.md)
- Development setup: [README.md](README.md)

## Code Style Examples

### TypeScript (Frontend)

```typescript
// ✅ Good - Server Component by default, explicit types, descriptive names
interface WordSetCardProps {
  wordSet: WordSet;
  onStartTest: (id: string) => void;
}

export function WordSetCard({ wordSet, onStartTest }: WordSetCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <h3 className="text-lg font-semibold">{wordSet.name}</h3>
      <button
        onClick={() => onStartTest(wordSet.id)}
        className="mt-2 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Start Test
      </button>
    </div>
  );
}

// ✅ Good - Client Component only when needed
'use client';

import { useState } from 'react';

export function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  // ...
}
```

```typescript
// ❌ Bad - vague names, any types, missing error handling
function doThing(x: any) {
  return fetch(x).then(r => r.json());
}
```

### Go (Backend)

```go
// ✅ Good - explicit error handling, structured responses, context usage
func (h *Handler) GetWordSet(c *gin.Context) {
    id := c.Param("id")
    if id == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "word set ID required"})
        return
    }

    wordSet, err := h.db.GetWordSet(c.Request.Context(), id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            c.JSON(http.StatusNotFound, gin.H{"error": "word set not found"})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch word set"})
        return
    }

    c.JSON(http.StatusOK, wordSet)
}
```

```go
// ❌ Bad - ignoring errors, no context
func (h *Handler) GetWordSet(c *gin.Context) {
    wordSet, _ := h.db.GetWordSet(context.Background(), c.Param("id"))
    c.JSON(200, wordSet)
}
```

## Feature Implementation Sequence

When adding features that affect the data model, follow this order:

1. **Database**: Create migration files, run `mise run db:migrate`
2. **Backend**: Update models → services → handlers → tests
3. **Frontend**: Update types → components → contexts → tests
4. **i18n**: Update BOTH `en.json` AND `no.json` together
5. **Seed**: Rebuild seed binary if needed
6. **Tests**: Run all tests - backend AND frontend must pass 100%

## Standards

### Naming Conventions
- TypeScript: camelCase functions, PascalCase components/types
- Go: Exported PascalCase, unexported camelCase
- Database: snake_case tables and columns
- Files: kebab-case for components, snake_case for Go

### Data Model
Family-scoped data model (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)):
- Family contains Users (parent/child roles)
- Family contains WordSets
- Users take Tests which create TestResults
- Parents see all family data, children see only their own

### Security
- All queries scoped to user's family ID
- JWT validation on every API call
- Parents can manage family, children cannot
- No secrets in frontend code

## Boundaries

✅ **Always do:**
- Run tests before completing changes: `cd backend && go test ./...` AND `cd frontend && pnpm test`
- Run migrations immediately after creating them
- Update both i18n files (`en.json` AND `no.json`) together
- Keep types synchronized between backend models and frontend types
- Use App Router patterns (not Pages Router)
- Use Server Components by default, `'use client'` only when needed
- Handle all errors explicitly
- Validate all inputs

⚠️ **Ask first:**
- Database schema changes (may need migration strategy)
- Adding new dependencies
- Changes to authentication flow
- Infrastructure/Terraform modifications

🚫 **Never do:**
- Commit secrets, API keys, or credentials
- Ignore test failures
- Use `any` type in TypeScript
- Skip error handling in Go
- Edit `node_modules/` or `vendor/`
- Create new documentation files summarizing changes
- Use Pages Router patterns

## Common Pitfalls

| Symptom                         | Cause               | Fix                                                        |
| ------------------------------- | ------------------- | ---------------------------------------------------------- |
| `column does not exist`         | Migration not run   | `mise run db:migrate`, verify with `\d tablename`          |
| Shows i18n keys instead of text | Missing translation | Update both `en.json` AND `no.json`                        |
| Type errors frontend/backend    | Types out of sync   | Sync `backend/internal/models/` with `frontend/src/types/` |
| Changes not appearing           | Old binaries        | Rebuild: `go build ./...` or restart dev server            |
| Test failures                   | Outdated seed data  | Rebuild seed: `go build -o bin/seed ./cmd/seed`            |

## Project Context

**Target audience**: Norwegian children learning vocabulary (ages 5-12)

**Core features**:
- Word sets with TTS audio generation
- Three test modes: Standard, Dictation, Translation
- Practice mode with reveal-on-hover
- Family progress tracking
- Parent/child role separation

**Personas** (see [docs/USER-STORIES.md](docs/USER-STORIES.md)):
- **Parent (Erik)**: Creates content, monitors children's progress
- **Child (Sofie, 7)**: Needs simple UI, immediate feedback, audio replay
- **Child (Magnus, 10)**: Self-motivated, wants statistics and challenges

**UI/UX principles**:
- Simple, colorful, gamified interface
- Mobile-first responsive design
- Large touch targets for children
- Immediate visual and audio feedback
