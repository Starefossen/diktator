# Diktator Design System

A comprehensive design guide for Diktator—a Norwegian vocabulary learning app for children ages 7-14, featuring Stavle the Arctic Fox mascot and a warm Nordic spring aesthetic.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Tone of Voice](#tone-of-voice)
3. [Stavle the Mascot](#stavle-the-mascot)
4. [Color System](#color-system)
5. [Achievement & Badge System](#achievement--badge-system)
6. [Typography](#typography)
7. [Component Patterns](#component-patterns)
8. [Animation & Motion](#animation--motion)
9. [AI Anti-Patterns to Avoid](#ai-anti-patterns-to-avoid)
10. [Accessibility](#accessibility)
11. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

### Core Principles

These principles are grounded in research from Nielsen Norman Group, Smashing Magazine, and Toptal on designing educational apps for children.

#### 1. Immediate Feedback on Everything

> "Every interaction should generate visual/auditory response" — Toptal

Children expect instant feedback. Every button tap, correct answer, or mistake should produce immediate visual and/or audio response. Silence feels like something is broken.

#### 2. "Hard Fun" Over Easy Entertainment

> "Micro-conflicts help develop skills; the journey matters more than the finish line" — Toptal

The app should challenge children without frustrating them. Mistakes are learning opportunities, not failures. The goal is engagement through achievable challenge, not passive consumption.

#### 3. Consistent Navigation

> "Kids form mental models from touchscreen environments—don't reposition key navigation" — Smashing Magazine

Navigation elements must stay in predictable locations. Children rely on muscle memory more than adults. Moving buttons between screens creates confusion and frustration.

#### 4. Age-Appropriate Sizing

| Element       | Minimum Size    | Rationale                                  |
| ------------- | --------------- | ------------------------------------------ |
| Touch targets | 48px (min-h-12) | Fine motor skills develop until age 10     |
| Body text     | 18px            | Children scan less efficiently than adults |
| Headings      | 24-32px         | Visual hierarchy aids comprehension        |
| Line height   | 1.5-1.7         | Generous spacing improves readability      |

#### 5. Just-in-Time Instructions

> "Young kids won't wait; older kids handle post-failure messages" — Smashing Magazine

Instructions should appear when needed, not upfront. For test mode, show how to interact as the child encounters each element, not in a tutorial they'll skip.

#### 6. Let Mistakes Happen Gracefully

> "Let kids make mistakes. No harsh buzzers." — Toptal (citing Word Wizard app)

When a child spells incorrectly, don't punish with jarring sounds or scary red screens. Show what was wrong gently and encourage another try. The goal is learning, not testing.

#### 7. Gamification with Purpose

Achievements, streaks, and progress visualization should celebrate genuine learning milestones, not manipulate engagement. Every gamification element should answer: "Does this help the child learn?"

#### 8. Whimsy Without Distraction

Stavle and playful elements add personality but shouldn't steal focus from the learning task. Animations should punctuate success, not interrupt concentration.

---

## Tone of Voice

### Voice Principles

Diktator speaks as a **helpful friend**—warm, encouraging, and mildly playful. Think of a supportive older sibling or a favorite teacher who happens to love words.

#### The Stavle Voice Spectrum

```
Cold/Clinical ←————————•————————→ Gushing/Patronizing
                    Stavle
              (warm, understated,
               Norwegian-style humor)
```

### Tone Guidelines

| Do                                          | Don't                                    |
| ------------------------------------------- | ---------------------------------------- |
| Encourage without excessive praise          | "Good try, sweetie!" (too young)         |
| Be informative when correcting              | "Incorrect." (too cold/blunt)            |
| Use mild, dry humor occasionally            | Random silliness or baby talk            |
| Keep Norwegian copy natural, not translated | Direct English-to-Norwegian translations |
| Let Stavle have a consistent personality    | Different voices in different screens    |

### Stavle's Personality

- Friendly neighbor/classmate energy
- Curious about words and language (slight word-nerd)
- Occasionally makes gentle word-related jokes
- Never condescending or preachy
- Celebrates effort, not just success

### Example Copy Transformations

#### Test Feedback

| Context       | Current (Cold)          | New (Warm) EN                                     | New (Warm) NO                               |
| ------------- | ----------------------- | ------------------------------------------------- | ------------------------------------------- |
| Correct       | "Correct!"              | "Nailed it!"                                      | "Helt riktig!"                              |
| Wrong         | "Incorrect"             | "Not quite..."                                    | "Nesten..."                                 |
| Attempts left | "Try again (1/3)"       | "Give it another go!"                             | "Prøv en gang til!"                         |
| Almost right  | "Almost!"               | "So close! Just a small slip."                    | "Bare en liten glipp!"                      |
| Final wrong   | "Incorrect - Answer: X" | "The answer was **X** — you'll get it next time!" | "Svaret var **X** — du tar det neste gang!" |

#### Success Celebrations (Graduated)

| Score  | Message EN                                      | Message NO                                    |
| ------ | ----------------------------------------------- | --------------------------------------------- |
| 100%   | "Perfect score! Stavle is impressed!"           | "Full pott! Stavle er imponert!"              |
| 80-99% | "Great work! So close to perfect!"              | "Kjempebra! Nesten helt perfekt!"             |
| 60-79% | "Good effort! Practice makes perfect."          | "Godt jobba! Øvelse gjør mester."             |
| <60%   | "Keep at it — every mistake teaches something!" | "Fortsett å øve — feil er til for å lære av!" |

#### Empty States

| Screen       | Current               | New EN                                          | New NO                                            |
| ------------ | --------------------- | ----------------------------------------------- | ------------------------------------------------- |
| No word sets | "No Word Sets Yet"    | "No word sets yet — time to create your first!" | "Ingen ordsett ennå — på tide å lage det første!" |
| No results   | "No test results yet" | "No tests taken yet. Ready to try one?"         | "Ingen tester tatt ennå. Klar for å prøve?"       |

#### Error Messages

| Context | Current     | New EN                                  | New NO                               |
| ------- | ----------- | --------------------------------------- | ------------------------------------ |
| Generic | "Error"     | "Oops, something went wrong"            | "Oi, noe gikk galt"                  |
| Network | (technical) | "Lost connection. Check your internet?" | "Mistet forbindelsen. Sjekk nettet?" |

#### Hints with Personality

| Current                                       | New EN                                                    | New NO                                           |
| --------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| "Check if there should be a double consonant" | "Double check — should there be a double letter?"         | "Dobbeltsjekk — skal det være dobbel konsonant?" |
| "Remember the silent h at the beginning?"     | "Psst... there's a sneaky silent 'h' hiding at the start" | "Psst... det gjemmer seg en stum 'h' i starten"  |

---

## Stavle the Mascot

### Character Overview

**Stavle** is an arctic fox (fjellrev) who loves learning new words. The name is nonsensical and slightly misspelled—fitting for a spelling app with a sense of humor.

### Visual Description

- **Species**: Arctic fox with fluffy white/cream fur
- **Age vibe**: School-age kid (relatable to 7-14 year olds)
- **Accessories**: Small, slightly worn backpack/satchel (the dedicated student)
- **Fur**: Slightly scruffy, not perfectly groomed (approachable, not precious)
- **Expression**: Default is friendly curiosity with a hint of mischief
- **Style**: Whimsical illustration, not hyper-realistic or overly cartoonish

### Design Principles for Stavle

1. **Whimsical but not silly** — Stavle has personality without being a distraction
2. **Expressive without exaggeration** — Emotions readable but not over-the-top
3. **Consistent across contexts** — Same character whether celebrating or encouraging
4. **Norwegian sensibility** — Understated charm, not American-cartoon energy

### Sprite Sheet Reference

All Stavle poses are available in a single sprite sheet at `public/stavle-sprite.png` with coordinates defined in `public/stavle-sprite.json`.

| Sprite Name           | Position (x, y) | Size    | Description                               |
| --------------------- | --------------- | ------- | ----------------------------------------- |
| `stavle-listening`    | (0, 0)          | 256×256 | Ears perked, attentive, waiting for input |
| `stavle-celebrating`  | (256, 0)        | 256×256 | Small jump, tail wagging, big smile       |
| `stavle-encouraging`  | (512, 0)        | 256×256 | Soft smile, "you got this" gesture        |
| `stavle-waving`       | (0, 256)        | 256×256 | Friendly wave, welcoming posture          |
| `stavle-thinking`     | (256, 256)      | 256×256 | Paw on chin, looking up thoughtfully      |
| `stavle-reading`      | (512, 256)      | 256×256 | Holding a book, focused but happy         |
| `stavle-pointing`     | (0, 512)        | 256×256 | Gesturing toward something, guide pose    |
| `stavle-sleeping`     | (256, 512)      | 256×256 | Curled up, peaceful, zzz                  |
| `stavle-idle`         | (512, 512)      | 256×256 | Relaxed stance, pleasant default          |
| `stavle-idle-resting` | (0, 768)        | 256×256 | Relaxed, slightly tired but content       |

### When to Show Stavle

Stavle should appear at **emotionally significant moments** — not everywhere. Strategic placement makes appearances meaningful.

#### ✅ DO Show Stavle

| Context                    | Pose          | Size      | Placement                | Trigger                     |
| -------------------------- | ------------- | --------- | ------------------------ | --------------------------- |
| **Welcome/Onboarding**     | `waving`      | 160-200px | Center of empty state    | First visit, new user       |
| **Empty Word Sets**        | `pointing`    | 128px     | Above "Create" CTA       | No word sets exist          |
| **Empty Results**          | `encouraging` | 128px     | Center of empty state    | No tests taken yet          |
| **Test Start**             | `listening`   | 64px      | Corner of test card      | Test begins                 |
| **Correct Answer**         | `celebrating` | 64px      | Next to feedback         | Immediate, animate in       |
| **Wrong Answer**           | `encouraging` | 64px      | Next to feedback         | Gentle, no harsh transition |
| **Hint Requested**         | `thinking`    | 48px      | Next to hint text        | User asks for hint          |
| **Test Complete (90%+)**   | `celebrating` | 160px     | Hero position on results | Score revealed              |
| **Test Complete (70-89%)** | `encouraging` | 128px     | Above score              | Score revealed              |
| **Test Complete (<70%)**   | `reading`     | 128px     | With "Practice more" CTA | Gentle, not disappointed    |
| **Achievement Unlocked**   | `celebrating` | 128px     | Behind/beside badge      | Achievement popup           |
| **Practice Mode Active**   | `reading`     | 48px      | Corner, subtle presence  | While practicing            |
| **Audio Playing**          | `listening`   | 48px      | Near audio button        | Word audio plays            |
| **Long Loading (>3s)**     | `sleeping`    | 96px      | Center of loading state  | Rare, adds personality      |
| **Error State**            | `encouraging` | 96px      | Above error message      | Something went wrong        |

#### ❌ DON'T Show Stavle

| Context                      | Reason                                  |
| ---------------------------- | --------------------------------------- |
| Every single screen          | Becomes noise, loses meaning            |
| During active typing         | Distracting from the task               |
| Navigation/header            | Too prominent, clutters UI              |
| Settings/admin pages         | Parent-focused, keep professional       |
| While child is concentrating | Don't interrupt focus                   |
| Multiple Stavles at once     | Confusing, breaks character consistency |
| Constantly animated          | Distracting, increases cognitive load   |

### Animation Guidelines for Stavle

| Animation Type      | Duration | Easing            | Usage                              |
| ------------------- | -------- | ----------------- | ---------------------------------- |
| **Fade in**         | 300ms    | ease-out          | Appearing on screen                |
| **Slide up**        | 400ms    | ease-out          | Entering from below (celebrations) |
| **Gentle bounce**   | 500ms    | spring            | Celebrating correct answer         |
| **Head tilt**       | 200ms    | ease-in-out       | Thinking, encouraging              |
| **Idle bob**        | 2000ms   | ease-in-out, loop | Subtle presence while waiting      |
| **Sleep breathing** | 3000ms   | ease-in-out, loop | Sleeping pose only                 |

```css
/* Example: Stavle celebration entrance */
@keyframes stavle-celebrate-enter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  60% {
    transform: translateY(-5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.stavle-celebrating {
  animation: stavle-celebrate-enter 0.5s ease-out;
}
```

### Implementation: Stavle Component

```tsx
// Example usage with sprite sheet
interface StavleProps {
  pose: 'listening' | 'celebrating' | 'encouraging' | 'waving' |
        'thinking' | 'reading' | 'pointing' | 'sleeping' | 'idle' | 'idle-resting';
  size?: 48 | 64 | 96 | 128 | 160 | 200;
  animate?: boolean;
  className?: string;
}

// Stavle should be imported and used like:
<Stavle pose="celebrating" size={64} animate />
<Stavle pose="encouraging" size={128} />
<Stavle pose="reading" size={48} className="opacity-70" />
```

### Size Specifications

| Context             | Size      | Usage                                    |
| ------------------- | --------- | ---------------------------------------- |
| **Favicon/Icon**    | 32×32px   | Browser tab, app icon small              |
| **Inline feedback** | 48-64px   | Next to test answers, small celebrations |
| **Card accent**     | 80-96px   | Empty state cards, feature highlights    |
| **Empty states**    | 128-160px | "No word sets" screens, onboarding       |
| **Hero/Welcome**    | 200-256px | Landing page, major celebrations         |

### Integration Points

1. **Test feedback** — Small Stavle appears next to answer showing appropriate emotion
2. **Achievement unlocks** — Celebrating Stavle with the achievement badge
3. **Empty states** — Stavle inviting action ("Let's create your first word set!")
4. **Loading states** — Thinking Stavle or subtle animation
5. **Error states** — Encouraging Stavle ("Something went wrong, but we can fix it!")
6. **Onboarding** — Waving Stavle welcoming new users
7. **Practice mode** — Reading Stavle in corner during word study

### What Stavle is NOT

- Not a talking character with speech bubbles everywhere
- Not present in every single screen (would become noise)
- Not animated constantly (distracting)
- Not a reward to unlock (should feel like a friend from day one)
- Not gendered or given complex backstory

---

## Color System

### Design Direction: Nordic Spring

The palette is inspired by Norwegian spring—when snow melts, days lengthen, and nature awakens. Warm, optimistic, and distinctly Scandinavian.

### Primary Palette

| Name                  | Hex       | RGB           | Usage                                         |
| --------------------- | --------- | ------------- | --------------------------------------------- |
| **Sky Blue**          | `#7DD3FC` | 125, 211, 252 | Primary actions, links, interactive elements  |
| **Fjord Teal**        | `#2DD4BF` | 45, 212, 191  | Secondary actions, accents, Stavle's backpack |
| **Meadow Green**      | `#4ADE80` | 74, 222, 128  | Success states, correct answers, progress     |
| **Cloudberry Orange** | `#FB923C` | 251, 146, 60  | Highlights, badges, warm accents              |
| **Sunrise Yellow**    | `#FBBF24` | 251, 191, 36  | Stars, achievements, special celebrations     |

### Neutral Palette

| Name              | Hex       | RGB           | Usage                         |
| ----------------- | --------- | ------------- | ----------------------------- |
| **Midnight Blue** | `#1E3A5A` | 30, 58, 90    | Primary text, headings        |
| **Slate**         | `#475569` | 71, 85, 105   | Secondary text, labels        |
| **Birch Bark**    | `#FEFCE8` | 254, 252, 232 | Page backgrounds (warm cream) |
| **Snow**          | `#FAFAF9` | 250, 250, 249 | Card backgrounds (warm white) |
| **Mist**          | `#E7E5E4` | 231, 229, 228 | Borders, dividers             |

### Semantic Colors

| Purpose                | Color        | Hex       | Usage                                     |
| ---------------------- | ------------ | --------- | ----------------------------------------- |
| **Success**            | Meadow Green | `#4ADE80` | Correct answers, completed tasks          |
| **Success Background** | Light Green  | `#DCFCE7` | Success message backgrounds               |
| **Error**              | Soft Coral   | `#F87171` | Incorrect answers (gentle, not harsh red) |
| **Error Background**   | Light Coral  | `#FEE2E2` | Error message backgrounds                 |
| **Warning**            | Cloudberry   | `#FB923C` | Cautions, last attempt                    |
| **Info**               | Sky Blue     | `#7DD3FC` | Hints, tips, information                  |

### Color Usage Guidelines

#### Backgrounds

```
Page background: Birch Bark (#FEFCE8) — warm cream, not cold white
Card background: Snow (#FAFAF9) — slightly warm white
```

#### Text Hierarchy

```
Headings: Midnight Blue (#1E3A5A)
Body text: Midnight Blue (#1E3A5A) at 90% opacity
Secondary: Slate (#475569)
Disabled: Slate at 50% opacity
```

#### Interactive States

```
Default button: Sky Blue (#7DD3FC)
Hover: Darken 10% or add subtle shadow
Active: Darken 15%
Focus ring: Fjord Teal (#2DD4BF) with 2px offset
```

#### Button Color Hierarchy

Use distinct colors to communicate button purpose and create visual variety:

| Button Type               | Color                 | Tailwind Classes                   | Rationale                                |
| ------------------------- | --------------------- | ---------------------------------- | ---------------------------------------- |
| **Primary Action (Test)** | Meadow → Sky gradient | `from-nordic-meadow to-nordic-sky` | Green signals "go" / positive action     |
| **Create / Add**          | Meadow → Sky gradient | `from-nordic-meadow to-nordic-sky` | Consistent with primary positive actions |
| **Practice / Study**      | Cloudberry            | `bg-nordic-cloudberry`             | Warm, relaxed, distinct from test        |
| **Analytics / Info**      | Sky                   | `bg-nordic-sky`                    | Informational, neutral-positive          |
| **Secondary**             | Gray/transparent      | `bg-gray-100` or `border-gray-200` | De-emphasized actions                    |
| **Destructive**           | Red                   | `text-red-700`                     | Clear warning for delete actions         |

**Anti-pattern**: Avoid using the same color (e.g., teal) for both primary and secondary buttons. This creates monotony and reduces visual hierarchy.

#### Score-Based Color Coding

Use color to communicate performance at a glance:

| Score Range   | Color             | Hex       | Tailwind Classes                                 | Meaning                 |
| ------------- | ----------------- | --------- | ------------------------------------------------ | ----------------------- |
| **90-100%**   | Sunrise Yellow    | `#FBBF24` | `text-nordic-sunrise bg-nordic-sunrise/20`       | Excellence, celebration |
| **70-89%**    | Meadow Green      | `#4ADE80` | `text-nordic-meadow bg-nordic-meadow/20`         | Good performance        |
| **Below 70%** | Cloudberry Orange | `#FB923C` | `text-nordic-cloudberry bg-nordic-cloudberry/20` | Needs more practice     |

**Important**: This graduated scale helps children understand their progress intuitively—gold is the goal, green is good, orange means keep trying.

#### Word Pill Colors

Word pills should use warm, varied colors that feel inviting:

| State              | Color             | Tailwind Classes                                                             | Usage                    |
| ------------------ | ----------------- | ---------------------------------------------------------------------------- | ------------------------ |
| **Default**        | Sky Blue tint     | `bg-nordic-sky/20 text-nordic-midnight`                                      | Regular words with audio |
| **Needs Practice** | Cloudberry accent | `bg-nordic-cloudberry/20 text-nordic-cloudberry border-nordic-cloudberry/40` | Words to focus on        |
| **No Audio**       | Gray              | `bg-gray-100 text-gray-600`                                                  | Words without playback   |
| **Playing**        | Sky ring          | `ring-2 ring-nordic-sky`                                                     | Currently playing audio  |

### Gradients (Use Sparingly)

Gradients should feel natural, like light or sky, not artificial "tech" gradients.

```css
/* Primary action gradient — horizontal sunrise */
background: linear-gradient(to right, #7DD3FC, #2DD4BF);

/* Celebration gradient — achievement glow */
background: linear-gradient(135deg, #FBBF24, #FB923C);

/* Avoid: harsh purple-blue, neon, or overly saturated gradients */
```

### Mode-Specific Gradients

To visually differentiate learning modes, each mode has a distinct gradient:

| Mode         | Gradient                | Tailwind Classes                        | Purpose                    |
| ------------ | ----------------------- | --------------------------------------- | -------------------------- |
| **Test**     | Sky Blue → Fjord Teal   | `from-nordic-sky to-nordic-teal`        | Primary learning activity  |
| **Practice** | Fjord Teal → Cloudberry | `from-nordic-teal to-nordic-cloudberry` | Relaxed, exploratory study |
| **Results**  | Meadow Green → Sky Blue | `from-nordic-meadow to-nordic-sky`      | Celebration, completion    |

```css
/* Test mode — focused, clear, primary */
.progress-bar-test {
  background: linear-gradient(to right, #7DD3FC, #2DD4BF);
}

/* Practice mode — warm, relaxed, exploratory */
.progress-bar-practice {
  background: linear-gradient(to right, #2DD4BF, #FB923C);
}

/* Results/completion — celebratory, accomplished */
.progress-bar-results {
  background: linear-gradient(to right, #4ADE80, #7DD3FC);
}
```

### Role-Specific Colors

For sections that highlight different user roles (e.g., benefits section on home page), use distinct colors from the Nordic palette while maintaining warmth:

| Role         | Primary Color | Background         | Tailwind Classes                            |
| ------------ | ------------- | ------------------ | ------------------------------------------- |
| **Parents**  | Sky Blue      | `nordic-sky/10`    | `text-nordic-sky`, `bg-nordic-sky/10`       |
| **Children** | Meadow Green  | `nordic-meadow/10` | `text-nordic-meadow`, `bg-nordic-meadow/10` |
| **Family**   | Fjord Teal    | `nordic-teal/10`   | `text-nordic-teal`, `bg-nordic-teal/10`     |

This maintains visual differentiation while staying within the Nordic palette.

### Achievement & Celebration Colors

Achievement badges and celebration screens use warm, celebratory colors:

| Achievement Type | Gradient                  | Tailwind Classes                           |
| ---------------- | ------------------------- | ------------------------------------------ |
| **Gold/Primary** | Sunrise → Cloudberry      | `from-nordic-sunrise to-nordic-cloudberry` |
| **Progress**     | Cloudberry → Sunrise      | `from-nordic-cloudberry to-nordic-sunrise` |
| **Streak**       | Meadow Green → Fjord Teal | `from-nordic-meadow to-nordic-teal`        |

```css
/* Achievement badge — warm celebratory glow */
.badge-achievement {
  background: linear-gradient(135deg, #FBBF24, #FB923C);
}

/* Streak badge — growth and consistency */
.badge-streak {
  background: linear-gradient(135deg, #4ADE80, #2DD4BF);
}
```

---

## Achievement & Badge System

### Design Philosophy

Badges reward **genuine learning milestones**, not engagement metrics. Every badge should answer: "Does earning this mean the child learned something?" Avoid badges that reward time spent or clicks—focus on mastery and growth.

### Badge Visual Design

All badges share a consistent visual language:

```
┌─────────────────────────────────────┐
│                                     │
│         ╭─────────────╮             │
│        ╱   [ICON]      ╲            │  ← Gradient background
│       │                 │           │     (achievement-specific)
│       │    ⭐ / 🏆 / 📚   │           │
│        ╲               ╱            │
│         ╰─────────────╯             │
│                                     │
│     Badge Name                      │  ← Bold, centered
│     Short description               │  ← Secondary text
│                                     │
└─────────────────────────────────────┘
```

#### Badge Tiers

| Tier       | Border Color        | Background Gradient                | Meaning          |
| ---------- | ------------------- | ---------------------------------- | ---------------- |
| **Bronze** | `nordic-cloudberry` | `cloudberry/10` to `cloudberry/20` | Getting started  |
| **Silver** | `nordic-sky`        | `sky/10` to `teal/20`              | Solid progress   |
| **Gold**   | `nordic-sunrise`    | `sunrise/10` to `sunrise/30`       | Mastery achieved |

### Achievement Categories

#### 1. Mastery Badges (Score-Based)

Earned by achieving high scores on tests. These are the "goal" badges children work toward.

| Badge Name            | Icon | Criteria                        | Tier   | EN Description                   | NO Description                  |
| --------------------- | ---- | ------------------------------- | ------ | -------------------------------- | ------------------------------- |
| **First Steps**       | 🌱    | Complete first test             | Bronze | "You took your first test!"      | "Du tok din første test!"       |
| **Word Learner**      | 📖    | Score 70%+ on any test          | Bronze | "Good effort on your test!"      | "Godt jobba på testen!"         |
| **Word Master**       | ⭐    | Score 90%+ on any test          | Silver | "Amazing score!"                 | "Fantastisk resultat!"          |
| **Perfect Speller**   | 🏆    | Score 100% on any test          | Gold   | "Perfect! Not a single mistake!" | "Perfekt! Ikke én eneste feil!" |
| **Spelling Champion** | 👑    | Score 100% on 5 different tests | Gold   | "A true spelling champion!"      | "En ekte stavemester!"          |

#### 2. Consistency Badges (Streak-Based)

Earned by practicing regularly. Encourages habit formation without punishing breaks.

| Badge Name             | Icon | Criteria      | Tier   | EN Description              | NO Description          |
| ---------------------- | ---- | ------------- | ------ | --------------------------- | ----------------------- |
| **Getting Started**    | 🔥    | 3-day streak  | Bronze | "3 days in a row!"          | "3 dager på rad!"       |
| **Consistent Learner** | 🔥🔥   | 7-day streak  | Silver | "A whole week of practice!" | "En hel uke med øving!" |
| **Dedicated Student**  | 🔥🔥🔥  | 14-day streak | Gold   | "Two weeks strong!"         | "To uker i strekk!"     |
| **Learning Machine**   | ⚡    | 30-day streak | Gold   | "Incredible dedication!"    | "Utrolig dedikasjon!"   |

**Streak rules:**
- A "day" counts if the child completes at least one test
- Streak resets after 48 hours of inactivity (gives grace period)
- Weekends don't break streaks if Friday was active

#### 3. Volume Badges (Quantity-Based)

Earned by completing many tests. Celebrates persistence.

| Badge Name         | Icon | Criteria           | Tier   | EN Description           | NO Description             |
| ------------------ | ---- | ------------------ | ------ | ------------------------ | -------------------------- |
| **Test Taker**     | 📝    | Complete 10 tests  | Bronze | "10 tests completed!"    | "10 tester fullført!"      |
| **Frequent Flyer** | ✈️    | Complete 25 tests  | Silver | "25 tests and counting!" | "25 tester og teller!"     |
| **Test Veteran**   | 🎖️    | Complete 50 tests  | Silver | "50 tests! Impressive!"  | "50 tester! Imponerende!"  |
| **Century Club**   | 💯    | Complete 100 tests | Gold   | "100 tests! Legendary!"  | "100 tester! Legendarisk!" |

#### 4. Word Count Badges

Earned by learning many unique words correctly.

| Badge Name             | Icon | Criteria                         | Tier   | EN Description                 | NO Description                 |
| ---------------------- | ---- | -------------------------------- | ------ | ------------------------------ | ------------------------------ |
| **Word Collector**     | 🔤    | Spell 50 unique words correctly  | Bronze | "50 words in your collection!" | "50 ord i samlingen din!"      |
| **Vocabulary Builder** | 📚    | Spell 100 unique words correctly | Silver | "100 words mastered!"          | "100 ord mestret!"             |
| **Word Wizard**        | 🧙    | Spell 250 unique words correctly | Gold   | "250 words! You're a wizard!"  | "250 ord! Du er en trollmann!" |
| **Dictionary Master**  | 📖✨   | Spell 500 unique words correctly | Gold   | "500 words! Incredible!"       | "500 ord! Utrolig!"            |

#### 5. Improvement Badges

Earned by showing growth over time. Celebrates effort, not just talent.

| Badge Name         | Icon | Criteria                         | Tier   | EN Description           | NO Description         |
| ------------------ | ---- | -------------------------------- | ------ | ------------------------ | ---------------------- |
| **Getting Better** | 📈    | Improve score by 20%+ on retake  | Bronze | "Great improvement!"     | "Flott forbedring!"    |
| **Comeback Kid**   | 🔄    | Go from <60% to 90%+ on same set | Silver | "What a turnaround!"     | "For en snuoperasjon!" |
| **Growth Mindset** | 🌟    | Improve on 5 different word sets | Gold   | "Always getting better!" | "Alltid i fremgang!"   |

#### 6. Special Badges

Unique achievements that add variety.

| Badge Name           | Icon | Criteria                        | Tier   | EN Description                    | NO Description              |
| -------------------- | ---- | ------------------------------- | ------ | --------------------------------- | --------------------------- |
| **Early Bird**       | 🐦    | Complete a test before 8am      | Bronze | "Up and learning early!"          | "Oppe og lærer tidlig!"     |
| **Night Owl**        | 🦉    | Complete a test after 8pm       | Bronze | "Learning into the night!"        | "Lærer til langt på kveld!" |
| **Speed Demon**      | ⚡    | Complete a 10-word test in <60s | Silver | "Lightning fast!"                 | "Lynrask!"                  |
| **Careful Speller**  | 🎯    | 100% with no hints used         | Silver | "Perfect without any help!"       | "Perfekt uten hjelp!"       |
| **Polyglot Starter** | 🌍    | Complete tests in 2+ languages  | Silver | "Learning in multiple languages!" | "Lærer på flere språk!"     |
| **Family Helper**    | 👨‍👩‍👧    | Parent creates 5+ word sets     | Gold   | "Building a great collection!"    | "Bygger en flott samling!"  |

### Badge Display & Unlock Flow

#### Unlock Animation

When a badge is earned:

1. **Overlay appears** — Semi-transparent backdrop
2. **Stavle enters** — `celebrating` pose, slides up
3. **Badge reveals** — Scales up with glow effect
4. **Confetti burst** — Subtle, brief (respect `prefers-reduced-motion`)
5. **Sound effect** — Pleasant chime (optional, respects mute settings)
6. **Dismiss** — Tap anywhere or auto-dismiss after 4 seconds

```css
@keyframes badge-unlock {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-10deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.badge-unlocking {
  animation: badge-unlock 0.6s ease-out;
}
```

#### Badge Collection View

Badges are displayed in a grid on the profile/achievements page:

- **Earned badges**: Full color, gradient background
- **Locked badges**: Grayscale with lock icon overlay
- **Progress badges**: Show progress bar (e.g., "15/25 tests")
- **Tap to expand**: Shows full description and date earned

### Badge Component Specifications

```tsx
interface BadgeProps {
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  earned: boolean;
  earnedAt?: Date;
  progress?: { current: number; target: number };
  description: string;
}
```

#### Visual Specifications

| Property      | Bronze              | Silver            | Gold                |
| ------------- | ------------------- | ----------------- | ------------------- |
| Border width  | 2px                 | 3px               | 4px                 |
| Border color  | `nordic-cloudberry` | `nordic-sky`      | `nordic-sunrise`    |
| Background    | `cloudberry/10`     | `sky/10`          | `sunrise/20`        |
| Icon size     | 32px                | 36px              | 40px                |
| Glow on hover | None                | Subtle `sky` glow | Warm `sunrise` glow |
| Shadow        | `shadow-sm`         | `shadow-md`       | `shadow-lg`         |

### Data Model Considerations

Badges should be stored with:

```typescript
interface UserBadge {
  badgeId: string;           // e.g., "perfect-speller"
  earnedAt: Date;
  metadata?: {
    testId?: string;         // Which test triggered it
    wordSetId?: string;      // Related word set
    score?: number;          // Score that earned it
  };
}

interface BadgeProgress {
  badgeId: string;
  currentValue: number;      // e.g., 15 tests completed
  targetValue: number;       // e.g., 25 tests needed
  lastUpdated: Date;
}
```

### Badge Display Priority

When showing badges in limited space (e.g., profile summary), prioritize:

1. **Most recently earned** — Immediate gratification
2. **Highest tier** — Gold > Silver > Bronze
3. **Rarest** — Fewer users have earned it
4. **Most impressive** — Perfect scores, long streaks

### Dark Mode Consideration

Dark mode is not planned for initial release. The warm cream backgrounds work well in various lighting conditions. If added later, invert the neutral palette while keeping accent colors vibrant.

---

## Typography

### Font Choice: Lexend

**Lexend** is chosen for its research-backed benefits for reading comprehension and its suitability for children, including those with dyslexia.

#### Why Lexend?

1. **Designed for reading fluency** — Studies show improved words-per-minute with Lexend
2. **Expanded character spacing** — Reduces visual crowding
3. **Clear letterforms** — Distinct characters prevent confusion (a/o, l/1/I)
4. **Norwegian support** — Full æ, ø, å via `latin-ext` subset
5. **Variable font** — Single file, all weights (100-900)

### Installation (Next.js App Router)

#### 1. Update `frontend/src/app/layout.tsx`

```tsx
import { Lexend } from 'next/font/google';

const lexend = Lexend({
  subsets: ['latin', 'latin-ext'], // latin-ext includes æ, ø, å
  display: 'swap',
  variable: '--font-lexend',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={lexend.variable}>
      <body className={lexend.className}>
        {children}
      </body>
    </html>
  );
}
```

#### 2. Update `frontend/tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-lexend)', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### Type Scale

| Element        | Size    | Weight | Line Height | Usage                              |
| -------------- | ------- | ------ | ----------- | ---------------------------------- |
| **Display**    | 32-40px | 700    | 1.2         | Hero headings, celebration screens |
| **H1**         | 28-32px | 600    | 1.3         | Page titles                        |
| **H2**         | 24px    | 600    | 1.4         | Section headings                   |
| **H3**         | 20px    | 500    | 1.4         | Card titles, subsections           |
| **Body**       | 18px    | 400    | 1.6         | Primary content, test UI           |
| **Body Small** | 16px    | 400    | 1.5         | Secondary content, parent UI       |
| **Caption**    | 14px    | 400    | 1.4         | Labels, metadata (use sparingly)   |

### Typography Rules

1. **Minimum 18px for children's UI** — Test screens, word displays, feedback
2. **16px acceptable for parent admin UI** — Settings, detailed tables
3. **Never use text smaller than 14px** — Even for captions
4. **Line length 45-75 characters** — Use `max-w-prose` or similar
5. **Generous line-height** — 1.5 minimum, 1.6-1.7 for body text

---

## Component Patterns

### Two Interface Modes

The app serves two audiences with different needs:

| Aspect         | Child Interface                      | Parent Interface                  |
| -------------- | ------------------------------------ | --------------------------------- |
| **Purpose**    | Learning, practicing, testing        | Managing, monitoring, creating    |
| **Tone**       | Playful, encouraging, Stavle-present | Clean, professional, data-focused |
| **Colors**     | Full palette, celebrations           | Subdued, functional accents       |
| **Typography** | 18px+ body, large headings           | 16px body acceptable              |
| **Animation**  | Celebratory, feedback-rich           | Subtle, functional                |
| **Complexity** | Minimal options, clear paths         | Full feature access               |

### Button Hierarchy

#### Child Interface Buttons

```css
/* Primary action — "Start Test", "Next Word" */
.btn-primary-child {
  background: linear-gradient(to right, #7DD3FC, #2DD4BF);
  color: #1E3A5A;
  padding: 16px 32px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 18px;
  min-height: 56px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Secondary action — "Skip", "Back" */
.btn-secondary-child {
  background: #FAFAF9;
  border: 2px solid #E7E5E4;
  color: #1E3A5A;
  padding: 12px 24px;
  border-radius: 12px;
  min-height: 48px;
}

/* Success state — Correct answer feedback */
.btn-success {
  background: #4ADE80;
  color: #1E3A5A;
}
```

#### Parent Interface Buttons

```css
/* Primary — "Save", "Create" */
.btn-primary {
  background: #7DD3FC;
  color: #1E3A5A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  min-height: 48px;
}

/* Secondary — "Cancel", "Back" */
.btn-secondary {
  background: transparent;
  border: 1px solid #E7E5E4;
  color: #475569;
}
```

### Card Patterns

#### Word Set Card (Child View)

```css
.card-wordset-child {
  background: #FAFAF9;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
}

.card-wordset-child:hover {
  border-color: #7DD3FC;
  box-shadow: 0 8px 12px -2px rgba(125, 211, 252, 0.2);
}
```

#### Achievement Card

```css
.card-achievement {
  background: linear-gradient(135deg, #FEFCE8, #FEF3C7);
  border: 2px solid #FBBF24;
  border-radius: 16px;
  padding: 20px;
}
```

### Input Fields

```css
.input-child {
  background: #FAFAF9;
  border: 2px solid #E7E5E4;
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 18px;
  min-height: 56px;
}

.input-child:focus {
  border-color: #7DD3FC;
  outline: none;
  box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.3);
}
```

### Progress Indicators

```css
/* Test progress bar */
.progress-bar {
  background: #E7E5E4;
  border-radius: 9999px;
  height: 12px;
}

.progress-bar-fill {
  background: linear-gradient(to right, #7DD3FC, #4ADE80);
  border-radius: 9999px;
  transition: width 0.3s ease-out;
}
```

---

## Animation & Motion

### Principles

1. **Purpose over decoration** — Every animation should serve UX, not just look pretty
2. **Celebrate success visibly** — Correct answers deserve noticeable but brief celebration
3. **Soften failure gently** — Wrong answers get subtle, non-jarring feedback
4. **Respect preferences** — Always check `prefers-reduced-motion`
5. **Spring physics** — Use easing that feels natural, not linear or overly bouncy

### Timing Guidelines

| Animation Type          | Duration  | Easing                    |
| ----------------------- | --------- | ------------------------- |
| **UI transitions**      | 150-200ms | ease-out                  |
| **Button feedback**     | 100-150ms | ease-in-out               |
| **Card hover**          | 200ms     | ease-out                  |
| **Success celebration** | 500-800ms | spring (slight overshoot) |
| **Stavle entrance**     | 300-400ms | ease-out                  |
| **Page transitions**    | 200-300ms | ease-in-out               |

### Key Animations

#### Correct Answer

```css
@keyframes success-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.answer-correct {
  animation: success-pop 0.4s ease-out;
  background-color: #DCFCE7;
}
```

#### Wrong Answer (Gentle)

```css
@keyframes gentle-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.answer-wrong {
  animation: gentle-shake 0.3s ease-in-out;
  /* No harsh red — use soft coral briefly */
}
```

#### Stavle Celebration

```css
@keyframes stavle-jump {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-12px); }
  60% { transform: translateY(-8px); }
}

.stavle-celebrating {
  animation: stavle-jump 0.6s ease-out;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## AI Anti-Patterns to Avoid

### The "Sameness Problem"

AI-generated UI tends toward generic patterns. Diktator should feel distinctive and purposeful.

### Patterns to Reject

| Anti-Pattern                      | Why It's Bad                                              | What to Do Instead                       |
| --------------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| **Blue-purple gradients**         | Overused, feels "tech startup" not "children's education" | Warm sky-to-teal gradients               |
| **Cold gray backgrounds**         | Clinical, unwelcoming                                     | Warm cream (Birch Bark)                  |
| **Perfectly centered everything** | Monotonous, lacks visual interest                         | Asymmetric layouts, varied alignment     |
| **Generic rounded cards**         | Every AI mockup looks identical                           | Distinctive card styles per content type |
| **Hero + illustration pattern**   | Seen in every landing page                                | Stavle integration, unique onboarding    |
| **Stock illustration style**      | Feels impersonal, corporate                               | Custom Stavle illustrations              |
| **Gradient text**                 | Often poor accessibility, feels dated                     | Solid text colors                        |
| **Excessive shadows**             | "Floating card" syndrome                                  | Subtle shadows, used sparingly           |
| **Neon accent colors**            | Feels gamified in a cheap way                             | Warm, natural accent palette             |

### Distinctive Elements for Diktator

1. **Stavle as guide** — No other app has this character
2. **Nordic spring palette** — Warm but not generic "cheerful"
3. **Research-backed typography** — Lexend for genuine readability benefits
4. **Graduated feedback** — Nuanced responses to performance, not binary
5. **Norwegian personality** — Understated humor, not American over-enthusiasm

---

## Accessibility

### WCAG 2.1 AA Compliance

The app must meet accessibility standards, especially important for children who may have undiagnosed learning differences.

### Requirements Checklist

| Requirement             | Standard                 | Implementation                               |
| ----------------------- | ------------------------ | -------------------------------------------- |
| **Color contrast**      | 4.5:1 minimum for text   | All text colors tested against backgrounds   |
| **Touch targets**       | 48×48px minimum          | `min-h-12` on all interactive elements       |
| **Focus indicators**    | Visible focus ring       | 2px ring with offset, high contrast          |
| **Keyboard navigation** | Full keyboard access     | All interactions work without mouse          |
| **Screen reader**       | Meaningful announcements | ARIA labels, live regions for feedback       |
| **Motion sensitivity**  | Respect preferences      | `prefers-reduced-motion` support             |
| **Text scaling**        | Support up to 200%       | No fixed heights that break with larger text |

### Child-Specific Accessibility

1. **Dyslexia-friendly font** — Lexend's design helps readability
2. **Clear visual feedback** — Not relying only on color for correct/incorrect
3. **Audio support** — TTS for words, sound effects optional
4. **Simple language** — Instructions use clear, short sentences
5. **Consistent layout** — Predictable navigation aids children with attention differences

---

## Implementation Checklist

### Phase 1: Foundation ✅ COMPLETED

- [x] Install Lexend font via `next/font/google`
- [x] Update Tailwind config with new color palette
- [x] Replace blue-purple gradients in global CSS (`.btn-primary`, `.text-gradient`, etc.)
- [x] Update background colors (layout.tsx: `bg-nordic-birch`)
- [x] Update Navigation component colors
- [x] Update PWA manifest and SVG icons
- [x] Add CSS custom properties for semantic colors

### Phase 2: Component Color Migration ✅ COMPLETED

All old color classes (blue-500, purple-600, indigo-*) have been replaced with Nordic palette across all pages and components.

#### Pages Updated

- [x] `/app/page.tsx` - Home page
- [x] `/app/about/page.tsx` - About page
- [x] `/app/wordsets/page.tsx` - Word sets page
- [x] `/app/family/page.tsx` - Family page
- [x] `/app/results/page.tsx` - Results page
- [x] `/app/profile/page.tsx` - Profile page
- [x] `/app/settings/page.tsx` - Settings page
- [x] `/app/family/progress/page.tsx` - Progress page
- [x] `/app/auth/callback/page.tsx` - Auth callback page
- [x] `/app/register/page.tsx` - Registration page
- [x] `/app/not-found.tsx` - 404 page

#### Core Components Updated

- [x] `TestView.tsx` - Progress bar, buttons
- [x] `PracticeView.tsx` - Nordic colors throughout
- [x] `TestResultsView.tsx` - Buttons, backgrounds
- [x] `SpellingFeedback.tsx` - Hint backgrounds
- [x] `AuthForm.tsx` - Logo, buttons
- [x] `WordSetEditor.tsx` - Nordic sky throughout
- [x] `ModeSelectionModal.tsx` - Nordic sky
- [x] `WordSetCard/ChildWordSetCard.tsx` - Nordic teal
- [x] `WordSetCard/ParentWordSetCard.tsx` - Nordic palette
- [x] `ChildAssignmentSelector.tsx` - Nordic sky
- [x] `NavigationLanguageSwitcher.tsx` - Nordic sky
- [x] `Icons.tsx` - Nordic colors
- [x] `modals/BaseModal.tsx` - Nordic sky/teal buttons
- [x] `modals/SettingsModal.tsx` - Nordic teal checkboxes/inputs
- [x] `WordSetsListView.tsx` - Nordic teal empty state
- [x] `TestResultsList.tsx` - Nordic sky username
- [x] `LoadingSpinner.tsx` - Nordic sky spinner

### Phase 3: Button & Card Redesign ✅ COMPLETED

- [x] Created `Button` component (`/components/Button.tsx`)
  - Variants: `primary-child`, `secondary-child`, `primary`, `secondary`, `success`, `practice`, `danger`
  - Supports `as` prop for rendering as `<Link>` or `<a>`
  - Loading state with spinner
  - Disabled state styling
  - Layout-only className overrides (w-full, mt-4, etc.)
- [x] Created `IconButton` component (`/components/IconButton.tsx`)
  - Variants: `default`, `primary`, `danger`
  - 40px minimum touch target
  - Required `aria-label` for accessibility
- [x] Added comprehensive CSS classes in `globals.css`:
  - `.btn-primary-child` - 56px, gradient, rounded-2xl
  - `.btn-secondary-child` - 48px, nordic-snow bg
  - `.btn-primary` / `.btn-secondary` - Standard 48px buttons
  - `.btn-success` - Meadow green for positive actions
  - `.btn-practice` - Cloudberry for practice mode
  - `.btn-danger` - Coral red for destructive actions
  - `.btn-icon` / `.btn-icon-primary` / `.btn-icon-danger` - 40px icon buttons
  - `.card-child` - 20px radius, nordic-snow bg
  - `.card-parent` - 12px radius, nordic-snow bg
  - `.card-achievement` - Gradient border effect
  - `.input-child` - 56px height for little fingers
- [x] Migrated child components to use Button/IconButton:
  - `ChildWordSetCard.tsx` - Fixed typo bug, applied card-child class
  - `TestView.tsx` - All action buttons
  - `TestResultsView.tsx` - Restart and exit buttons
  - `PracticeView.tsx` - Navigation and action buttons
- [x] Migrated parent components:
  - `ParentWordSetCard.tsx` - Applied card-parent class, IconButtons
- [x] Migrated page-level buttons:
  - `not-found.tsx` - Using Button with `as="link"`

#### Button Component Usage

```tsx
// Primary child button (large, gradient)
<Button variant="primary-child" onClick={handleStart}>
  Start Test
</Button>

// Secondary child button (softer)
<Button variant="secondary-child" onClick={handleBack}>
  Go Back
</Button>

// Button as Next.js Link
<Button as="link" href="/wordsets" variant="primary">
  View Word Sets
</Button>

// Icon button for actions
<IconButton
  variant="primary"
  onClick={handlePlay}
  aria-label={t('aria.playAudio')}
>
  <PlayIcon className="w-4 h-4" />
</IconButton>

// With loading state
<Button variant="primary" loading={isSubmitting}>
  Save Changes
</Button>

// Layout overrides (only layout classes pass through)
<Button variant="primary-child" className="w-full mt-4">
  Full Width Button
</Button>
```

### Phase 4: Tone of Voice

- [ ] Audit all i18n strings
- [ ] Rewrite error messages (softer tone)
- [ ] Add graduated success messages
- [ ] Update empty state copy
- [ ] Add personality to loading states

### Phase 5: Stavle Integration

- [ ] Generate Stavle illustrations (all required poses)
- [ ] Add Stavle to empty states
- [ ] Add Stavle to test feedback
- [ ] Add Stavle to celebration screens
- [ ] Create loading animation with Stavle

### Phase 6: Animation & Polish

- [ ] Add success/failure animations
- [ ] Implement Stavle entrance animations
- [ ] Add `prefers-reduced-motion` support
- [ ] Final accessibility audit
- [ ] Cross-browser testing

---

## Resources

### Research Sources

- [Nielsen Norman Group: Children's UX](https://www.nngroup.com/articles/children-ux-guidelines/)
- [Smashing Magazine: Designing Web Interfaces for Kids](https://www.smashingmagazine.com/2015/08/designing-web-interfaces-for-kids/)
- [Toptal: Building Apps for Kids](https://www.toptal.com/designers/interactive/guide-to-apps-for-kids)
- [Lexend Font Research](https://www.lexend.com/)

### Tools

- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)

---

*This design system is a living document. Update it as the app evolves and new patterns emerge.*
