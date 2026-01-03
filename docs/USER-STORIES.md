# Diktator - User Stories

**Version**: 1.0
**Last Updated**: January 2026

## Overview

Diktator is a family-oriented web application for children to learn Norwegian vocabulary through gamified spelling tests and practice modes. Parents create content and monitor progress while children engage with learning activities.

### Core Value

- **For Parents**: Create customized vocabulary, manage child accounts, monitor progress
- **For Children**: Engaging, game-like spelling practice with instant feedback

### Key Features

- Family-scoped data with parent oversight
- Multiple test modes: Standard, Dictation, Translation
- Text-to-Speech audio integration
- Progress tracking and analytics
- Multilingual interface (Norwegian/English)

---

## Personas

### Parent (Content Creator)

**Name**: Erik, 38, Software Engineer

**Goals**:

- Create word sets aligned with school curriculum
- Monitor children's progress
- Track improvement trends

**Behaviors**:

- Creates word sets weekly
- Checks dashboard on weekends
- Adjusts difficulty based on results

---

### Child - Younger (Primary Learner)

**Name**: Sofie, 7, 2nd Grade

**Goals**:

- Practice spelling from school
- Have fun while learning
- See progress and feel accomplished

**Behaviors**:

- Short sessions (5-10 minutes)
- Needs immediate feedback
- Large buttons and visual feedback
- Replays audio multiple times

---

### Child - Older (Advanced Learner)

**Name**: Magnus, 10, 5th Grade

**Goals**:

- Master weekly spelling efficiently
- Track improvement
- Practice translations

**Behaviors**:

- Longer sessions (15-20 minutes)
- Self-motivated
- Reviews incorrect answers
- Wants detailed statistics

---

## User Journeys

### 1. Parent Onboarding & Registration

1. Visit home page → See value proposition
2. Click "Sign In" → OIDC authentication
3. First-time user → Redirect to /register
4. Complete registration form:
   - Email pre-filled from OIDC
   - Enter display name
   - Create family name
5. Guided onboarding wizard:
   - Welcome message explaining family structure
   - "Create Your First Word Set" prompt
   - Quick tutorial on test modes
6. Create first word set → System generates TTS audio
7. Option to add child account or skip
8. Dashboard tour (optional)

**Success**: Registration completed and first word set created in < 5 minutes

**Drop-off Points**:
- Registration form (monitor completion rate)
- First word set creation (track skips)
- Child account creation (measure adoption)

---

### 2. Child Taking Test

1. Login → View family word sets
2. Click "Start Test" → Select mode (Standard/Dictation/Translation)
3. For each word:
   - Audio plays automatically
   - Type answer
   - Submit → Immediate feedback
   - Retry if incorrect (up to max attempts)
   - Auto-advance
4. Complete test → View score and review mistakes

**Success**: Completion rate > 90%, return within 7 days > 70%

---

### 3. Parent Monitoring Progress

1. Login as parent → View family dashboard
2. See overview: total tests, average scores
3. Click child card → Detailed progress
4. Review test history → Identify problem areas
5. Create targeted word set

---

### 4. Child Practice Mode

1. Select word set → Click "Practice"
2. See blurred word → Click to reveal
3. Play audio → Listen to pronunciation
4. Navigate/shuffle words
5. Start actual test when ready

---

## User Stories

### Authentication & Accounts

**US-1.1: OIDC Authentication** (P0, 3 pts)

- User clicks "Sign In"
- Redirect to OIDC provider
- Successful authentication
- Return with user profile

**US-1.2: Registration Flow** ✅ (P0, 8 pts)

- New OIDC user redirected to /register
- Email pre-filled from OIDC token
- Enter display name and family name
- Create parent profile + family
- Redirect to onboarding wizard

**US-1.3: Onboarding Wizard** (P0, 8 pts)

- Welcome screen explaining app purpose
- Guided prompt to create first word set
- Quick tutorial on test modes (Standard/Dictation/Translation)
- Optional: Create first child account
- Optional: Dashboard feature tour
- Can skip and revisit later

**US-1.4: Child Account Creation** (P0, 8 pts)

- Parent accesses Family page
- Clicks "Add Child"
- Enter child's email, name, and password
- Child linked to family
- Child has limited permissions (no family management)
- Child can log in independently

