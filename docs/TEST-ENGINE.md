# Test Engine Architecture

**Unified, registry-based architecture for test modes in Diktator**

---

## Overview

The Test Engine provides a centralized, extensible system for managing test modes in Diktator. Instead of scattered mode-specific logic across components, all mode definitions are registered in a single location and accessed via a registry pattern.

**Key Benefits:**

- **Centralized**: All mode logic in one place (`frontend/src/lib/testEngine/`)
- **Extensible**: Add new modes by creating a single file and registering it
- **Type-safe**: Full TypeScript coverage with strict interfaces
- **Maintainable**: No mode-specific switch statements in components
- **Testable**: Easy to test mode logic in isolation

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                      Test Registry                          │
│  Map<TestMode, TestModeDefinition>                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ letterTiles  │  │  wordBank    │  │  keyboard    │ ... │
│  │ Mode         │  │  Mode        │  │  Mode        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ getMode(testMode)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   ┌────▼─────┐                         ┌────▼─────┐
   │ TestView │                         │  Mode    │
   │          │                         │ Selection│
   │ - Uses   │                         │  Modal   │
   │   mode   │                         │          │
   │   data   │                         │ - Shows  │
   │          │                         │   avail- │
   │ - Calls  │                         │   ability│
   │   mode   │                         │          │
   │   funcs  │                         │ - Icons  │
   └──────────┘                         │ & names  │
                                        └──────────┘
```

**Data Flow:**

1. **Registration**: Each mode registers itself in `registry.ts`
2. **Lookup**: Components call `getMode(testMode)` to get mode definition
3. **Delegation**: Components call mode functions (isAvailable, generateChallenge, etc.)
4. **Rendering**: TestModeRenderer uses registry to render appropriate input component

---

## Mode Lifecycle

### 1. Test Initialization

```typescript
// User selects mode from ModeSelectionModal
const mode = getMode("letterTiles");

// Check availability
const { available, reasonKey } = mode.isAvailable(wordSet);
if (!available) {
  // Show reason to user
}

// Start test
useTestMode().startTest(wordSet, "letterTiles");
```

### 2. Word Presentation

```typescript
// For each word in test
const currentWord = wordSet.words[currentWordIndex];

// Get expected answer (mode-specific for translation)
const expectedAnswer = mode.getExpectedAnswer
  ? mode.getExpectedAnswer(currentWord, {
      translationDirection: "toTarget",
      wordSet,
    })
  : currentWord.word;

// Generate challenge data (mode-specific)
const challengeData = mode.generateChallenge?.(expectedAnswer, {
  wordSet,
});
```

### 3. User Interaction

```typescript
// TestModeRenderer selects appropriate input component
if (mode.inputType === "tiles") {
  return (
    <LetterTileInput
      tiles={challengeData.tiles}
      onSubmit={(answer, isCorrect) => {
        /* ... */
      }}
    />
  );
}
```

### 3.5. Navigation Integration

All input components integrate with the unified `TestNavigationBar` via the `NavigationActions` interface:

```typescript
// TestView creates navigation object
const navigation: NavigationActions = useMemo(
  () => ({
    onCancel: handleExitClick,
    onPlayAudio: handlePlayAudio,
    onSubmit: () => onSubmitAnswer(),
    onNext: onNextWord,
    onClear: clearFn || undefined,
    showFeedback,
    isLastWord: currentWordIndex >= processedWords.length - 1,
    canSubmit: userAnswer.trim().length > 0,
    isSubmitting: false,
    isPlayingAudio: isAudioPlaying,
    lastAnswerCorrect,
  }),
  [/* deps */],
);

// Passed to TestModeRenderer
<TestModeRenderer
  testMode={testMode}
  navigation={navigation}
  onClearRef={handleClearRef}
  onCanClearChange={handleCanClearChange}
  // ...other props
/>
```

**Input Component Pattern**:

Input components (LetterTileInput, WordBankInput, etc.) expose clear functionality via callbacks:

```typescript
interface TileInputProps {
  // ... other props
  navigation?: NavigationActions;
  onClearRef?: (clearFn: () => void) => void;
  onCanClearChange?: (canClear: boolean) => void;
}

// Inside component:
React.useEffect(() => {
  onClearRef?.(handleClear);
}, [handleClear, onClearRef]);

