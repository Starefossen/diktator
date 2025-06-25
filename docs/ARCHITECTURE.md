# Diktator - Architecture Document

## Overview

Diktator is a web application designed to help children learn Norwegian vocabulary through gamified spelling tests. The system enables parents to create word sets and allows children to practice spelling by listening to audio recordings of words.

## System Goals

- **Educational**: Help children improve spelling skills through auditory learning
- **Family-Friendly**: Simple interface suitable for both parents and children
- **Multilingual**: Support for Norwegian (🇳🇴) and English (🇬🇧) with proper flag icons
- **Scalable**: Cloud-native architecture supporting multiple families

## High-Level Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js SPA   │    │   Go API        │    │   Firestore     │
│   (Frontend)    │◄──►│   (Cloud Run)   │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Cloud Storage   │
                       │ (Audio Files)   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Text-to-Speech  │
                       │      API        │
                       └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with React 19 and TypeScript 5+
- **Styling**: Tailwind CSS 4+ with utility-first approach
- **UI Components**: Headless UI with custom components
- **Icons**: Heroicons and flag-icons for proper country flags
- **Authentication**: Firebase Auth SDK
- **State Management**: React Context and hooks
- **Build**: Static export for Cloud Storage hosting

### Backend
- **Platform**: Google Cloud Run (serverless containers)
- **Language**: Go 1.23 with Gin HTTP framework
- **Database**: Cloud Firestore (serverless NoSQL)
- **File Storage**: Google Cloud Storage for audio files
- **Authentication**: Firebase Admin SDK
- **TTS Service**: Google Cloud Text-to-Speech API
- **API Documentation**: Swagger/OpenAPI

### Infrastructure
- **Hosting**: Google Cloud Platform
- **CI/CD**: GitHub Actions
- **Infrastructure as Code**: Terraform
- **Version Control**: GitHub monorepo
- **Development**: Firebase Emulators

## Core Features

### 1. User Management
- Firebase Authentication (email/password)
- Role-based access (Parent/Child)
- Family group management
- User profiles and progress tracking

### 2. Word Set Management
- Create and manage word collections
- Automatic audio generation via Google Cloud TTS
- Support for Norwegian and English languages
- Word organization and categorization

### 3. Spelling Tests
- Interactive spelling tests with audio playback
- Real-time feedback and scoring
- Progress tracking and analytics
- Mobile-responsive test interface

### 4. Progress Tracking
- Individual performance analytics
- Family leaderboards and achievements
- Test history and improvement metrics
- Visual progress indicators

## Database Schema (Firestore)

### Core Collections

```javascript
// Users
users/{userId} {
  email: string,
  displayName: string,
  role: 'parent' | 'child',
  familyId: string,
  createdAt: timestamp,
  lastActiveAt: timestamp
}

// Families
families/{familyId} {
  name: string,
  members: array,
  createdBy: string,
  createdAt: timestamp
}

// Word Sets
wordsets/{wordsetId} {
  name: string,
  language: 'no' | 'en',
  words: array, // [{word, audio: {audioId, audioUrl}}]
  familyId: string,
  createdBy: string,
  audioProcessing: 'pending' | 'completed' | 'failed',
  testConfiguration: object,
  createdAt: timestamp
}

// Test Results
results/{resultId} {
  userId: string,
  wordsetId: string,
  score: number,
  answers: array, // [{word, userAnswer, isCorrect, timeSpent}]
  timeSpent: number,
  completedAt: timestamp
}
```

## API Design

### Core Endpoints

```http
# Health & Status
GET  /health
GET  /docs                    # Swagger documentation

# Authentication (handled by Firebase)
# No backend auth endpoints needed

# Word Sets
GET    /api/wordsets         # List family word sets
POST   /api/wordsets         # Create new word set
GET    /api/wordsets/{id}    # Get specific word set
PUT    /api/wordsets/{id}    # Update word set
DELETE /api/wordsets/{id}    # Delete word set

# Audio Generation
POST   /api/wordsets/{id}/generate-audio  # Generate TTS audio

# Test Results
POST   /api/results          # Save test result
GET    /api/results          # Get user's test results
GET    /api/results/{id}     # Get specific result

# Family Management
GET    /api/families/{id}/children      # Get family children
POST   /api/families/children           # Create child account
PUT    /api/families/children/{id}      # Update child account
DELETE /api/families/children/{id}      # Delete child account
GET    /api/families/children/{id}/progress    # Get child progress
GET    /api/families/children/{id}/results     # Get child results
```