---

### Word Set Management

**US-2.1: Create Word Set** (P0, 8 pts)

- Enter name, select language
- Add multiple words
- Auto-generate TTS audio
- Visible to all family members

**US-2.2: Edit Word Set** (P1, 5 pts)

- Edit name and words
- Add/remove words
- Regenerate audio for changes

**US-2.3: Delete Word Set** (P2, 3 pts)

- Confirmation before deletion
- Handle associated test results

**US-2.4: Test Settings** ✅ (P2, 5 pts)

- Configure max attempts per word
- Enable/disable auto-play audio
- Enable/disable word shuffling
- Set default test mode

---

### Testing & Practice

**US-3.1: Standard Spelling Test** (P0, 13 pts)

- Audio playback
- Type and submit answer
- Immediate feedback
- Multiple attempts
- Progress indicator
- Final score display

**US-3.2: Dictation Test** (P1, 5 pts)

- Audio auto-plays (no visible word)
- Unlimited retries
- Focus on listening

**US-3.3: Translation Test** (P1, 5 pts)

- Display source word
- Type translation
- Only for word sets with translations

**US-3.4: Select Test Mode** (P1, 3 pts)

- Mode selection modal
- Descriptions for each mode
- Translation disabled if unavailable

**US-3.5: Practice Mode** (P1, 8 pts)

- Blurred words, click to reveal
- Audio playback
- Navigation and shuffle
- No scoring

---

### Progress & Analytics

**US-4.1: Personal Results** (P1, 5 pts)

- Test history with scores
- Word-level details
- Sort and filter
- Improvement trends

**US-4.2: Family Dashboard** (P0, 8 pts)

- Family statistics
- Per-child summary cards
- Tests completed, average scores
- Last activity dates

**US-4.3: Child Progress Detail** (P1, 5 pts)

- Full test history
- Performance trends
- Commonly missed words
- Score distribution

---

### UX & Accessibility

**US-5.1: Multilingual Interface** ✅ (P1, 5 pts)

- Language switcher in navigation
- English and Norwegian translations
- Context-based translations (auth, word sets, tests)
- Persistent preference

**US-5.2: Mobile-Responsive** (P0, 8 pts)

- Works on phone/tablet
- Touch-friendly buttons
- Responsive layouts

**US-5.3: Audio Reliability** (P0, 5 pts)

- Browser compatibility
- Safari/iOS auto-play handling
- Clear audio state indicators

**US-5.4: Onboarding Progress Persistence** (P1, 3 pts)

- Track onboarding wizard completion
- Allow users to skip and return
- Don't show wizard to returning parents
- Dashboard help tour available anytime

---

## Global Acceptance Criteria

**Accessibility**:

- Keyboard navigation
- Screen reader compatible
- WCAG 2.1 AA contrast
- Visible focus indicators

**Performance**:

- Page load < 3 seconds
- API responses < 500ms
- Immediate audio playback

**Security**:

- All API calls authenticated
- Family data isolated
- Role-based permissions

---

## Permissions Matrix

| Action              | Parent | Child | System          |
| ------------------- | ------ | ----- | --------------- |
| Create word set     | ✅      | ❌     | Generates audio |
| Edit word set       | ✅      | ❌     | Updates audio   |
| Delete word set     | ✅      | ❌     | Removes data    |
| Take test           | ✅      | ✅     | Tracks results  |
| View own results    | ✅      | ✅     | Provides data   |
| View family results | ✅      | ❌     | Provides data   |
| Create child        | ✅      | ❌     | Creates account |

---

## Future Enhancements

**Phase 2: Gamification**

- Achievement badges
- Leaderboards
- Daily streaks
- Time-limited challenges
- XP system

**Phase 3: AI Features**

- Auto-generated word sets
- Personalized recommendations
- Adaptive difficulty

**Phase 4: Extended Users**

- Teacher accounts
- School integration
- Classroom management

---

## Priority Definitions

| Priority | Timeline | Description            |
| -------- | -------- | ---------------------- |
| P0       | MVP      | Critical functionality |
| P1       | v1.1     | Important features     |
| P2       | v1.2+    | Nice to have           |

---

*Last reviewed: January 2026*
