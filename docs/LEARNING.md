# Diktator - Learning Methodology

**Version**: 1.0
**Last Updated**: January 2026

## Overview

This document describes the pedagogical approach behind Diktator—how we teach spelling to Norwegian children ages 5-12. Our methods are grounded in research on spelling acquisition, child development, and language learning.

---

## Learning Philosophy

### Core Principles

#### 1. Active Recall Over Passive Recognition

Children learn spelling by actively producing words, not just recognizing them. Diktator emphasizes typing/building words rather than multiple-choice recognition.

> **Research basis**: Testing effect studies show that active retrieval strengthens memory more than re-reading or recognition tasks (Roediger & Karpicke, 2006).

#### 2. Immediate, Specific Feedback

Every attempt receives instant feedback. When wrong, children see exactly what was incorrect and why, not just "wrong."

> **Research basis**: Immediate corrective feedback accelerates learning, especially for procedural skills like spelling (Hattie & Timperley, 2007).

#### 3. Productive Failure

Mistakes are learning opportunities. The app encourages multiple attempts before revealing answers, allowing children to self-correct.

> **Research basis**: Struggling before receiving instruction leads to deeper understanding (Kapur, 2014).

#### 4. Scaffolded Challenge

Input methods progress from supported (letter tiles) to independent (keyboard), matching the child's developing skills.

> **Research basis**: Vygotsky's Zone of Proximal Development—learning happens best with appropriate support that's gradually removed.

#### 5. Multimodal Learning

Children hear words (audio), see words (text), and produce words (typing/tapping). Multiple modalities strengthen encoding.

> **Research basis**: Dual coding theory shows combining verbal and visual information improves retention (Paivio, 1986).

---

## Test Modes

Diktator offers three test modes, each targeting different aspects of spelling acquisition:

### Flashcard Mode

**What the child sees**: Word + audio → countdown → spelling revealed
**What the child does**: Self-check ("Did I know it?") or optional type-to-verify

**Learning purpose**: Builds visual memory through brief exposure followed by self-assessment. Lower pressure than typing modes—good for confidence building and initial exposure.

**How it works**:

1. **Show**: Word appears with audio (2-3 seconds)
2. **Countdown**: Animated 3-2-1 countdown
3. **Reveal**: Correct spelling shown
4. **Self-check**: Child indicates if they knew it (Yes/No buttons)
5. **Optional verify**: Toggle to type the word for confirmation

**When to use**:

- First exposure to new words
- Quick review sessions
- Building confidence before harder modes
- When typing would slow down learning flow

> **Research basis**: Flashcard-style learning leverages the testing effect—even attempting to recall before seeing the answer strengthens memory (Roediger & Karpicke, 2006).

### Dictation Mode

**What the child sees**: Audio only (no text)
**What the child types**: The heard word

**Learning purpose**: Develops phoneme-to-grapheme conversion—hearing sounds and producing correct letters. This is the core skill of spelling.

**When to use**:

- After initial exposure in Flashcard or Look-Cover-Write mode
- Testing true spelling knowledge
- Developing auditory processing skills

### Translation Mode

**What the child sees**: Word in source language
**What the child types**: Translation in target language

**Learning purpose**: Vocabulary expansion across languages. Requires semantic understanding, not just orthographic memory.

**When to use**:

- Bilingual learning contexts
- Vocabulary building (not just spelling)
- Advanced learners

### Look-Cover-Write-Check Mode

**What the child sees**: Word displayed briefly → covered → blank input
**What the child types**: The word from memory

**Learning purpose**: Develops visual memory of word shapes. This is an evidence-based method widely used in schools ("Look, Say, Cover, Write, Check").

**How it works**:

1. **Look**: Word appears with audio (3-5 seconds)
2. **Cover**: Word disappears, child mentally rehearses
3. **Write**: Child types the word from memory
4. **Check**: Correct answer revealed for comparison

**When to use**:

- After Practice mode exposure
- For visual learners
- Words with irregular spellings that must be memorized
- Norwegian sight words (høyfrekvente ord)

> **Research basis**: The Look-Say-Cover-Write-Check method is based on the belief that spelling is a visual skill. It encourages children to form mental images of words.

### Mode Progression

Recommended progression for new word sets:

1. **Practice** → View words, listen to pronunciation
2. **Flashcard** → Quick self-check, build familiarity
3. **Look-Cover-Write** → Build visual memory with typing
4. **Letter Tiles / Word Bank** → Supported spelling practice
5. **Keyboard** → Full spelling production
6. **Translation** → Expand vocabulary (if applicable)

