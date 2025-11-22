const express = require('express');
const router = express.Router();
const TrainToUFCAvatar = require('../models/TrainToUFCAvatar');
const Train = require('../models/Train');
const { requireAuth } = require('../middleware/authMiddleware');
const { calculateFight, canFight } = require('../utils/fightEngine');

// Get socket.io instance for real-time updates
let trainSocketNamespace = null;
function setTrainSocketNamespace(namespace) {
  trainSocketNamespace = namespace;
}
module.exports.setTrainSocketNamespace = setTrainSocketNamespace;

// Get game status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    
    const avatar = await TrainToUFCAvatar.findOne({ firebaseUid });
    
    if (!avatar) {
      return res.status(404).json({ message: 'No avatar found. Create one first.' });
    }
    
    let train = null;
    if (avatar.onTrain && avatar.trainId) {
      train = await Train.findById(avatar.trainId)
        .populate('cars.spot1.avatarId', 'name stats outfitColor')
        .populate('cars.spot2.avatarId', 'name stats outfitColor');
    }
    
    res.json({ avatar, train });
  } catch (error) {
    console.error('Error fetching train to UFC status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create avatar
router.post('/create-avatar', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { name, skinColor, hairColor, hairStyle, outfitColor, stats } = req.body;
    
    // Check if avatar already exists
    const existingAvatar = await TrainToUFCAvatar.findOne({ firebaseUid });
    if (existingAvatar) {
      return res.status(400).json({ message: 'Avatar already exists for this user' });
    }
    
    // Find or create user
    const User = require('../models/User');
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = new User({
        firebaseUid,
        email: req.user.email,
        displayName: req.user.name || req.user.email || 'Player'
      });
      await user.save();
    }
    
    // Create avatar
    const avatar = new TrainToUFCAvatar({
      userId: user._id,
      firebaseUid,
      name: name || 'Fighter',
      skinColor: skinColor || '#fdbcb4',
      hairColor: hairColor || '#8B4513',
      hairStyle: hairStyle || 'short',
      outfitColor: outfitColor || '#DC143C',
      stats: stats || {
        striking: 50,
        speed: 50,
        stamina: 50,
        grappling: 50,
        luck: 50,
        defense: 50
      },
      weightClass: req.body.weightClass || 'Lightweight'
    });
    
    await avatar.save();
    
    res.json({ avatar, message: 'Avatar created successfully!' });
  } catch (error) {
    console.error('Error creating avatar:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join train (user joins queue)
router.post('/join', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    
    const avatar = await TrainToUFCAvatar.findOne({ firebaseUid });
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found. Create one first.' });
    }
    
    if (avatar.onTrain) {
      return res.status(400).json({ message: 'Already on train!' });
    }
    
    if (avatar.eliminated) {
      return res.status(400).json({ message: 'You have been eliminated! Cannot join train.' });
    }
    
    // Find active train or create new one
    let train = await Train.findOne({ isActive: true });
    
    if (!train || train.occupiedSpots >= train.totalSpots) {
      // Create new train
      train = new Train({
        maxCars: 10,
        currentCarCount: 10,
        totalSpots: 20,
        cars: Array.from({ length: 10 }, (_, i) => ({
          carNumber: i + 1,
          spot1: { occupied: false, avatarId: null },
          spot2: { occupied: false, avatarId: null }
        }))
      });
      await train.save();
    }
    
    // Find available spot
    const spot = train.findAvailableSpot();
    if (!spot) {
      return res.status(400).json({ message: 'Train is full! Wait for next train.' });
    }
    
    // Assign avatar to spot
    const carIndex = spot.carNumber - 1;
    const spotKey = spot.spotNumber === 1 ? 'spot1' : 'spot2';
    
    train.cars[carIndex][spotKey].avatarId = avatar._id;
    train.cars[carIndex][spotKey].occupied = true;
    train.occupiedSpots += 1;
    
    avatar.onTrain = true;
    avatar.trainId = train._id;
    avatar.carNumber = spot.carNumber;
    avatar.spotNumber = spot.spotNumber;
    
    await train.save();
    await avatar.save();
    
  // Check if car is full and trigger fight (only if same weight class)
  if (train.isCarFull(spot.carNumber)) {
    const car = train.cars[carIndex];
    const fighter1 = await TrainToUFCAvatar.findById(car.spot1.avatarId);
    const fighter2 = await TrainToUFCAvatar.findById(car.spot2.avatarId);
    
    // Check if they can fight
    const fightCheck = canFight(fighter1, fighter2);
    if (fightCheck.canFight) {
      await triggerCarFight(train, spot.carNumber);
    } else {
      // Remove one fighter (the one that just joined if mismatch)
      car.spot2.occupied = false;
      car.spot2.avatarId = null;
      train.occupiedSpots -= 1;
      avatar.onTrain = false;
      avatar.trainId = null;
      avatar.carNumber = null;
      avatar.spotNumber = null;
      await train.save();
      await avatar.save();
      return res.status(400).json({ 
        message: `Cannot place fighter: ${fightCheck.reason}`,
        reason: fightCheck.reason
      });
    }
  }
    
    // Populate train data with all fighter info
    await train.populate('cars.spot1.avatarId', 'name stats outfitColor weightClass wins losses');
    await train.populate('cars.spot2.avatarId', 'name stats outfitColor weightClass wins losses');
    
    // Broadcast train update via Socket.io (if socket is initialized)
    try {
      const trainSocketModule = require('../sockets/trainSocket');
      if (trainSocketModule && typeof trainSocketModule.getHelpers === 'function') {
        const helpers = trainSocketModule.getHelpers();
        if (helpers && helpers.broadcastTrainUpdate) {
          helpers.broadcastTrainUpdate(train._id.toString(), {
            type: 'fighter-joined',
            avatarId: avatar._id.toString(),
            carNumber: spot.carNumber,
            spotNumber: spot.spotNumber
          });
        }
      }
    } catch (error) {
      // Socket might not be initialized yet - that's okay
      console.warn('Could not broadcast train update via socket:', error.message);
    }
    
    res.json({ train, avatar, message: 'Joined train successfully!' });
  } catch (error) {
    console.error('Error joining train:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Simulate fight (POST /api/train-to-ufc/fight)
router.post('/fight', requireAuth, async (req, res) => {
  try {
    const { trainId, carNumber } = req.body;
    const firebaseUid = req.user.uid;
    
    if (!trainId || !carNumber) {
      return res.status(400).json({ message: 'Train ID and car number required' });
    }
    
    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    
    const fightResult = await triggerCarFight(train, carNumber);
    
    if (!fightResult) {
      return res.status(400).json({ message: 'Cannot trigger fight - conditions not met' });
    }
    
    res.json({ 
      message: 'Fight completed',
      result: fightResult
    });
  } catch (error) {
    console.error('Error simulating fight:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Trigger fight in a car (when both spots are filled)
async function triggerCarFight(train, carNumber) {
  const carIndex = carNumber - 1;
  const car = train.cars[carIndex];
  
  if (!car.spot1.occupied || !car.spot2.occupied || car.isFighting) {
    return null;
  }
  
  car.isFighting = true;
  await train.save();
  
  // Get both avatars
  const avatar1 = await TrainToUFCAvatar.findById(car.spot1.avatarId);
  const avatar2 = await TrainToUFCAvatar.findById(car.spot2.avatarId);
  
  if (!avatar1 || !avatar2) {
    car.isFighting = false;
    await train.save();
    return null;
  }
  
  // Check if they can fight (same weight class)
  const fightCheck = canFight(avatar1, avatar2);
  if (!fightCheck.canFight) {
    car.isFighting = false;
    await train.save();
    throw new Error(fightCheck.reason);
  }
  
  // Calculate fight outcome using fight engine
  const fightResult = calculateFight(avatar1, avatar2);
  
  // Update car fight result
  car.fightResult = {
    winner: fightResult.winner._id,
    loser: fightResult.loser._id,
    foughtAt: new Date()
  };
  car.isFighting = false;
  
  // Get winner and loser avatars
  const winner = avatar1._id.toString() === fightResult.winner._id.toString() ? avatar1 : avatar2;
  const loser = avatar1._id.toString() === fightResult.loser._id.toString() ? avatar1 : avatar2;
  
  // Eliminate loser
  loser.eliminated = true;
  loser.onTrain = false;
  loser.trainId = null;
  loser.carNumber = null;
  loser.spotNumber = null;
  loser.losses += 1;
  loser.currentStreak = 0;
  loser.xp += fightResult.loser.xpGained;
  
  // Update winner
  winner.wins += 1;
  winner.currentStreak += 1;
  if (winner.currentStreak > winner.longestStreak) {
    winner.longestStreak = winner.currentStreak;
  }
  winner.xp += fightResult.winner.xpGained;
  winner.coins += 10; // Base reward
  winner.trainTokens += 1;
  
  // Level up check (every 100 XP = 1 level)
  const newLevel = Math.floor(winner.xp / 100) + 1;
  if (newLevel > winner.level) {
    winner.level = newLevel;
  }
  
  // Free up loser's spot
  if (car.spot1.avatarId.toString() === loser._id.toString()) {
    car.spot1.occupied = false;
    car.spot1.avatarId = null;
  } else {
    car.spot2.occupied = false;
    car.spot2.avatarId = null;
  }
  
  train.occupiedSpots -= 1;
  
  // Check if winner is the last fighter standing
  const remainingFighters = train.getRemainingFighters();
  if (remainingFighters === 1) {
    train.winner = {
      avatarId: winner._id,
      wonAt: new Date()
    };
    train.isActive = false;
    train.endedAt = new Date();
    // Big bonus for winning the train
    winner.coins += 50;
    winner.trainTokens += 5;
    winner.xp += 100;
  }
  
  await winner.save();
  await loser.save();
  await train.save();
  
  // Broadcast fight result via Socket.io (if socket is initialized)
  // Note: Socket helpers are set in server.js after socket initialization
  // For now, we'll try to access them but won't fail if unavailable
  try {
    // Socket helpers should be available via module
    const trainSocketModule = require('../sockets/trainSocket');
    if (trainSocketModule && typeof trainSocketModule.getHelpers === 'function') {
      const helpers = trainSocketModule.getHelpers();
      if (helpers && helpers.broadcastFightResult) {
        helpers.broadcastFightResult(train._id.toString(), {
          ...fightResult,
          trainId: train._id.toString(),
          carNumber
        });
        helpers.broadcastTrainUpdate(train._id.toString(), {
          type: 'fight-complete',
          carNumber,
          winner: fightResult.winner.name,
          loser: fightResult.loser.name
        });
      }
    }
  } catch (error) {
    // Socket might not be initialized yet - that's okay
    console.warn('Could not broadcast fight result via socket:', error.message);
  }
  
  return {
    ...fightResult,
    trainId: train._id,
    carNumber
  };
}

// Get active train status
router.get('/train-status', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    
    const avatar = await TrainToUFCAvatar.findOne({ firebaseUid });
    if (!avatar || !avatar.onTrain || !avatar.trainId) {
      return res.status(404).json({ message: 'Not on train' });
    }
    
    const train = await Train.findById(avatar.trainId)
      .populate('cars.spot1.avatarId', 'name stats outfitColor wins losses')
      .populate('cars.spot2.avatarId', 'name stats outfitColor wins losses')
      .populate('winner.avatarId', 'name');
    
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }
    
    res.json({ train, myAvatar: avatar });
  } catch (error) {
    console.error('Error fetching train status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leaderboard (GET /api/train-to-ufc/leaderboard)
router.get('/leaderboard', async (req, res) => {
  try {
    const { sortBy = 'wins', limit = 50 } = req.query;
    
    let sortField = 'wins';
    if (sortBy === 'streak') sortField = 'longestStreak';
    else if (sortBy === 'tokens') sortField = 'trainTokens';
    else if (sortBy === 'xp') sortField = 'xp';
    
    const leaderboard = await TrainToUFCAvatar.find({ eliminated: false })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('name wins losses longestStreak trainTokens xp level outfitColor')
      .lean();
    
    res.json({
      leaderboard: leaderboard.map((player, index) => ({
        rank: index + 1,
        ...player
      })),
      sortBy,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reward system (POST /api/train-to-ufc/reward)
router.post('/reward', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { rewardType, amount } = req.body;
    
    const avatar = await TrainToUFCAvatar.findOne({ firebaseUid });
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }
    
    // Reward types: 'xp', 'coins', 'tokens'
    if (rewardType === 'xp') {
      avatar.xp += amount || 0;
      // Level up check
      const newLevel = Math.floor(avatar.xp / 100) + 1;
      if (newLevel > avatar.level) {
        avatar.level = newLevel;
      }
    } else if (rewardType === 'coins') {
      avatar.coins += amount || 0;
    } else if (rewardType === 'tokens') {
      avatar.trainTokens += amount || 0;
    } else {
      return res.status(400).json({ message: 'Invalid reward type' });
    }
    
    await avatar.save();
    
    res.json({
      message: 'Reward granted',
      avatar: {
        xp: avatar.xp,
        level: avatar.level,
        coins: avatar.coins,
        trainTokens: avatar.trainTokens
      }
    });
  } catch (error) {
    console.error('Error granting reward:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Place fighter on specific train spot
router.post('/place-fighter', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { trainId, carNumber, spotNumber } = req.body;
    
    if (!trainId || !carNumber || !spotNumber) {
      return res.status(400).json({ message: 'Missing required fields: trainId, carNumber, spotNumber' });
    }
    
    const avatar = await TrainToUFCAvatar.findOne({ firebaseUid });
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found.' });
    }
    
    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Train not found.' });
    }
    
    const carIndex = carNumber - 1;
    const spotKey = spotNumber === 1 ? 'spot1' : 'spot2';
    const spot = train.cars[carIndex]?.[spotKey];
    
    if (!spot) {
      return res.status(400).json({ message: 'Invalid car or spot number.' });
    }
    
    if (spot.occupied) {
      return res.status(400).json({ message: 'Spot is already occupied.' });
    }
    
    // Place fighter
    spot.avatarId = avatar._id;
    spot.occupied = true;
    train.occupiedSpots += 1;
    
    avatar.onTrain = true;
    avatar.trainId = train._id;
    avatar.carNumber = carNumber;
    avatar.spotNumber = spotNumber;
    
    await train.save();
    await avatar.save();
    
    // Check if car is full and can fight
    if (train.isCarFull(carNumber)) {
      const car = train.cars[carIndex];
      const fighter1 = await TrainToUFCAvatar.findById(car.spot1.avatarId);
      const fighter2 = await TrainToUFCAvatar.findById(car.spot2.avatarId);
      
      const fightCheck = canFight(fighter1, fighter2);
      if (fightCheck.canFight) {
        // Trigger fight asynchronously (don't wait)
        triggerCarFight(train, carNumber).catch(err => {
          console.error('Error triggering fight:', err);
        });
      } else {
        // Remove fighter if weight class mismatch
        spot.occupied = false;
        spot.avatarId = null;
        train.occupiedSpots -= 1;
        avatar.onTrain = false;
        avatar.trainId = null;
        avatar.carNumber = null;
        avatar.spotNumber = null;
        await train.save();
        await avatar.save();
        return res.status(400).json({ 
          message: `Cannot place fighter: ${fightCheck.reason}`,
          reason: fightCheck.reason
        });
      }
    }
    
    await train.populate('cars.spot1.avatarId', 'name stats outfitColor weightClass wins losses');
    await train.populate('cars.spot2.avatarId', 'name stats outfitColor weightClass wins losses');
    
    res.json({ 
      message: 'Fighter placed on train!',
      train: train.toObject({ virtuals: true }),
      avatar: avatar.toObject({ virtuals: true })
    });
  } catch (error) {
    console.error('Error placing fighter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove fighter from train (leave train)
router.post('/leave-train', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { trainId } = req.body;
    
    const avatar = await TrainToUFCAvatar.findOne({ firebaseUid });
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar not found.' });
    }
    
    if (!avatar.onTrain || !avatar.trainId) {
      return res.status(400).json({ message: 'Fighter is not on train.' });
    }
    
    const train = await Train.findById(avatar.trainId);
    if (!train) {
      // Train might have been deleted, just update avatar
      avatar.onTrain = false;
      avatar.trainId = null;
      avatar.carNumber = null;
      avatar.spotNumber = null;
      await avatar.save();
      return res.json({ 
        message: 'Fighter removed from train.',
        avatar: avatar.toObject({ virtuals: true })
      });
    }
    
    // Remove fighter from train spot
    const carIndex = avatar.carNumber - 1;
    const spotKey = avatar.spotNumber === 1 ? 'spot1' : 'spot2';
    
    if (train.cars[carIndex] && train.cars[carIndex][spotKey]) {
      train.cars[carIndex][spotKey].occupied = false;
      train.cars[carIndex][spotKey].avatarId = null;
      train.occupiedSpots = Math.max(0, train.occupiedSpots - 1);
      await train.save();
    }
    
    // Update avatar
    avatar.onTrain = false;
    avatar.trainId = null;
    avatar.carNumber = null;
    avatar.spotNumber = null;
    await avatar.save();
    
    await train.populate('cars.spot1.avatarId', 'name stats outfitColor weightClass wins losses');
    await train.populate('cars.spot2.avatarId', 'name stats outfitColor weightClass wins losses');
    
    res.json({ 
      message: 'Fighter moved back to waiting zone!',
      train: train.toObject({ virtuals: true }),
      avatar: avatar.toObject({ virtuals: true })
    });
  } catch (error) {
    console.error('Error removing fighter from train:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

