#!/usr/bin/env npx tsx
/**
 * i18n Translation Key Validator
 *
 * This script checks for:
 * 1. Unused translation keys (defined but not used in source code)
 * 2. Missing translation keys (used in source code but not defined)
 * 3. Hardcoded strings in TSX files that should be translated
 *
 * Usage: npx tsx scripts/check-i18n.ts
 *
 * Options:
 *   --list-allowlisted  Show all allowlisted unused keys
 *   -q, --quiet         Minimal output
 *   --skip-hardcoded    Skip hardcoded string detection
 *
 * Exit codes:
 *   0 - All keys valid
 *   1 - Errors found (missing keys, unused keys, or hardcoded strings)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "@swc/core";
import { Visitor } from "@swc/core/Visitor.js";
import type {
  JSXText,
  JSXAttribute,
  StringLiteral,
  ImportDeclaration,
  TsType,
  CallExpression,
  Span,
} from "@swc/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, "..", "src");
const LOCALES_DIR = path.join(SRC_DIR, "locales");

// Prefixes that are known to be used dynamically (built at runtime from base keys)
// These keys are referenced with template strings or dynamic concatenation
const KNOWN_DYNAMIC_PREFIXES = [
  "stavle.companion.", // Used with selectRandomVariant() for .1, .2, .3 suffixes
  "aria.stavle.", // ARIA labels for Stavle poses
  "mastery.difficulty.", // Used dynamically in CuratedWordSetCard for difficulty badges
];

// Keys that are intentionally defined but may not be directly used in code
// (e.g., prepared for future features, used in tests, or used via dynamic lookup)
// These produce warnings but don't fail the check

// CATEGORY: DEAD_CODE - Safe to remove, legacy/unused code
// All dead code has been removed - this category is now empty
const DEAD_CODE_PREFIXES: string[] = [];

// CATEGORY: FUTURE - Keep for planned features
const FUTURE_FEATURE_PREFIXES = [
  // Invitation flow (planned)
  "auth.register.invitation.",
  "auth.invitations.",
  "family.invitation.",
  // Family management (partially implemented)
  "family.member.",
  "family.parents.",
  "family.child.",
  "family.back",
  "family.test.",
  // Results page filters and detailed stats
  "results.filters.",
  "results.history.",
  "results.details.",
  "results.distribution.",
  "results.empty.",
  "results.error.",
  "results.achievement.",
  "results.retry",
  // Profile settings
  "profile.settings.",
  // Auth form fields
  "auth.password",
  "auth.role",
  "auth.signin.",
  "auth.signup.",
  // Spelling hints (can be enabled for Norwegian)
  "test.hint.",
];

// CATEGORY: DYNAMIC - Used dynamically or via ARIA
const DYNAMIC_USAGE_PREFIXES = [
  // ARIA labels
  "aria.",
  // Word set config/status/time keys (object property access)
  "wordsets.config.",
  "wordsets.status.",
  "wordsets.time.",
  "wordsets.practice.key",
  "wordsets.mode.",
  "wordsets.assignment.",
  "wordsets.safari.",
  // Word set toast messages
  "wordsets.createSuccess",
  "wordsets.updateSuccess",
  "wordsets.deleteSuccess",
  "wordsets.deleteError",
  "wordsets.audioGeneration",
  "wordsets.audioGenerationSuccess",
  "wordsets.audioError",
  "wordsets.nameRequired",
  // Word set card details
  "wordsets.childrenProgress",
  "wordsets.moreChildren",
  "wordsets.moreWords",
  "wordsets.created",
  "wordsets.withAudio",
  "wordsets.attempt",
  "wordsets.attempts",
  "wordsets.editTitle",
  "wordsets.editWordSet",
  "wordsets.generateAudio",
  // Results keys
  "results.",
  // Profile keys
  "profile.",
  // Test page keys
  "test.",
  // Common
  "common.words",
  // Challenge/mastery mode labels (some used as fallbacks)
  "challenge.letterTiles",
  "challenge.wordBank",
  "challenge.keyboard",
  "challenge.masteryProgress",
  "challenge.practiceAgain",
  "challenge.modeUnlocked",
  "challenge.tryWordBank",
  "challenge.tryKeyboard",
  // Sentence difficulty (used dynamically via template literal)
  "sentence.difficulty.",
  // Mastery difficulty (used dynamically via template literal for wordset cards)
  "mastery.difficulty.",
  // Test modes (accessed dynamically via mode.metadata nameKey/descKey)
  "modes.",
  // Mode selector (accessed dynamically via reasonKey string)
  "modeSelector.unavailable",
  // Mastery unlocking system (used in challenges.ts and test views)
  "mastery.keyboard",
  "mastery.letterTiles",
  "mastery.wordBank",
  "mastery.recommended",
  "mastery.replayMode",
  "mastery.selectMethod",
];

const ALLOWLISTED_UNUSED_PREFIXES = [
  ...DEAD_CODE_PREFIXES,
  ...FUTURE_FEATURE_PREFIXES,
  ...DYNAMIC_USAGE_PREFIXES,
];

// Attributes that should NEVER contain user-visible text (skip entirely)
const SKIP_ATTRIBUTES = new Set([
  // Technical/styling
  "className",
  "class",
  "id",
  "key",
  "ref",
  "style",
  "dangerouslySetInnerHTML",
  // Data attributes
  "data-testid",
  "data-test",
  "data-cy",
  "data-state",
  // URLs and sources
  "href",
  "src",
  "srcSet",
  "action",
  // Media/audio attributes
  "preload",
  // Form technical
  "type",
  "name",
  "value",
  "defaultValue",
  "htmlFor",
  "autoComplete",
  "autoCorrect",
  "autoCapitalize",
  "inputMode",
  "enterKeyHint",
  "pattern",
  "accept",
  "method",
  "encType",
  // Layout/positioning
  "role",
  "tabIndex",
  "target",
  "rel",
  // SVG attributes
  "viewBox",
  "preserveAspectRatio",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "width",
  "height",
  "xmlns",
  "xmlnsXlink",
  "transform",
  "clipPath",
  "clipRule",
  "fillRule",
  "points",
  "rx",
  "ry",
  // Component variant/size props (technical, not user-facing)
  "variant",
  "size",
  "as",
  "pose",
  "mode",
  "page",
  "lang",
  "color",
  "align",
  "justify",
  "direction",
  "spacing",
  "gap",
  "loading",
  "disabled",
  "selected",
  "checked",
  "open",
  "closed",
  "active",
  "inactive",
  "status",
  "state",
  "position",
  "placement",
  "orientation",
  "axis",
  "side",
  "sideOffset",
  "alignOffset",
  "collisionPadding",
  "arrowPadding",
  "sticky",
  "hideWhenDetached",
  "avoidCollisions",
  "loop",
  "modal",
  "forceMount",
  "defaultOpen",
  "defaultChecked",
  "defaultValue",
  "asChild",
]);

// ARIA attributes that only have boolean/technical values
const SKIP_ARIA_BOOLEAN = new Set([
  "aria-hidden",
  "aria-expanded",
  "aria-selected",
  "aria-checked",
  "aria-disabled",
  "aria-readonly",
  "aria-required",
  "aria-pressed",
  "aria-current",
  "aria-busy",
  "aria-live",
  "aria-atomic",
  "aria-haspopup",
  "aria-controls",
  "aria-describedby",
  "aria-labelledby",
  "aria-owns",
  "aria-flowto",
  "aria-activedescendant",
  "aria-colcount",
  "aria-colindex",
  "aria-colspan",
  "aria-rowcount",
  "aria-rowindex",
  "aria-rowspan",
  "aria-level",
  "aria-posinset",
  "aria-setsize",
  "aria-valuemax",
  "aria-valuemin",
  "aria-valuenow",
  "aria-orientation",
  "aria-sort",
  "aria-autocomplete",
  "aria-multiline",
  "aria-multiselectable",
  "aria-relevant",
  "aria-dropeffect",
  "aria-grabbed",
  "aria-modal",
  "aria-errormessage",
  "aria-details",
  "aria-keyshortcuts",
  "aria-roledescription",
]);

// ARIA attributes that SHOULD be translated
const TRANSLATABLE_ARIA = new Set([
  "aria-label",
  "aria-placeholder",
  "aria-valuetext",
]);

// Other attributes that SHOULD be translated (user-visible)
const TRANSLATABLE_ATTRIBUTES = new Set(["title", "alt", "placeholder"]);

// Patterns that indicate non-user-facing strings
const SKIP_PATTERNS = [
  /^https?:\/\//, // URLs
  /^\/[a-z]/i, // Paths starting with /
  /^\.\.\//, // Relative paths
  /^[A-Z_]+$/, // CONSTANTS
  /^[a-z]+[A-Z]/, // camelCase (likely variable names)
  /^#[0-9a-fA-F]+$/, // Hex colors
  /^\d+(\.\d+)?(px|em|rem|%|vh|vw|s|ms)?$/, // CSS values
  /^[a-z]+(-[a-z]+)+$/, // kebab-case (CSS classes, IDs)
  /^(GET|POST|PUT|DELETE|PATCH)$/, // HTTP methods
  /^(true|false|null|undefined)$/, // Boolean/null literals
  /^\{.*\}$/, // Object-like strings
  /^\[.*\]$/, // Array-like strings
];

// Minimum alphabetic characters for a string to be considered translatable
const MIN_ALPHA_CHARS = 2;

interface HardcodedString {
  file: string;
  line: number;
  column: number;
  text: string;
  context: "text" | "attribute";
  attributeName?: string;
}

interface ValidationResult {
  unusedKeys: string[];
  missingKeys: string[];
  dynamicKeyUsages: string[];
  allowlistedUnused: string[];
  hardcodedStrings: HardcodedString[];
}

/**
 * Check if a string should be skipped (not user-facing)
 */
