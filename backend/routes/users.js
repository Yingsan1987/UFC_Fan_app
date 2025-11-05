const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('firebase-admin');

// Check if Firebase is already initialized by middleware
let firebaseInitialized = false;
if (admin.apps.length > 0) {
  firebaseInitialized = true;
  console.log('✅ Firebase Admin already initialized');
} else {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized in users route');
    }
  } catch (error) {
    console.log('⚠️  Firebase Admin not initialized - user profile features may be limited');
  }
}

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    if (!firebaseInitialized) {
      return res.status(500).json({ error: 'Authentication not configured' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// GET user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .populate('gameProgress')
      .select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check subscription status from Firebase custom claims if available
    let isPremium = false;
    if (firebaseInitialized) {
      try {
        const firebaseUser = await admin.auth().getUser(req.user.uid);
        isPremium = firebaseUser.customClaims?.stripeRole === 'premium' || false;
      } catch (error) {
        console.log('Could not fetch Firebase user claims:', error.message);
      }
    }

    res.json({
      ...user.toObject(),
      isPremium,
      subscriptionStatus: isPremium ? 'active' : 'free'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// UPDATE user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, profileImage, bio } = req.body;

    // Validate username
    if (username && (username.length < 3 || username.length > 20)) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    // Check if username is already taken
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        firebaseUid: { $ne: req.user.uid } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Validate bio length
    if (bio && bio.length > 200) {
      return res.status(400).json({ error: 'Bio must be 200 characters or less' });
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (profileImage) updateFields.profileImage = profileImage;
    if (bio !== undefined) updateFields.bio = bio;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      user,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET available profile images
router.get('/profile-images', (req, res) => {
  const profileImages = [
    { id: 'avatar1', url: '/images/avatars/avatar1.png', name: 'Fighter Red' },
    { id: 'avatar2', url: '/images/avatars/avatar2.png', name: 'Fighter Blue' },
    { id: 'avatar3', url: '/images/avatars/avatar3.png', name: 'Champion' },
    { id: 'avatar4', url: '/images/avatars/avatar4.png', name: 'Warrior' },
    { id: 'avatar5', url: '/images/avatars/avatar5.png', name: 'Legend' },
    { id: 'avatar6', url: '/images/avatars/avatar6.png', name: 'Master' }
  ];

  res.json(profileImages);
});

module.exports = router;