## Development Workflow

### Local Development

```bash
# Start all services
mise run dev

# Individual services
mise run dev:frontend    # Next.js on :3000
mise run dev:backend     # Go API on :8080
mise run dev:emulators   # Firebase emulators
```

### Project Structure

```text
diktator/
├── frontend/                 # Next.js TypeScript SPA
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth, Language)
│   │   ├── lib/            # Utilities and API clients
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Go API
│   ├── cmd/server/         # Application entry point
│   ├── handlers/           # HTTP request handlers
│   ├── internal/           # Private application code
│   │   ├── middleware/     # HTTP middleware
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── Dockerfile
│   └── go.mod
├── terraform/              # Infrastructure as Code
├── scripts/                # Development scripts
└── docs/                   # Documentation
```

## Deployment

### Google Cloud Services

- **Cloud Run**: Hosts the Go backend API
- **Cloud Storage**: Hosts the Next.js frontend (static files)
- **Cloud Firestore**: NoSQL database for application data
- **Cloud Storage**: Audio file storage with CDN
- **Firebase Authentication**: User authentication
- **Text-to-Speech API**: Audio generation for words

### CI/CD Pipeline

- **GitHub Actions**: Automated testing and deployment
- **Frontend**: Build Next.js static export → Deploy to Cloud Storage
- **Backend**: Build Docker image → Deploy to Cloud Run
- **Infrastructure**: Terraform for cloud resource management

### Security

- **Authentication**: Firebase Auth with JWT tokens
- **Authorization**: Family-level data isolation
- **API Security**: CORS, rate limiting, input validation
- **Data Protection**: Firestore security rules
- **Child Safety**: COPPA compliance considerations

## Current Status

### Implemented Features ✅

- Next.js frontend with TypeScript and Tailwind CSS
- Mobile-responsive navigation with Headless UI
- Firebase Authentication integration
- Firestore database integration
- Word set creation and management
- Google Cloud Text-to-Speech integration
- Interactive spelling tests with audio
- Test results and progress tracking
- Family management system
- Flag icons for language indicators
- Mobile-optimized test interface

### Infrastructure ✅

- Google Cloud Platform setup
- Terraform infrastructure management
- Firebase project configuration
- Development environment with emulators
- GitHub Actions CI/CD pipelines

### Next Steps 🚧

- Enhanced gamification features
- Advanced analytics and reporting
- Performance optimizations
- Additional language support
- Extended achievement system

## Future Enhancements & Stretch Goals

### 1. Translation Word Sets

**Concept**: Expand beyond simple spelling practice to include translation exercises where users are shown a word in one language and must spell the correct translation in another language.

**Key Features**:

- **Bidirectional Practice**: Practice Norwegian→English and English→Norwegian
- **Context Hints**: Show example sentences or images for difficult words
- **Audio Support**: Play pronunciation for both source and target words
- **Progressive Difficulty**: Start with cognates, advance to false friends
- **Cultural Context**: Include culturally specific terms and explanations

**WordSet Structure Enhancement**:

- Add `type` field: "spelling", "translation", or "mixed"
- Add `targetLanguage` field for translation exercises
- Extend word objects to include `translation`, `definition`, `context` fields
- Support audio for both source and target languages

**Database Schema**:

```javascript
// Unified WordSet collection supports both spelling and translation
wordsets/{wordsetId} {
  name: string,
  type: string,          // "spelling", "translation", or "mixed"
  language: string,      // Primary language ('no' | 'en')
  targetLanguage: string, // For translations ('no' | 'en'), omitted for spelling-only
  category: string,      // "animals", "food", "colors", etc.
  difficulty: string,    // "beginner", "intermediate", "advanced"
  words: array,          // [{word, translation?, audio?, audioTarget?, definition?, context?}]
  familyId: string,
  createdBy: string,
  audioProcessing: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```
```

**API Endpoints**:

```http
# Unified WordSet endpoints (support both spelling and translation)
GET    /api/wordsets                   # List family word sets (all types)
POST   /api/wordsets                   # Create new word set (spelling, translation, or mixed)
GET    /api/wordsets/{id}              # Get specific word set
PUT    /api/wordsets/{id}              # Update word set
DELETE /api/wordsets/{id}              # Delete word set