### Adaptive Mode Selection

When a child starts a test, the app recommends an appropriate mode based on context:

```text
IF content is sentence (2+ words):
  → Recommend: Word Bank
ELSE IF mastery < 50%:
  → Recommend: Letter Tiles (most support)
ELSE IF mastery < 80%:
  → Recommend: Flashcard or Missing Letters
ELSE:
  → Recommend: Keyboard (least support)

OVERRIDE: If child succeeded 3+ times with harder mode → recommend that
```

**Algorithm factors**:

| Factor              | Weight | Rationale                                                   |
| ------------------- | ------ | ----------------------------------------------------------- |
| **Content type**    | High   | Sentences need Word Bank; single words suit tiles/keyboard  |
| **Mastery level**   | High   | Low mastery → more scaffolding; high mastery → less support |
| **Recent success**  | Medium | If child excels at harder mode, recommend it                |
| **Session context** | Low    | First test of day might suggest easier mode                 |

The recommendation appears as a "⭐ Recommended" badge on one tile. Children can always choose any available mode—the recommendation is guidance, not restriction.

---

## Modes (Unified)

Diktator presents **seven modes** as equal choices. What were previously called "input methods" (Letter Tiles, Word Bank, Keyboard) and "test modes" (Dictation, Translation) are now unified into a single selection:

| Mode                 | Child Name                    | Description                       |
| -------------------- | ----------------------------- | --------------------------------- |
| **Letter Tiles**     | Build It / Bygg Ordet         | Arrange scrambled letters         |
| **Word Bank**        | Pick Words / Velg Ord         | Tap words to build sentence       |
| **Keyboard**         | Type It / Skriv Selv          | Type the full spelling            |
| **Missing Letters**  | Fill the Gap / Fyll Inn       | Complete the blanks               |
| **Flashcard**        | Quick Look / Hurtigblikk      | See word → countdown → self-check |
| **Look-Cover-Write** | Memory Spell / Huskestaving   | See → hide → type from memory     |
| **Translation**      | Switch Languages / Bytt Språk | Type in other language            |

### Scaffolding Model

Modes provide different levels of support:

```text
Letter Tiles → Word Bank → Keyboard → Missing Letters
(most support)                        (targeted support)

Flashcard → Look-Cover-Write → Keyboard
(self-check)  (typed recall)    (full production)
```

**Important**: Research does not support age-gating modes. Norwegian and Swedish studies show first graders (age 6-7) can successfully use keyboards, and doing so may even benefit children with developing fine motor skills by removing the handwriting barrier.

### Letter Tiles (Single Words)

**How it works**: Scrambled letters that children tap to place in order.

**When it helps**:

- Reduces cognitive load (recognition vs. full recall)
- Teaches letter sequence awareness
- Builds confidence for hesitant spellers
- Useful when the focus is on letter patterns, not typing speed

**Scaffolding features**:

- Visual word length (slot count matches answer)
- Distractor letters for challenge
- Phonetically similar distractors (ø/o, æ/e)

### Word Bank (Sentences)

**How it works**: Word pills that children tap to build sentences.

**When it helps**:

- Focuses on word order and sentence structure
- Removes spelling barrier for sentence practice
- Teaches grammar through construction
- Appropriate for complex multi-word content

**Scaffolding features**:

- Distractor words from same context
- Confusable word pairs (da/når, han/hun)
- Word count indicator

### Keyboard (Full Spelling)

**How it works**: Traditional text input.

**When it helps**:

- Full spelling production (no scaffolding)
- Develops typing fluency
- Prepares for real-world writing
- Highest cognitive demand—tests true spelling knowledge

**Note**: Norwegian research (Spilling et al., 2023) found no disadvantage to keyboard input for first graders learning to write.

### Missing Letters (Gap Fill)

**How it works**: Word displayed with strategic blanks; child types only the missing letters.

**Examples**:

- `ma__` → type `nn` (double consonant focus)
- `_jelpe` → type `h` (silent letter focus)
- `sk_le` → type `o` (vowel focus)
- `b_re` → type `æ` (Norwegian character focus)

**When it helps**:

