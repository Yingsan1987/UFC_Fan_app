import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signup(email, password, displayName) {
    if (!auth) throw new Error('Firebase Auth not initialized. Please configure .env file.');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    // Send email verification
    await sendEmailVerification(userCredential.user);
    return userCredential;
  }

  // Sign in with email and password
  function login(email, password) {
    if (!auth) throw new Error('Firebase Auth not initialized. Please configure .env file.');
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Sign in with Google
  function loginWithGoogle() {
    if (!auth || !googleProvider) throw new Error('Firebase Auth not initialized. Please configure .env file.');
    return signInWithPopup(auth, googleProvider);
  }

  // Sign out
  function logout() {
    if (!auth) throw new Error('Firebase Auth not initialized. Please configure .env file.');
    return signOut(auth);
  }

  // Reset password
  function resetPassword(email) {
    if (!auth) throw new Error('Firebase Auth not initialized. Please configure .env file.');
    return sendPasswordResetEmail(auth, email);
  }

  // Resend verification email
  async function resendVerificationEmail() {
    if (!auth) throw new Error('Firebase Auth not initialized. Please configure .env file.');
    if (!currentUser) throw new Error('No user logged in');
    return sendEmailVerification(currentUser);
  }

  useEffect(() => {
    // If Firebase auth is not initialized, just set loading to false
    if (!auth) {
      console.warn('⚠️ Firebase Auth not initialized - running without authentication');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    resendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


