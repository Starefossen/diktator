# Diktator - User Story Specification Document

## Document Information

| Field             | Value                               |
| ----------------- | ----------------------------------- |
| **Version**       | 1.0                                 |
| **Last Updated**  | January 2026                        |
| **Status**        | Active                              |
| **Document Type** | Product Requirements / User Stories |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Glossary & Terminology](#glossary--terminology)
3. [Personas](#personas)
4. [User Journeys](#user-journeys)
5. [Epic & User Story Breakdown](#epic--user-story-breakdown)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Cross-Persona Interactions](#cross-persona-interactions)
8. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**Diktator** is a family-oriented web application designed to help children learn Norwegian vocabulary through gamified spelling tests and practice modes. The application supports a hierarchical family structure where parents create and manage content, while children engage with learning activities.

### Core Value Proposition

- **For Parents**: A tool to create customized vocabulary learning content, manage child accounts, and monitor learning progress
- **For Children**: An engaging, game-like environment to practice spelling through audio-based tests with instant feedback

### Key Differentiators

1. **Family-Centric Design**: Family-scoped data with parent oversight
2. **Multiple Learning Modes**: Standard, Dictation, and Translation modes
3. **Audio-First Learning**: Text-to-Speech integration for pronunciation
4. **Progress Tracking**: Detailed analytics and improvement metrics
5. **Multilingual Support**: Norwegian (🇳🇴) and English (🇬🇧) interface

---

## Glossary & Terminology

| Term                 | Definition                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Word Set**         | A collection of words grouped together for learning purposes (e.g., "Animals", "Colors", "Week 12 Spelling Words") |
| **Test**             | An interactive session where the user listens to word audio and types the spelling                                 |
| **Practice Mode**    | A non-scored review mode with hover-to-reveal functionality for memorization                                       |
| **Standard Mode**    | Default test mode where audio plays and user types what they hear                                                  |
| **Dictation Mode**   | Auto-play mode optimized for traditional spelling dictation (unlimited retries)                                    |
| **Translation Mode** | Mode where source word is shown and user types the translation                                                     |
| **Family**           | A group of related accounts (parent + children) that share word sets                                               |
| **Progress**         | Aggregated statistics showing learning improvement over time                                                       |
| **Attempt**          | A single try at spelling a word correctly within a test                                                            |
| **Score**            | Percentage of words spelled correctly in a test session                                                            |
| **Audio Processing** | Background generation of TTS audio for word sets                                                                   |

---

## Personas

### Primary Personas

#### 👨‍👩‍👧‍👦 Persona 1: Parent (Content Creator & Administrator)

**Name**: Erik Larsen
**Age**: 38
**Occupation**: Software Engineer
**Location**: Oslo, Norway
**Technical Proficiency**: High

**Background**:
Erik is a father of two children (ages 7 and 10). He wants to support his children's Norwegian language education at home, complementing what they learn at school. He values educational tools that give him visibility into his children's progress.

**Goals**:
- Create customized word sets aligned with school curriculum
- Monitor each child's learning progress independently
- Ensure children practice spelling regularly
- Track improvement trends over time

**Pain Points**:
- Limited time to create educational content
- Difficulty finding age-appropriate vocabulary lists
- No visibility into how much children are actually practicing
- Existing apps don't support Norwegian well

**Behaviors**:
- Creates word sets weekly based on school homework
- Checks family dashboard on weekends
- Adjusts word set difficulty based on test results
- Prefers mobile-responsive interfaces for quick checks

**Quote**: *"I want to know that my kids are actually learning, not just clicking through an app."*

---

#### 👧 Persona 2: Child (Primary Learner - Younger)

**Name**: Sofie Larsen
**Age**: 7
**Grade**: 2nd Grade
**Technical Proficiency**: Low-Medium

**Background**:
Sofie is learning to read and write in Norwegian. She enjoys games and interactive activities. She needs a simple, visually engaging interface that provides immediate feedback.

**Goals**:
- Practice spelling words from school
- Get better at Norwegian spelling
- Have fun while learning
- See her progress and feel accomplished

**Pain Points**:
- Gets frustrated when interfaces are confusing
- Loses interest if feedback is delayed
- Needs audio to understand pronunciation
- Wants to know immediately if she got it right

**Behaviors**:
- Short attention span (5-10 minute sessions)
- Responds well to positive reinforcement
- Prefers large buttons and visual feedback
- May need audio replayed multiple times

**Quote**: *"I want to hear the word again!"*

---

#### 👦 Persona 3: Child (Primary Learner - Older)

**Name**: Magnus Larsen
**Age**: 10
**Grade**: 5th Grade
**Technical Proficiency**: Medium

**Background**:
Magnus is more independent in his learning. He's working on more complex vocabulary including some English-Norwegian translations. He appreciates seeing his statistics and competing with his own past performance.

**Goals**:
- Master weekly spelling words efficiently
- Track his own improvement over time
- Challenge himself with harder word sets
- Practice translations between languages

**Pain Points**:
- Bored by overly simplistic interfaces
- Wants more detailed statistics
- Needs efficient workflow (not too many clicks)
- Wants to see how he compares to his past performance

**Behaviors**:
- Can handle longer practice sessions (15-20 minutes)
- Self-motivated to improve scores
- Reviews incorrect answers to learn from mistakes
- May use translation mode for language learning

**Quote**: *"I want to beat my high score!"*

---

### Secondary Personas

#### 👩‍🏫 Persona 4: Teacher (Future Consideration)

**Name**: Kari Johansen
**Age**: 42
**Occupation**: Elementary School Teacher

**Potential Goals**:
- Create word sets for entire classroom
- Monitor progress across multiple students
- Share standardized vocabulary lists

**Note**: *Teacher/classroom functionality is a future enhancement consideration.*

---

## User Journeys

### Journey 1: Parent Onboarding & Setup

**Persona**: Erik (Parent)
**Goal**: Create a family account and set up first word set

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PARENT ONBOARDING JOURNEY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Visit  │    │  Sign   │    │ Create  │    │  Add    │    │ Invite  │  │
│  │  Home   │───►│   Up    │───►│  Word   │───►│  Words  │───►│  Child  │  │
│  │  Page   │    │  OIDC   │    │   Set   │    │         │    │ Account │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  - See value    - Redirect    - Name set     - Type words   - Enter      │
│    proposition  - Auth flow   - Choose lang  - Auto-TTS     - Email      │
│  - CTA button   - Auto-create - Select mode  - Preview      - Display    │
│                   family                       audio          name       │
│                                                              - Password   │
│                                                                           │
│  TOUCHPOINTS: Home Page → OIDC Provider → Word Sets Page → Family Page   │
│                                                                           │
│  SUCCESS METRICS:                                                         │
│  - Time to first word set: < 5 minutes                                   │
│  - Audio generation: < 30 seconds                                         │
│  - Child account creation: < 2 minutes                                    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Journey Steps**:

| Step | Action                           | System Response                           | Emotional State |
| ---- | -------------------------------- | ----------------------------------------- | --------------- |
| 1    | Visits diktator.app              | Shows landing page with value proposition | Curious         |
| 2    | Clicks "Get Started"             | Redirects to OIDC provider                | Neutral         |
| 3    | Completes sign-up                | Creates account, auto-creates family      | Engaged         |
| 4    | Views empty word sets page       | Shows "Create your first word set" CTA    | Motivated       |
| 5    | Clicks "Create Word Set"         | Opens word set editor                     | Focused         |
| 6    | Enters name and selects language | Form validates input                      | Progressing     |
| 7    | Adds words to the set            | Each word gets TTS audio generated        | Satisfied       |
| 8    | Saves word set                   | Returns to word sets list with new set    | Accomplished    |
| 9    | Navigates to Family page         | Shows family dashboard                    | Prepared        |
| 10   | Creates child account            | Child can now log in independently        | Complete        |

**Exit Points & Recovery**:
- If OIDC fails → Show error with retry option
- If audio generation fails → Allow saving without audio, retry later
- If child email already exists → Show helpful error message

---

### Journey 2: Child Taking a Spelling Test

**Persona**: Sofie (Child - 7 years old)
**Goal**: Complete a spelling test and see her score

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHILD SPELLING TEST JOURNEY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Login  │    │  View   │    │ Select  │    │  Take   │    │  View   │  │
│  │         │───►│  Word   │───►│  Mode   │───►│  Test   │───►│ Results │  │
│  │         │    │  Sets   │    │         │    │         │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  - Use creds    - See family  - Standard    - Listen     - Score %     │
│    from parent    word sets   - Dictation   - Type       - Correct     │
│  - Child role   - Start Test  - Translation - Submit       count       │
│    recognized     button                    - Feedback   - Review      │
│                                             - Progress     mistakes    │
│                                                                           │
│  TEST FLOW DETAIL:                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  For each word:                                                   │    │
│  │  1. Audio plays automatically (if enabled)                        │    │
│  │  2. Child types answer in input field                            │    │
│  │  3. Presses Enter or clicks Submit                               │    │
│  │  4. Immediate feedback (correct/incorrect)                        │    │
│  │  5. If incorrect: retry up to max attempts                        │    │
│  │  6. Auto-advance to next word                                     │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  SUCCESS METRICS:                                                         │
│  - Test completion rate: > 90%                                           │
│  - Average time per word: 10-20 seconds                                   │
│  - Return rate within 7 days: > 70%                                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Journey Steps**:

| Step | Action                        | System Response                          | Emotional State |
| ---- | ----------------------------- | ---------------------------------------- | --------------- |
| 1    | Opens app and logs in         | Authenticates, shows word sets           | Ready           |
| 2    | Sees list of family word sets | Displays available sets with word counts | Choosing        |
| 3    | Clicks "Start Test" on a set  | Opens mode selection modal               | Anticipating    |
| 4    | Selects "Standard" mode       | Test interface loads                     | Focused         |
| 5    | Hears word audio play         | Large play button shows audio state      | Listening       |
| 6    | Types spelling in input field | Input accepts keystrokes                 | Concentrating   |
| 7    | Presses Enter to submit       | Validates answer                         | Hopeful         |
| 8a   | Sees "Correct!" feedback      | Green success message, advances          | Happy/Proud     |
| 8b   | Sees "Try again" feedback     | Red message, retry counter shows         | Determined      |
| 9    | Completes all words           | Results screen appears                   | Accomplished    |
| 10   | Views score and review        | Can see which words were missed          | Reflective      |

**Accessibility Considerations**:
- Large, tappable play button for audio
- Clear visual feedback (colors + text)
- Keyboard-friendly (Enter to submit)
- Mobile-responsive interface

---

### Journey 3: Parent Monitoring Child Progress

**Persona**: Erik (Parent)
**Goal**: Review children's learning progress and identify areas for improvement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PARENT PROGRESS MONITORING JOURNEY                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Login  │    │  View   │    │  View   │    │  Drill  │    │  Take   │  │
│  │   as    │───►│ Family  │───►│  Child  │───►│  Down   │───►│ Action  │  │
│  │ Parent  │    │Dashboard│    │Progress │    │ Details │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  - Parent role  - Family      - Individual  - Test-by-   - Adjust    │
│    detected       stats         child         test          difficulty │
│  - Family nav   - All           stats         results     - Create new  │
│    visible        children    - Trends      - Word-level    word set   │
│                 - Overview                    analysis    - Encourage  │
│                                                             child      │
│                                                                           │
│  DASHBOARD METRICS DISPLAYED:                                             │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Family Level:                                                    │    │
│  │  - Total members       - Tests completed    - Average score      │    │
│  │  - Active children     - Most active child                       │    │
│  │                                                                   │    │
│  │  Per Child:                                                       │    │
│  │  - Total tests         - Average score      - Trend (↑/↓/→)      │    │
│  │  - Correct/Total words - Last activity      - Active status      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Journey Steps**:

| Step | Action                       | System Response                        | Emotional State |
| ---- | ---------------------------- | -------------------------------------- | --------------- |
| 1    | Logs in as parent            | Dashboard loads with family overview   | Curious         |
| 2    | Reviews family statistics    | Sees total tests, average score        | Informed        |
| 3    | Clicks on child's card       | Opens detailed progress view           | Engaged         |
| 4    | Reviews test history         | Sees chronological results with scores | Analyzing       |
| 5    | Identifies low-scoring areas | Highlights problematic words           | Concerned       |
| 6    | Creates targeted word set    | Word set editor with focus words       | Proactive       |
| 7    | Returns to family dashboard  | Updated statistics reflect activity    | Satisfied       |

---

### Journey 4: Child Practice Mode Session

**Persona**: Magnus (Child - 10 years old)
**Goal**: Review and memorize words before a test

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHILD PRACTICE MODE JOURNEY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  View   │    │  Start  │    │ Practice│    │ Shuffle │    │  Start  │  │
│  │  Word   │───►│Practice │───►│  Word   │───►│   /     │───►│  Actual │  │
│  │  Sets   │    │  Mode   │    │  Cards  │    │Navigate │    │  Test   │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  - Browse       - Click       - Blurred     - Previous/  - Confident  │
│    available     "Practice"    word shown     Next       - "Start     │
│    sets          button       - Click to   - Shuffle      Test"      │
│                              - reveal        order        button      │
│                              - Play audio  - Word list                 │
│                                               visible                  │
│                                                                           │
│  PRACTICE INTERFACE:                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                                                                   │    │
│  │    ┌──────────────────────────────────────┐                      │    │
│  │    │          🔊 [Play Audio]             │                      │    │
│  │    │                                       │                      │    │
│  │    │        ████████████████               │  ← Blurred word     │    │
│  │    │        (click to reveal)              │                      │    │
│  │    │                                       │                      │    │
│  │    │    [◀ Previous]  [Shuffle]  [Next ▶] │                      │    │
│  │    └──────────────────────────────────────┘                      │    │
│  │                                                                   │    │
│  │    Word 3 of 12    [Start Test] [Exit]                           │    │
│  │                                                                   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Journey Steps**:

| Step | Action                      | System Response               | Emotional State |
| ---- | --------------------------- | ----------------------------- | --------------- |
| 1    | Selects word set            | Word set details visible      | Preparing       |
| 2    | Clicks "Practice" button    | Practice mode interface loads | Focused         |
| 3    | Sees blurred word           | Can hear audio, word hidden   | Curious         |
| 4    | Clicks to reveal word       | Word becomes visible          | Learning        |
| 5    | Clicks play button          | Audio plays pronunciation     | Reinforcing     |
| 6    | Uses shuffle button         | Words randomize order         | Engaged         |
| 7    | Navigates through all words | Progress indicator updates    | Confident       |
| 8    | Clicks "Start Test"         | Transitions to test mode      | Ready           |

---

### Journey 5: Parent Creating Translation Word Set

**Persona**: Erik (Parent)
**Goal**: Create a bilingual word set for language learning

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRANSLATION WORD SET CREATION JOURNEY                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Click  │    │ Select  │    │ Choose  │    │  Add    │    │  Save   │  │
│  │ Create  │───►│Translat.│───►│ Target  │───►│  Word   │───►│   and   │  │
│  │   New   │    │  Mode   │    │Language │    │  Pairs  │    │  Test   │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  - Word Set    - Radio       - Dropdown    - Source      - Audio       │
│    Editor        button        selector      word          generated  │
│    opens       - Translation - en/no/etc  - Translation  - Ready for  │
│               - mode shown                   field          test       │
│                                                                           │
│  TRANSLATION WORD ENTRY:                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Source Language: Norwegian (🇳🇴)                                 │    │
│  │  Target Language: English (🇬🇧)                                   │    │
│  │                                                                   │    │
│  │  Word 1: [ hund_________ ]  Translation: [ dog__________ ]       │    │
│  │  Word 2: [ katt_________ ]  Translation: [ cat__________ ]       │    │
│  │  Word 3: [ fugl_________ ]  Translation: [ bird_________ ]       │    │
│  │                                                                   │    │
│  │  [+ Add Word]                                                    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Epic & User Story Breakdown

### Epic 1: User Authentication & Account Management

#### US-1.1: Parent Account Creation
**As a** parent
**I want to** create an account using my email
**So that** I can manage my family's learning content

**Acceptance Criteria**:
- [ ] User can sign up via OIDC provider
- [ ] Family is automatically created upon registration
- [ ] User is assigned "parent" role by default
- [ ] User is redirected to word sets page after signup

**Priority**: P0 (Critical)
**Story Points**: 5

---

#### US-1.2: Child Account Creation
**As a** parent
**I want to** create accounts for my children
**So that** they can practice independently while I monitor their progress

**Acceptance Criteria**:
- [ ] Parent can access Family page
- [ ] Parent can enter child's email, display name, and password
- [ ] Child account is linked to parent's family
- [ ] Child cannot access family management features
- [ ] Child can log in independently

**Priority**: P0 (Critical)
**Story Points**: 8

---

#### US-1.3: Role-Based Navigation
**As a** user
**I want to** see navigation options relevant to my role
**So that** I have a streamlined experience

**Acceptance Criteria**:
- [ ] Parents see: Home, About, Word Sets, Family, Profile
- [ ] Children see: Home, About, Word Sets, Results, Profile
- [ ] Non-authenticated users see: Home, About, Sign In

**Priority**: P1 (High)
**Story Points**: 3

---

### Epic 2: Word Set Management

#### US-2.1: Create Word Set
**As a** parent
**I want to** create a new word set with custom words
**So that** my children can practice relevant vocabulary

**Acceptance Criteria**:
- [ ] Can enter word set name
- [ ] Can select language (Norwegian/English)
- [ ] Can add multiple words
- [ ] Audio is automatically generated for each word
- [ ] Word set is visible to all family members

**Priority**: P0 (Critical)
**Story Points**: 8

---

#### US-2.2: Edit Word Set
**As a** parent
**I want to** modify an existing word set
**So that** I can correct errors or add new words

**Acceptance Criteria**:
- [ ] Can edit word set name
- [ ] Can add/remove words
- [ ] Changed words get new audio generated
- [ ] Original test results remain intact

**Priority**: P1 (High)
**Story Points**: 5

---

#### US-2.3: Delete Word Set
**As a** parent
**I want to** delete a word set I no longer need
**So that** the list stays manageable

**Acceptance Criteria**:
- [ ] Confirmation modal before deletion
- [ ] Associated test results handled gracefully
- [ ] Deletion is permanent

**Priority**: P2 (Medium)
**Story Points**: 3

---

#### US-2.4: Configure Test Settings ✅
**As a** parent
**I want to** customize how tests work for a word set
**So that** I can adjust difficulty appropriately

**Acceptance Criteria**:
- [x] Can set max attempts per word (1-5)
- [x] Can enable/disable auto-play audio
- [x] Can enable/disable word shuffling
- [x] Can enable/disable autocorrect
- [x] Can set default test mode

**Priority**: P2 (Medium)
**Story Points**: 5
**Status**: Implemented - Settings modal in word sets page with full persistence

---

#### US-2.5: Create Translation Word Set
**As a** parent
**I want to** create word sets with translations
**So that** my children can practice vocabulary across languages

**Acceptance Criteria**:
- [ ] Can select "Translation" mode when creating
- [ ] Can choose target language
- [ ] Can enter translation for each word
- [ ] Translation mode available when testing

**Priority**: P1 (High)
**Story Points**: 8

---

### Epic 3: Testing & Practice

#### US-3.1: Take Standard Spelling Test
**As a** child
**I want to** take a spelling test by listening and typing
**So that** I can practice my spelling skills

**Acceptance Criteria**:
- [ ] Audio plays for current word
- [ ] Can replay audio
- [ ] Can type answer and submit
- [ ] Immediate feedback shown
- [ ] Multiple attempts allowed
- [ ] Progress indicator visible
- [ ] Final score displayed

**Priority**: P0 (Critical)
**Story Points**: 13

---

#### US-3.2: Take Dictation Test
**As a** child
**I want to** take a dictation-style test
**So that** I can practice spelling in a school-like format

**Acceptance Criteria**:
- [ ] Audio auto-plays (no visible word)
- [ ] Unlimited retries
- [ ] No play-again button (auto-plays)
- [ ] Focus on listening skills

**Priority**: P1 (High)
**Story Points**: 5

---

#### US-3.3: Take Translation Test
**As a** child
**I want to** practice translations between languages
**So that** I can improve my bilingual vocabulary

**Acceptance Criteria**:
- [ ] Source word displayed
- [ ] User types translation
- [ ] Only available for word sets with translations
- [ ] Score reflects translation accuracy

**Priority**: P1 (High)
**Story Points**: 5

---

#### US-3.4: Select Test Mode
**As a** child
**I want to** choose which test mode to use
**So that** I can practice in different ways

**Acceptance Criteria**:
- [ ] Mode selection modal appears before test
- [ ] All three modes shown with descriptions
- [ ] Recommended mode highlighted
- [ ] Translation disabled if no translations available

**Priority**: P1 (High)
**Story Points**: 3

---

#### US-3.5: Practice Mode
**As a** child
**I want to** review words without being scored
**So that** I can prepare before taking a test

**Acceptance Criteria**:
- [ ] Words shown with blur effect
- [ ] Click to reveal spelling
- [ ] Audio playback available
- [ ] Navigation between words
- [ ] Shuffle functionality
- [ ] Can start test from practice

**Priority**: P1 (High)
**Story Points**: 8

---

### Epic 4: Progress & Analytics

#### US-4.1: View Personal Results
**As a** child
**I want to** see my test history and scores
**So that** I can track my improvement

**Acceptance Criteria**:
- [ ] List of all completed tests
- [ ] Score and date for each test
- [ ] Word-level detail available
- [ ] Sort and filter options
- [ ] Improvement trend visible

**Priority**: P1 (High)
**Story Points**: 5

---

#### US-4.2: View Family Dashboard
**As a** parent
**I want to** see an overview of my family's activity
**So that** I can monitor learning engagement

**Acceptance Criteria**:
- [ ] Total family statistics
- [ ] Per-child summary cards
- [ ] Tests completed counts
- [ ] Average scores
- [ ] Last activity dates

**Priority**: P0 (Critical)
**Story Points**: 8

---

#### US-4.3: View Child Progress Detail
**As a** parent
**I want to** drill down into a specific child's performance
**So that** I can identify areas for improvement

**Acceptance Criteria**:
- [ ] Full test history for child
- [ ] Performance trends over time
- [ ] Commonly missed words
- [ ] Score distribution

**Priority**: P1 (High)
**Story Points**: 5

---

### Epic 5: User Experience & Accessibility

#### US-5.1: Multilingual Interface
**As a** user
**I want to** use the app in my preferred language
**So that** I can navigate comfortably

**Acceptance Criteria**:
- [ ] Language switcher in navigation
- [ ] English and Norwegian supported
- [ ] All UI text translatable
- [ ] Language preference persisted

**Priority**: P1 (High)
**Story Points**: 5

---

#### US-5.2: Mobile-Responsive Design
**As a** user
**I want to** use the app on my phone or tablet
**So that** I can practice anywhere

**Acceptance Criteria**:
- [ ] All features work on mobile
- [ ] Touch-friendly buttons
- [ ] Responsive layouts
- [ ] Mobile-optimized test interface

**Priority**: P0 (Critical)
**Story Points**: 8

---

#### US-5.3: Audio Playback Reliability
**As a** child
**I want to** reliably hear word pronunciations
**So that** I can spell words correctly

**Acceptance Criteria**:
- [ ] Audio works on all browsers
- [ ] Safari/iOS auto-play handled gracefully
- [ ] Fallback to browser TTS if needed
- [ ] Clear audio state indicators

**Priority**: P0 (Critical)
**Story Points**: 5

---

## Acceptance Criteria

### Global Acceptance Criteria (Apply to All Stories)

1. **Accessibility**
   - Keyboard navigation supported
   - Screen reader compatible
   - Color contrast meets WCAG 2.1 AA
   - Focus indicators visible

2. **Performance**
   - Page load < 3 seconds
   - API responses < 500ms
   - Audio playback immediate

3. **Error Handling**
   - Graceful error messages
   - Retry options provided
   - No data loss on errors

4. **Security**
   - All API calls authenticated
   - Family data isolated
   - Child data protected

---

## Cross-Persona Interactions

### Interaction Matrix

| Action          | Parent        | Child      | System          |
| --------------- | ------------- | ---------- | --------------- |
| Create word set | ✅ Creates     | ❌ Cannot   | Generates audio |
| Edit word set   | ✅ Can edit    | ❌ Cannot   | Updates audio   |
| Delete word set | ✅ Can delete  | ❌ Cannot   | Removes data    |
| Take test       | ✅ Can take    | ✅ Can take | Tracks results  |
| View results    | ✅ All family  | ✅ Own only | Provides data   |
| Create child    | ✅ Can create  | ❌ Cannot   | Creates account |
| View progress   | ✅ Family view | ✅ Personal | Aggregates data |

### Data Sharing Rules

```
Family Scope:
├── Word Sets (shared)
│   ├── Created by any parent
│   ├── Visible to all family members
│   └── Editable by parents only
│
├── Test Results (per-user + parent visibility)
│   ├── Created by test taker
│   ├── Visible to self
│   └── Visible to parents (for children)
│
└── User Profiles (per-user)
    ├── Personal data
    ├── Role-specific features
    └── Activity tracking
```

---

## Future Enhancements

### Phase 2: Enhanced Gamification

| Feature            | Description                            | Personas Benefited |
| ------------------ | -------------------------------------- | ------------------ |
| Achievement Badges | Badges for 90%+ scores and completions | Children           |
| Leaderboards       | Family/global rankings                 | Children           |
| Streaks            | Daily practice tracking                | Children           |
| Challenges         | Time-limited competitions              | All                |
| XP System          | Experience points for activities       | Children           |

> **Note**: Achievement Badges (formerly US-4.4) moved here from Epic 4 as a future enhancement.

### Phase 3: AI-Powered Features

| Feature                      | Description                 | Personas Benefited |
| ---------------------------- | --------------------------- | ------------------ |
| Auto-generated word sets     | AI creates vocabulary lists | Parents            |
| Personalized recommendations | Based on performance        | Children           |
| Adaptive difficulty          | Adjusts to skill level      | Children           |

### Phase 4: Extended User Types

| Feature            | Description          | New Persona |
| ------------------ | -------------------- | ----------- |
| Teacher accounts   | Classroom management | Teachers    |
| School integration | Curriculum alignment | Schools     |
| Group competitions | Class vs class       | Students    |

### Phase 5: Monetization

| Feature                 | Description              | Business Impact |
| ----------------------- | ------------------------ | --------------- |
| Premium tier            | Extended limits/features | Revenue         |
| Family Pro subscription | Advanced analytics       | Revenue         |
| School licensing        | Multi-teacher support    | Revenue         |

---

## Appendix A: User Story Prioritization

### Priority Definitions

| Priority | Definition                    | Timeline |
| -------- | ----------------------------- | -------- |
| P0       | Critical - Core functionality | MVP      |
| P1       | High - Important features     | v1.1     |
| P2       | Medium - Nice to have         | v1.2+    |
| P3       | Low - Future consideration    | Backlog  |

### Story Point Reference

| Points | Complexity | Example          |
| ------ | ---------- | ---------------- |
| 1      | Trivial    | Text change      |
| 2      | Simple     | Add button       |
| 3      | Small      | New modal        |
| 5      | Medium     | New form         |
| 8      | Large      | New page         |
| 13     | XL         | New feature area |
| 21     | XXL        | Epic-level       |

---

## Appendix B: Consistency Checklist

### Terminology Consistency ✅

| Concept             | Correct Term | Incorrect Alternatives      |
| ------------------- | ------------ | --------------------------- |
| Collection of words | Word Set     | Word List, Vocabulary, Deck |
| Scored activity     | Test         | Quiz, Exam                  |
| Review activity     | Practice     | Study, Review               |
| Answer attempt      | Attempt      | Try, Guess                  |
| User groups         | Family       | Group, Team                 |
| Adult user          | Parent       | Admin, Teacher              |
| Young user          | Child        | Student, Kid                |

### UI Consistency ✅

| Element       | Standard                  |
| ------------- | ------------------------- |
| Primary CTA   | Blue-Purple gradient      |
| Success       | Green background          |
| Error         | Red background            |
| Warning       | Amber/Orange              |
| Audio playing | Spinning border animation |

### Navigation Consistency ✅

| User Type | Navigation Items                         |
| --------- | ---------------------------------------- |
| Anonymous | Home, About, Sign In                     |
| Parent    | Home, About, Word Sets, Family, Profile  |
| Child     | Home, About, Word Sets, Results, Profile |

---

*Document maintained by the Diktator product team. Last reviewed: January 2026.*
