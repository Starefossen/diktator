# Firebase Authentication Testing Guide

## Quick Test for Sign Up and Login Issues

### 1. Start Firebase Emulators

```bash
# Start emulators first
cd /Users/hans/go/src/github.com/starefossen/diktator
mise run firebase-emulators
```

Wait for this message:
```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✓ All emulators ready! View the Emulator UI at:            │
│ http://localhost:4000                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Start Frontend in Another Terminal

```bash
# In a new terminal
cd /Users/hans/go/src/github.com/starefossen/diktator
mise run frontend
```

### 3. Test Authentication

1. **Go to**: http://localhost:3000
2. **Check Firebase Status**: Look for the Firebase connection status indicator in the bottom-right corner
3. **Expected Status**:
   - 🟢 Auth: connected
   - 🟢 Firestore: connected
   - 🔵 Emulators: enabled

### 4. Test Sign Up

1. Click **"Sign Up"** or go to `/auth`
2. Fill in:
   - **Email**: test@example.com
   - **Password**: password123
   - **Display Name**: Test User
   - **Role**: Parent
3. Click **"Sign Up"**

**Expected Behavior:**
- ✅ Success: User created, redirected to home page
- ❌ Error: Clear error message explaining the issue

### 5. Test Login

1. Sign out if logged in
2. Go to `/auth` and switch to "Log In"
3. Use the same credentials:
   - **Email**: test@example.com
   - **Password**: password123
4. Click **"Log In"**

**Expected Behavior:**
- ✅ Success: User logged in, see user info in navigation
- ❌ Error: Clear error message explaining the issue

## Common Error Messages and Solutions

### ❌ "Firebase Auth is not initialized"
**Solution**:
- Check if Firebase emulators are running
- Verify `.env.local` has correct configuration
- Restart frontend after starting emulators

### ❌ "Network error. Please check your connection"
**Solution**:
- Ensure Firebase emulators are running on correct ports:
  - Auth: http://localhost:9099
  - Firestore: http://localhost:8088
  - UI: http://localhost:4000

### ❌ "Firebase emulator connection failed"
**Solution**:
```bash
# Stop any existing emulators
pkill -f firebase

# Start fresh
mise run firebase-emulators
```

### ❌ "Cannot connect to authentication service"
**Solutions**:
1. **Check emulator status**: Visit http://localhost:4000
2. **Restart emulators**:
   ```bash
   pkill -f firebase
   mise run firebase-emulators
   ```
3. **Check environment variables**:
   ```bash
   cd frontend
   cat .env.local
   ```

## Debugging Steps

### 1. Check Console Logs
Open browser developer tools and look for:
- Firebase connection messages
- Authentication errors
- Network requests to localhost:9099

### 2. Check Firebase UI
Visit http://localhost:4000 to:
- See if emulators are running
- View created users in Authentication tab
- Check Firestore data

### 3. Verify Configuration
```bash
# Check if ports are available
lsof -i :3000,4000,8088,9099

# Check Firebase config
cd frontend && cat .env.local
```

### 4. Check Firebase Connection Status
The app now shows a status indicator in the bottom-right corner:
- 🟢 Green: Service is connected
- 🔴 Red: Service has issues
- 🟡 Yellow: Service is starting

## Manual Testing Checklist

- [ ] Firebase emulators start successfully
- [ ] Frontend connects to emulators
- [ ] Connection status shows all green
- [ ] Sign up creates new user
- [ ] Sign up shows success/error messages
- [ ] Login works with created user
- [ ] Login shows success/error messages
- [ ] User data appears in Firebase UI
- [ ] Navigation shows user info when logged in
- [ ] Logout works correctly

## Production Testing

To test with real Firebase:

1. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-real-project
   # ... other real Firebase config
   ```

2. **Deploy Terraform**:
   ```bash
   cd terraform
   tofu apply
   ```

3. **Test with real Firebase project**

The enhanced error handling will now provide much more detailed information about what's going wrong with Firebase connections and authentication.
