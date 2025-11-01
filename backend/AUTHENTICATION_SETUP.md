# Backend Authentication Setup Guide

This guide explains how to set up Firebase Admin SDK on the backend to verify user authentication tokens.

## Overview

The backend now supports optional Firebase authentication. This allows you to:
- Verify user identity for protected routes
- Associate data with specific users (forum posts, chat messages, etc.)
- Track user preferences and favorites

## Setup (Optional)

Authentication is **optional**. The app will work without backend authentication, but you won't be able to verify user tokens or use protected features.

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview" → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Save the JSON file securely (DO NOT commit this to git!)

### Step 2: Configure Environment Variable

Add the service account to your `.env` file in the backend directory:

```bash
# Firebase Admin Configuration (Optional)
# Paste the entire contents of your service account JSON as a single line
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}

# Alternative: For local development, you can use a file path
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

**Important**: The `FIREBASE_SERVICE_ACCOUNT` should be the entire JSON content as a single-line string.

### Step 3: For Production (Render, Heroku, etc.)

1. Go to your hosting platform's environment variables settings
2. Add a new variable: `FIREBASE_SERVICE_ACCOUNT`
3. Paste the entire service account JSON as the value
4. Save and redeploy

## How It Works

### Optional Authentication (`optionalAuth` middleware)

This middleware checks for authentication but doesn't require it:

```javascript
const { optionalAuth } = require('./middleware/authMiddleware');

// Route that works with or without authentication
router.get('/api/posts', optionalAuth, (req, res) => {
  // req.user will be populated if authenticated, null otherwise
  const user = req.user; // { uid, email, displayName, photoURL } or null
  // ... your logic
});
```

### Required Authentication (`requireAuth` middleware)

This middleware requires a valid authentication token:

```javascript
const { requireAuth } = require('./middleware/authMiddleware');

// Route that requires authentication
router.post('/api/protected', requireAuth, (req, res) => {
  // req.user is guaranteed to exist here
  const userId = req.user.uid;
  // ... your logic
});
```

## Frontend Integration

The frontend automatically sends authentication tokens when a user is logged in. No additional configuration needed!

The AuthContext in the frontend handles:
- Getting the Firebase ID token
- Sending it in the `Authorization` header
- Refreshing tokens when needed

## User Model

A User model has been created to store additional user data:

```javascript
{
  firebaseUid: String,        // Firebase UID
  email: String,              // User email
  displayName: String,        // Display name
  photoURL: String,           // Profile photo URL
  createdAt: Date,           // Account creation date
  lastLogin: Date,           // Last login timestamp
  preferences: {
    favoriteFighters: [],    // Array of fighter IDs
    notifications: Boolean   // Notification preference
  }
}
```

## Example Usage

### Protecting Forum Routes

```javascript
// routes/forums.js
const { requireAuth } = require('../middleware/authMiddleware');

// Create post (requires authentication)
router.post('/api/forums/:id/posts', requireAuth, async (req, res) => {
  const post = new ForumPost({
    ...req.body,
    author: req.user.uid,
    authorName: req.user.displayName
  });
  await post.save();
  res.json(post);
});
```

### Optional Authentication for Chat

```javascript
// sockets/chatSocket.js
const { optionalAuth } = require('../middleware/authMiddleware');

socket.on('chatMessage', (data) => {
  const userName = socket.user?.displayName || data.user || 'Guest';
  // ... handle message
});
```

## Testing

To test if Firebase Admin is working:

1. Check the server logs on startup:
   - ✅ `"Firebase Admin initialized successfully"`
   - ⚠️ `"Firebase Admin not initialized - authentication features disabled"`

2. Make a request to a protected route:
   - Without token: Should return 401 Unauthorized
   - With valid token: Should work normally

## Security Notes

- ⚠️ Never commit service account keys to version control
- ⚠️ Keep the `FIREBASE_SERVICE_ACCOUNT` environment variable secure
- ✅ The `.env` file is already in `.gitignore`
- ✅ Use environment variables for all sensitive data
- ✅ Rotate service account keys regularly in production

## Troubleshooting

### "Firebase Admin not initialized"
- This is normal if you haven't configured the service account
- The app will work without authentication features
- Add `FIREBASE_SERVICE_ACCOUNT` to enable authentication

### "Error initializing Firebase Admin"
- Check that your service account JSON is valid
- Ensure the entire JSON is on a single line in the environment variable
- Verify there are no extra quotes or escape characters

### "Invalid authentication token"
- The token might be expired (tokens expire after 1 hour)
- The frontend should automatically refresh tokens
- Check that the frontend and backend are using the same Firebase project

## Optional: Migrate Existing Data

If you have existing forum posts or chat messages without user associations:

```javascript
// scripts/migrate-users.js
// Add user associations to existing data
```

This is optional and only needed if you want to associate existing data with users.


