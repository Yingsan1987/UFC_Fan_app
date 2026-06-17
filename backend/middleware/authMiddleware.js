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

    const token = authHeader.split('Bearer ')[1];

    // If Firebase Admin is configured, verify the token properly
    if (firebaseInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          admin: decodedToken.admin === true // custom claim, if set
        };

        console.log('✅ Token verified via Firebase Admin for user:', req.user.email);
        return next();
      } catch (error) {
        console.error('❌ Firebase token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    }

    // SECURITY: never trust an unverified token in production. If Firebase Admin
    // is not configured in prod, fail closed instead of decoding the token blind.
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 requireAuth: Firebase Admin not initialized in production — rejecting request. Set FIREBASE_SERVICE_ACCOUNT.');
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    // Fallback for LOCAL DEVELOPMENT ONLY: Extract user info from unverified token (JWT decode)
    // WARNING: This trusts the client token without verification. Only reached when NODE_ENV !== 'production'.
    console.warn('⚠️ Firebase Admin not configured - using unverified token (development mode only)');

    try {
      // Basic JWT decode (without verification)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      req.user = {
        uid: payload.user_id || payload.sub,
        email: payload.email,
        name: payload.name,
        displayName: payload.name,
        photoURL: payload.picture
      };
      
      console.log('✅ User info extracted from token (unverified):', req.user.email);
      next();
    } catch (decodeError) {
      console.error('❌ Could not decode token:', decodeError.message);
      return res.status(401).json({ error: 'Invalid token format' });
    }
  } catch (error) {
    console.error('Error in auth middleware:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Admin authorization middleware. MUST be chained after requireAuth so req.user is set.
// Grants access if the verified token carries an `admin: true` custom claim, or the
// user's uid/email is in the ADMIN_UIDS / ADMIN_EMAILS env allow-list (comma-separated).
const ADMIN_UIDS = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const requireAdmin = (req, res, next) => {
  const u = req.user;
  if (!u) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const isAdmin =
    u.admin === true ||
    (u.uid && ADMIN_UIDS.includes(u.uid)) ||
    (u.email && ADMIN_EMAILS.includes(String(u.email).toLowerCase()));

  if (!isAdmin) {
    console.warn(`⛔ Admin-only route blocked for ${u.email || u.uid}`);
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  return next();
};

module.exports = {
  optionalAuth,
  requireAuth,
  requireAdmin,
  firebaseInitialized
};






