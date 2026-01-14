# Diktator - Gamification System

**Version**: 1.0
**Last Updated**: January 2026

## Overview

This document defines the unified gamification system for Diktator—how we reward, motivate, and celebrate learning progress for Norwegian children ages 5-12. Our approach is grounded in Self-Determination Theory and the pedagogical principles in [LEARNING.md](LEARNING.md).

> **Design Philosophy**: Gamification should **signal competence**, not **control behavior**. Every reward element must answer: "Does this help the child learn?"

---

## Table of Contents

1. [Unified Reward Philosophy](#unified-reward-philosophy)
2. [XP System](#xp-system)
3. [Level Progression](#level-progression)
4. [Badge System](#badge-system)
5. [Integration: XP + Badges](#integration-xp--badges)
6. [Anti-Gaming Measures](#anti-gaming-measures)
7. [UI Display Guidelines](#ui-display-guidelines)
8. [Data Model](#data-model)
9. [Implementation Status](#implementation-status)

---

## Unified Reward Philosophy

### Three Complementary Reward Types

| Reward Type                | What It Measures   | Feel              | Example                      |
| -------------------------- | ------------------ | ----------------- | ---------------------------- |
| **XP (Experience Points)** | Cumulative effort  | "I'm growing"     | +25 XP for completing a test |
| **Levels**                 | Journey progress   | "I'm evolving"    | Reached "Snøugle" (Level 5)  |
| **Badges**                 | Quality milestones | "I achieved this" | "Perfect Score" badge        |

These three systems work **together**, not in competition:

- **XP** is the continuous fuel—every test awards XP
- **Levels** are the journey markers—XP accumulates into level-ups
- **Badges** are the special achievements—milestone celebrations that also grant bonus XP

### What We Explicitly Avoid

Per [LEARNING.md](LEARNING.md#rewards--motivation), we do NOT implement:

- ❌ **Daily login streaks** that punish missed days
- ❌ **Leaderboards** comparing children/siblings
- ❌ **Time-based rewards** (encourages mindless clicking)
- ❌ **Trivial XP grants** (devalues achievement)
- ❌ **Virtual currency/loot boxes**
- ❌ **XP removal/loss** (never take away earned progress)
- ❌ **Social pressure** (no sharing scores to social media)

---

## XP System

### XP Award Formula

XP is calculated when a test is completed:

```
Total XP = Base XP × Score Multiplier × First-Time Bonus × Repetition Decay
```

### Base XP by Mode

Harder modes (less scaffolding) award more base XP:

| Mode             | Base XP | Rationale                               |
| ---------------- | ------- | --------------------------------------- |
| `letterTiles`    | 10      | Most scaffolding—letters provided       |
| `wordBank`       | 15      | Sentence construction, moderate support |
| `missingLetters` | 20      | Targeted challenge, partial scaffolding |
| `translation`    | 20      | Vocabulary + spelling combined          |
| `keyboard`       | 25      | No scaffolding—full recall required     |
| `flashcard`      | 5       | Self-check only, minimal engagement     |
| `lookCoverWrite` | 20      | Memory-based, typed verification        |

### Score Multiplier

Performance affects XP award:

| Score Range | Multiplier | Message                 |
| ----------- | ---------- | ----------------------- |
| 100%        | 2.0×       | "Perfect!"              |
| 90-99%      | 1.5×       | "Excellent!"            |
| 70-89%      | 1.0×       | "Good work!"            |
| 50-69%      | 0.75×      | "Keep practicing!"      |
| <50%        | 0.5×       | "Every mistake teaches" |

### First-Time Bonus

Completing a word set for the first time (ever, or with a specific mode) awards a **3× bonus**:

- First time completing "Animals" word set: 3× XP
- First time completing "Animals" with keyboard mode: 3× XP
- Subsequent completions: normal XP with repetition decay

### Repetition Decay

To prevent gaming by repeating easy tests, XP decays for repeated word set + mode combinations within a 7-day window:

| Repetition                | XP Percentage | Rationale                  |
| ------------------------- | ------------- | -------------------------- |
| 1st time                  | 100%          | Full reward                |
| 2nd time (within 7 days)  | 50%           | Still learning             |
| 3rd time (within 7 days)  | 25%           | Review benefit diminishing |
| 4th+ time (within 7 days) | 10%           | Floor—never zero           |

**After 7 days**: Counter resets to 100%. This aligns with spaced repetition principles—returning to material after a week is beneficial for long-term retention.

### XP Calculation Examples

**Example 1**: First keyboard test, perfect score
```
Base: 25 (keyboard)
Score: ×2.0 (100%)
First-time: ×3.0
Repetition: ×1.0 (first time)
Total: 25 × 2.0 × 3.0 × 1.0 = 150 XP
```

**Example 2**: Third letter tiles test this week, 80% score
```
Base: 10 (letterTiles)
Score: ×1.0 (80%)
First-time: ×1.0 (not first)
Repetition: ×0.25 (3rd time)
Total: 10 × 1.0 × 1.0 × 0.25 = 2.5 → 3 XP (rounded up)
```

**Example 3**: Return after 8 days, 95% score
```
Base: 20 (translation)
Score: ×1.5 (95%)
First-time: ×1.0 (not first)
Repetition: ×1.0 (reset after 7 days)
Total: 20 × 1.5 × 1.0 × 1.0 = 30 XP
```

---

## Level Progression

### Nordic Journey Theme

Levels follow an Arctic/Scandinavian journey theme—from small creatures to natural wonders. Each level represents growth and progression through the Norwegian wilderness.

### Level Definitions

| Level | Name            | Norwegian    | XP Required | Total XP | Icon Description                                                                                                                   |
| ----- | --------------- | ------------ | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Snow Mouse      | Snømus       | 0           | 0        | Tiny round mouse silhouette, small ears, curled tail. Soft gray (#94A3B8). Conveys "just starting out."                            |
| 2     | Arctic Fox      | Fjellrev     | 100         | 100      | Stavle-style fox silhouette in profile, fluffy tail raised. Fjord Teal (#2DD4BF). Familiar—matches mascot.                         |
| 3     | Arctic Hare     | Snøhare      | 200         | 300      | Alert hare sitting upright, long ears, powerful back legs. Sky Blue (#7DD3FC). Quick and nimble.                                   |
| 4     | Reindeer        | Rein         | 300         | 600      | Proud reindeer head with antlers, front-facing. Cloudberry Orange (#FB923C). Norwegian cultural icon.                              |
| 5     | Snowy Owl       | Snøugle      | 400         | 1,000    | Owl face with large round eyes, small ear tufts. Sunrise Yellow (#FBBF24). Wise and watchful.                                      |
| 6     | Wolverine       | Jerv         | 500         | 1,500    | Stocky wolverine in motion, low stance. Deep Teal (#0D9488). Fierce determination.                                                 |
| 7     | Wolf            | Ulv          | 600         | 2,100    | Wolf head howling upward, strong profile. Slate Blue (#475569). Pack leader energy.                                                |
| 8     | Polar Bear      | Isbjørn      | 700         | 2,800    | Standing polar bear, powerful front paws. Pure white (#FFFFFF) with subtle gray outline. Arctic royalty.                           |
| 9     | Northern Lights | Nordlys      | 800         | 3,600    | Wavy aurora bands flowing upward. Gradient: Meadow Green (#4ADE80) → Sky Blue (#7DD3FC) → soft purple (#A78BFA). Transcendent.     |
| 10    | Midnight Sun    | Midnattsol   | 900         | 4,500    | Sun half-visible on horizon line, rays extending. Gradient: Sunrise Yellow (#FBBF24) → Cloudberry (#FB923C). Ultimate achievement. |
| 11+   | Polar Explorer  | Polarforsker | 1,000 each  | 5,500+   | Compass rose with Nordic styling, 8-pointed star. Gold (#FBBF24) with Midnight Blue (#1E3A5A) accents. Endless journey.            |

### XP Curve Rationale

The XP requirements increase gradually:
- **Early levels (1-4)**: Quick progression to build engagement (100-300 XP each)
- **Mid levels (5-7)**: Steady growth requiring consistent practice (400-600 XP each)
- **Late levels (8-10)**: Significant milestones for dedicated learners (700-900 XP each)
- **Beyond 10**: Linear 1,000 XP per level for endless progression

A child doing ~5 tests per day at moderate scores would level up roughly once per week in early stages.

### Level Icon Specifications

**For Design Team**: Create icons following these specifications:

| Specification | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Base size     | 48×48px                                                     |
| Export sizes  | 24px (header), 48px (inline), 96px (modal)                  |
| Format        | SVG preferred, PNG fallback with @2x                        |
| Style         | Simple silhouettes, 2-3px line weight                       |
| Colors        | Use Nordic palette from [DESIGN.md](DESIGN.md#color-system) |
| File naming   | `level-01-snomus.svg` through `level-11-polarforsker.svg`   |
| Location      | `public/levels/`                                            |

**Quality Checklist**:
- [ ] Clear silhouette recognizable at 24px
- [ ] Consistent line weight across all icons
- [ ] Colors match Nordic palette exactly
- [ ] No harsh black outlines (use soft grays or brand colors)
- [ ] Warm, friendly aesthetic matching Stavle

---

## Badge System

### Badge Categories

Badges celebrate **quality milestones**, not quantity:

#### Mastery Badges
| Badge             | Requirement                        | XP Bonus    |
| ----------------- | ---------------------------------- | ----------- |
| First Steps       | Complete first test                | 25 (Bronze) |
| Word Learner      | Master 10 words (keyboard mode)    | 50 (Silver) |
| Spelling Champion | Master 50 words (keyboard mode)    | 100 (Gold)  |
| Perfect Score     | Get 100% on any test               | 25 (Bronze) |
| Perfect Streak    | Get 100% on 3 tests in a row       | 50 (Silver) |
| Flawless          | Get 100% on 10 different word sets | 100 (Gold)  |

#### Challenge Badges
| Badge            | Requirement                        | XP Bonus    |
| ---------------- | ---------------------------------- | ----------- |
| Double Trouble   | Master 10 double-consonant words   | 50 (Silver) |
| Silent Hunter    | Master 10 silent-letter words      | 50 (Silver) |
| Keyboard Warrior | Complete 10 tests in keyboard mode | 50 (Silver) |
| Polyglot         | Complete 10 translation tests      | 50 (Silver) |

#### Progress Badges
| Badge        | Requirement                              | XP Bonus    |
| ------------ | ---------------------------------------- | ----------- |
| Rising Star  | Improve score by 20%+ on a retake        | 25 (Bronze) |
| Comeback Kid | Return after 7+ days and complete a test | 25 (Bronze) |
| Explorer     | Try all 7 test modes                     | 50 (Silver) |

### Badge Tiers and XP Bonuses

| Tier   | XP Bonus | Visual Style                |
| ------ | -------- | --------------------------- |
| Bronze | 25 XP    | Cloudberry (#FB923C) tint   |
| Silver | 50 XP    | Slate (#94A3B8) with shine  |
| Gold   | 100 XP   | Sunrise (#FBBF24) with glow |

### Badge Design Principles

Per [LEARNING.md](LEARNING.md#badge-design-principles):

1. **Milestone-based, not frequency-based**: "First perfect score" not "10 tests completed"
2. **Surprising when possible**: Don't announce "3 more tests for a badge"
3. **Meaningful thresholds**: 100% accuracy is meaningful; arbitrary numbers aren't
4. **Celebrate effort, not just success**: Acknowledge improvement, not just perfection
5. **No removal/loss**: Never take away earned badges

---

## Integration: XP + Badges

### How They Work Together

```
Test Completed
    │
    ├─→ Calculate Base XP (mode + score + first-time + decay)
    │
    ├─→ Check Badge Criteria
    │       │
    │       └─→ If badge earned: Add Badge XP Bonus
    │
    └─→ Update Total XP
            │
            └─→ Check Level Up
                    │
                    └─→ If level up: Show Celebration
```

### Example Flow

1. Child completes keyboard test with 100% score
2. Base XP calculated: 25 × 2.0 × 1.0 = 50 XP
3. Badge check: First 100% score! → "Perfect Score" badge earned → +25 XP bonus
4. Total XP awarded: 75 XP
5. XP pushes child from 290 → 365 total XP
6. Level check: 365 > 300 threshold → Level up to Snøhare (Level 3)!
7. UI shows: "+75 XP", badge unlock animation, level-up celebration with Stavle

### Never Competing

XP and badges reinforce each other:
- XP is the **constant drip**—every test matters
- Badges are the **special moments**—milestone celebrations
- Levels are the **journey visualization**—"where am I going?"

A child focused on badges still earns XP. A child focused on XP will naturally unlock badges. Neither path is "better."

---

## Anti-Gaming Measures

### Repetition Decay (Primary)

As defined above, repeating the same word set + mode within 7 days yields diminishing XP:

```
100% → 50% → 25% → 10% (floor)
```

### Mode Diversity Bonus (Future)

Consider implementing: Extra XP for using different modes across a session. This encourages trying harder modes without punishing preference.

### Quality Over Quantity

The score multiplier ensures:
- High scores (90%+) earn 1.5-2× more than mediocre scores
- Perfect scores are rewarded but not required
- Even low scores earn something (0.5× floor)

### What We Don't Restrict

We intentionally allow:
- Unlimited test attempts (learning > gatekeeping)
- Any mode at any time (autonomy is motivating)
- Repeating favorite word sets (familiarity aids confidence)

The decay prevents abuse while respecting legitimate repetition.

---

## UI Display Guidelines

### Persistent XP Indicator (Header)

The XP system is **visible but not intrusive** in the app header through the `XPIndicator` component:

**Implementation** (`frontend/src/components/XPIndicator.tsx`):

```tsx
<XPIndicator totalXp={userData.totalXp} compact={isMobile} />
```

**Desktop view** (default):

- Shows current level with emoji and name (e.g., "🦊 Fjellrev")
- Progress bar filling from current level to next (Nordic gradient colors)
- Total XP and arrow pointing to next level name (e.g., "→ Rein")
- Tooltip with detailed XP info on hover

**Mobile view** (compact mode):

- Minimal badge design with level emoji
- XP progress circle around the badge
- Level name visible on small screens and above

**Key features**:

- Negative XP prevented: `Math.max(0, nextLevelInfo.totalXp - totalXp)`
- Next level name shown instead of countdown ("→ Rein" not "-100")
- Responsive: Full view on desktop, compact on mobile
- Accessible: ARIA labels for screen readers
- Nordic color palette: `from-nordic-sky to-nordic-aurora`

### Test Results XP Display

After completing a test, XP earned is prominently displayed in `TestResultsView`:

**XP Summary Card** (shows if `xpInfo` is available):

```tsx
<div className="p-6 mb-8 border border-nordic-cloudberry/30 rounded-lg
     bg-linear-to-br from-nordic-sunrise/10 to-nordic-cloudberry/10">
```

**Displays**:

1. **XP Earned** - Bold "+125" with "XP Earned" label
2. **Total XP** - Current total XP with "Total XP" label
3. **Current Level** - Level number with localized name (e.g., "Fjellrev")
4. **Progress Bar** - Animated fill showing progress to next level
   - Shows XP needed: "45 XP to go"
   - Smooth 800ms transition animation
   - Nordic gradient: `from-nordic-sky to-nordic-aurora`

**Design goals**:

- Immediate feedback - User sees exactly what they earned
- Progress visualization - Clear path to next level
- Celebration - Warm colors, generous padding, subtle gradients
- Age-appropriate - Simple numbers, no complex calculations visible
- Progress bar (Sunrise Yellow gradient fill)
- XP counter (current / next threshold)

**Placement**: App header, visible on all child-facing pages. Parents see family XP/levels in dashboard.

### XP Gain Feedback

On test completion, show XP earned:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│            ✨ +50 XP ✨                                  │
│                                                         │
│     Great work! You're getting closer to Snøhare.       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Animate number counting up
- Show Stavle `encouraging` or `celebrating` based on score
- Auto-dismiss after 3 seconds or on tap

### Level-Up Celebration

Full-screen modal when leveling up:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    🎉 LEVEL UP! 🎉                       │
│                                                         │
│                   [🐰 Snøhare Icon]                      │
│                                                         │
│              You are now a Snøhare!                     │
│                    Level 3                              │
│                                                         │
│        [Stavle celebrating with sparkles]               │
│                                                         │
│                   [ Continue ]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Scale-up animation on new level icon
- Stavle `celebrating` pose
- Confetti or sparkle effects (subtle, Nordic-style)
- Requires tap to dismiss (moment of celebration)

### Badge Unlock

Toast notification + optional detail view:

```
┌─────────────────────────────────────────────────────────┐
│  🏅 Badge Unlocked: Perfect Score!              +25 XP  │
│     Get 100% on any test                                │
└─────────────────────────────────────────────────────────┘
```

- Slide in from top
- Badge icon + name + XP bonus
- Auto-dismiss after 4 seconds
- Tap to view badge collection

### Color Usage

Per [DESIGN.md](DESIGN.md#color-system):

| Element               | Color                      | Tailwind                                   |
| --------------------- | -------------------------- | ------------------------------------------ |
| XP progress bar fill  | Sunrise Yellow gradient    | `from-nordic-sunrise to-nordic-cloudberry` |
| XP text               | Midnight Blue              | `text-nordic-midnight`                     |
| Level icon background | Level-specific (see table) | varies                                     |
| Badge Bronze          | Cloudberry                 | `bg-nordic-cloudberry/20`                  |
| Badge Silver          | Slate                      | `bg-gray-300`                              |
| Badge Gold            | Sunrise                    | `bg-nordic-sunrise/20`                     |

---

## Data Model

### Database Schema

Minimal additions to existing schema:

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN level INTEGER NOT NULL DEFAULT 1;

-- Add to test_results table for audit trail
ALTER TABLE test_results ADD COLUMN xp_awarded INTEGER NOT NULL DEFAULT 0;
```

### No Separate Transactions Table

XP audit trail is maintained via `test_results.xp_awarded`. This keeps the model simple:
- Each test result records its XP award
- Total XP can be recalculated from sum of `xp_awarded` if needed
- No separate table to maintain or sync

### Badge Storage (Future)

When badges are implemented:

```sql
CREATE TABLE user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    xp_bonus INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
```

### API Response Extension

`SaveTestResult` response adds XP data:

```typescript
interface SaveTestResultResponse {
  testResult: TestResult;
  xp: {
    awarded: number;      // XP earned this test
    total: number;        // New total XP
    level: number;        // Current level
    levelUp: boolean;     // Did we level up?
    newLevelName?: string; // If levelUp, the new level name
    nextLevelXp: number;  // XP needed for next level
  };
  badges?: {
    earned: Badge[];      // Newly earned badges
  };
}
```

---

## Implementation Status

### ✅ Phase 1: Core XP System (Complete)

All core XP functionality is implemented and working:

- ✅ Database migration with `total_xp`, `level` columns on users table
- ✅ Database migration with `xp_awarded` column on test_results table
- ✅ Retroactive XP calculation for existing test results via migration
- ✅ XP service with full calculation logic (base XP, multipliers, decay)
- ✅ XP calculation integrated into test result handler
- ✅ XP data returned in API responses
- ✅ Frontend types updated for XP data
- ✅ XPIndicator component in header (desktop + mobile compact mode)
- ✅ XP display in test results view
- ✅ Level names in both English and Norwegian
- ✅ XP-related i18n messages
- ✅ Seed data generates realistic XP for all users

### 🎨 Phase 2: Level Icons (Pending)

- [ ] Design: Create 11 level icons per specifications
- [ ] Frontend: Add icon assets to `public/levels/`
- [ ] Frontend: Integrate icons into XP components

### 🏆 Phase 3: Badge System (Pending)

- [ ] Database migration: Create `user_badges` table
- [ ] Backend: Create `badge_service.go` with earning logic
- [ ] Backend: Integrate badge checks into test submission
- [ ] Frontend: Create badge display components
- [ ] Frontend: Create badge unlock toast
- [ ] i18n: Add badge names and descriptions (EN + NO)

### ✨ Phase 4: Polish (Pending)

- [ ] XPGainToast: Trigger on test completion
- [ ] LevelUpModal: Trigger on level-up events
- [ ] Add animations to XP gain and level-up
- [ ] Add Stavle poses to celebrations
- [ ] Profile page: Show XP history and badge collection
- [ ] Parent dashboard: Show children's XP/level progress

---

## References

- [LEARNING.md](LEARNING.md) — Pedagogical principles, reward research
- [DESIGN.md](DESIGN.md) — Visual design system, Stavle guidelines
- [ARCHITECTURE.md](ARCHITECTURE.md) — Data model, API patterns

---

*This gamification system is designed to celebrate learning, not manipulate engagement. Every element should make children feel proud of their genuine progress.*