function shouldSkipString(text: string): boolean {
  const trimmed = text.trim();

  // Skip empty or whitespace-only
  if (!trimmed) return true;

  // Skip very short strings
  if (trimmed.length < 2) return true;

  // Count alphabetic characters
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount < MIN_ALPHA_CHARS) return true;

  // Skip strings matching technical patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Get line number from span offset
 */
function getLineFromOffset(
  source: string,
  offset: number,
): { line: number; column: number } {
  const lines = source.slice(0, offset).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

/**
 * Check if a position is preceded by an i18n-ignore comment
 * @param source - The source code
 * @param offset - The adjusted offset (already accounting for base offset)
 */
function hasIgnoreComment(source: string, offset: number): boolean {
  // Look back up to 200 chars for a comment
  const start = Math.max(0, offset - 200);
  const beforeText = source.slice(start, offset);

  // Check for {/* i18n-ignore */} or // i18n-ignore
  return /\{\/\*\s*i18n-ignore\s*\*\/\}|\/\/\s*i18n-ignore/.test(beforeText);
}

/**
 * AST Visitor to find hardcoded strings in JSX
 */
class HardcodedStringVisitor extends Visitor {
  public strings: HardcodedString[] = [];
  private source: string;
  private filePath: string;
  private baseOffset: number;
  private inTCall = false;

  constructor(source: string, filePath: string, baseOffset: number) {
    super();
    this.source = source;
    this.filePath = filePath;
    this.baseOffset = baseOffset;
  }

  /**
   * Adjust a span offset to be relative to the source file
   */
  private adjustOffset(spanStart: number): number {
    return spanStart - this.baseOffset;
  }

  // Skip import declarations
  visitImportDeclaration(n: ImportDeclaration): ImportDeclaration {
    return n;
  }

  // Skip TypeScript type annotations
  visitTsType(n: TsType): TsType {
    return n;
  }

  // Track when we're inside a t() call
  visitCallExpression(n: CallExpression): CallExpression {
    if (n.callee.type === "Identifier" && n.callee.value === "t") {
      this.inTCall = true;
      super.visitCallExpression(n);
      this.inTCall = false;
      return n;
    }
    super.visitCallExpression(n);
    return n;
  }

  // Check JSX text content
  visitJSXText(n: JSXText): JSXText {
    if (this.inTCall) return n;

    const text = n.value;
    if (!shouldSkipString(text)) {
      const adjustedOffset = this.adjustOffset(n.span.start);
      if (!hasIgnoreComment(this.source, adjustedOffset)) {
        const { line, column } = getLineFromOffset(this.source, adjustedOffset);
        this.strings.push({
          file: this.filePath,
          line,
          column,
          text:
            text.trim().slice(0, 50) + (text.trim().length > 50 ? "..." : ""),
          context: "text",
        });
      }
    }
    return n;
  }

  // Check JSX attribute string values
  visitJSXAttribute(n: JSXAttribute): JSXAttribute {
    if (this.inTCall) return n;

    // Get attribute name
    let attrName: string;
    if (n.name.type === "Identifier") {
      attrName = n.name.value;
    } else {
      // JSXNamespacedName
      attrName = `${n.name.namespace.value}:${n.name.name.value}`;
    }

    // Skip non-translatable attributes
    if (SKIP_ATTRIBUTES.has(attrName)) return n;
    if (attrName.startsWith("on")) return n; // Event handlers
    if (SKIP_ARIA_BOOLEAN.has(attrName)) return n;

    // Check if it's a string literal value
    if (n.value?.type === "StringLiteral") {
      const text = (n.value as StringLiteral).value;
      const adjustedOffset = this.adjustOffset(n.span.start);

      // For translatable ARIA and other translatable attributes, always flag non-empty strings
      if (
        TRANSLATABLE_ARIA.has(attrName) ||
        TRANSLATABLE_ATTRIBUTES.has(attrName)
      ) {
        if (text.trim() && !hasIgnoreComment(this.source, adjustedOffset)) {
          const { line, column } = getLineFromOffset(
            this.source,
            adjustedOffset,
          );
          this.strings.push({
            file: this.filePath,
            line,
            column,
            text: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
            context: "attribute",
            attributeName: attrName,
          });
        }
      } else if (!shouldSkipString(text)) {
        // For other attributes, use standard filtering
        if (!hasIgnoreComment(this.source, adjustedOffset)) {
          const { line, column } = getLineFromOffset(
            this.source,
            adjustedOffset,
          );
          this.strings.push({
            file: this.filePath,
            line,
            column,
            text: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
            context: "attribute",
            attributeName: attrName,
          });
        }
      }
    }

    return n;
  }
}

/**
 * Find hardcoded strings in a TSX file using AST parsing
 */
async function findHardcodedStrings(
  filePath: string,
): Promise<HardcodedString[]> {
  const source = fs.readFileSync(filePath, "utf-8");

  try {
    const ast = await parse(source, {
      syntax: "typescript",
      tsx: true,
      target: "es2022",
    });

    // Get the base offset from the module span
    // SWC uses a global span counter, so we need to subtract this base
    const baseOffset = ast.span.start;

    const visitor = new HardcodedStringVisitor(
      source,
      path.relative(SRC_DIR, filePath),
      baseOffset,
    );
    visitor.visitModule(ast);

    return visitor.strings;
  } catch (error) {
    // If parsing fails, skip this file
    console.warn(`Warning: Could not parse ${filePath}: ${error}`);
    return [];
  }
}

/**
 * Extract all defined translation keys from the English locale
 */
function getDefinedKeys(): Set<string> {
  const keys = new Set<string>();

  // Match string keys in object literals: "key.name": "value" or 'key.name': 'value'
  const keyPattern = /["']([a-zA-Z0-9_.]+)["']\s*:/g;

  // Check main index file
  const indexPath = path.join(LOCALES_DIR, "en", "index.ts");
  const content = fs.readFileSync(indexPath, "utf-8");
  let match;

  while ((match = keyPattern.exec(content)) !== null) {
    const key = match[1];
    if (!key.includes(".") && key.length < 3) continue;
    keys.add(key);
  }

  // Check imported module files
  const moduleFiles = [
    "auth",
    "family",
    "wordsets",
    "common",
    "profile",
    "results",
    "test",
    "aria",
  ];

  for (const moduleName of moduleFiles) {
    const modulePath = path.join(LOCALES_DIR, "en", `${moduleName}.ts`);
    if (fs.existsSync(modulePath)) {
      const moduleContent = fs.readFileSync(modulePath, "utf-8");
      // Reset the regex for each file
      const moduleKeyPattern = /["']([a-zA-Z0-9_.]+)["']\s*:/g;
      let moduleMatch;
      while ((moduleMatch = moduleKeyPattern.exec(moduleContent)) !== null) {
        keys.add(moduleMatch[1]);
      }
    }
  }

  return keys;
}

/**
 * Find all translation key usages in source files
 */
async function findUsedKeys(
  dir: string,
  checkHardcoded: boolean,
): Promise<{
  staticKeys: Set<string>;
  dynamicPatterns: string[];
  hardcodedStrings: HardcodedString[];
}> {
  const staticKeys = new Set<string>();
  const dynamicPatterns: string[] = [];
  const hardcodedStrings: HardcodedString[] = [];

  async function processFile(filePath: string) {
    const content = fs.readFileSync(filePath, "utf-8");

    // Match t("key") or t('key') patterns
    const tCallPattern = /\bt\(\s*["']([^"']+)["']/g;
    let match;

    while ((match = tCallPattern.exec(content)) !== null) {
      const key = match[1];
      if (key.includes("${") || key.includes("{")) {
        dynamicPatterns.push(`${path.relative(SRC_DIR, filePath)}: ${key}`);
      } else {
        staticKeys.add(key);
      }
    }

    // Match t(`template`) patterns for dynamic keys
    const templatePattern = /\bt\(\s*`([^`]+)`/g;
    while ((match = templatePattern.exec(content)) !== null) {
      dynamicPatterns.push(`${path.relative(SRC_DIR, filePath)}: ${match[1]}`);
    }

    // Match messageKey: "key" patterns (used in StavleCompanion)
    const messageKeyPattern = /messageKey:\s*["']([^"']+)["']/g;
    while ((match = messageKeyPattern.exec(content)) !== null) {
      staticKeys.add(match[1]);
    }

    // Match TranslationKey type usage in tests
    const typeUsagePattern = /["']([a-zA-Z0-9_.]+)["']\s+as\s+TranslationKey/g;
    while ((match = typeUsagePattern.exec(content)) !== null) {
      staticKeys.add(match[1]);
    }

    // Match findCompanionText("key") in tests
    const testHelperPattern = /findCompanionText\(\s*["']([^"']+)["']/g;
    while ((match = testHelperPattern.exec(content)) !== null) {
      staticKeys.add(match[1]);
    }

    // Check for hardcoded strings in TSX files
    if (checkHardcoded && filePath.endsWith(".tsx")) {
      const found = await findHardcodedStrings(filePath);
      hardcodedStrings.push(...found);
    }
  }

  async function walkDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === "generated" ||
          entry.name === ".next" ||
          entry.name === "__tests__" ||
          entry.name === "dev" // Skip dev-only pages
        ) {
          continue;
        }
        await walkDir(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
        !entry.name.endsWith(".d.ts") &&
        !entry.name.endsWith(".test.ts") &&
        !entry.name.endsWith(".test.tsx") &&
        !entry.name.startsWith("Dev") // Skip dev-only components
      ) {
        if (fullPath.includes("/locales/")) continue;
        await processFile(fullPath);
      }
    }
  }

  await walkDir(dir);
  return { staticKeys, dynamicPatterns, hardcodedStrings };
}

/**
 * Check if a key matches any known dynamic prefix
 */
function isDynamicKey(key: string): boolean {
  return KNOWN_DYNAMIC_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Check if a key is in the allowlist for unused keys
 */
function isAllowlistedUnused(key: string): boolean {
  return ALLOWLISTED_UNUSED_PREFIXES.some(
    (prefix) => key.startsWith(prefix) || key === prefix,
  );
}

/**
 * Validate translations
 */
async function validate(checkHardcoded: boolean): Promise<ValidationResult> {
  const definedKeys = getDefinedKeys();
  const {
    staticKeys: usedKeys,
    dynamicPatterns,
    hardcodedStrings,
  } = await findUsedKeys(SRC_DIR, checkHardcoded);

  const unusedKeys: string[] = [];
  const allowlistedUnused: string[] = [];

  for (const key of definedKeys) {
    if (!usedKeys.has(key) && !isDynamicKey(key)) {
      if (isAllowlistedUnused(key)) {
        allowlistedUnused.push(key);
      } else {
        unusedKeys.push(key);
      }
    }
  }

  const missingKeys: string[] = [];
  for (const key of usedKeys) {
    if (!definedKeys.has(key)) {
      // Don't report dynamic keys as missing
      if (!isDynamicKey(key)) {
        missingKeys.push(key);
      }
    }
  }

  return {
    unusedKeys: unusedKeys.sort(),
    missingKeys: missingKeys.sort(),
    dynamicKeyUsages: dynamicPatterns,
    allowlistedUnused: allowlistedUnused.sort(),
    hardcodedStrings,
  };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const listAllowlisted = args.includes("--list-allowlisted");
  const quiet = args.includes("--quiet") || args.includes("-q");
  const skipHardcoded = args.includes("--skip-hardcoded");
  const checkHardcoded = !skipHardcoded;

  if (!quiet) {
    console.log("🔍 Checking i18n translation keys...\n");
  }

  const result = await validate(checkHardcoded);
  const definedCount = getDefinedKeys().size;
  let hasErrors = false;

  // Show allowlisted keys if requested
  if (listAllowlisted) {
    // Categorize the allowlisted keys
    const deadCode: string[] = [];
    const future: string[] = [];
    const dynamic: string[] = [];

    for (const key of result.allowlistedUnused) {
      if (DEAD_CODE_PREFIXES.some((p) => key.startsWith(p) || key === p)) {
        deadCode.push(key);
      } else if (
        FUTURE_FEATURE_PREFIXES.some((p) => key.startsWith(p) || key === p)
      ) {
        future.push(key);
      } else {
        dynamic.push(key);
      }
    }

    console.log(
      `📋 Allowlisted unused keys (${result.allowlistedUnused.length} total):\n`,
    );

    if (deadCode.length > 0) {
      console.log(`🗑️  DEAD CODE - Safe to remove (${deadCode.length}):`);
      const groups: Record<string, number> = {};
      for (const key of deadCode) {
        const prefix = key.split(".").slice(0, 2).join(".");
        groups[prefix] = (groups[prefix] || 0) + 1;
      }
      for (const [prefix, count] of Object.entries(groups).sort()) {
        console.log(`   ${prefix}.* (${count})`);
      }
      console.log("");
    }

    if (future.length > 0) {
      console.log(
        `🔮 FUTURE FEATURES - Keep for planned work (${future.length}):`,
      );
      const groups: Record<string, number> = {};
      for (const key of future) {
        const prefix = key.split(".").slice(0, 2).join(".");
        groups[prefix] = (groups[prefix] || 0) + 1;
      }
      for (const [prefix, count] of Object.entries(groups).sort()) {
        console.log(`   ${prefix}.* (${count})`);
      }
      console.log("");
    }

    if (dynamic.length > 0) {
      console.log(`⚡ DYNAMIC USAGE - Used at runtime (${dynamic.length}):`);
      const groups: Record<string, number> = {};
      for (const key of dynamic) {
        const prefix = key.split(".").slice(0, 2).join(".");
        groups[prefix] = (groups[prefix] || 0) + 1;
      }
      for (const [prefix, count] of Object.entries(groups).sort()) {
        console.log(`   ${prefix}.* (${count})`);
      }
      console.log("");
    }

    process.exit(0);
  }

  // Missing keys are always errors
  if (result.missingKeys.length > 0) {
    hasErrors = true;
    console.log("❌ Missing translation keys (used but not defined):\n");
    for (const key of result.missingKeys) {
      console.log(`   - ${key}`);
    }
    console.log("");
  }

  // Truly unused keys (not allowlisted) are errors
  if (result.unusedKeys.length > 0) {
    hasErrors = true;
    console.log("❌ Unused translation keys (defined but not used):\n");
    for (const key of result.unusedKeys) {
      console.log(`   - ${key}`);
    }
    console.log(
      "\n   To fix: Remove these keys or add them to the allowlist in check-i18n.ts\n",
    );
  }

  // Hardcoded strings are errors
  if (result.hardcodedStrings.length > 0) {
    hasErrors = true;
    console.log(
      "❌ Hardcoded strings found (should use t() for translation):\n",
    );

    // Group by file
    const byFile: Record<string, HardcodedString[]> = {};
    for (const str of result.hardcodedStrings) {
      if (!byFile[str.file]) byFile[str.file] = [];
      byFile[str.file].push(str);
    }

    for (const [file, strings] of Object.entries(byFile).sort()) {
      console.log(`   ${file}:`);
      for (const str of strings.sort((a, b) => a.line - b.line)) {
        const location = `L${str.line}:${str.column}`;
        if (str.context === "attribute") {
          console.log(`     ${location} [${str.attributeName}] "${str.text}"`);
        } else {
          console.log(`     ${location} "${str.text}"`);
        }
      }
      console.log("");
    }

    console.log(
      "   To fix: Use t('key') or add {/* i18n-ignore */} before intentional hardcoding\n",
    );
  }

  // Show summary (unless quiet mode)
  if (!quiet) {
    console.log("📊 Statistics:");
    console.log(`   - Total defined keys: ${definedCount}`);
    console.log(
      `   - Keys used in code: ${definedCount - result.unusedKeys.length - result.allowlistedUnused.length}`,
    );
    console.log(`   - Allowlisted unused: ${result.allowlistedUnused.length}`);
    console.log(`   - Dynamic key patterns: ${result.dynamicKeyUsages.length}`);
    if (checkHardcoded) {
      console.log(`   - Hardcoded strings: ${result.hardcodedStrings.length}`);
    }
    console.log("");
  }

  if (hasErrors) {
    console.log("💡 Tips:");
    if (result.missingKeys.length > 0) {
      console.log(
        "   - Missing keys: Add them to the appropriate locale file in src/locales/en/",
      );
    }
    if (result.unusedKeys.length > 0) {
      console.log(
        "   - Unused keys: Remove them, use them, or add prefix to ALLOWLISTED_UNUSED_PREFIXES",
      );
    }
    if (result.hardcodedStrings.length > 0) {
      console.log(
        "   - Hardcoded strings: Replace with t('key') or suppress with {/* i18n-ignore */}",
      );
    }
    console.log("");
    process.exit(1);
  } else {
    if (quiet) {
      console.log("✅ i18n: ok");
    } else {
      console.log("✅ All translation keys are valid!\n");
    }
    process.exit(0);
  }
}

main();
