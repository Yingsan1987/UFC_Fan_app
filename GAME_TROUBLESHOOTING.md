# 🔧 Game System Troubleshooting Guide

## Issue: "Start Your Journey" Button Does Nothing

### ✅ FIXED Issues

The following issues have been resolved:

1. **Incorrect Middleware Name** - Changed from `verifyToken` to `requireAuth`
2. **Missing Error Logging** - Added comprehensive console logs
3. **Poor Error Messages** - Improved user-facing error messages

---

## 🔍 How to Diagnose Issues

### Step 1: Check Browser Console

Open your browser's developer tools (F12) and look for console messages:

**Expected Success Flow:**
```
🎮 Initializing game... {selectedWeightClass: 'Lightweight', currentUser: {...}}
🔑 Getting auth token...
✅ Token received
📡 Making API call to: http://localhost:5000/api/game/initialize
✅ Game initialized successfully: {...}
```

**Common Error Messages:**

#### Error: "Please sign in to start the game"
**Cause:** No user logged in
**Solution:** Sign in with Firebase authentication first

#### Error: "Authentication not configured"
**Cause:** Firebase not set up properly
**Solution:** 
1. Check `frontend/.env` has Firebase config
2. Check `backend/.env` has `FIREBASE_SERVICE_ACCOUNT`

#### Error: "Cannot connect to server"
**Cause:** Backend not running
**Solution:**
```bash
cd UFC_Fan_app/backend
npm start
```

#### Error: "Authentication failed - no user ID"
**Cause:** Invalid Firebase token
**Solution:** Sign out and sign in again

---

### Step 2: Check Backend Console

Your backend server should show these logs:

**Expected Success Flow:**
```
🎮 Initialize game request received
User: { uid: 'abc123', email: 'user@example.com', ... }
Body: { weightClass: 'Lightweight' }
Checking if game already initialized...
Finding or creating user...
✅ User found: 507f1f77bcf86cd799439011
Creating placeholder fighter...
✅ Placeholder fighter created: 507f191e810c19729de860ea
Creating game progress...
✅ Game progress created: 507f191e810c19729de860eb
✅ User updated with game progress reference
🎉 Game initialization complete!
```

**Common Backend Errors:**

#### Error: "Authentication not configured"
**Cause:** Missing `FIREBASE_SERVICE_ACCOUNT` in backend `.env`
**Solution:** Add Firebase Admin SDK credentials

#### Error: "MongoError: connection refused"
**Cause:** MongoDB not running or wrong connection string
**Solution:** 
1. Check MongoDB is running
2. Verify `MONGODB_URI` in `.env`

---

### Step 3: Verify Prerequisites

#### ✅ Checklist

- [ ] Backend server is running (`npm start` in `backend/`)
- [ ] Frontend is running (`npm run dev` in `frontend/`)
- [ ] User is signed in (check top-right corner)
- [ ] MongoDB is connected
- [ ] Firebase is configured (both frontend and backend)
- [ ] No console errors in browser
- [ ] Backend shows no errors in terminal

---

## 🚨 Common Issues and Solutions

### Issue 1: Button Click Does Nothing (No Console Logs)

**Symptoms:** Click button, nothing happens at all

**Possible Causes:**
1. JavaScript error elsewhere on page
2. Event handler not attached
3. Button disabled

**Solution:**
```javascript
// Check in browser console:
console.log('Game component loaded?', document.querySelector('[class*="Game"]'));
```

---

### Issue 2: "Game already initialized" Error

**Symptoms:** Error message saying game already exists

**Cause:** You already created a game!

**Solution:**
- The game is already set up
- Reload the page to see the training screen
- OR delete your game data in MongoDB to start fresh:
```javascript
// In MongoDB shell or Compass:
db.gameprogresses.deleteOne({ firebaseUid: "YOUR_FIREBASE_UID" })
db.placeholderfighters.deleteOne({ firebaseUid: "YOUR_FIREBASE_UID" })
```

---

### Issue 3: Network Error / CORS Error

**Symptoms:** Browser console shows CORS or network error