- Focuses attention on the "tricky" part of the word
- Reduces cognitive load (don't retype known parts)
- Ideal for targeting specific Norwegian spelling challenges
- Efficient practice for words with one problem area

**Scaffolding features**:

- Blank position highlights the challenge (double consonant, silent letter, etc.)
- Visual cue shows number of missing letters (one slot vs. two slots)
- Can be combined with audio to hear the complete word

**Norwegian-specific applications**:

| Challenge         | Example  | Child Types |
| ----------------- | -------- | ----------- |
| Double consonants | `ma__`   | `nn`        |
| Silent h          | `_jelpe` | `h`         |
| Silent d          | `lan_`   | `d`         |
| Vowel choice (æ)  | `b_re`   | `æ`         |
| Vowel choice (ø)  | `h_re`   | `ø`         |
| Skj-sound         | `__ære`  | `skj`       |

### Auto Mode (Content-Based Selection)

When `inputMethod="auto"`, the system selects based on content type:

- **Letter Tiles** for single words (1 word)
- **Word Bank** for sentences (2+ words)

This matches the cognitive demands of each content type, not the child's age.

### Progressive Unlocking (Optional, Mastery-Based)

For families who prefer guided progression, children can unlock input methods:

1. **Letter Tiles** → 2 correct answers → **Word Bank unlocked**
2. **Word Bank** → 2 correct answers → **Keyboard unlocked**

This is **optional**—all input methods can be made available immediately if preferred.

---

## Norwegian Spelling Challenges

Norwegian presents specific spelling challenges that Diktator addresses:

### Phoneme-Grapheme Irregularities

| Challenge             | Example                   | Teaching Approach                    |
| --------------------- | ------------------------- | ------------------------------------ |
| **Double consonants** | *mann* vs *man*           | Specific hints when detected         |
| **Silent letters**    | *hjelpe* (silent h)       | Audio emphasizes pronunciation       |
| **Æ, Ø, Å**           | *bære*, *høre*, *gå*      | Phonetic distractors in letter tiles |
| **Skj-lyden**         | *skjære*, *ski*, *kjenne* | Multiple spelling patterns for /ʃ/   |
| **Ng/Nk sounds**      | *sang*, *tenke*           | Distinct from standard consonants    |
| **Compound words**    | *sjukepleier*             | Longer words broken into components  |
| **Vowel length**      | *tak* vs *takk*           | Audio clarity for vowel duration     |

### Distractor Strategy

Letter tiles include phonetically similar Norwegian distractors:

```typescript
PHONETIC_PAIRS = {
  o: ["ø", "å"],
  ø: ["o", "ö"],
  a: ["æ", "å"],
  æ: ["a", "e"],
  å: ["o", "a"],
  e: ["æ", "i"],
  k: ["g"],
  g: ["k"],
  p: ["b"],
  b: ["p"],
  t: ["d"],
  d: ["t"],
}
```

Word bank includes confusable Norwegian word pairs:

```typescript
CONFUSABLE_WORDS = {
  da: ["når", "så"],
  når: ["da", "hvor"],
  han: ["hun", "den"],
  hun: ["han", "den"],
  var: ["er", "blir"],
  er: ["var", "blir"],
  // ... etc.
}
```

### Error Analysis

The app detects common spelling error types and provides targeted hints:

| Error Type         | Detection                             | Hint Example                          |
| ------------------ | ------------------------------------- | ------------------------------------- |
| Double consonant   | Missing/extra double letter           | "Should there be a double letter?"    |
| Silent letter      | Missing h, d, g at specific positions | "There's a sneaky silent letter here" |
| Vowel confusion    | æ/e, ø/o, å/a substitutions           | "Check your vowels"                   |
| Keyboard proximity | QWERTY-adjacent letter substitution   | "Looks like a typo—try again"         |

---

## Feedback Design

### Graduated Response System

Feedback adapts to performance level, avoiding both false praise and discouragement:

| Score Range | Feedback Tone               | Message Style                     |
| ----------- | --------------------------- | --------------------------------- |
| 90-100%     | Celebratory, earned         | "Perfect! Stavle is impressed!"   |
| 70-89%      | Positive, encouraging       | "Great work! So close to perfect" |
| 50-69%      | Supportive, growth-oriented | "Good effort! Practice helps"     |
| <50%        | Gentle, non-judgmental      | "Keep at it—mistakes teach us"    |

### Attempt-Based Feedback

Within a single word, feedback escalates:

1. **First wrong attempt**: "Not quite..." (minimal intervention)
2. **Second wrong attempt**: Specific hint (e.g., "Check the double consonant")
3. **Third wrong attempt**: Show correct answer with explanation

### What We Avoid

- **Binary feedback**: Just "right" or "wrong" without context
- **Punishment framing**: Harsh sounds, red screens, negative language
- **Over-praise**: "Amazing!" for mediocre performance devalues real achievement
- **Comparison**: Never compare to other children or siblings

> **Note**: For specific feedback copy (Norwegian and English message text), see the "Tone of Voice" section in [DESIGN.md](DESIGN.md).

---

## Rewards & Motivation

### The Research Challenge

Gamification in education is contentious. Research shows both benefits and risks:

**The overjustification effect**: When external rewards are introduced for activities children already enjoy, intrinsic motivation can decrease. The child shifts from "I like spelling" to "I spell to get badges" (Deci, 1971; Lepper et al., 1973).

**But rewards can work**: When designed carefully, badges and achievements can enhance both intrinsic and extrinsic motivation, particularly when they:

- Acknowledge competence rather than control behavior
- Are unexpected rather than promised upfront
- Celebrate genuine milestones rather than trivial actions

### Self-Determination Theory (SDT)

Deci & Ryan's research identifies three psychological needs that support intrinsic motivation:

| Need            | Definition                          | How Diktator Supports It                                    |
| --------------- | ----------------------------------- | ----------------------------------------------------------- |
| **Autonomy**    | Feeling in control of one's actions | Child chooses word sets, input methods, when to practice    |
| **Competence**  | Feeling capable and effective       | Progressive difficulty, specific feedback, visible progress |
| **Relatedness** | Feeling connected to others         | Family word sets, parent involvement, Stavle as companion   |

### Our Approach: Competence Signaling, Not Behavior Control

Diktator uses achievements to **signal competence**, not to **control behavior**:

**✅ DO (Competence-focused)**:

- Celebrate genuine learning milestones (first test, first perfect score)
- Show progress toward mastery (words learned, accuracy trends)
- Make achievements visible but not the primary goal
- Let children feel proud of their work, not their badge count

**❌ AVOID (Control-focused)**:

- Daily login streaks that punish missing days
- Leaderboards comparing children to siblings/classmates
- Rewards for time spent (encourages mindless clicking)
- Badges for trivial actions (inflates meaninglessness)

### Badge Design Principles

When implementing achievements (see [DESIGN.md](DESIGN.md) for visual specs):

1. **Milestone-based, not frequency-based**: "First perfect score" not "10 tests completed"
2. **Surprising when possible**: Don't announce "3 more tests for a badge"
3. **Meaningful thresholds**: 100% accuracy is meaningful; arbitrary numbers aren't
4. **Celebrate effort, not just success**: Acknowledge improvement, not just perfection
5. **No removal/loss**: Never take away earned achievements

### What We Explicitly Avoid

- **Streaks**: Create anxiety about breaking them; punish legitimate breaks
- **Leaderboards**: Comparison undermines intrinsic motivation; discourages struggling learners
- **Virtual currency**: Adds complexity without learning benefit
- **Loot boxes/randomness**: Gambling mechanics inappropriate for children
- **Social pressure**: No sharing scores to social media or family comparisons

### Progress Visualization (Preferred Alternative)

Instead of badge-hunting, we emphasize **progress visualization**:

- Words mastered in each word set
- Accuracy trends over time (personal improvement)
- Spelling challenges conquered (double consonants, etc.)
- Time spent learning (not gamified, just informational)

---

## Session Design

### Attention Spans by Age

| Age   | Recommended Session | Words per Session | Rest Cue                   |
| ----- | ------------------- | ----------------- | -------------------------- |
| 5-7   | 5-10 minutes        | 5-8 words         | "Great job! Take a break?" |
| 8-10  | 10-15 minutes       | 10-15 words       | Natural pause at test end  |
| 11-12 | 15-20 minutes       | 15-20 words       | Self-directed              |

### Spaced Repetition (Future)

Words that are answered incorrectly should reappear more frequently. Planned implementation:

- **Wrong answer**: Reappear in next session
- **Correct after struggle**: Reappear in 2-3 days
- **Easy correct**: Reappear in 1 week
- **Mastered**: Monthly review

---

## Curriculum Alignment

### Norwegian School Grades (LK20)

Word sets can be tagged with grade levels:

| Grade Level | Norwegian | Age Range | Typical Focus                              |
| ----------- | --------- | --------- | ------------------------------------------ |
| 1-2         | 1.-2.     | 5-7 år    | High-frequency words, basic phonics        |
| 3-4         | 3.-4.     | 8-9 år    | Compound words, double consonants          |
| 5-7         | 5.-7.     | 10-12 år  | Advanced spelling patterns, silent letters |

### Spelling Focus Categories

Curated word sets can target specific spelling challenges:

- **doubleConsonant**: Words with double consonants
- **silentLetter**: Words with silent h, d, g
- **compoundWord**: Compound words (sammensatte ord)
- **diphthong**: Words with diphthongs
- **skjSound**: Words with skj-/sj-/sk- sounds
- **norwegianChars**: Focus on æ, ø, å usage
- **ngNk**: Words with ng and nk sounds
- **silentD**: Words with silent d
- **vowelLength**: Vowel length distinctions

---

## Accessibility Considerations

### Learning Differences

The app accommodates various learning needs:

| Consideration        | Accommodation                              |
| -------------------- | ------------------------------------------ |
| **Dyslexia**         | Lexend font, generous spacing, audio-first |
| **Motor challenges** | Large touch targets (48px+), keyboard nav  |
| **Attention**        | Short sessions, clear progress indicators  |
| **Processing speed** | No time pressure (optional time limits)    |

### Audio-First Design

For children who struggle with reading:

- Words are always spoken aloud (auto-play)
- Audio can be replayed unlimited times
- Dictation mode works without reading ability
- TTS rate is slower for single words (0.8x)

---

## Research References

### Spelling Acquisition

- **Ehri, L.C. (2000)**. Learning to read and learning to spell: Two sides of a coin. *Topics in Language Disorders*, 20(3), 19-36.
- **Treiman, R. (2017)**. Learning to spell: Phonology and beyond. *Cognitive Neuropsychology*, 34(3-4), 185-191.

### Feedback & Learning

- **Hattie, J. & Timperley, H. (2007)**. The power of feedback. *Review of Educational Research*, 77(1), 81-112.
- **Kapur, M. (2014)**. Productive failure in learning math. *Cognitive Science*, 38(5), 1008-1022.

### Child Development

- **Piaget, J.**. Stages of cognitive development.
- **Vygotsky, L.S.**. Zone of Proximal Development.

### Motivation & Rewards

- **Deci, E.L. & Ryan, R.M. (2000)**. Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist*, 55(1), 68-78.
- **Deci, E.L. (1971)**. Effects of externally mediated rewards on intrinsic motivation. *Journal of Personality and Social Psychology*, 18(1), 105-115. (The foundational study on overjustification)
- **Lepper, M.R., Greene, D., & Nisbett, R.E. (1973)**. Undermining children's intrinsic interest with extrinsic reward. *Journal of Personality and Social Psychology*, 28(1), 129-137.
- **Tang, S.H. & Hall, V.C. (1995)**. The overjustification effect: A meta-analysis. *Applied Cognitive Psychology*, 9(5), 365-404.

### Memory & Retention

- **Roediger, H.L. & Karpicke, J.D. (2006)**. Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science*, 17(3), 249-255.
- **Paivio, A. (1986)**. *Mental representations: A dual coding approach*. Oxford University Press.

### Digital Writing in Schools

- **Spilling, E.F., Rønneberg, V., Rogne, W.M., Roeser, J., & Torrance, M. (2023)**. Handwriting versus keyboard writing: Effect on word reading. *Computers & Education*, 201, 104803. (Norwegian first-grade study showing no disadvantage to keyboard instruction)
- **Genlott, A.A. & Grönlund, Å. (2013)**. Improving literacy skills through learning reading by writing: The iWTR method presented and tested. *Computers & Education*, 67, 98-104. (Swedish study showing first graders writing like third graders using keyboards)

### Norwegian Literacy Research

- **Lesesenteret (Norwegian Reading Centre)**, University of Stavanger. Norway's national center for reading and writing research. Their work on begynneropplæring (early instruction) informs grade-level expectations.
- **Språkløyper**. National strategy for language, reading, and writing (Utdanningsdirektoratet). Provides framework for LK20 curriculum alignment.
- **Engen, L. (2006)**. Adaptations of Mary Clay's literacy assessment for Norwegian contexts.

### Dyslexia-Friendly Design

- **British Dyslexia Association**. Dyslexia style guide.
- **Lexend font**. Variable font for improved reading fluency. See [lexend.com](https://www.lexend.com/)

---

## Future Research Areas

Areas we'd like to investigate further:

1. **Optimal distractor difficulty**: How many distractors maximize learning without frustration?
2. **Spaced repetition intervals**: What's the ideal schedule for Norwegian spelling?
3. **Achievement timing**: When should badges appear—immediately or delayed?
4. **Parent involvement**: How does parent-created content compare to curated content?
5. **Bilingual transfer**: Does Norwegian spelling skill transfer to English and vice versa?

---

*This document should evolve as we learn more about what works for Norwegian children.*
