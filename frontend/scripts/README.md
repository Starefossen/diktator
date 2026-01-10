# Frontend Scripts

This directory contains development and build scripts for the Diktator frontend.

## check-i18n.ts

A comprehensive i18n (internationalization) validation tool that ensures translation consistency across the codebase using AST parsing.

### Features

1. **Unused Key Detection** - Finds translation keys defined in locale files but never used in code
2. **Missing Key Detection** - Finds translation keys used in code but not defined in locale files
3. **Hardcoded String Detection** - Uses SWC AST parsing to find untranslated strings in TSX files
4. **Dynamic Key Support** - Handles dynamically generated translation keys (e.g., template strings)
5. **Allowlist System** - Categorizes unused keys as dead code, future features, or dynamic usage

### Usage

```bash
# Run all checks
npx tsx scripts/check-i18n.ts

# Quiet mode (minimal output, good for CI)
npx tsx scripts/check-i18n.ts -q
npx tsx scripts/check-i18n.ts --quiet

# List all allowlisted unused keys with categories
npx tsx scripts/check-i18n.ts --list-allowlisted

# Skip hardcoded string detection (faster)
npx tsx scripts/check-i18n.ts --skip-hardcoded
```

### Exit Codes

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| 0    | All validations passed                                         |
| 1    | Errors found (missing keys, unused keys, or hardcoded strings) |

### Hardcoded String Detection

The script uses [@swc/core](https://swc.rs/) to parse TSX files and detect strings that should be translated.

#### What Gets Flagged

- **JSX Text Content**: Text directly inside JSX elements
- **Translatable Attributes**: `aria-label`, `aria-placeholder`, `aria-valuetext`, `title`, `alt`, `placeholder`

#### What Gets Skipped

- **Technical Attributes**: `className`, `id`, `href`, `src`, `type`, `name`, `value`, etc.
- **Event Handlers**: Any attribute starting with `on` (onClick, onChange, etc.)
- **Boolean ARIA Attributes**: `aria-hidden`, `aria-expanded`, `aria-disabled`, etc.
- **SVG Attributes**: `viewBox`, `fill`, `stroke`, `d`, etc.
- **Component Props**: `variant`, `size`, `mode`, `loading`, etc.
- **Technical Patterns**: URLs, file paths, CSS values, hex colors, constants

#### Suppressing False Positives

Use `{/* i18n-ignore */}` comments to suppress specific strings that intentionally shouldn't be translated:

```tsx
// JSX comment style (recommended)
{/* i18n-ignore */}
<span>Version 1.0.0</span>

// JavaScript comment style (for inline suppressions)
// i18n-ignore
<button title="API v2">Click</button>
```

The ignore comment must appear within 200 characters before the string.

### Allowlist Categories

Unused keys can be allowlisted by adding prefixes to the configuration arrays:

| Category                  | Purpose                              | Example              |
| ------------------------- | ------------------------------------ | -------------------- |
| `DEAD_CODE_PREFIXES`      | Safe to remove, legacy code          | (currently empty)    |
| `FUTURE_FEATURE_PREFIXES` | Planned features not yet implemented | `auth.invitations.*` |
| `DYNAMIC_USAGE_PREFIXES`  | Keys used dynamically at runtime     | `wordsets.mode.*`    |
| `KNOWN_DYNAMIC_PREFIXES`  | Keys built with template strings     | `stavle.companion.*` |

### Integration with Build Pipeline

The script is integrated into the check command:

```json
{
  "scripts": {
    "check": "tsc --noEmit && eslint . && prettier --write . && knip --fix && tsx scripts/check-i18n.ts -q && vitest run",
    "i18n:check": "tsx scripts/check-i18n.ts"
  }
}
```

### Technical Notes

#### SWC Span Offset Handling

SWC's parser uses a global span counter that accumulates across multiple `parse()` calls within the same process. The script handles this by:

1. Extracting `ast.span.start` as `baseOffset` after parsing each file
2. Subtracting `baseOffset` from all node spans to get file-relative positions
3. Using adjusted offsets for ignore comment detection and line number calculation

This ensures accurate source location reporting regardless of parse order.

#### Adding New Locale Modules

When adding a new locale module (e.g., `src/locales/en/newmodule.ts`), add it to the `moduleFiles` array in `getDefinedKeys()`:

```typescript
const moduleFiles = [
  "auth",
  "family",
  "wordsets",
  "common",
  "profile",
  "results",
  "test",
  "aria",
  "newmodule", // Add here
];
```

### Example Output

```text
🔍 Checking i18n translation keys...

📊 Statistics:
   - Total defined keys: 825
   - Keys used in code: 562
   - Allowlisted unused: 263
   - Dynamic key patterns: 0
   - Hardcoded strings: 0

✅ All translation keys are valid!
```

When errors are found:

```text
❌ Missing translation keys (used but not defined):

   - newFeature.title
   - newFeature.description

❌ Hardcoded strings found (should use t() for translation):

   app/about/page.tsx:
     L15:12 "Welcome to our app"
     L23:8 [aria-label] "Close menu"

💡 Tips:
   - Missing keys: Add them to the appropriate locale file in src/locales/en/
   - Hardcoded strings: Replace with t('key') or suppress with {/* i18n-ignore */}
```

### Dependencies

- `@swc/core` - Fast TypeScript/TSX parser
- `tsx` - TypeScript execution (for running the script)