React.useEffect(() => {
  onCanClearChange?.(placedTileIds.length > 0);
}, [placedTileIds.length, onCanClearChange]);
```

**Auto-Submit Behavior**:

When `navigation` prop is provided, tile-based components auto-submit when answer is complete:

```typescript
React.useEffect(() => {
  if (navigation && isComplete && !showingFeedback) {
    const isCorrect = currentAnswer.toLowerCase() === expectedWord.toLowerCase();
    onSubmit(currentAnswer, isCorrect);
  }
}, [isComplete, navigation, showingFeedback, currentAnswer, expectedWord, onSubmit]);
```

### 4. Answer Submission

```typescript
// User submits answer
const isCorrect = normalizeText(userAnswer) === normalizeText(expectedAnswer);

// Feedback displayed (each input component handles its own)
// Progress tracked (if mode.tracksMastery === true)
```

### 4.5. Unified Feedback System

All input components handle their own feedback display using unified feedback state from TestView:

```typescript
// TestView creates unified feedback state via useUnifiedFeedbackState hook
const feedbackState = useUnifiedFeedbackState(
  showFeedback,
  lastAnswerCorrect,
  lastUserAnswer,
  expectedAnswer,
  currentTries,
  maxAttempts,
  spellingConfig,
  showCorrectAnswer,
);
// Returns: { tile: TileFeedbackState | null, standard: StandardFeedbackState | null }

// Passed to TestModeRenderer
<TestModeRenderer
  testMode={testMode}
  tileFeedbackState={feedbackState.tile}
  standardFeedbackState={feedbackState.standard}
  // ...other props
/>
```

**Feedback State Types:**

```typescript
// For LetterTileInput (subset of fields)
interface TileFeedbackState {
  analysis: SpellingAnalysisResult;
  currentAttempt: number;
  maxAttempts: number;
  hintKey: string | null;
  lastUserAnswer: string;
}

// For WordBankInput, KeyboardInput, TranslationInput
interface StandardFeedbackState extends TileFeedbackState {
  showCorrectAnswer: boolean;
  config: SpellingFeedbackConfig;
}
```

**Inline Feedback Pattern:**

Each input component renders its own feedback UI when `feedbackState` is provided:

```typescript
// Example from KeyboardInput
export function KeyboardInput({ feedbackState, expectedAnswer, ... }) {
  const showingFeedback = feedbackState !== null;
  const showingCorrectFeedback =
    showingFeedback && feedbackState.showCorrectAnswer;

  return (
    <div>
      <input disabled={showingFeedback} ... />

      {showingFeedback && !showingCorrectFeedback && (
        <SpellingFeedback feedbackState={feedbackState} />
      )}

      {showingCorrectFeedback && (
        <CorrectFeedback expectedAnswer={expectedAnswer} />
      )}
    </div>
  );
}
```

**Benefits of Inline Feedback:**

- No external overlay component needed
- Feedback appears contextually near the input
- Each component controls its own feedback layout
- Consistent behavior across all modes

### 5. Test Completion

```typescript
// Calculate scores
const scoreBreakdown = calculateScores(finalAnswers);

// Save results (if mode.tracksMastery === true)
await generatedApiClient.saveResult({
  wordSetId,
  mode: testMode,
  score: scoreBreakdown.weightedScore,
  // ...
});
```

---

## TestModeDefinition Interface

Every mode must implement this interface:

```typescript
interface TestModeDefinition {
  /** Unique identifier matching TestMode type */
  id: TestMode;

  /** Display metadata for UI */
  metadata: {
    /** Heroicon component for visual representation */
    icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    /** i18n key for mode name */
    nameKey: string;
    /** i18n key for mode description */
    descriptionKey: string;
  };

  /** General category of input this mode uses */
  inputType: "tiles" | "wordBank" | "keyboard" | "specialized";

  /** Whether this mode tracks mastery in the database */
  tracksMastery: boolean;

  /** Content type requirements for this mode */
  contentRequirements: {
    singleWords?: boolean; // Requires single words (no sentences)
    sentences?: boolean; // Requires sentences (not single words)
    translations?: boolean; // Requires translations to be present
  };

  /**
   * Determines if this mode is available for a given word set
   */
  isAvailable: (wordSet: WordSet) => {
    available: boolean;
    reasonKey?: string; // i18n key for unavailability reason
  };

