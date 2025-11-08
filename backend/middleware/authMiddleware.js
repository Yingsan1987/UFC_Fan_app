// Authentication middleware for Firebase
// This is optional - only validates if a token is provided
// Can be used to protect routes or just to get user info

const admin = require('firebase-admin');

// Initialize Firebase Admin (only if credentials are provided)
let firebaseInitialized = false;

try {
  // For production, use service account key from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized successfully');
  } else {
    console.log('Firebase Admin not initialized - authentication features disabled');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
}

// Optional authentication middleware - doesn't block requests without token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without user info
      req.user = null;
      return next();
    }

    if (!firebaseInitialized) {
      // Firebase not configured - continue without verification
      req.user = null;
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture
    };
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    req.user = null;
    next();
  }
};

// Required authentication middleware - blocks requests without valid token
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    if (!firebaseInitialized) {
      return res.status(500).json({ error: 'Authentication not configured' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture
    };
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = {
  optionalAuth,
  requireAuth,
  firebaseInitialized
};






