# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the UFC Fan App.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

## Step 2: Enable Authentication

1. In the Firebase Console, go to **Authentication** from the left sidebar
2. Click **Get Started**
3. Enable the following sign-in methods:
   - **Email/Password**: Toggle to enable
   - **Google**: Toggle to enable and configure

## Step 3: Get Your Firebase Configuration

1. In the Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click on the **Web** icon `</>` to register a web app
5. Give your app a name (e.g., "UFC Fan App")
6. Copy the Firebase configuration object

## Step 4: Create Environment File

Create a `.env` file in the `frontend` directory with the following content:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API URL
VITE_APP_API_URL=https://ufc-fan-app-backend.onrender.com/api
```

Replace the placeholder values with your actual Firebase configuration values.

## Step 5: Configure Google Sign-In (Important!)

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Add your authorized domains:
   - `localhost` (for development)
   - Your production domain (e.g., `your-app.netlify.app`)
4. Save the configuration

## Step 6: Test the Authentication

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Click the "Sign In" button in the top right corner
3. Try creating an account with email/password
4. Try signing in with Google

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Keep your Firebase API keys secure
- Configure Firebase Security Rules in production

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Make sure your domain is added to the authorized domains list in Firebase Console
- Go to Authentication > Settings > Authorized domains

### "Firebase: Error (auth/operation-not-allowed)"
- Ensure Email/Password and Google sign-in methods are enabled in Firebase Console
- Go to Authentication > Sign-in method

### Environment variables not loading
- Make sure your `.env` file is in the `frontend` directory
- Restart your development server after creating/modifying `.env`
- In Vite, environment variables must be prefixed with `VITE_`

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)





