# 🔐 UFC Fan App - Authentication System

## Overview

Your UFC Fan App now has a complete authentication system with the following features:

✅ **Email/Password Registration** - Users can create accounts with email and password  
✅ **Google Sign-In** - One-click login with Google account  
✅ **User Profile Display** - Shows user name and profile picture in header  
✅ **Secure Authentication** - Firebase Authentication for industry-standard security  
✅ **Persistent Sessions** - Users stay logged in across page refreshes  
✅ **Responsive Design** - Beautiful login modal and user menu  

## What's New

### Frontend Changes

1. **Login Button** - Located in the top-right corner of the header
2. **User Profile Menu** - Shows user info when logged in with logout option
3. **Authentication Modal** - Beautiful modal for login/signup with Google integration
4. **Auth Context** - Manages authentication state across the entire app
5. **Protected User Info** - Chat messages now show logged-in user's name

### Backend Changes

1. **Firebase Admin SDK** - Verifies authentication tokens (optional)
2. **Auth Middleware** - Protects routes and verifies users
3. **User Model** - Stores user preferences and data

## Quick Start

### 1️⃣ Frontend Setup (Required)

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Once created, click on your project

#### Step 2: Enable Authentication

1. In Firebase Console, click **Authentication** from sidebar
2. Click **Get Started**
3. Enable these sign-in methods:
   - ✅ **Email/Password** - Toggle to enable
   - ✅ **Google** - Toggle to enable

#### Step 3: Register Web App

1. In Firebase Console, click gear icon ⚙️ → **Project settings**
2. Scroll to **Your apps** section
3. Click the Web icon `</>`
4. Register app as "UFC Fan App"
5. Copy the Firebase configuration

#### Step 4: Create `.env` File

Create a file named `.env` in the `UFC_Fan_app/frontend` directory:

```bash
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Important**: Replace the values with your actual Firebase configuration from Step 3!

#### Step 5: Configure Authorized Domains

1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add your domains:
   - `localhost` (already there for development)
   - Your production domain (e.g., `your-app.netlify.app`)

#### Step 6: Test It Out!

```bash
cd UFC_Fan_app/frontend
npm run dev
```

Visit http://localhost:5173 and click **Sign In** in the top right!

### 2️⃣ Backend Setup (Optional)

The backend setup is **optional**. Your app works without it, but you can add it later for:
- Protected routes that require authentication
- User-specific data (favorites, preferences)
- Verified user identity in database

See `backend/AUTHENTICATION_SETUP.md` for backend configuration details.

## How to Use

### For Users

1. **Sign Up/Login**
   - Click "Sign In" button in top-right corner
   - Choose "Sign in with Google" or create account with email
   - Fill in required information

2. **User Profile**
   - Once logged in, see your profile picture/initial in top-right
   - Click to open dropdown menu
   - View your email and name
   - Click "Sign Out" to logout

3. **Features**
   - Chat messages now show your real name instead of "Guest"
   - Your session persists across page refreshes
   - Secure and private authentication

### For Developers

#### Check if User is Logged In

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    console.log('User is logged in:', currentUser.email);
    console.log('Display name:', currentUser.displayName);
    console.log('Photo URL:', currentUser.photoURL);
  }
  
  return <div>Hello {currentUser?.displayName || 'Guest'}</div>;
}
```

#### Add Login/Logout Functionality

```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { currentUser, login, logout, loginWithGoogle, signup } = useAuth();
  
  const handleEmailLogin = async (email, password) => {
    try {
      await login(email, password);
      console.log('Logged in!');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      console.log('Logged in with Google!');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logged out!');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
}
```

#### Protect Routes

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  return children;
}

// Usage in App.jsx
<Route 
  path="/protected" 
  element={
    <ProtectedRoute>
      <ProtectedPage />
    </ProtectedRoute>
  } 
/>
```

## File Structure

```
UFC_Fan_app/
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js          # Firebase configuration
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── components/
│   │   │   └── AuthModal.jsx        # Login/Signup modal
│   │   ├── App.jsx                  # Updated with auth UI
│   │   └── main.jsx                 # Wrapped with AuthProvider
│   ├── .env                         # ⚠️ CREATE THIS (not in git)
│   └── FIREBASE_SETUP.md           # Detailed frontend setup
│
└── backend/
    ├── middleware/
    │   └── authMiddleware.js        # Auth verification middleware
    ├── models/
    │   └── User.js                  # User database model
    └── AUTHENTICATION_SETUP.md     # Backend setup guide
```

## Security Best Practices

✅ **Environment Variables** - Never commit `.env` files  
✅ **HTTPS Only** - Use HTTPS in production  
✅ **Token Expiration** - Firebase tokens expire after 1 hour (auto-refreshed)  
✅ **Authorized Domains** - Only allow your domains in Firebase  
✅ **Input Validation** - Validate all user inputs  
✅ **Password Requirements** - Minimum 6 characters enforced  

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Add your domain to Authorized domains in Firebase Console

### "Firebase: Error (auth/operation-not-allowed)"
**Solution**: Enable Email/Password and Google sign-in methods in Firebase Console

### Environment variables not loading
**Solution**: 
- Ensure `.env` is in `frontend/` directory
- Restart dev server after creating `.env`
- Variables must start with `VITE_`

### Google Sign-In popup blocked
**Solution**: Allow popups for localhost in browser settings

### User profile not showing after login
**Solution**: Check browser console for errors, verify Firebase config

## Next Steps

🚀 **Enhance Your App**:
1. Add user favorites for fighters
2. Create user-specific predictions
3. Add profile page with settings
4. Enable email verification
5. Add password reset functionality
6. Create admin roles and permissions

## Support

For more help:
- 📖 [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- 📖 [Frontend Setup Guide](frontend/FIREBASE_SETUP.md)
- 📖 [Backend Setup Guide](backend/AUTHENTICATION_SETUP.md)

---

**Happy Coding! 🥊**