# Audio generation works for both languages
POST   /api/wordsets/{id}/generate-audio  # Generate TTS audio for both source and target languages

# Query parameters for filtering
GET    /api/wordsets?type=spelling     # Filter by type
GET    /api/wordsets?type=translation  # Get only translation sets
GET    /api/wordsets?language=en       # Filter by source language
GET    /api/wordsets?category=animals  # Filter by category
```

**Features**:

- **Bidirectional Practice**: Practice Norwegian→English and English→Norwegian
- **Context Hints**: Show example sentences or images for difficult words
- **Audio Support**: Play pronunciation for both source and target words
- **Progressive Difficulty**: Start with cognates, advance to false friends
- **Cultural Context**: Include culturally specific terms and explanations

### 2. Tiered Pricing Model

**Free Tier - "Family Starter"**:

- **Word Sets**: 5 custom word sets maximum
- **Words per Set**: 20 words maximum
- **Character Limit**: 48 characters per word
- **Languages**: Norwegian and English only
- **Voice**: Standard TTS voices only
- **Family Members**: Up to 4 users
- **Test History**: Last 30 days only
- **Features**: Basic spelling tests, simple progress tracking

**Premium Tier - "Family Pro" ($9.99/month)**:

- **Word Sets**: 100 custom word sets
- **Words per Set**: 50 words maximum
- **Character Limit**: 256 characters per word
- **Languages**: All supported languages (NO, EN, DA, SV, DE, FR, ES)
- **Voice Settings**: Neural voices, speed control, pitch adjustment
- **Family Members**: Unlimited
- **Test History**: Complete history with analytics
- **Advanced Features**: Translation tests, auto-generated word sets, custom challenges
- **Priority Support**: Email support with faster response times

**Implementation Approach**:

- **Subscription Management**: Integration with Stripe for billing
- **Usage Tracking**: Monitor family usage against tier limits
- **Feature Gating**: Restrict premium features based on subscription status
- **Billing Events**: Track payments, renewals, and cancellations

**Database Schema**:

```javascript
// Subscription tracking
subscriptions/{familyId} {
  tier: string,
  status: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  currentPeriodEnd: timestamp,
  features: object,
  createdAt: timestamp
}

usage/{familyId} {
  wordSetsCount: number,
  wordsCount: number,
  ttsCharactersUsed: number,
  lastResetDate: timestamp
}
```
```

**API Endpoints**:

```http
# Subscription management
GET    /api/subscription                # Get family subscription status
POST   /api/subscription/checkout       # Create Stripe checkout session
POST   /api/subscription/cancel         # Cancel subscription
GET    /api/subscription/usage          # Get current usage stats
POST   /api/subscription/webhook        # Stripe webhook handler

# Billing
GET    /api/billing/history             # Get billing history
GET    /api/billing/invoices            # Get invoices
POST   /api/billing/update-payment      # Update payment method
```

### 3. Enhanced Gamification System

**Time-Based Challenges**:

- **Speed Demon**: Complete tests within time limits
- **Accuracy Race**: Maintain high accuracy across multiple tests
- **Streak Builder**: Practice consistently over consecutive days
- **Marathon**: Complete large numbers of words or tests

**Challenge Features**:

- Real-time leaderboards with live updates
- Family competitions and seasonal tournaments
- Achievement badges and XP rewards
- Progressive difficulty and qualification rules

**Advanced Leaderboard Features**:

- **Multi-dimensional Rankings**: Overall, speed, accuracy, consistency, improvement
- **Time-based Boards**: Daily, weekly, monthly, all-time
- **Age Group Categories**: Fair competition within age ranges
- **Seasonal Competitions**: Regular tournaments with prizes

**Achievement System**:

- **Bronze/Silver/Gold/Platinum** tiers
- **Categories**: Accuracy, speed, consistency, improvement, exploration
- **Examples**: Perfect Speller, Week Warrior, Bilingual Master, Lightning Speller
- **XP Rewards**: Points for achievements, leveling, and unlocking features

**Database Schema**:

