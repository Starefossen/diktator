# Diktator - Architecture Document

## Overview

Diktator is a children's voice dictation spelling application that enables parents to create spelling tests with voice recordings and allows children to practice spelling by listening to the recorded words.

## System Goals

- **Educational**: Help children improve their spelling skills through auditory learning
- **User-Friendly**: Simple interface suitable for both parents (test creation) and children (test taking)
- **Reliable**: Secure storage of audio files and test data
- **Scalable**: Support multiple families and word sets

## Architecture Overview

### High-Level Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   Cloud Run     │    │   Firestore     │
│   (React/Vue)   │◄──►│   (Go API)      │◄──►│   (NoSQL DB)    │
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

### Backend

- **Platform**: Google Cloud Run (serverless containers)
- **Language**: Go (leveraging the existing Go workspace structure)
- **Framework**: Gin or Echo for HTTP routing
- **Database**: Cloud Firestore (serverless NoSQL, pay-per-use)
- **File Storage**: Google Cloud Storage for audio files
- **Authentication**: Firebase Authentication
- **TTS Service**: Google Cloud Text-to-Speech API

### Frontend

- **Hosting**: Google Cloud Storage + Cloud CDN (static SPA hosting)
- **Framework**: Next.js 14+ with React 18+ (configured as SPA export)
- **Language**: TypeScript 5+ for full type safety across the application
- **Styling**: Tailwind CSS for utility-first styling
- **Audio Handling**: Web Audio API for playback
- **UI Components**: Headless UI or Radix UI with Tailwind
- **State Management**: Zustand with TypeScript for type-safe state management
- **Form Handling**: React Hook Form with Zod validation schemas
- **Testing**: Jest with TypeScript and React Testing Library

### Infrastructure

- **Version Control**: GitHub (monorepo: starefossen/diktator)
- **CI/CD**: GitHub Actions for automated deployment
- **Backend Deployment**: Cloud Run via GitHub Actions
- **Frontend Deployment**: Cloud Storage + Cloud CDN via GitHub Actions
- **CDN**: Cloud CDN for global distribution of frontend and audio files
- **Monitoring**: Cloud Monitoring and Cloud Logging
- **Secrets**: GitHub Secrets for CI/CD, Secret Manager for runtime

## Core Components

### 1. User Management Service

**Responsibilities:**

- User registration and authentication via Firebase Auth
- Role-based access (Parent/Child)
- Family/household management
- User sessions and security

**Google Cloud Services:**

- Firebase Authentication for user management
- Cloud Firestore for user profiles and family data

**Entities:**

- User (Parent/Child)
- Family/Household
- Authentication tokens (handled by Firebase)

### 2. Word Set Management Service

**Responsibilities:**

- Create and manage word collections
- Generate audio recordings via Google Cloud Text-to-Speech
- Organize words by difficulty/categories
- Word set sharing between family members

**Google Cloud Services:**

- Cloud Firestore for word data storage
- Cloud Storage for audio file storage
- Cloud Text-to-Speech API for audio generation

**Entities:**

- WordSet
- Word
- AudioRecording (generated)
- Category/Tag

### 3. Test Management Service

**Responsibilities:**

- Create spelling tests from word sets
- Track test sessions and progress
- Generate test results and statistics
- Adaptive difficulty based on performance

**Google Cloud Services:**

- Cloud Firestore for test data and results
- Cloud Run for stateless test processing
- Cloud Scheduler for automated test reminders (optional)

**Entities:**

- Test
- TestSession
- TestResult
- UserProgress

### 4. Audio Service

**Responsibilities:**

- Google Cloud Text-to-Speech API integration
- Audio file generation and caching in Cloud Storage
- Secure audio file serving via Cloud Storage CDN
- Audio quality optimization

**Google Cloud Services:**

- Cloud Text-to-Speech API
- Cloud Storage with CDN
- Cloud Functions for audio processing (if needed)

**Technical Details:**

- TTS API: Google Cloud Text-to-Speech (primary choice)
- Generated formats: MP3, optimized for web delivery
- Audio caching in Cloud Storage with CDN distribution
- Voice selection options (neural voices available)

### 5. Progress Tracking Service

**Responsibilities:**

- Track spelling accuracy over time
- Generate progress reports
- Identify difficult words for review
- Achievement/badge system

**Google Cloud Services:**

- Cloud Firestore for progress data
- Cloud Functions for analytics processing
- BigQuery for advanced analytics (optional for larger datasets)

## Google Cloud Architecture Details

### Serverless Infrastructure Benefits

1. **Cost Optimization**: Pay only for actual usage
2. **Auto-scaling**: Handles traffic spikes automatically
3. **Zero Infrastructure Management**: Google manages underlying infrastructure
4. **Global Distribution**: Built-in CDN and global presence

### Core Google Cloud Services

#### Cloud Run (Backend API)