  /**
   * Generate challenge data for this mode (optional)
   */
  generateChallenge?: (
    word: string,
    context?: TestModeContext,
  ) => ChallengeData;

  /**
   * Get the expected answer for this mode (optional)
   * Most modes return the word, but translation mode may swap
   */
  getExpectedAnswer?: (word: WordItem, context?: TestModeContext) => string;
}
```

---

## Current Modes

| Mode                 | Input Type  | Tracks Mastery | Content Requirements |
| -------------------- | ----------- | -------------- | -------------------- |
| letterTiles          | tiles       | Yes            | Single words         |
| wordBank             | wordBank    | Yes            | Sentences            |
| keyboard             | keyboard    | Yes            | Any                  |
| missingLetters       | specialized | Yes            | Single words         |
| flashcard            | specialized | No             | Any                  |
| lookCoverWrite       | specialized | No             | Any                  |
| translation          | keyboard    | Yes            | Translations present |
| listeningTranslation | keyboard    | Yes            | Translations present |

### Mastery Tracking vs Self-Report

**Mastery Tracking Modes** (tracksMastery: true):

- Store detailed results: attempts, time spent, error types
- Contribute to word mastery levels in database
- Used for progress tracking and adaptive difficulty
- Examples: keyboard, letterTiles, wordBank, translation

**Self-Report Modes** (tracksMastery: false):

- User self-reports whether they knew the answer
- No objective correctness verification
- Don't contribute to mastery calculations
- Used for practice and confidence building
- Examples: flashcard, lookCoverWrite

---

## Adding a New Mode

Follow this checklist to add a new test mode:

### 1. Add Mode Type

**File**: `frontend/src/types/index.ts`

```typescript
export type TestMode =
  | "letterTiles"
  | "wordBank"
  // ... existing modes
  | "myNewMode"; // Add here

export const TEST_MODES: TestMode[] = [
  // ... existing modes
  "myNewMode", // Add here
];
```

### 2. Create Mode Definition File

**File**: `frontend/src/lib/testEngine/modes/myNewMode.ts`

```typescript
import { TestModeDefinition } from "../types";
import type { WordSet } from "@/types";
import { MyIcon } from "@heroicons/react/24/outline";

export const myNewMode: TestModeDefinition = {
  id: "myNewMode",
  metadata: {
    icon: MyIcon,
    nameKey: "modes.myNewMode",
    descriptionKey: "modes.myNewMode.desc",
  },
  inputType: "keyboard", // or 'tiles', 'wordBank', 'specialized'
  tracksMastery: true,
  contentRequirements: {
    // Define what content this mode needs
    singleWords: true,
  },
  isAvailable: (wordSet: WordSet) => {
    const hasSingleWords = wordSet.words.some((w) => !w.word.includes(" "));
    return {
      available: hasSingleWords,
      reasonKey: hasSingleWords ? undefined : "modes.requiresSingleWords",
    };
  },
  // Optional: generate challenge data
  generateChallenge: (word: string) => {
    return {
      // Return mode-specific challenge data
    };
  },
  // Optional: customize expected answer
  getExpectedAnswer: (word, context) => {
    return word.word; // Default behavior
  },
};
```

### 3. Register Mode

**File**: `frontend/src/lib/testEngine/registry.ts`

```typescript
import { myNewMode } from "./modes/myNewMode";

// Register all modes
registerMode(letterTilesMode);
// ... existing registrations
registerMode(myNewMode); // Add here
```

### 4. Add i18n Translations

**Files**: `frontend/src/locales/en/common.ts` and `frontend/src/locales/no/common.ts`

```typescript
export const common = {
  modes: {
    // ... existing modes
    myNewMode: "My New Mode",
    "myNewMode.desc": "Description of my new mode",
    requiresSingleWords: "Requires single words",
  },
};
```

### 5. Create Input Component (if specialized)

If `inputType: "specialized"`, create a new component:

**File**: `frontend/src/components/MyNewModeInput.tsx`

```typescript
interface MyNewModeInputProps {
  word: string;
  onSubmit: (answer: string, isCorrect: boolean) => void;
  // ... other props
}