```javascript
// Challenge tracking
challenges/{challengeId} {
  type: string,
  name: string,
  description: string,
  rules: object,
  rewards: object,
  participants: array,
  startTime: timestamp,
  endTime: timestamp,
  status: string,
  leaderboard: array
}

challengeParticipation/{challengeId}/{userId} {
  joinedAt: timestamp,
  progress: object,
  currentScore: number,
  attempts: number,
  completedAt: timestamp,
  rank: number
}
```
```

**API Endpoints**:

```http
# Challenge management
GET    /api/challenges                 # List available challenges
POST   /api/challenges                 # Create new challenge (premium)
GET    /api/challenges/{id}            # Get challenge details
POST   /api/challenges/{id}/join       # Join challenge
POST   /api/challenges/{id}/leave      # Leave challenge
GET    /api/challenges/{id}/leaderboard # Get challenge leaderboard

# Real-time updates
GET    /api/challenges/{id}/events     # Server-sent events for live updates
POST   /api/challenges/{id}/submit     # Submit challenge attempt
```

### 4. AI-Powered Auto-Generated Word Sets

**Concept**: Use AI to automatically generate contextually relevant and educationally appropriate word sets based on topics, difficulty levels, and individual student needs.

**Key Features**:

- **Topic-Based Generation**: Generate word sets for specific topics (animals, food, weather)
- **Difficulty Adaptation**: Automatic difficulty adjustment based on age and skill level
- **Personalized Learning**: AI analyzes performance to suggest relevant words
- **Context-Rich Content**: Include definitions, example sentences, and phonetics
- **Quality Assurance**: Content moderation and educational value validation

**Generation Types**:

- **Topic-Based**: "Ocean animals", "Kitchen items", "Weather words"
- **Personalized**: Based on user's weak areas and learning history
- **Adaptive**: Adjusts difficulty based on recent performance
- **Bilingual**: Generate translation pairs for language learning

**AI Integration Options**:

- **OpenAI GPT-4**: For natural language generation and educational content
- **Google Cloud AI**: For educational content and Norwegian language support
- **Custom Models**: Specialized for educational content and Norwegian
- **Hybrid Approach**: Combine multiple AI services for best results

**Database Schema**:

```javascript
// AI-generated content tracking
generatedWordSets/{setId} {
  originalRequest: object,
  generatedWords: array,
  qualityScore: number,
  humanApproved: boolean,
  usageCount: number,
  userRatings: array,
  createdAt: timestamp,
  aiModel: string
}

learningProfiles/{userId} {
  strengths: array,
  weaknesses: array,
  commonMistakes: array,
  masteredWords: array,
  strugglingWords: array,
  preferredTopics: array,
  learningStyle: string,
  lastAnalyzed: timestamp
}
```
```

**API Endpoints**:

```http
# AI word set generation
POST   /api/ai/generate-wordset        # Generate word set from topic
POST   /api/ai/personalized-wordset    # Generate personalized word set
GET    /api/ai/topics                  # Get available topics
GET    /api/ai/suggestions             # Get AI suggestions for topics

# Learning analytics
GET    /api/users/{id}/learning-profile # Get user learning profile
POST   /api/users/{id}/analyze         # Update learning profile
GET    /api/ai/recommendations         # Get AI recommendations
```

**Quality Assurance & Cost Management**:

- **Content Moderation**: Validate appropriateness and educational value
- **Language Correctness**: Ensure accurate Norwegian and English content
- **Usage Quotas**: Free tier (2 sets/month), Premium tier (50 sets/month)
- **Progressive Implementation**: Start with basic generation, add personalization later

**Implementation Phases**:

1. **Phase 1**: Basic topic-based generation with predefined templates
2. **Phase 2**: Integration with OpenAI for dynamic content generation
3. **Phase 3**: Personalized word sets based on user performance data
4. **Phase 4**: Advanced AI features like adaptive difficulty and learning paths

These stretch goals would significantly enhance the educational value and user engagement of the Diktator application while providing clear upgrade paths for monetization and advanced features.

## Key Design Decisions

1. **Static Frontend**: Next.js static export for simple, cost-effective hosting
2. **Serverless Backend**: Cloud Run for automatic scaling and cost optimization
3. **Firebase Integration**: Leveraging Firebase ecosystem for auth and real-time data
4. **Monorepo Structure**: Simplified development and deployment workflow
5. **TypeScript Throughout**: Type safety across the entire application
6. **Mobile-First Design**: Responsive UI optimized for children's devices