- **Purpose**: Host the Go backend API
- **Benefits**:
  - Scale to zero when not in use
  - Pay per request
  - Automatic HTTPS
  - Built-in load balancing
- **Configuration**:
  - CPU: 1 vCPU, Memory: 512Mi (adjustable)
  - Concurrency: 100 requests per instance
  - Min instances: 0, Max instances: 10

#### Cloud SQL (Database)

- **Purpose**: PostgreSQL database for structured data
- **Benefits**:
  - Automatic backups and point-in-time recovery
  - Read replicas for scaling
  - Automatic storage increase
- **Configuration**:
  - Instance type: db-f1-micro for development, db-custom for production
  - Storage: 10GB SSD with automatic increase
  - Backup retention: 7 days

#### Cloud Firestore (Database)

- **Purpose**: Serverless NoSQL database for application data
- **Benefits**:
  - Pay-per-use pricing (reads, writes, storage)
  - Automatic scaling and high availability
  - Real-time synchronization capabilities
  - Offline support for mobile applications
  - Strong consistency within a region
- **Configuration**:
  - Mode: Native mode for new applications
  - Location: Multi-region for global availability
  - Security rules for access control
  - Backup: Automatic daily backups
- **Pricing**:
  - Document reads: $0.06 per 100K operations
  - Document writes: $0.18 per 100K operations
  - Storage: $0.18 per GB/month
  - Free tier: 50K reads, 20K writes, 1GB storage per day

#### Cloud Storage (Audio Files & Frontend Hosting)

- **Purpose**: Store generated audio files and host static frontend application
- **Benefits**:
  - Global CDN distribution via Cloud CDN
  - Pay for storage used
  - Automatic lifecycle management
  - Single storage solution for all static assets
- **Configuration**:
  - Storage class: Standard for frequently accessed files
  - Cloud CDN enabled for global distribution
  - Object lifecycle: Delete old audio files after 1 year (configurable)
  - Website configuration for SPA routing (index.html fallback)

#### Cloud CDN (Global Content Delivery)

- **Purpose**: Global distribution of frontend application and audio files
- **Benefits**:
  - Low-latency content delivery worldwide
  - Automatic caching and optimization
  - DDoS protection and security features
  - Integrated with Cloud Storage
- **Configuration**:
  - Origin: Cloud Storage bucket(s)
  - Cache TTL: 1 hour for frontend assets, 1 day for audio files
  - Custom domain support with SSL certificates
  - Compression and image optimization

#### Firebase Authentication

- **Purpose**: User authentication and management
- **Benefits**:
  - Multiple sign-in methods
  - Built-in security features
  - Free tier for moderate usage
  - Integration with other Google services

## Text-to-Speech Integration

### Google Cloud Text-to-Speech Service

The application leverages Google Cloud Text-to-Speech API as the primary TTS provider, taking advantage of the integrated Google Cloud ecosystem.

### Google Cloud TTS Features

1. **Neural Voices (WaveNet)**
   - High-quality, natural-sounding voices
   - Multiple languages and accents
   - Child-friendly voice options

2. **Standard Voices**
   - Cost-effective option for high-volume usage
   - Good quality for educational content
   - Faster generation times

3. **SSML Support**
   - Speech Synthesis Markup Language for pronunciation control
   - Custom speaking rates and emphasis
   - Phonetic pronunciation for difficult words

### Audio Generation Workflow

```text
1. User adds word to word set (Cloud Run API)
2. System checks Cloud Storage for existing audio file
3. If not cached:
   a. Call Google Cloud Text-to-Speech API
   b. Upload generated audio to Cloud Storage
   c. Update Firestore word document with file path and metadata
4. Serve audio file via Cloud Storage CDN
```

### Caching Strategy with Google Cloud Storage

- **Cache Key**: word_text + voice_id + language + hash
- **Storage**: Google Cloud Storage with CDN
- **TTL**: Indefinite (files deleted via lifecycle policy)
- **Optimization**: Batch requests to TTS API when possible
- **CDN**: Automatic global distribution via Cloud Storage CDN
- **Firestore Integration**: Audio metadata stored in word documents

### Voice Configuration

- **Default Voice**: en-US-Neural2-A (child-friendly female voice)
- **Alternative Voices**: en-US-Neural2-C (male), en-GB-Neural2-A (British)
- **Language Support**: 40+ languages available
- **Custom Settings**: Speaking rate, pitch adjustments via SSML

### Cost Management

- **TTS API Pricing**: $16 per 1 million characters (Neural voices)
- **Storage Costs**: $0.02 per GB/month (Standard storage)
- **CDN Costs**: $0.085 per GB (first 10TB/month)
- **Free Tier**: 1 million characters/month for Standard voices
- **Rate Limiting**: 300 requests per minute (default quota)

## Frontend Architecture Details

### Next.js 14+ Features

#### App Router Architecture

