const express = require('express');
const router = express.Router();
const PlaceholderFighter = require('../models/PlaceholderFighter');
const GameProgress = require('../models/GameProgress');
const TrainingSession = require('../models/TrainingSession');
const Fighter = require('../models/Fighter');
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

// Initialize game for a user (create placeholder fighter and game progress)
router.post('/initialize', requireAuth, async (req, res) => {
  try {
    console.log('🎮 Initialize game request received');
    console.log('User:', req.user);
    console.log('Body:', req.body);

    const firebaseUid = req.user.uid;
    const { weightClass } = req.body;

    if (!firebaseUid) {
      console.error('❌ No firebaseUid in request');
      return res.status(401).json({ message: 'Authentication failed - no user ID' });
    }

    // Check if user already has a game progress
    console.log('Checking if game already initialized...');
    let gameProgress = await GameProgress.findOne({ firebaseUid });
    
    if (gameProgress) {
      console.log('⚠️ Game already initialized');
      return res.status(400).json({ message: 'Game already initialized for this user' });
    }

    // Find or create user in database
    console.log('Finding or creating user...');
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      console.log('Creating new user in database...');
      user = new User({
        firebaseUid,
        email: req.user.email,
        displayName: req.user.name || req.user.email || 'Player'
      });
      await user.save();
      console.log('✅ User created:', user._id);
    } else {
      console.log('✅ User found:', user._id);
    }

    // Create placeholder fighter
    console.log('Creating placeholder fighter...');
    const placeholderFighter = new PlaceholderFighter({
      userId: user._id,
      firebaseUid,
      selectedWeightClass: weightClass || 'Lightweight'
    });
    await placeholderFighter.save();
    console.log('✅ Placeholder fighter created:', placeholderFighter._id);

    // Create game progress
    console.log('Creating game progress...');
    gameProgress = new GameProgress({
      userId: user._id,
      firebaseUid,
      currentFighter: {
        isPlaceholder: true,
        placeholderFighterId: placeholderFighter._id
      }
    });
    await gameProgress.save();
    console.log('✅ Game progress created:', gameProgress._id);

    // Update user with game progress reference
    user.gameProgress = gameProgress._id;
    await user.save();
    console.log('✅ User updated with game progress reference');

    console.log('🎉 Game initialization complete!');
    res.json({
      message: 'Game initialized successfully',
      placeholderFighter,
      gameProgress
    });
  } catch (error) {
    console.error('❌ Error initializing game:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's game status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const gameProgress = await GameProgress.findOne({ firebaseUid })
      .populate('currentFighter.placeholderFighterId')
      .populate('currentFighter.realFighterId');

    if (!gameProgress) {
      return res.json({ initialized: false });
    }

    const placeholderFighter = await PlaceholderFighter.findOne({ firebaseUid });
    
    // Refresh energy if needed
    if (placeholderFighter && !placeholderFighter.isTransferred) {
      placeholderFighter.refreshEnergy();
      await placeholderFighter.save();
    }

    res.json({
      initialized: true,
      gameProgress,
      placeholderFighter
    });
  } catch (error) {
    console.error('Error fetching game status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Perform training action
router.post('/train', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { trainingType } = req.body;

    const placeholderFighter = await PlaceholderFighter.findOne({ firebaseUid, isTransferred: false });
    
    if (!placeholderFighter) {
      return res.status(404).json({ message: 'No active placeholder fighter found' });
    }

    // Refresh energy
    placeholderFighter.refreshEnergy();

    // Check if user has energy
    if (placeholderFighter.energy <= 0) {
      return res.status(400).json({ 
        message: 'No energy remaining. Come back tomorrow!',
        energy: placeholderFighter.energy
      });
    }

    // Training type to attribute mapping
    const trainingMap = {
      bagWork: 'striking',
      grappleDrills: 'grappling',
      cardio: 'stamina',
      sparDefense: 'defense'
    };

    const attribute = trainingMap[trainingType];
    if (!attribute) {
      return res.status(400).json({ message: 'Invalid training type' });
    }

    // Random XP gain (1-3)
    const xpGained = Math.floor(Math.random() * 3) + 1;

    // Update stats (max 100)
    placeholderFighter.stats[attribute] = Math.min(100, placeholderFighter.stats[attribute] + xpGained);
    placeholderFighter.trainingSessions += 1;
    placeholderFighter.energy -= 1;
    await placeholderFighter.save();

    // Create training session record
    const user = await User.findOne({ firebaseUid });
    const trainingSession = new TrainingSession({
      userId: user._id,
      firebaseUid,
      placeholderFighterId: placeholderFighter._id,
      trainingType,
      attributeImproved: attribute,
      xpGained
    });
    await trainingSession.save();

    // Update game progress XP
    const gameProgress = await GameProgress.findOne({ firebaseUid });
    const leveledUp = gameProgress.addXP(xpGained * 10);
    await gameProgress.save();

    res.json({
      message: `Training complete! +${xpGained} ${attribute}`,
      xpGained,
      attribute,
      leveledUp,
      placeholderFighter,
      gameProgress
    });
  } catch (error) {
    console.error('Error during training:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available fighters for transfer (based on weight class and upcoming events)
router.get('/available-fighters', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const placeholderFighter = await PlaceholderFighter.findOne({ firebaseUid, isTransferred: false });

    if (!placeholderFighter) {
      return res.status(404).json({ message: 'No active placeholder fighter found' });
    }

    if (!placeholderFighter.isEligibleForTransfer()) {
      return res.status(400).json({ 
        message: 'Not eligible for transfer yet',
        progress: `${placeholderFighter.trainingSessions}/${placeholderFighter.trainingGoal}`
      });
    }

    // Get fighters from the selected weight class
    const fighters = await Fighter.find({ 
      division: placeholderFighter.selectedWeightClass,
      status: 'active'
    }).limit(20);

    res.json({
      weightClass: placeholderFighter.selectedWeightClass,
      fighters
    });
  } catch (error) {
    console.error('Error fetching available fighters:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Transfer to real fighter
router.post('/transfer', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { fighterId } = req.body;

    const placeholderFighter = await PlaceholderFighter.findOne({ firebaseUid, isTransferred: false });
    
    if (!placeholderFighter) {
      return res.status(404).json({ message: 'No active placeholder fighter found' });
    }

    if (!placeholderFighter.isEligibleForTransfer()) {
      return res.status(400).json({ message: 'Not eligible for transfer yet' });
    }

    // Verify fighter exists and is in correct weight class
    const fighter = await Fighter.findById(fighterId);
    if (!fighter) {
      return res.status(404).json({ message: 'Fighter not found' });
    }

    if (fighter.division !== placeholderFighter.selectedWeightClass) {
      return res.status(400).json({ message: 'Fighter not in selected weight class' });
    }

    // Mark placeholder as transferred
    placeholderFighter.isTransferred = true;
    placeholderFighter.transferredTo = fighterId;
    await placeholderFighter.save();

    // Update game progress
    const gameProgress = await GameProgress.findOne({ firebaseUid });
    gameProgress.currentFighter = {
      isPlaceholder: false,
      placeholderFighterId: placeholderFighter._id,
      realFighterId: fighterId
    };
    gameProgress.fanCorn += 100; // Bonus for completing training
    await gameProgress.save();

    res.json({
      message: `Successfully transferred to ${fighter.name}!`,
      fighter,
      gameProgress
    });
  } catch (error) {
    console.error('Error during transfer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get training history
router.get('/training-history', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const limit = parseInt(req.query.limit) || 20;

    const trainingSessions = await TrainingSession.find({ firebaseUid })
      .sort({ completedAt: -1 })
      .limit(limit);

    res.json(trainingSessions);
  } catch (error) {
    console.error('Error fetching training history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await GameProgress.find()
      .sort({ prestige: -1 })
      .limit(50)
      .populate('userId', 'displayName photoURL')
      .select('userId totalXP level totalWins totalLosses prestige fanCorn');

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

