# Diktator - Coding Agent Instructions

You are an expert full-stack developer working on **Diktator**, a Norwegian vocabulary learning app for children with gamified spelling tests and practice modes.

## Commands You Can Run

Use mise to run commands in the development environment. Here are some common commands:

```bash
- `mise run install` - Install dependencies for both frontend and backend
- `mise run test` - All tests (lint + typecheck + backend + frontend unit tests)
- `mise run check` - Alias for `test`
- `mise run backend:swagger-gen` - Regenerate backend Swagger docs
- `mise run frontend:client-gen` - Regenerate frontend API client from Swagger
```

Assume dev server is already running with `mise run dev`. Do not run `pnpm` or `go run` directly.

## Project Knowledge

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4+ static export PWA
- Backend: Go 1.25+, Gin HTTP framework
- Database: PostgreSQL with pgx/v5 driver
- Auth: OIDC (Zitadel), mock mode for development (`AUTH_MODE=mock`)
- Infrastructure: Knative on HOMELAB-cluster (see deploy/HOMELAB.md)

**File Structure:**
```
frontend/src/
  app/           # Next.js App Router pages (NOT Pages Router)
  components/    # Reusable UI components
  contexts/      # React contexts (Auth, Language)
  lib/           # Utilities, API clients, OIDC config
  locales/       # i18n files (en/, no/ with common.ts, aria.ts, etc.)
  test/          # Test utilities (setup.ts, vitest-axe.d.ts)
backend/
  cmd/server/    # Application entrypoint
  handlers/      # HTTP route handlers
  internal/      # Private application code
    middleware/  # Auth middleware (OIDC)
    migrate/     # Database migrations (embedded, auto-run on startup)
    models/      # Data models
    services/    # Business logic (db, tts, storage)
terraform/       # Infrastructure (modular files)
```

**Documentation:**

- Architecture & data model: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Personas & user stories: [docs/USER-STORIES.md](docs/USER-STORIES.md)
- Development setup: [README.md](README.md)

## Code Style Examples

**General principles:**

- Write self-documenting code with descriptive names
- Only add inline comments to explain WHY (not WHAT) - code should be clear enough to explain what it does
- Never use emojis in code or UI - use Heroicons for iconography instead

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

1. **Database**: Create migration files in `backend/internal/migrate/migrations/`
2. **Backend**: Update models → services → handlers → tests
3. **Frontend**: Update types → components → contexts → tests
4. **i18n**: Update BOTH English AND Norwegian translations together (locales/en/ and locales/no/)
5. **Seed**: Rebuild seed binary if needed
6. **Tests**: Run all tests - backend AND frontend must pass 100%

**Note:** Database migrations run automatically on backend startup.

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

## Accessibility Standards

**WCAG 2.1 Level AA Compliance** - Critical for children ages 5-12:

### Touch Targets

- **Minimum 48px**: All buttons, links, and interactive elements must be min-h-12 (48px)
- **Global classes**: Use `.btn-primary` and `.btn-secondary` with py-4 min-h-12
- **Form inputs**: Always min-h-12 for child-friendly interaction
- **Navigation**: py-3 text-base minimum for menu items

### Typography

- **Primary content**: text-base (16px) minimum, NOT text-sm
- **Responsive scaling**: Add md:text-lg to important stats and content
- **Badges/labels**: text-sm font-semibold minimum (was text-xs)
- **Avoid text-sm globally**: Only use for truly secondary content

### Color Contrast

- **Minimum 4.5:1 ratio**: All text must meet WCAG AA standards
- **Common fixes**: text-gray-400 → text-gray-600, test with contrast checkers
- **Badges on colored backgrounds**: Ensure sufficient contrast

### ARIA Support

- **i18n integration**: All ARIA labels in `locales/en/aria.ts` and `locales/no/aria.ts`
- **Icon-only buttons**: Always include aria-label (e.g., "Play audio", "Delete word set")
- **Loading states**: role="status" aria-live="polite" with sr-only text
- **Dynamic content**: Use ARIA live regions for test feedback
- **Forms**: HTML5 validation preferred, ARIA support for errors

### Keyboard Navigation

- **Semantic markup**: Use `<button>` not `<div>` for clickable elements
- **Focus indicators**: focus-visible:ring-2 focus-visible:ring-blue-600 with sufficient contrast
- **Tab order**: Logical flow through interactive elements
- **Word pills**: Convert to buttons with proper aria-labels when interactive

### Testing & Enforcement

- **Automated testing**: vitest-axe integration for component tests
- **Example test**: See `frontend/src/components/__tests__/ModeSelectionModal.test.tsx`
- **ESLint rules**: Strict jsx-a11y configuration in eslint.config.js
- **Run checks**: `mise run check` includes accessibility linting

### Common Patterns

```typescript
// ✅ Good - Semantic button with ARIA label
import { useTranslation } from '@/hooks/useTranslation';

const { t } = useTranslation();
<button
  onClick={() => playAudio(word.id)}
  className="rounded-full bg-blue-500 p-2 hover:bg-blue-600 min-h-12 min-w-12"
  aria-label={t('aria.playAudio', { word: word.text })}
>
  <SpeakerIcon className="h-5 w-5" aria-hidden="true" />
</button>

// ✅ Good - Loading state with ARIA
<div role="status" aria-live="polite" className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  <span className="sr-only">{t('aria.loading')}</span>
</div>

// ❌ Bad - Interactive div without keyboard support
<div onClick={() => handleClick()} className="cursor-pointer">
  Click me
</div>

// ❌ Bad - Text too small, insufficient touch target
<button className="py-1 text-xs">
  Submit
</button>

// ❌ Bad - Icon without label
<button onClick={() => deleteItem()}>
  <TrashIcon />
</button>
```

### Key Learnings

1. **TypeScript config for tests**: Use separate `tsconfig.test.json` with vitest/globals types
2. **ESLint intentional patterns**: Disable rules at config level (not inline) for documented UX patterns
3. **Touch target calculation**: py-4 (1rem = 16px × 2 = 32px) + min-h-12 (48px) ensures 48px minimum
4. **ARIA translations**: Keep ARIA labels separate from UI text for clarity and maintenance
5. **Semantic HTML first**: Use native HTML elements before adding ARIA (e.g., `<button>` over `<div role="button">`)