- **File-based Routing**: Organized by feature with grouped routes
- **Static Export**: Configured for SPA deployment to Cloud Storage
- **Client Components**: Interactive components with "use client" directive
- **Client-side Routing**: All routing handled by React Router or Next.js router

#### Next.js SPA Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    unoptimized: true, // Required for static export
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
  async generateStaticParams() {
    return []; // No dynamic routes for SPA
  },
}

module.exports = nextConfig
```

#### Key Libraries and Integrations

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@headlessui/react": "^1.7.0",
    "@heroicons/react": "^2.0.0",
    "firebase": "^10.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "framer-motion": "^10.16.0",
    "recharts": "^2.8.0",
    "clsx": "^2.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/jest": "^29.5.0",
    "eslint": "^8.48.0",
    "eslint-config-next": "^14.0.0",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "@typescript-eslint/parser": "^6.7.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.0",
    "ts-jest": "^29.1.0",
    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

#### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

#### ESLint Configuration with TypeScript

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  }
}
```

#### Tailwind CSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

#### Component Architecture Examples

```typescript
// src/components/ui/Button.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
            'hover:bg-gray-100': variant === 'ghost',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

export { Button }
```

#### TypeScript Types (Simplified for MVP)

```typescript
// src/types/index.ts - Keep it simple for MVP!

export interface User {
  id: string
  email: string
  familyId: string
}

export interface WordSet {
  id: string
  name: string
  words: string[]
  familyId: string
}

export interface TestResult {
  id: string
  wordSetId: string
  userId: string
  score: number
  completedAt: string
}

// Simple API Response
export interface ApiResponse<T> {
  data: T
  error?: string
}

// Basic form type
export interface CreateWordSetForm {
  name: string
  words: string[]
}
```

#### Package.json Scripts for TypeScript

```json
// frontend/package.json scripts section
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

#### Jest Configuration for TypeScript

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (if you're using them in your tsconfig)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig)
```

#### State Management with Zustand

```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { User } from 'firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))
```

#### Firebase Integration

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

### Responsive Design Strategy

- **Mobile-First**: Tailwind's responsive prefixes (sm:, md:, lg:, xl:)
- **Component Adaptability**: Components that work across all screen sizes
- **Touch-Friendly**: Large touch targets for children's use
- **Accessibility**: WCAG 2.1 AA compliance with semantic HTML and ARIA labels

## Database Schema

### Firestore Document Structure

Firestore uses a document-based NoSQL structure organized in collections and subcollections.

#### Core Collections (Simplified for MVP)

```javascript
// Users Collection
users/{userId} {
  email: string,
  familyId: string,
  createdAt: timestamp
}

// Word Sets Collection
wordsets/{wordsetId} {
  name: string,
  words: array, // Just an array of strings for MVP
  familyId: string,
  createdAt: timestamp
}

// Test Results Collection
results/{resultId} {
  wordsetId: string,
  userId: string,
  score: number, // percentage correct
  completedAt: timestamp
}
```

#### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Family members can read family data
    match /families/{familyId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.members;
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.createdBy;
    }

    // Family members can manage wordsets
    match /wordsets/{wordsetId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.members;

      // Words subcollection
      match /words/{wordId} {
        allow read, write: if request.auth != null &&
          request.auth.uid in get(/databases/$(database)/documents/families/$(get(/databases/$(database)/documents/wordsets/$(wordsetId)).data.familyId)).data.members;
      }
    }

    // Users can manage their own tests
    match /tests/{testId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;

      // Test answers subcollection
      match /answers/{answerId} {
        allow read, write: if request.auth != null &&
          request.auth.uid == get(/databases/$(database)/documents/tests/$(testId)).data.userId;
      }
    }

    // Users can read/write their own progress
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Firestore Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "wordsets",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "familyId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "tests",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "completedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "words",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        {"fieldPath": "difficultyLevel", "order": "ASCENDING"},
        {"fieldPath": "order", "order": "ASCENDING"}
      ]
    }
  ]
}
```

## API Design (Simplified)

Keep the API simple for MVP - we can expand later!

### Essential Endpoints Only

```http
# Health check
GET  /health                    # Basic health check

# Word Sets (core functionality)
GET    /api/wordsets           # List word sets for user's family
POST   /api/wordsets           # Create new word set
DELETE /api/wordsets/{id}      # Delete word set

# TTS Audio Generation
POST   /api/wordsets/{id}/audio # Generate audio for all words in set

