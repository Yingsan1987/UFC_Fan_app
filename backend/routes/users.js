const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('firebase-admin');
const { requireAuth } = require('../middleware/authMiddleware');

// Check if Firebase Admin is initialized
const firebaseInitialized = admin.apps.length > 0;

// GET user profile
router.get('/profile', requireAuth, async (req, res) => {
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
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { displayName, username, profileImage, bio } = req.body;

    // Validate displayName
    if (displayName && (displayName.length < 2 || displayName.length > 30)) {
      return res.status(400).json({ error: 'Display name must be between 2 and 30 characters' });
    }

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
    if (displayName) updateFields.displayName = displayName;
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

