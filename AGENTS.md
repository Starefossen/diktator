# Diktator - Coding Agent Instructions

You are an expert full-stack developer working on **Diktator**, a Norwegian vocabulary learning app for children with gamified spelling tests and practice modes.

## Commands You Can Run

Use mise to run commands in the development environment. Here are some common commands:

- `mise run install` - Install dependencies for both frontend and backend
- `mise run test` - All tests (lint + typecheck + backend + frontend unit tests)
- `mise run check` - Alias for `test`
- `mise run backend:swagger-gen` - Regenerate backend Swagger docs
- `mise run frontend:client-gen` - Regenerate frontend API client from Swagger

Assume dev server is already running with `mise run dev`. Do not run `pnpm` or `go run` directly.

## Project Knowledge

**Tech Stack:** Next.js 16/React 19/TypeScript frontend, Go 1.25+/Gin backend, PostgreSQL. Full details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Key Directories:**

- `frontend/src/` — App Router pages, components, contexts, locales (en/, no/)
- `backend/` — cmd/server/, handlers/, internal/ (middleware, migrate, models, services)
- `docs/` — Architecture, personas, design system

**Documentation:** [ARCHITECTURE.md](docs/ARCHITECTURE.md) (data model, security), [USER-STORIES.md](docs/USER-STORIES.md) (personas), [DESIGN.md](docs/DESIGN.md) (UI/UX, accessibility)

## Code Style Examples

**General principles:**

- Write self-documenting code with descriptive names
- Only add inline comments to explain WHY (not WHAT) - code should be clear enough to explain what it does
- Never use emojis in code or UI - use Heroicons for iconography instead

### TypeScript (Frontend)

```typescript
// ✅ Server Component by default, explicit types, descriptive names
interface WordSetCardProps {
  wordSet: WordSet;
  onStartTest: (id: string) => void;
}

export function WordSetCard({ wordSet, onStartTest }: WordSetCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <h3 className="text-lg font-semibold">{wordSet.name}</h3>
      <button onClick={() => onStartTest(wordSet.id)} className="mt-2 rounded bg-blue-600 px-4 py-2 text-white">
        Start Test
      </button>
    </div>
  );
}

// Use 'use client' only when needed (useState, useEffect, event handlers)
```

### Go (Backend)

```go
// ✅ Explicit error handling, structured responses, context usage
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

## Feature Implementation Sequence

When adding features that affect the data model, follow this order:

1. **Database**: Create migration files in `backend/internal/migrate/migrations/`
2. **Backend**: Update models → services → handlers → tests
3. **Frontend**: Update types → components → contexts → tests
4. **i18n**: Update BOTH English AND Norwegian translations together (locales/en/ and locales/no/)
5. **Seed**: Rebuild seed binary if needed
6. **Tests**: Run all tests - backend AND frontend must pass 100%

**Note:** Database migrations run automatically on backend startup.

### Database Migration Guidelines

Migrations must be **production-safe** and **idempotent**. Naming: `NNNNNN_descriptive_name.{up,down}.sql`

1. **Drop constraints BEFORE updating data** — Most common pitfall:

   ```sql
   ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_mode_check;
   UPDATE test_results SET mode = 'new_value' WHERE mode = 'old_value';
   ALTER TABLE test_results ADD CONSTRAINT test_results_mode_check CHECK (mode IN ('new_value'));
   ```

2. **Use IF EXISTS/IF NOT EXISTS** — All DDL must be safe to run multiple times
3. **Test locally first** — `docker-compose down -v && docker-compose up -d postgres && mise run dev`
4. **Backwards compatible** — Add nullable columns first, drop columns only after code stops using them
5. **Always include `.down.sql`** — For rollback capability

## Standards

### Naming Conventions

- TypeScript: camelCase functions, PascalCase components/types
- Go: Exported PascalCase, unexported camelCase
- Database: snake_case tables and columns
- Files: kebab-case for components, snake_case for Go

### Data Model & Security

Family-scoped architecture — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details.

**Critical rules:** All queries scoped to user's family ID. JWT validation on every API call. No secrets in frontend.

## Boundaries

✅ **Always do:**

- Run tests before completing changes: `mise run check` AND `mise run test`
- Update both i18n translations (en/ AND no/) together, including aria.ts for accessibility
- Keep types synchronized between backend models and frontend types
- Use App Router patterns (not Pages Router)
- Use Server Components by default, `'use client'` only when needed
- Handle all errors explicitly
- Validate all inputs
- Ensure WCAG 2.1 AA compliance: min-h-12 touch targets, 4.5:1 contrast, ARIA labels, semantic HTML

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
- Create new documentation files summarizing changes (unless explicitly requested)
- Provide lengthy summaries after coding sessions - keep responses concise
- Use Pages Router patterns
- Add inline code comments that explain WHAT code does (only WHY when necessary)
- Use emojis in code or UI (use Heroicons instead)

## Common Pitfalls

| Symptom                         | Cause               | Fix                                                        |
| ------------------------------- | ------------------- | ---------------------------------------------------------- |
| `relation does not exist`       | Migration not run   | Restart backend (migrations run on startup)                |
| Shows i18n keys instead of text | Missing translation | Update both `locales/en/` AND `locales/no/`                |
| Type errors frontend/backend    | Types out of sync   | Sync `backend/internal/models/` with `frontend/src/types/` |
| Changes not appearing           | Old binaries        | Rebuild: `go build ./...` or restart dev server            |
| Test failures                   | Outdated seed data  | Rebuild seed: `go build -o bin/seed ./cmd/seed`            |
| Accessibility lint errors       | Missing ARIA        | Add aria-label, use button not div, ensure min-h-12        |
| Vitest type errors              | Wrong tsconfig      | Use separate `tsconfig.test.json` with vitest/globals      |

## Project Context

**Target:** Norwegian children (ages 5-12) learning vocabulary with gamified spelling tests.

**Personas:** Parent (Erik), Child (Sofie, 7), Child (Magnus, 10) — see [docs/USER-STORIES.md](docs/USER-STORIES.md)

**UI/UX:** Mobile-first, large touch targets, immediate feedback — see [docs/DESIGN.md](docs/DESIGN.md)

## Accessibility Standards

**WCAG 2.1 Level AA** — Full guidelines in [docs/DESIGN.md](docs/DESIGN.md#accessibility)

**Critical rules:**

- Touch targets: `min-h-12` (48px) on all interactive elements
- Typography: `text-base` (16px) minimum, never `text-sm` for primary content
- Contrast: 4.5:1 ratio — use `text-gray-600` not `text-gray-400`
- ARIA: Labels in `locales/*/aria.ts`, icon-only buttons need `aria-label`
- Semantic HTML: Use `<button>` not `<div>` for clickable elements

```typescript
// ✅ Good
<button
  onClick={() => playAudio(word.id)}
  className="rounded-full bg-blue-500 p-2 min-h-12 min-w-12"
  aria-label={t('aria.playAudio', { word: word.text })}
>
  <SpeakerIcon className="h-5 w-5" aria-hidden="true" />
</button>

// ❌ Bad - div for click, no aria-label, small target
<div onClick={handleClick} className="py-1 text-xs cursor-pointer"><TrashIcon /></div>
```

**Testing:** vitest-axe integration, jsx-a11y ESLint rules, `mise run check` includes a11y linting