**Possible Causes:**
1. Backend not running
2. Wrong API URL
3. CORS not configured

**Solution:**

1. **Check backend is running:**
```bash
curl http://localhost:5000/api/health
```

2. **Verify API URL in frontend `.env`:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

3. **Check CORS in backend `server.js`:**
```javascript
app.use(cors({
  origin: '*', // or specify your frontend URL
  credentials: true
}));
```

---

### Issue 4: Firebase Authentication Error

**Symptoms:** "Firebase Auth not initialized" or "getAuthToken is not a function"

**Solution:**

1. **Check Firebase config in `frontend/.env`:**
```
REACT_APP_FIREBASE_API_KEY=your_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
# ... etc
```

2. **Check `frontend/src/config/firebase.js` exists and exports auth:**
```javascript
export const auth = getAuth(app);
```

3. **Verify AuthContext has getAuthToken:**
```javascript
// Should be in AuthContext.jsx
async function getAuthToken() {
  if (!currentUser) throw new Error('No user logged in');
  return currentUser.getIdToken();
}
```

---

### Issue 5: Backend Authentication Error

**Symptoms:** 401 Unauthorized or 500 Authentication not configured

**Solution:**

1. **Set up Firebase Admin SDK credentials:**

Create a service account in Firebase Console:
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file

2. **Add to backend `.env`:**
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

OR set it as environment variable (preferred for production)

---

## 🧪 Testing the Fix

### Quick Test Script

1. **Open browser console** (F12)
2. **Run this:**
```javascript
// Check if game component is loaded
const gameElement = document.querySelector('[class*="max-w-4xl"]');
console.log('Game UI loaded:', !!gameElement);

// Check if user is logged in
const userButton = document.querySelector('[class*="flex items-center gap-2"]');
console.log('User logged in:', !!userButton);
```

3. **Click "Start Your Journey"**
4. **Watch console for logs**

---

## 📊 Debug Mode

To see all debug logs, add this to your frontend code temporarily:

```javascript
// In Game.jsx, at the top of the component:
console.log('🔍 DEBUG - Game Component State:', {
  currentUser,
  gameStatus,
  loading,
  actionLoading,
  selectedWeightClass
});
```

---

## 🆘 Still Not Working?

### Collect Debug Information

1. **Browser Console Output** - Copy all logs
2. **Backend Console Output** - Copy all server logs
3. **Network Tab** - Check the request to `/api/game/initialize`
4. **Firebase Config** - Verify API keys are set

### Create Test Request

Try initializing the game manually with curl:

```bash
# Get your Firebase token first
# (From browser console: await firebase.auth().currentUser.getIdToken())

curl -X POST http://localhost:5000/api/game/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN_HERE" \
  -d '{"weightClass":"Lightweight"}'
```

Expected response:
```json
{
  "message": "Game initialized successfully",
  "placeholderFighter": { ... },
  "gameProgress": { ... }
}
```

---

## 📝 Environment Variables Checklist

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ufc_fan_app
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
NODE_ENV=development
```

---

## ✅ Verification Steps

After fixing issues, verify everything works:

1. ✅ Click "Start Your Journey"
2. ✅ See success message
3. ✅ Page transitions to training screen
4. ✅ See stats bars and energy counter
5. ✅ Training sessions work

---

## 🔄 Reset Everything (Nuclear Option)

If all else fails, reset and start fresh:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Clear MongoDB game data
mongo
use ufc_fan_app
db.gameprogresses.deleteMany({})
db.placeholderfighters.deleteMany({})
db.trainingsessions.deleteMany({})

# 3. Clear browser cache and localStorage
# (In browser console)
localStorage.clear()

# 4. Restart backend
cd backend
npm start

# 5. Restart frontend
cd frontend
npm run dev

# 6. Sign out and sign in again
# 7. Try "Start Your Journey"
```

---

## 📞 Getting Help

If you're still stuck:

1. Check the browser console logs
2. Check the backend terminal logs
3. Review [GAME_SYSTEM_DOCUMENTATION.md](GAME_SYSTEM_DOCUMENTATION.md)
4. Use the Support page in the app

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.1 (with fixes)




