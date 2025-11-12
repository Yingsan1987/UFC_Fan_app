const express = require('express');
const router = express.Router();
const RookieFighter = require('../models/RookieFighter');
const GameProgress = require('../models/GameProgress');
const TrainingSession = require('../models/TrainingSession');
const Fighter = require('../models/Fighter');
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');
const { createFuzzyFinder } = require('../utils/nameMatcher');

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

    // Create Rookie Fighter
    console.log('Creating Rookie Fighter...');
    const rookieFighter = new RookieFighter({
      userId: user._id,
      firebaseUid,
      selectedWeightClass: weightClass || 'Lightweight'
    });
    await rookieFighter.save();
    console.log('✅ Rookie Fighter created:', rookieFighter._id);

    // Create game progress
    console.log('Creating game progress...');
    gameProgress = new GameProgress({
      userId: user._id,
      firebaseUid,
      currentFighter: {
        isRookie: true,
        rookieFighterId: rookieFighter._id
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
      rookieFighter,
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
      .populate('currentFighter.rookieFighterId')
      .populate('currentFighter.realFighterId');

    if (!gameProgress) {
      return res.json({ initialized: false });
    }

    let rookieFighter = await RookieFighter.findOne({ firebaseUid });
    
    // If game is initialized but no rookieFighter exists, create one (data recovery)
    if (!rookieFighter && gameProgress) {
      console.log('⚠️ Game initialized but no RookieFighter found. Creating new RookieFighter...');
      
      // Find or create user
      let user = await User.findOne({ firebaseUid });
      if (!user) {
        user = new User({
          firebaseUid,
          email: req.user.email,
          displayName: req.user.name || req.user.email || 'Player'
        });
        await user.save();
      }
      
      rookieFighter = new RookieFighter({
        userId: user._id,
        firebaseUid,
        selectedWeightClass: 'Lightweight',
        energy: 3,
        lastEnergyRefresh: new Date()
      });
      await rookieFighter.save();
      console.log('✅ RookieFighter created for existing game');
    }
    
    // Refresh energy if needed (for non-transferred fighters)
    if (rookieFighter && !rookieFighter.isTransferred) {
      const wasRefreshed = rookieFighter.refreshEnergy();
      if (wasRefreshed) {
        await rookieFighter.save();
        console.log('✅ Energy refreshed for user');
      }
    }

    res.json({
      initialized: true,
      gameProgress,
      rookieFighter
    });
  } catch (error) {
    console.error('Error fetching game status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin/Test Account with Unlimited Energy
const ADMIN_TESTER_EMAIL = 'yingsan1987@gmail.com';

// Perform training action
router.post('/train', requireAuth, async (req, res) => {
  try {
    console.log('🎮 Training request received');
    console.log('User:', req.user);
    
    const firebaseUid = req.user.uid;
    const { trainingType, xpGained } = req.body;
    
    // Check if this is admin tester account
    const isAdminTester = req.user.email === ADMIN_TESTER_EMAIL;
    console.log('🔑 Is Admin Tester:', isAdminTester, '(email:', req.user.email, ')');

    let rookieFighter = await RookieFighter.findOne({ firebaseUid, isTransferred: false });
    
    // If no rookieFighter exists, create one (data recovery)
    if (!rookieFighter) {
      console.log('⚠️ No RookieFighter found during training. Creating new RookieFighter...');
      console.log('Firebase UID:', firebaseUid);
      console.log('User email:', req.user.email);
      
      // Check if game is initialized
      const gameProgress = await GameProgress.findOne({ firebaseUid });
      if (!gameProgress) {
        console.log('❌ No game progress found for this user');
        return res.status(404).json({ message: 'Game not initialized. Please initialize the game first.' });
      }
      console.log('✅ Game progress found:', gameProgress._id);
      
      // Find or create user
      let user = await User.findOne({ firebaseUid });
      if (!user) {
        console.log('📝 Creating new user in database...');
        console.log('User data:', { firebaseUid, email: req.user.email, displayName: req.user.displayName || req.user.name });
        user = new User({
          firebaseUid,
          email: req.user.email,
          displayName: req.user.displayName || req.user.name || req.user.email || 'Player'
        });
        await user.save();
        console.log('✅ User created:', user._id);
      } else {
        console.log('✅ User found:', user._id);
      }
      
      rookieFighter = new RookieFighter({
        userId: user._id,
        firebaseUid,
        selectedWeightClass: 'Lightweight',
        energy: 3,
        lastEnergyRefresh: new Date()
      });
      await rookieFighter.save();
      console.log('✅ RookieFighter created for training:', rookieFighter._id);
    }

    // Double-check rookieFighter exists after creation attempt
    if (!rookieFighter) {
      console.error('❌ CRITICAL: RookieFighter still null after creation attempt!');
      return res.status(500).json({ message: 'Failed to create or retrieve RookieFighter' });
    }
    
    console.log('✅ RookieFighter ready for training');
    console.log('Fighter energy:', rookieFighter.energy);
    console.log('Fighter sessions:', rookieFighter.trainingSessions);

    // Refresh energy and save if it was refreshed (skip for admin tester)
    if (!isAdminTester) {
      const wasRefreshed = rookieFighter.refreshEnergy();
      if (wasRefreshed) {
        await rookieFighter.save();
        console.log('✅ Energy refreshed to 3 for new day');
      }
    }

    console.log(`⚡ Current energy before training: ${rookieFighter.energy}`);
    console.log(`🔑 Is Admin Tester: ${isAdminTester}`);

    // Check if user has energy (skip check for admin tester)
    if (!isAdminTester && rookieFighter.energy <= 0) {
      return res.status(400).json({ 
        message: 'No energy remaining. Come back tomorrow!',
        energy: rookieFighter.energy
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

    // Use XP from mini-game or default random (1-3)
    const statGained = xpGained || Math.floor(Math.random() * 3) + 1;
    
    // Validate XP is within reasonable range (1-10 for critical hits)
    const validatedXP = Math.max(1, Math.min(10, statGained));

    console.log(`🎮 Mini-game XP gained: ${validatedXP} for ${attribute}`);

    // Update stats (max 100)
    rookieFighter.stats[attribute] = Math.min(100, rookieFighter.stats[attribute] + validatedXP);
    rookieFighter.trainingSessions += 1;
    
    // Reduce energy (skip for admin tester)
    if (!isAdminTester) {
      rookieFighter.energy -= 1;
      console.log(`⚡ Energy after training: ${rookieFighter.energy}`);
    } else {
      console.log(`⚡ Admin Tester - Energy unchanged: ${rookieFighter.energy}`);
    }
    
    // Save the updated fighter
    await rookieFighter.save();
    console.log(`✅ Fighter saved with energy: ${rookieFighter.energy}`);

    // Create training session record
    const user = await User.findOne({ firebaseUid });
    const trainingSession = new TrainingSession({
      userId: user._id,
      firebaseUid,
      rookieFighterId: rookieFighter._id,
      trainingType,
      attributeImproved: attribute,
      xpGained: validatedXP
    });
    await trainingSession.save();

    // Update game progress
    const gameProgress = await GameProgress.findOne({ firebaseUid });
    await gameProgress.save();

    console.log('📤 Sending response with updated data...');
    console.log('Response rookieFighter energy:', rookieFighter.energy);
    console.log('Response rookieFighter sessions:', rookieFighter.trainingSessions);
    
    res.json({
      message: `Training complete! +${validatedXP} ${attribute}. Energy: ${rookieFighter.energy}/3`,
      statGained: validatedXP,
      attribute,
      rookieFighter,
      gameProgress
    });
    
    console.log('✅ Training response sent successfully');
  } catch (error) {
    console.error('❌ Error during training:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message || 'Server error', error: error.message });
  }
});

// Get available fighters for transfer (based on weight class and upcoming events)
router.get('/available-fighters', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const rookieFighter = await RookieFighter.findOne({ firebaseUid, isTransferred: false });

    if (!rookieFighter) {
      return res.status(404).json({ message: 'No active Rookie Fighter found' });
    }

    if (!rookieFighter.isEligibleForTransfer()) {
      return res.status(400).json({ 
        message: 'Not eligible for transfer yet',
        progress: `${rookieFighter.trainingSessions}/${rookieFighter.trainingGoal}`
      });
    }

    // Get fighters from the selected weight class
    const fighters = await Fighter.find({ 
      division: rookieFighter.selectedWeightClass,
      status: 'active'
    }).limit(20);

    res.json({
      weightClass: rookieFighter.selectedWeightClass,
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

    const rookieFighter = await RookieFighter.findOne({ firebaseUid, isTransferred: false });
    
    if (!rookieFighter) {
      return res.status(404).json({ message: 'No active Rookie Fighter found' });
    }

    if (!rookieFighter.isEligibleForTransfer()) {
      return res.status(400).json({ message: 'Not eligible for transfer yet' });
    }

    // Verify fighter exists and is in correct weight class
    const fighter = await Fighter.findById(fighterId);
    if (!fighter) {
      return res.status(404).json({ message: 'Fighter not found' });
    }

    if (fighter.division !== rookieFighter.selectedWeightClass) {
      return res.status(400).json({ message: 'Fighter not in selected weight class' });
    }

    // Mark Rookie Fighter as transferred
    rookieFighter.isTransferred = true;
    rookieFighter.transferredTo = fighterId;
    await rookieFighter.save();

    // Update game progress
    const gameProgress = await GameProgress.findOne({ firebaseUid });
    gameProgress.currentFighter = {
      isRookie: false,
      rookieFighterId: rookieFighter._id,
      realFighterId: fighterId
    };
    gameProgress.fanCoin += 3; // Bonus for completing training
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

// Get upcoming fights filtered by weight class
router.get('/upcoming-fights/:weightClass', async (req, res) => {
  try {
    const { weightClass } = req.params;
    console.log(`🎯 Fetching upcoming fights for weight class: ${weightClass}`);
    
    const UpcomingEvent = require('../models/UpcomingEvent');
    const FighterImages = require('../models/FighterImages');
    
    // Fetch all upcoming events
    const upcomingFights = await UpcomingEvent.find({
      weight_class: weightClass
    });
    
    console.log(`✅ Found ${upcomingFights.length} fights in ${weightClass}`);
    
    // Fetch fighter images
    const fighterImages = await FighterImages.find();
    const findImage = createFuzzyFinder(
      fighterImages
        .filter((img) => img?.name && (img?.image_url || img?.image_path))
        .map((img) => ({
          name: img.name,
          value: img.image_url || img.image_path,
        }))
    );
    
    // Group fights by event and format
    const eventMap = {};
    upcomingFights.forEach(fight => {
      const eventKey = fight.event_title || 'Unknown Event';
      
      if (!eventMap[eventKey]) {
        eventMap[eventKey] = {
          eventName: fight.event_title,
          eventDate: fight.event_date,
          location: fight.event_location,
          eventLink: fight.event_link,
          fights: []
        };
      }
      
      const redFighterName = fight.red_fighter?.name || '';
      const blueFighterName = fight.blue_fighter?.name || '';
      
      eventMap[eventKey].fights.push({
        _id: fight._id,
        fighter1: redFighterName,
        fighter2: blueFighterName,
        fighter1Image: findImage(redFighterName),
        fighter2Image: findImage(blueFighterName),
        redProfileLink: fight.red_fighter?.profile_link,
        blueProfileLink: fight.blue_fighter?.profile_link,
        weightClass: fight.weight_class,
        // Store fight data for registration
        fightData: {
          eventTitle: fight.event_title,
          eventDate: fight.event_date,
          eventLocation: fight.event_location,
          redFighter: fight.red_fighter,
          blueFighter: fight.blue_fighter
        }
      });
    });
    
    // Convert to array and sort by date
    const events = Object.values(eventMap).sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      return dateA - dateB;
    });
    
    res.json({
      weightClass,
      totalFights: upcomingFights.length,
      events
    });
  } catch (error) {
    console.error('❌ Error fetching upcoming fights:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register user to a live UFC fighter
router.post('/register-fighter', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { fightId, selectedFighterSide } = req.body; // 'red' or 'blue'
    
    console.log('🎯 Fighter registration request:', { firebaseUid, fightId, selectedFighterSide });
    
    const UpcomingEvent = require('../models/UpcomingEvent');
    
    // Get user's rookie fighter and game progress
    const rookieFighter = await RookieFighter.findOne({ firebaseUid });
    const gameProgress = await GameProgress.findOne({ firebaseUid });
    
    if (!rookieFighter) {
      return res.status(404).json({ message: 'No rookie fighter found' });
    }
    
    // Check if eligible (12 training sessions completed)
    if (!rookieFighter.isEligibleForTransfer()) {
      return res.status(400).json({ 
        message: 'Not eligible yet. Complete 12 training sessions first.',
        currentSessions: rookieFighter.trainingSessions,
        requiredSessions: rookieFighter.trainingGoal
      });
    }
    
    // Check if already transferred
    if (rookieFighter.isTransferred) {
      return res.status(400).json({ message: 'Already transferred to a real fighter' });
    }
    
    // Get the fight details
    const fight = await UpcomingEvent.findById(fightId);
    if (!fight) {
      return res.status(404).json({ message: 'Fight not found' });
    }
    
    // Verify weight class matches
    if (fight.weight_class !== rookieFighter.selectedWeightClass) {
      return res.status(400).json({ 
        message: 'Fighter weight class does not match your selected weight class' 
      });
    }
    
    // Get selected fighter details
    const selectedFighter = selectedFighterSide === 'red' ? fight.red_fighter : fight.blue_fighter;
    const opponentFighter = selectedFighterSide === 'red' ? fight.blue_fighter : fight.red_fighter;
    
    // Update rookie fighter with registration
    rookieFighter.registeredFight = {
      fightId: fight._id,
      eventTitle: fight.event_title,
      eventDate: fight.event_date,
      eventLocation: fight.event_location,
      selectedFighter: selectedFighter,
      opponentFighter: opponentFighter,
      selectedSide: selectedFighterSide,
      registeredAt: new Date()
    };
    
    await rookieFighter.save();
    
    // Update game progress
    if (gameProgress) {
      gameProgress.pendingFight = {
        fightId: fight._id,
        selectedFighter: selectedFighter.name,
        eventTitle: fight.event_title,
        eventDate: fight.event_date
      };
      await gameProgress.save();
    }
    
    console.log(`✅ User registered to ${selectedFighter.name} vs ${opponentFighter.name}`);
    
    res.json({
      message: `Successfully registered to ${selectedFighter.name}!`,
      fight: {
        eventTitle: fight.event_title,
        eventDate: fight.event_date,
        selectedFighter: selectedFighter.name,
        opponent: opponentFighter.name,
        weightClass: fight.weight_class
      },
      rookieFighter,
      gameProgress
    });
  } catch (error) {
    console.error('❌ Error registering fighter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

