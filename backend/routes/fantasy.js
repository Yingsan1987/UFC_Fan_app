const express = require('express');
const router = express.Router();
const FantasyEntry    = require('../models/FantasyEntry');
const UpcomingEvent   = require('../models/UpcomingEvent');
const GameProgress    = require('../models/GameProgress');
const FanCoinTransaction = require('../models/FanCoinTransaction');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// ── helpers ──────────────────────────────────────────────────────────────────

function scoreMethod(method = '') {
  const m = method.toLowerCase();
  if (m.includes('ko') || m.includes('tko')) return 15;
  if (m.includes('submis'))                  return 13;
  return 10; // decision / unanimous / split / majority
}

function coinsFromPoints(points, totalPicks, correctPicks) {
  let coins = 0;
  if      (points >= 75) coins = 50;
  else if (points >= 55) coins = 35;
  else if (points >= 40) coins = 20;
  else if (points >= 30) coins = 10;
  else if (points >= 20) coins = 5;
  // Perfect card bonus
  if (correctPicks === totalPicks && totalPicks >= 3) coins += 25;
  return coins;
}

// ── GET /api/fantasy/contests ─────────────────────────────────────────────────
// Returns upcoming events grouped as fantasy contests, with completed-fight counts
router.get('/contests', async (req, res) => {
  try {
    const fights = await UpcomingEvent.find().lean();

    const eventMap = {};
    fights.forEach(fight => {
      const key = fight.event_title;
      if (!key) return;

      if (!eventMap[key]) {
        eventMap[key] = {
          eventName:      key,
          eventDate:      fight.event_date,
          location:       fight.event_location,
          fights:         [],
          totalFights:    0,
          completedFights: 0,
        };
      }

      eventMap[key].fights.push({
        fighter1:   fight.red_fighter?.name  || '',
        fighter2:   fight.blue_fighter?.name || '',
        weightClass: fight.weight_class || '',
        status:     fight.status  || 'upcoming',
        winner:     fight.winner  || null,
        method:     fight.method  || null,
      });
      eventMap[key].totalFights++;
      if (fight.status === 'completed') eventMap[key].completedFights++;
    });

    const events = Object.values(eventMap)
      .filter(e => e.fights.length > 0)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    res.json(events);
  } catch (err) {
    console.error('Fantasy contests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fantasy/my-entries ───────────────────────────────────────────────
router.get('/my-entries', requireAuth, async (req, res) => {
  try {
    const entries = await FantasyEntry.find({ firebaseUid: req.user.uid })
      .sort({ submittedAt: -1 })
      .lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/fantasy/submit ──────────────────────────────────────────────────
router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { eventName, eventDate, picks } = req.body;

    if (!eventName || !Array.isArray(picks) || picks.length < 3) {
      return res.status(400).json({ error: 'Must pick at least 3 fights' });
    }

    const existing = await FantasyEntry.findOne({ firebaseUid: req.user.uid, eventName });
    if (existing) {
      return res.status(400).json({ error: 'You already submitted picks for this event' });
    }

    const entry = new FantasyEntry({
      firebaseUid: req.user.uid,
      eventName,
      eventDate,
      picks: picks.map(p => ({
        fighter1:      p.fighter1,
        fighter2:      p.fighter2,
        pickedFighter: p.pickedFighter,
        weightClass:   p.weightClass || '',
        result:        'pending',
        pointsEarned:  0,
      })),
      status: 'pending',
    });

    await entry.save();
    res.json(entry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Already submitted picks for this event' });
    }
    console.error('Fantasy submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/fantasy/score ───────────────────────────────────────────────────
// Checks DB fight results and scores any pending/partial entries for the authenticated user.
router.post('/score', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const pendingEntries = await FantasyEntry.find({
      firebaseUid: uid,
      status: { $in: ['pending', 'partial'] },
    });

    let totalCoinsAwarded = 0;
    const results = [];

    for (const entry of pendingEntries) {
      let pendingCount = 0;

      for (const pick of entry.picks) {
        if (pick.result !== 'pending') continue; // already scored

        const fight = await UpcomingEvent.findOne({
          'red_fighter.name':  pick.fighter1,
          'blue_fighter.name': pick.fighter2,
          status: 'completed',
          winner: { $exists: true, $nin: [null, ''] },
        }).lean();

        if (!fight) { pendingCount++; continue; }

        const winner = fight.winner || '';
        if (!winner) { pendingCount++; continue; }

        if (winner === pick.pickedFighter) {
          pick.result       = 'correct';
          pick.pointsEarned = scoreMethod(fight.method);
          pick.method       = fight.method;
        } else if (winner.toLowerCase().includes('draw') || fight.result === 'draw') {
          pick.result       = 'draw';
          pick.pointsEarned = 2;
          pick.method       = fight.method;
        } else {
          pick.result       = 'incorrect';
          pick.pointsEarned = 0;
          pick.method       = fight.method;
        }
      }

      entry.totalPoints = entry.picks.reduce((s, p) => s + (p.pointsEarned || 0), 0);

      const correctPicks = entry.picks.filter(p => p.result === 'correct').length;

      if (pendingCount === 0) {
        entry.status = 'scored';
        const coins = coinsFromPoints(entry.totalPoints, entry.picks.length, correctPicks);

        if (coins > 0) {
          const gp = await GameProgress.findOneAndUpdate(
            { firebaseUid: uid },
            { $inc: { fanCoin: coins } },
            { new: true }
          );
          if (gp) {
            await new FanCoinTransaction({
              userId:      gp.userId,
              firebaseUid: uid,
              amount:      coins,
              type:        'earned',
              source:      'other',
              balanceAfter: gp.fanCoin,
              description: `Fantasy Picks: ${entry.eventName} — ${entry.totalPoints} pts`,
            }).save();
          }
          entry.fanCoinsEarned = coins;
          totalCoinsAwarded   += coins;
        }
      } else {
        entry.status = 'partial';
      }

      await entry.save();
      results.push(entry.toObject());
    }

    res.json({ scored: results.length, totalCoinsAwarded, entries: results });
  } catch (err) {
    console.error('Fantasy score error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fantasy/leaderboard/:eventName ───────────────────────────────────
router.get('/leaderboard/:eventName', async (req, res) => {
  try {
    const eventName = decodeURIComponent(req.params.eventName);
    const entries = await FantasyEntry.find({ eventName, status: 'scored' })
      .sort({ totalPoints: -1 })
      .limit(20)
      .lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
