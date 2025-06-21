# Firebase Local Development Setup

This document describes the Firebase configuration for local development with emulators.

## Overview

The Diktator app is now configured to work seamlessly with Firebase emulators for local development. This means:

- ✅ No real Firebase project needed for development
- ✅ All authentication and database operations work locally
- ✅ Data is persisted between emulator sessions
- ✅ Complete offline development experience

## Quick Start

### 1. Initial Setup (One Time)

```bash
# Complete project setup
mise run setup

# Or just Firebase setup
mise run firebase-setup
```

### 2. Start Development

```bash
# Option 1: Start everything (recommended)
mise run dev-with-firebase

# Option 2: Start components separately
mise run firebase-emulators  # Terminal 1
mise run frontend            # Terminal 2
mise run backend             # Terminal 3 (optional)
```

### 3. Access the Application

- **Main App**: <http://localhost:3000>
- **Firebase UI**: <http://localhost:4000>
- **Auth Emulator**: <http://localhost:9099>
- **Firestore**: <http://localhost:8088>

## Configuration Files

### `.env.local` (Frontend)
```bash
# Firebase Configuration for Local Development with Emulators
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-diktator
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-diktator.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-diktator.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=demo-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=demo-app-id

# Enable Firebase Emulators for local development
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
```

### `firebase.json` (Emulator Configuration)
```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8088 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### `firestore.rules` (Security Rules)
- Users can only access their own data
- Test results are tied to user IDs
- Future word sets will have proper sharing permissions

## Features Working Locally

### ✅ Authentication
- Email/password signup and login
- User session management
- Protected routes

### ✅ Firestore Database
- User profile storage
- Test results persistence
- User activity tracking
- Real-time updates

### ✅ Application Features
- Word practice with hover-to-reveal
- Score tracking and statistics
- Multilingual support (EN/NO)
- Profile page with user stats

## Troubleshooting

### Firebase CLI Not Found
```bash
# Install globally
npm install -g firebase-tools

# Or use mise
mise run firebase-setup
```

### Emulators Won't Start
```bash
# Check if ports are available
lsof -i :4000,8088,9099

# Kill existing processes if needed
pkill -f firebase
```

### Authentication Not Working
1. Check `.env.local` has `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`
2. Verify emulators are running at <http://localhost:4000>
3. Clear browser storage and try again

### Database Errors
1. Ensure Firestore emulator is running (port 8088)
2. Check Firestore rules in `firestore.rules`
3. Verify user is authenticated before database operations

## Production Deployment

For production deployment with real Firebase:

1. **Create Firebase Project**: Create a real Firebase project in console
2. **Update Terraform**: Run `tofu apply` to create Firebase resources
3. **Get Configuration**: Copy real Firebase config to `.env.local`
4. **Disable Emulators**: Set `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false`

The Terraform configuration (`terraform/main.tf`) already includes:
- Firebase project setup
- Authentication configuration
- Firestore database
- Web app registration

## Development Workflow

1. Start emulators: `mise run firebase-emulators`
2. Start frontend: `mise run frontend`
3. Develop and test features
4. All data stays local in emulators
5. No cleanup needed - emulators handle everything

The emulators provide a complete Firebase experience locally, making development fast and reliable without external dependencies.