# Test Results
POST   /api/results            # Save test result
GET    /api/results            # Get user's test results
```

### Authentication

Use Firebase Auth on the frontend - no custom auth endpoints needed!

## Security Considerations

### Authentication & Authorization

- JWT tokens with reasonable expiration times
- Role-based access control (Parent vs Child permissions)
- Family-level data isolation
- Secure password hashing (bcrypt)

### Data Protection

- Input validation and sanitization
- SQL injection prevention through parameterized queries
- TTS API rate limiting and cost management
- Rate limiting on API endpoints

### Privacy

- COPPA compliance for children's data
- Family data isolation
- Secure audio file storage with access controls
- TTS API data privacy compliance
- Data retention policies

## Deployment Architecture

### GitHub Monorepo Structure

The application uses a monorepo approach hosted on GitHub with separate deployment pipelines for frontend and backend.

### Repository Structure

```text
starefossen/diktator/
├── backend/                     # Go API application
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── auth/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── tts/
│   │   └── config/
│   ├── Dockerfile
│   └── go.mod
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── public/
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
├── terraform/                   # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml
│       ├── deploy-frontend.yml
│       └── test.yml
└── README.md
```

### Development Environment

#### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/starefossen/diktator.git
cd diktator

# Backend setup
cd backend
go mod tidy

# Frontend setup
cd ../frontend
npm install

# Start development servers
# Terminal 1 - Backend (with Firestore emulator)
cd backend
export FIRESTORE_EMULATOR_HOST=localhost:8080
firebase emulators:start --only firestore &
go run cmd/server/main.go

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Docker Compose for Local Development

```yaml
# docker-compose.yml (root directory)
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - FIRESTORE_EMULATOR_HOST=firestore:8080
      - GOOGLE_CLOUD_PROJECT=diktator-local
      - STORAGE_BUCKET=diktator-local-audio
    depends_on:
      - firestore

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  firestore:
    image: gcr.io/google.com/cloudsdktool/cloud-sdk:latest
    command: >
      bash -c "
        gcloud components install cloud-firestore-emulator --quiet &&
        gcloud beta emulators firestore start --host-port=0.0.0.0:8080 --project=diktator-local
      "
    ports:
      - "8080:8080"
    environment:
      - GOOGLE_CLOUD_PROJECT=diktator-local
```

### Production Deployment

#### GitHub Actions Workflows

##### Backend Deployment (.github/workflows/deploy-backend.yml)

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches: [main]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.23'

      - name: Run tests
        working-directory: ./backend
        run: |
          go mod tidy
          go test ./...

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Configure Docker for GCR
        run: gcloud auth configure-docker

      - name: Build and push Docker image
        working-directory: ./backend
        run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/diktator-api:${{ github.sha }} .
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/diktator-api:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy diktator-api \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/diktator-api:${{ github.sha }} \
            --region eu-north1 \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars="GOOGLE_CLOUD_PROJECT=${{ secrets.GCP_PROJECT_ID }}" \
            --set-env-vars="STORAGE_BUCKET=${{ secrets.GCP_PROJECT_ID }}-audio"
```

##### Frontend Deployment (.github/workflows/deploy-frontend.yml)

```yaml
name: Deploy Frontend to Cloud Storage

on:
  push:
    branches: [main]
    paths: ['frontend/**']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: TypeScript type check
        working-directory: ./frontend
        run: npm run type-check

      - name: ESLint check
        working-directory: ./frontend
        run: npm run lint

      - name: Run tests
        working-directory: ./frontend
        run: npm run test

      - name: Build application
        working-directory: ./frontend
        run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build application
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://diktator-api-${{ secrets.GCP_PROJECT_ID }}-uc.a.run.app
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Deploy to Cloud Storage
        working-directory: ./frontend
        run: |
          # Copy files to Cloud Storage bucket
          gsutil -m rsync -r -d ./dist gs://${{ secrets.GCP_PROJECT_ID }}-frontend

          # Set cache control headers
          gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://${{ secrets.GCP_PROJECT_ID }}-frontend/**/*.html
          gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://${{ secrets.GCP_PROJECT_ID }}-frontend/**/*.{js,css,png,jpg,jpeg,gif,svg,ico,woff,woff2}

      - name: Invalidate CDN cache
        run: |
          gcloud compute url-maps invalidate-cdn-cache diktator-frontend-lb \
            --path "/*" \
            --async
```

##### Testing Workflow (.github/workflows/test.yml)

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.23'

      - name: Run backend tests
        working-directory: ./backend
        run: |
          go mod tidy
          go test -v ./...
          go vet ./...

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run type check
        working-directory: ./frontend
        run: npm run type-check

      - name: Run linting
        working-directory: ./frontend
        run: npm run lint

      - name: Run tests
        working-directory: ./frontend
        run: npm run test

      - name: Run tests with coverage
        working-directory: ./frontend
        run: npm run test:coverage

      - name: Upload coverage to Codecov (optional)
        uses: codecov/codecov-action@v3
        with:
          directory: ./frontend/coverage
          flags: frontend
          name: codecov-frontend

      - name: Build application
        working-directory: ./frontend
        run: npm run build
```

#### Infrastructure as Code (Terraform)

```hcl
# main.tf
resource "google_cloud_run_service" "diktator_api" {
  name     = "diktator-api"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/diktator-api:latest"

        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }

        env {
          name  = "STORAGE_BUCKET"
          value = "${var.project_id}-audio"
        }

        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1000m"
          }
        }
      }

      service_account_name = google_service_account.cloud_run.email
    }

    metadata {
      annotations = {
        "run.googleapis.com/max-scale" = "10"
        "run.googleapis.com/min-scale" = "0"
      }
    }
  }
}