export function MyNewModeInput({ word, onSubmit }: MyNewModeInputProps) {
  // Implement mode-specific UI
}
```

Update `TestModeRenderer.tsx` to handle your new mode:

```typescript
if (testMode === "myNewMode") {
  return <MyNewModeInput {...props} />;
}
```

### 6. Add Tests

**File**: `frontend/src/lib/testEngine/modes/__tests__/myNewMode.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { myNewMode } from "../myNewMode";

describe("myNewMode", () => {
  it("has correct metadata", () => {
    expect(myNewMode.id).toBe("myNewMode");
    expect(myNewMode.tracksMastery).toBe(true);
  });

  it("checks availability correctly", () => {
    const wordSet = {
      /* ... */
    };
    const { available } = myNewMode.isAvailable(wordSet);
    expect(available).toBe(true);
  });
});
```

### 7. Test End-to-End

1. Run `mise run check` to ensure all tests pass
2. Manually test the mode in the app:
   - Mode appears in selection modal with correct icon
   - Availability checking works
   - Test flow works correctly
   - Results are saved (if tracksMastery: true)

---

## Best Practices

### Mode Design

- **Single Responsibility**: Each mode should have one clear purpose
- **Content-Aware**: Use `isAvailable()` to ensure mode only shows when appropriate
- **User-Friendly**: Provide clear `reasonKey` when mode is unavailable
- **Accessibility**: Ensure WCAG 2.1 AA compliance (min-h-12 touch targets, 4.5:1 contrast, ARIA labels)

### Challenge Generation

- **Deterministic**: Same word should generate same challenge
- **Appropriate Difficulty**: Match challenge to user's age/level when possible
- **Fair**: Don't make challenges impossible or trivial

### Expected Answer

- **Normalized**: Use `normalizeText()` for comparison to ignore punctuation/case
- **Context-Aware**: Use context parameter for mode-specific logic (like translation direction)

### Testing

- **Unit Tests**: Test mode logic in isolation
- **Integration Tests**: Test mode within TestView component
- **Accessibility Tests**: Use vitest-axe to catch a11y issues

---

## Common Patterns

### Mode with Simple Availability

```typescript
isAvailable: (wordSet: WordSet) => {
  // Always available
  return { available: true };
};
```

### Mode with Content Requirements

```typescript
isAvailable: (wordSet: WordSet) => {
  const hasTranslations = wordSet.words.some(
    (w) => w.translations && w.translations.length > 0,
  );
  return {
    available: hasTranslations,
    reasonKey: hasTranslations ? undefined : "modes.requiresTranslations",
  };
};
```

### Mode with Challenge Generation

```typescript
generateChallenge: (word: string) => {
  const tiles = generateLetterTiles(word);
  return {
    tiles: tiles.map((tile) => ({
      letter: tile.letter,
      id: tile.id,
      isDistractor: tile.isDistractor,
    })),
  };
};
```

### Mode with Custom Expected Answer

```typescript
getExpectedAnswer: (word: WordItem, context?: TestModeContext) => {
  if (context?.translationDirection === "toTarget") {
    const targetLang = context.wordSet?.testConfiguration?.targetLanguage;
    return (
      word.translations?.find((t) => t.language === targetLang)?.text ||
      word.word
    );
  }
  return word.word;
};
```

---

## Troubleshooting

### Mode Not Appearing in Selection Modal

1. Check mode is added to `TEST_MODES` array in `types/index.ts`
2. Check mode is registered in `registry.ts`
3. Check `isAvailable()` returns `{ available: true }` for your test word set

### Mode Available But Not Rendering Correctly

1. Check `inputType` matches your component type
2. For specialized modes, ensure TestModeRenderer has case for your mode
3. Check console for errors

### Challenge Data Not Generated

1. Check `generateChallenge()` is defined in mode definition
2. Check it's being called with correct parameters
3. Check return type matches `ChallengeData` interface

### Expected Answer Incorrect

1. Check `getExpectedAnswer()` logic
2. Ensure context is passed correctly from TestView
3. Use `normalizeText()` for comparison to handle case/punctuation

---

## Audio Architecture

The test engine uses a unified audio system with callbacks for state tracking and focus restoration.

### Audio Component Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              useTestMode Hook                                │
│  • Manages isAudioPlaying state                                              │
│  • Handles first-word autoplay via playAudioSync() for iOS Safari           │
│  • Exposes onAudioStart/onAudioEnd handlers for child components            │
│  • Tracks currentWordAudioPlays count                                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ isAudioPlaying, onAudioStart, onAudioEnd
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               TestView                                       │
│  • Tracks local isAudioPlaying, playTrigger, focusTrigger states            │
│  • handleAudioStart: sets isAudioPlaying=true, notifies parent              │
│  • handleAudioEnd: sets isAudioPlaying=false, triggers focus restore        │
│  • Receives isParentAudioPlaying for iOS first-word spinner                 │
└──────────────┬───────────────────────────────┬──────────────────────────────┘
               │                               │
    Standard Modes                   Specialized/Translation Modes
               │                               │
               ▼                               ▼
┌──────────────────────────┐    ┌────────────────────────────────────────────┐
│     TestAudioButton      │    │            TestModeRenderer                 │
│  • Wrapper with          │    │  • Routes to correct input component        │
│    instruction text      │    │  • Passes onAudioStart/onAudioEnd through   │
│  • Shows definition      │    │    to specialized modes                     │
│  • Uses AudioPlayButton  │    └──────────────────┬─────────────────────────┘
└───────────┬──────────────┘                       │
            │                       ┌──────────────┼──────────────┐
            ▼                       ▼              ▼              ▼
┌──────────────────────────┐   Flashcard    LookCoverWrite  Listening
│     AudioPlayButton      │◄─────View────────View────────Translation
│  CORE REUSABLE           │                                 Input
│  • Self-contained audio  │
│  • Manages isPlaying     │
│  • Shows spinner         │
└──────────────────────────┘
```

