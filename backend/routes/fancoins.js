const express = require('express');
const router = express.Router();
const UFCEvent = require('../models/UFCEvent');
const FanCoinTransaction = require('../models/FanCoinTransaction');
const GameProgress = require('../models/GameProgress');
const User = require('../models/User');
const { requireAuth, optionalAuth, requireAdmin } = require('../middleware/authMiddleware');
const { validateCoinDelta } = require('../utils/coinGuard');

// Get upcoming UFC events with coin opportunities
router.get('/events/upcoming', async (req, res) => {
  try {
    const upcomingEvents = await UFCEvent.find({
      status: { $in: ['upcoming', 'live'] },
      eventDate: { $gte: new Date() }
    })
    .sort({ eventDate: 1 })
    .limit(10);

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get completed events
router.get('/events/completed', async (req, res) => {
  try {
    const completedEvents = await UFCEvent.find({
      status: 'completed'
    })
    .sort({ eventDate: -1 })
    .limit(20);

    res.json(completedEvents);
  } catch (error) {
    console.error('Error fetching completed events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single event details
router.get('/events/:eventId', async (req, res) => {
  try {
    const event = await UFCEvent.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process fight results and award coins (Admin endpoint)
router.post('/process-event/:eventId', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('🏆 Processing event results for Fan Coins...');
    
    const event = await UFCEvent.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'completed') {
      return res.status(400).json({ message: 'Event not completed yet' });
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      coinsByCard: {
        mainEvent: 0,
        coMainEvent: 0,
        mainCard: 0,
        preliminaryCard: 0,
        earlyPreliminaryCard: 0
      }
    };

    // Process each card type
    const cardTypes = ['mainEvent', 'coMainEvent', 'mainCard', 'preliminaryCard', 'earlyPreliminaryCard'];
    
    for (const cardType of cardTypes) {
      const fights = event.fightCard[cardType] || [];
      const coinValue = event.getCoinValue(cardType);

      for (const fight of fights) {
        if (fight.processed) {
          results.skipped++;
          continue;
        }

        if (!fight.winner || fight.result === 'no contest') {
          fight.processed = true;
          continue;
        }

        try {
          // Find all users who have this fighter
          const usersWithWinner = await GameProgress.find({
            'currentFighter.isPlaceholder': false,
            'currentFighter.realFighterId': { $exists: true }
          }).populate('currentFighter.realFighterId');

          for (const gameProgress of usersWithWinner) {
            const fighter = gameProgress.currentFighter.realFighterId;
            
            if (fighter && fighter.name === fight.winner) {
              // Award coins
              const oldBalance = gameProgress.fanCoin;
              gameProgress.fanCoin += coinValue;
              
              // Add to fight history
              gameProgress.addFightResult({
                eventName: event.eventName,
                fighterName: fighter.name,
                opponent: fight.fighter1 === fight.winner ? fight.fighter2 : fight.fighter1,
                result: 'win',
                method: fight.method,
                fanCoinGained: coinValue
              });

              await gameProgress.save();

              // Create transaction record
              const transaction = new FanCoinTransaction({
                userId: gameProgress.userId,
                firebaseUid: gameProgress.firebaseUid,
                amount: coinValue,
                type: 'earned',
                source: 'fight_win',
                fightDetails: {
                  eventName: event.eventName,
                  eventId: event._id,
                  fighterName: fighter.name,
                  fighterId: fighter._id,
                  cardPosition: cardType,
                  result: 'win'
                },
                balanceAfter: gameProgress.fanCoin,
                description: `Won ${coinValue} Fan Coins - ${fighter.name} victory at ${event.eventName} (${cardType})`
              });

              await transaction.save();

              results.processed++;
              results.coinsByCard[cardType] += coinValue;
            }
          }

          fight.processed = true;
        } catch (error) {
          console.error(`Error processing fight: ${fight.fightId}`, error);
          results.errors++;
        }
      }
    }

    await event.save();

    console.log('✅ Event processing complete:', results);
    res.json({
      message: 'Event processed successfully',
      results
    });
  } catch (error) {
    console.error('❌ Error processing event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's Fan Coin transaction history
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const limit = parseInt(req.query.limit) || 50;

    const transactions = await FanCoinTransaction.find({ firebaseUid })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Fan Coin leaderboard (Top 30)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    console.log('📊 Fetching Fan Coin leaderboard...');
    
    const leaderboard = await GameProgress.find()
      .sort({ fanCoin: -1, prestige: -1 }) // Primary: Fan Coins, Secondary: Prestige
      .limit(limit)
      .populate('userId', 'displayName username photoURL profileImage firebaseUid')
      .select('userId firebaseUid fanCoin totalWins totalLosses prestige fighterLevel');

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      fanCoin: entry.fanCoin,
      totalWins: entry.totalWins,
      totalLosses: entry.totalLosses,
      prestige: entry.prestige,
      fighterLevel: entry.fighterLevel,
      displayName: entry.userId?.displayName || 'Anonymous',
      username: entry.userId?.username || entry.userId?.displayName || 'Anonymous',
      photoURL: entry.userId?.photoURL || entry.userId?.profileImage || null
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's leaderboard position
router.get('/leaderboard/my-rank', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const gameProgress = await GameProgress.findOne({ firebaseUid });
    
    if (!gameProgress) {
      return res.json({ rank: null, message: 'Game not initialized' });
    }

    // Count users with more Fan Coins
    const rank = await GameProgress.countDocuments({
      $or: [
        { fanCoin: { $gt: gameProgress.fanCoin } },
        { 
          fanCoin: gameProgress.fanCoin, 
          prestige: { $gt: gameProgress.prestige } 
        }
      ]
    }) + 1;

    // Get total users
    const totalUsers = await GameProgress.countDocuments();

    res.json({
      rank,
      totalUsers,
      fanCoin: gameProgress.fanCoin,
      percentile: ((totalUsers - rank) / totalUsers * 100).toFixed(1)
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get poker session status — checked on page load to detect busted state
router.get('/poker-status', requireAuth, async (req, res) => {
  try {
    const gp = await GameProgress.findOne({ firebaseUid: req.user.uid });
    if (!gp) return res.json({ busted: false, fanCoin: 0 });
    res.json({ busted: !!gp.pokerBusted, fanCoin: gp.fanCoin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark player as busted (chips = 0) — called immediately when chips hit 0
router.post('/poker-bust', requireAuth, async (req, res) => {
  try {
    await GameProgress.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { pokerBusted: true }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rebuy: deduct fan coins and clear busted flag
router.post('/poker-rebuy', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    const gp = await GameProgress.findOne({ firebaseUid: req.user.uid });
    if (!gp) return res.status(404).json({ message: 'Game progress not found' });
    if (gp.fanCoin < amount) {
      return res.status(400).json({ message: 'Insufficient Fan Coins' });
    }
    gp.fanCoin -= amount;
    gp.pokerBusted = false;
    await gp.save();

    await new FanCoinTransaction({
      userId: gp.userId,
      firebaseUid: req.user.uid,
      amount,
      type: 'spent',
      source: 'other',
      balanceAfter: gp.fanCoin,
      description: `Poker rebuy: -${amount} Fan Coins`,
    }).save();

    res.json({ ok: true, fanCoin: gp.fanCoin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update fan coins after a poker session
router.post('/poker-result', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Bound + rate-limit the client-reported delta (anti-abuse). See utils/coinGuard.js.
    const check = validateCoinDelta('poker', firebaseUid, req.body.coinDelta);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }
    const coinDelta = check.delta;

    const gameProgress = await GameProgress.findOne({ firebaseUid });
    if (!gameProgress) {
      return res.status(404).json({ message: 'Game progress not found' });
    }

    const oldBalance = gameProgress.fanCoin;
    gameProgress.fanCoin = Math.max(0, oldBalance + coinDelta);
    await gameProgress.save();

    const transaction = new FanCoinTransaction({
      userId: gameProgress.userId,
      firebaseUid,
      amount: Math.abs(coinDelta),
      type: coinDelta >= 0 ? 'earned' : 'spent',
      source: 'other',
      balanceAfter: gameProgress.fanCoin,
      description: `Poker session: ${coinDelta >= 0 ? '+' : ''}${coinDelta} Fan Coins`,
    });
    await transaction.save();

    res.json({ message: 'Balance updated', fanCoin: gameProgress.fanCoin });
  } catch (error) {
    console.error('Error updating poker result:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/slots-result', requireAuth, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Bound + rate-limit the client-reported delta (anti-abuse). See utils/coinGuard.js.
    const check = validateCoinDelta('slots', firebaseUid, req.body.coinDelta);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }
    const coinDelta = check.delta;

    const gameProgress = await GameProgress.findOne({ firebaseUid });
    if (!gameProgress) {
      return res.status(404).json({ message: 'Game progress not found' });
    }

    const oldBalance = gameProgress.fanCoin;
    gameProgress.fanCoin = Math.max(0, oldBalance + coinDelta);
    await gameProgress.save();

    const transaction = new FanCoinTransaction({
      userId: gameProgress.userId,
      firebaseUid,
      amount: Math.abs(coinDelta),
      type: coinDelta >= 0 ? 'earned' : 'spent',
      source: 'other',
      balanceAfter: gameProgress.fanCoin,
      description: `Slots session: ${coinDelta >= 0 ? '+' : ''}${coinDelta} Fan Coins`,
    });
    await transaction.save();

    res.json({ message: 'Balance updated', fanCoin: gameProgress.fanCoin });
  } catch (error) {
    console.error('Error updating slots result:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new UFC event (Admin only - simplified for now)
router.post('/events/create', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('📅 Creating new UFC event...');
    
    const { eventName, eventDate, location, fightCard } = req.body;

    const event = new UFCEvent({
      eventName,
      eventDate,
      location,
      fightCard
    });

    await event.save();

    console.log('✅ Event created:', event.eventName);
    res.json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