# Enable Firestore
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Enable point-in-time recovery
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"
}

# Service account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "diktator-cloud-run"
  display_name = "Diktator Cloud Run Service Account"
}

# IAM bindings for Firestore access
resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# IAM bindings for Storage access
resource "google_project_iam_member" "storage_user" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# IAM bindings for TTS access
resource "google_project_iam_member" "tts_user" {
  project = var.project_id
  role    = "roles/texttospeech.synthesizer"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket" "audio_files" {
  name     = "${var.project_id}-audio"
  location = var.region

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 365  # Delete files older than 1 year
    }
  }

  cors {
    origin          = ["https://${var.project_id}-frontend.web.app"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Frontend hosting bucket
resource "google_storage_bucket" "frontend" {
  name     = "${var.project_id}-frontend"
  location = var.region

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"  # For SPA routing
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Make frontend bucket publicly readable
resource "google_storage_bucket_iam_member" "frontend_public" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Cloud CDN for frontend
resource "google_compute_backend_bucket" "frontend" {
  name        = "diktator-frontend-backend"
  bucket_name = google_storage_bucket.frontend.name
  enable_cdn  = true
}

resource "google_compute_url_map" "frontend" {
  name            = "diktator-frontend-lb"
  default_service = google_compute_backend_bucket.frontend.id
}

resource "google_compute_target_https_proxy" "frontend" {
  name    = "diktator-frontend-proxy"
  url_map = google_compute_url_map.frontend.id
  ssl_certificates = [google_compute_managed_ssl_certificate.frontend.id]
}

resource "google_compute_managed_ssl_certificate" "frontend" {
  name = "diktator-frontend-ssl"

  managed {
    domains = ["${var.domain_name}"]
  }
}

resource "google_compute_global_forwarding_rule" "frontend" {
  name       = "diktator-frontend-rule"
  target     = google_compute_target_https_proxy.frontend.id
  port_range = "443"
  ip_address = google_compute_global_address.frontend.address
}

resource "google_compute_global_address" "frontend" {
  name = "diktator-frontend-ip"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "texttospeech.googleapis.com",
  ])

  project = var.project_id
  service = each.value
}
```

#### CI/CD Pipeline (Cloud Build)

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/diktator-api:$COMMIT_SHA', '.']

  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/diktator-api:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
    - 'run'
    - 'deploy'
    - 'diktator-api'
    - '--image'
    - 'gcr.io/$PROJECT_ID/diktator-api:$COMMIT_SHA'
    - '--region'
    - 'eu-north1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'

  # Deploy frontend to Cloud Storage
  - name: 'gcr.io/cloud-builders/gsutil'
    args: ['rsync', '-r', '-d', './frontend/dist', 'gs://$PROJECT_ID-frontend']
    dir: 'frontend'

images:
  - 'gcr.io/$PROJECT_ID/diktator-api:$COMMIT_SHA'
```

### Cost Optimization Strategies

1. **Cloud Run**: Scales to zero, pay only for requests
2. **Firestore**: Pay only for reads/writes/storage used (no idle costs)
3. **Cloud Storage**: Lifecycle policies to delete old audio files
4. **Cloud CDN**: Global caching reduces origin requests and costs
5. **Firebase Auth**: Free tier for authentication (first 50K MAUs)
6. **TTS API**: Use Standard voices for development, Neural for production
7. **GitHub Actions**: 2000 minutes/month free for public repositories
8. **Monitoring**: Set up billing alerts and quotas

### Estimated Monthly Costs (for small family app)

- **Cloud Run**: $0-5 (generous free tier)
- **Firestore**: $0-2 (50K reads, 20K writes free daily)
- **Cloud Storage**: $0-2 (5GB free, then $0.02/GB for audio + frontend files)
- **Cloud CDN**: $0-1 (first 10TB/month at $0.085/GB, heavily cached)
- **Firebase Auth**: $0 (first 50K MAUs free)
- **TTS API**: $0-10 (1M characters free for Standard voices)
- **GitHub Actions**: $0 (free for public repositories)

**Total Estimated Cost**: $0-20/month for typical family usage

## Development Guidelines (Keep It Simple!)

### TypeScript Essentials

- Use `strict: true` in tsconfig.json
- Define interfaces for props and API responses
- Avoid `any` - use specific types
- Run `npm run type-check` before committing

### Code Quality

- Use ESLint and Prettier (pre-configured with Next.js)
- Run tests before deploying
- Keep components small and focused
- Write readable code over clever code

## Development Phases

### Phase 0: Foundation Setup (Essential Boilerplate)

**Goal**: Get a working development environment and deployment pipeline

**Frontend Setup**:

- Basic Next.js 14 TypeScript project with Tailwind CSS
- Essential folder structure (`src/app`, `src/components`, `src/lib`)
- Basic TypeScript configuration and ESLint
- Simple "Hello World" page that builds and deploys

**Backend Setup**:

- Basic Go project with simple HTTP server
- Essential folder structure (`cmd/server`, `internal/handlers`)
- Basic health check endpoint (`GET /health`)
- Dockerfile for containerization

**Deployment Setup**:

- GitHub Actions workflows for both frontend and backend
- Google Cloud project with basic services enabled
- Cloud Storage bucket for frontend hosting
- Cloud Run service for backend API
- Basic Terraform configuration

**Success Criteria**:

- `npm run dev` works for frontend
- `go run cmd/server/main.go` works for backend
- GitHub Actions successfully deploy both services
- Frontend accessible via Cloud Storage + CDN
- Backend API responds to health checks

### Phase 1: Core Authentication & Data

**Goal**: Add user authentication and basic data storage

**Features**:

- Firebase Authentication integration
- Basic user registration/login flow
- Firestore database setup with simple user collection
- Protected routes and API endpoints
- Basic error handling and loading states

### Phase 2: Word Management MVP

**Goal**: Core spelling application functionality

**Features**:

- Create and manage word sets
- Google Cloud Text-to-Speech integration
- Basic spelling test functionality
- Simple progress tracking

### Phase 3: Enhanced Features

**Goal**: Polish and advanced features

**Features**:

- Advanced analytics and reporting
- Improved UI/UX and animations
- Performance optimizations
- Mobile responsiveness improvements

## File Structure (Simplified for MVP)

Start simple! Add complexity only when needed.

```text
starefossen/diktator/
├── backend/                     # Go API
│   ├── cmd/server/main.go       # Simple server entry point
│   ├── handlers/                # HTTP handlers (health, wordsets, results)
│   ├── Dockerfile               # Container config
│   └── go.mod                   # Dependencies
├── frontend/                    # Next.js TypeScript SPA
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── wordsets/        # Word set pages
│   │   │   └── test/            # Test pages
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Basic UI (Button, etc.)
│   │   │   └── forms/           # Forms (CreateWordSet, etc.)
│   │   ├── lib/
│   │   │   ├── firebase.ts      # Firebase config
│   │   │   └── api.ts           # API client
│   │   └── types/index.ts       # TypeScript types
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
├── .github/workflows/
│   ├── deploy-backend.yml       # Deploy Go API to Cloud Run
│   └── deploy-frontend.yml      # Deploy React SPA to Cloud Storage
└── README.md                    # Getting started guide
```

## Basic Monitoring (For MVP)

Keep monitoring simple initially:

- **Google Cloud Console**: Basic metrics come built-in
- **Error Logging**: Cloud Run automatically logs errors
- **Cost Alerts**: Set a billing alert at $25/month
- **Health Checks**: Simple `/health` endpoint

Add sophisticated monitoring later when you have real users!

## Getting Started

This simplified architecture focuses on getting a working MVP deployed quickly. You can add complexity incrementally as your application grows and you understand your actual needs better.

### Next Steps

1. **Phase 0**: Set up the basic project structure and deployment
2. **Phase 1**: Add Firebase Auth and simple word set management
3. **Phase 2**: Add TTS integration and basic testing
4. **Phase 3**: Polish and optimize based on real usage

### Key Principles

- **Start simple**: Don't over-engineer from day one
- **Deploy early**: Get something working and deployed quickly
- **Iterate based on feedback**: Add features based on actual user needs
- **Operational simplicity**: Choose simple solutions over complex ones

## Gamification & Results System

### Test Results & Progress Tracking

The application implements a comprehensive results tracking system to monitor student progress and provide meaningful feedback to both children and parents.

#### Test Result Structure

```typescript
// Enhanced TestResult interface
export interface TestResult {
  id: string
  userId: string
  wordSetId: string
  score: number              // Percentage correct (0-100)
  totalWords: number         // Total words in the test
  correctWords: number       // Number of correct answers
  incorrectWords: string[]   // Array of words that were misspelled
  timeSpent: number         // Total time in seconds
  averageTimePerWord: number // Average time per word
  difficulty: 'easy' | 'medium' | 'hard'
  language: 'en' | 'no'
  completedAt: string       // ISO timestamp
  streak: number            // Current correct streak during test
  hintsUsed: number         // Number of times audio was played
  createdAt: string
  updatedAt: string
}

// Progress Summary
export interface UserProgress {
  userId: string
  totalTestsCompleted: number
  averageScore: number
  bestScore: number
  currentStreak: number          // Days with at least one test
  longestStreak: number
  totalWordsLearned: number
  weakWords: string[]            // Words frequently misspelled
  strongWords: string[]          // Words consistently correct
  preferredDifficulty: string
  timeSpentLearning: number      // Total minutes
  achievements: Achievement[]
  level: number                  // Calculated based on progress
  xp: number                     // Experience points
  lastActiveDate: string
}
```

#### Detailed Analytics

```typescript
// Word-level analytics
export interface WordAnalytics {
  word: string
  language: 'en' | 'no'
  attemptCount: number
  correctCount: number
  incorrectCount: number
  accuracy: number              // Percentage
  averageTimeToSpell: number
  lastAttemptDate: string
  difficulty: 'easy' | 'medium' | 'hard'
  userId: string
  commonMistakes: string[]      // Frequent misspellings
}

// Session analytics
export interface StudySession {
  id: string
  userId: string
  startTime: string
  endTime: string
  testsCompleted: number
  totalScore: number
  wordsLearned: string[]
  timeSpent: number
  focusScore: number           // Based on consistency
}
```

### Leaderboard System

#### Family Leaderboards

```typescript
export interface FamilyLeaderboard {
  familyId: string
  period: 'daily' | 'weekly' | 'monthly' | 'allTime'
  rankings: LeaderboardEntry[]
  lastUpdated: string
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  avatar?: string
  score: number
  testsCompleted: number
  accuracy: number
  streak: number
  xp: number
  level: number
  rank: number
  previousRank?: number
  badge?: string
}
```

#### Multiple Leaderboard Categories

- **Overall Performance**: Combined score based on accuracy, consistency, and improvement
- **Accuracy Champions**: Highest spelling accuracy
- **Speed Demons**: Fastest average spelling time
- **Consistency Kings**: Longest daily streaks
- **Improvement Stars**: Most improved over time period
- **Language Masters**: Separate boards for English and Norwegian

#### Achievement System

```typescript
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'accuracy' | 'speed' | 'consistency' | 'improvement' | 'exploration'
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum'
  requirements: AchievementRequirement[]
  xpReward: number
  unlockedAt?: string
}

export interface AchievementRequirement {
  type: 'score' | 'streak' | 'tests_completed' | 'words_learned' | 'time_spent'
  value: number
  period?: 'daily' | 'weekly' | 'monthly'
}
```

#### Sample Achievements

```typescript
const sampleAchievements: Achievement[] = [
  {
    id: 'perfect-score',
    name: 'Perfect Speller',
    description: 'Get 100% on a spelling test',
    icon: '🏆',
    category: 'accuracy',
    difficulty: 'bronze',
    requirements: [{ type: 'score', value: 100 }],
    xpReward: 50
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Practice spelling every day for a week',
    icon: '🔥',
    category: 'consistency',
    difficulty: 'silver',
    requirements: [{ type: 'streak', value: 7, period: 'daily' }],
    xpReward: 100
  },
  {
    id: 'bilingual-master',
    name: 'Bilingual Master',
    description: 'Complete tests in both English and Norwegian',
    icon: '🌍',
    category: 'exploration',
    difficulty: 'gold',
    requirements: [
      { type: 'tests_completed', value: 10 }, // 10 tests in each language
    ],
    xpReward: 200
  },
  {
    id: 'speed-demon',
    name: 'Lightning Speller',
    description: 'Spell a word in under 3 seconds',
    icon: '⚡',
    category: 'speed',
    difficulty: 'bronze',
    requirements: [{ type: 'speed', value: 3 }],
    xpReward: 30
  }
]
```

### XP & Leveling System

#### Experience Points Calculation

```typescript
// XP sources and values
const XP_REWARDS = {
  CORRECT_WORD: 10,
  PERFECT_TEST: 50,
  DAILY_STREAK: 25,
  NEW_WORD_LEARNED: 15,
  ACHIEVEMENT_BRONZE: 50,
  ACHIEVEMENT_SILVER: 100,
  ACHIEVEMENT_GOLD: 200,
  ACHIEVEMENT_PLATINUM: 500,
  SPEED_BONUS: 5,        // For fast spelling
  ACCURACY_BONUS: 10,    // For high accuracy
  CONSISTENCY_BONUS: 20, // For regular practice
}

// Level calculation
function calculateLevel(xp: number): number {
  // Exponential leveling: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100))
}

function getXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel + 1, 2) * 100
}
```

#### Level Rewards & Unlocks

```typescript
export interface LevelReward {
  level: number
  rewards: {
    newWords?: string[]          // Unlock new word sets
    themes?: string[]            // New UI themes
    achievements?: string[]      // New available achievements
    features?: string[]          // New app features
    title?: string              // Special user title
  }
}

const levelRewards: LevelReward[] = [
  {
    level: 5,
    rewards: {
      newWords: ['advanced-animals', 'colors-extended'],
      title: 'Spelling Apprentice'
    }
  },
  {
    level: 10,
    rewards: {
      themes: ['ocean-theme', 'forest-theme'],
      title: 'Word Warrior'
    }
  },
  {
    level: 15,
    rewards: {
      features: ['custom-word-sets'],
      title: 'Spelling Scholar'
    }
  }
]
```

### Gamification Features

#### Visual Progress Indicators

- **Progress Bars**: Visual representation of XP progress to next level
- **Skill Trees**: Different paths for different types of spelling skills
- **Streak Flames**: Visual representation of daily practice streaks
- **Accuracy Meters**: Real-time feedback during tests
- **Speed Indicators**: Animation-based feedback for quick responses

#### Motivational Elements

```typescript
// Positive reinforcement messages
const ENCOURAGEMENT_MESSAGES = {
  en: {
    perfect: ['Amazing! Perfect spelling! 🌟', 'Incredible! You nailed it! 🎯', 'Outstanding work! 🏆'],
    good: ['Great job! Keep it up! 👏', 'Well done! You\'re improving! 📈', 'Nice work! 🌟'],
    tryAgain: ['Good try! Let\'s practice more! 💪', 'Almost there! Keep going! 🎯', 'Learning is progress! 📚']
  },
  no: {
    perfect: ['Fantastisk! Perfekt staving! 🌟', 'Utrolig! Du klarte det! 🎯', 'Enestående arbeid! 🏆'],
    good: ['Flott jobbet! Fortsett sånn! 👏', 'Godt gjort! Du blir bedre! 📈', 'Bra arbeid! 🌟'],
    tryAgain: ['Godt forsøk! La oss øve mer! 💪', 'Nesten der! Fortsett! 🎯', 'Læring er fremgang! 📚']
  }
}
```

#### Social Features

- **Family Challenges**: Weekly spelling challenges between family members
- **Progress Sharing**: Share achievements with family members
- **Collaborative Goals**: Family-wide spelling goals
- **Mentorship**: Older siblings can help younger ones

### Database Schema for Gamification

#### Firestore Collections

```javascript
// Enhanced collections for gamification
results/{resultId} {
  // ...existing fields...
  xpEarned: number,
  achievementsUnlocked: array,
  levelUpDuringTest: boolean,
  bonusPoints: {
    speed: number,
    accuracy: number,
    streak: number
  }
}

userProgress/{userId} {
  xp: number,
  level: number,
  achievements: array,
  streaks: {
    current: number,
    longest: number,
    lastActiveDate: string
  },
  statistics: {
    totalTests: number,
    averageAccuracy: number,
    favoriteWords: array,
    weakWords: array,
    timeSpent: number
  },
  preferences: {
    difficulty: string,
    language: string,
    theme: string
  }
}

achievements/{achievementId} {
  userId: string,
  achievementId: string,
  unlockedAt: string,
  progress: number, // for multi-step achievements
  completed: boolean
}

leaderboards/{familyId}/{period} {
  rankings: array,
  lastUpdated: string,
  totalParticipants: number
}

familyChallenges/{challengeId} {
  familyId: string,
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  participants: array,
  goal: {
    type: 'total_tests' | 'accuracy' | 'streak',
    target: number
  },
  rewards: {
    xp: number,
    achievement: string
  },
  status: 'active' | 'completed' | 'upcoming'
}
```

### API Endpoints for Gamification

```http
# Results and Progress
POST   /api/results                    # Submit test result (auto-calculates XP)
GET    /api/users/{id}/progress        # Get user progress summary
GET    /api/users/{id}/achievements    # Get user achievements
GET    /api/users/{id}/analytics       # Detailed analytics

# Leaderboards
GET    /api/families/{id}/leaderboard  # Family leaderboard
GET    /api/leaderboard/global         # Global leaderboard (anonymous)

# Achievements
GET    /api/achievements               # Available achievements
POST   /api/achievements/check         # Check for new achievements

# Challenges
GET    /api/families/{id}/challenges   # Family challenges
POST   /api/families/{id}/challenges   # Create family challenge
PUT    /api/challenges/{id}/join       # Join challenge
```

### Real-time Features

#### Live Updates

- **Real-time leaderboard updates** using WebSockets or Server-Sent Events
- **Achievement notifications** that appear immediately after unlocking
- **Family activity feed** showing recent achievements and progress
- **Live challenge progress** during active family challenges

#### Notification System

```typescript
export interface Notification {
  id: string
  userId: string
  type: 'achievement' | 'level_up' | 'challenge' | 'streak' | 'leaderboard'
  title: string
  message: string
  icon: string
  data?: any
  read: boolean
  createdAt: string
}
```

### Child-Safe Design Considerations

- **No public usernames**: Only display within family groups
- **Positive reinforcement**: Focus on personal improvement rather than competition
- **Age-appropriate achievements**: Different achievements for different age groups
- **Parent controls**: Parents can adjust gamification intensity
- **Privacy protection**: No data sharing outside family groups
- **Educational focus**: Ensure games enhance learning rather than distract

This comprehensive gamification system will make spelling practice engaging and motivating while maintaining educational value and child safety standards.