### Component Responsibilities

**AudioPlayButton** (Core Reusable Component)

Self-contained audio button managing its own `<Audio>` element and playback state.

```typescript
interface AudioPlayButtonProps {
  audioUrl: string;
  onAudioEnd: () => void;        // Mandatory - for focus restoration
  onAudioStart?: () => void;     // Optional - for state tracking
  playTrigger?: number;          // Increment to trigger playback externally
  isExternallyPlaying?: boolean; // Show spinner when parent plays audio
  autoPlay?: boolean;
  size?: "sm" | "md" | "lg";
}
```

**TestAudioButton** (Wrapper)

Wraps `AudioPlayButton` with test-specific UI: instruction text and definition hint. Used by TestView for standard modes.

**TestView** (Orchestrator)

Central coordinator that:

- Tracks `isAudioPlaying`, `playTrigger`, `focusTrigger` locally
- Creates `handleAudioStart`/`handleAudioEnd` callbacks
- Passes callbacks to TestModeRenderer for all modes
- Manages focus restoration via `focusTrigger` counter

**TestModeRenderer** (Router)

Routes to correct input component and passes audio callbacks to:

- FlashcardView / LookCoverWriteView: Specialized modes with own AudioPlayButton
- ListeningTranslationInput: Audio-first mode with own AudioPlayButton

### iOS Safari First-Word Autoplay

iOS Safari requires audio.play() to be in the same synchronous call stack as the user click. The `useTestMode` hook handles this:

```typescript
// In startTest() - called synchronously from button click
if (shouldAutoPlayFirstWord) {
  // Mark audio as playing BEFORE calling playAudioSync
  isPlayingAudioRef.current = true;
  setIsAudioPlaying(true);

  // Call playAudioSync SYNCHRONOUSLY - NO await!
  const audioHandle = playAudioSync(audioUrl);

  audioHandle.onEnd(() => {
    isPlayingAudioRef.current = false;
    setIsAudioPlaying(false);
  });
}
```

TestView receives `isParentAudioPlaying` prop to show spinner on AudioPlayButton during this external playback.

### Focus Restoration Pattern

After audio ends, focus must return to the input field:

```typescript
// TestView
const handleAudioEnd = useCallback(() => {
  setIsAudioPlaying(false);
  onAudioEnd?.();
  // Trigger focus restoration
  setFocusTrigger((prev) => prev + 1);
}, [onAudioEnd]);

// KeyboardInput receives focusTrigger prop
useEffect(() => {
  if (focusTrigger > 0 && inputRef.current) {
    inputRef.current.focus();
  }
}, [focusTrigger]);
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall application architecture
- [USER-STORIES.md](./USER-STORIES.md) - User personas and requirements
- [DESIGN.md](./DESIGN.md) - UI/UX design principles
