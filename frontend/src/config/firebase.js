import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Debug logging (remove in production)
try {
  console.log('🔥 Firebase Configuration Check:');
  console.log('API Key loaded:', firebaseConfig.apiKey !== 'your-api-key' ? '✅ YES' : '❌ NO (using fallback)');
  console.log('API Key value:', firebaseConfig.apiKey);
  console.log('Project ID:', firebaseConfig.projectId);

  if (firebaseConfig.apiKey === 'your-api-key') {
    console.error('❌ FIREBASE ERROR: Environment variables not loaded!');
    console.error('👉 Make sure you:');
    console.error('   1. Created .env file in frontend/ directory');
    console.error('   2. Added VITE_FIREBASE_API_KEY=... (NO quotes)');
    console.error('   3. Restarted your dev server (npm run dev)');
  }
} catch (err) {
  console.error('Error logging Firebase config:', err);
}

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.error('Check your Firebase configuration in .env file');
  // Create a fallback to prevent app from breaking
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

