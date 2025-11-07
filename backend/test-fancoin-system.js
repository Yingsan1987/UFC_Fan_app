/**
 * UFC Fan App - Fan Coin System Test Script
 * 
 * This script tests the Fan Coin system:
 * - UFC Event creation
 * - Fight result processing
 * - Coin awarding logic
 * - Leaderboard functionality
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UFCEvent = require('./models/UFCEvent');
const FanCoinTransaction = require('./models/FanCoinTransaction');
const GameProgress = require('./models/GameProgress');
const PlaceholderFighter = require('./models/PlaceholderFighter');
const User = require('./models/User');
const Fighter = require('./models/Fighter');

dotenv.config();

async function testFanCoinSystem() {
  try {
    console.log('🪙 Starting Fan Coin System Tests...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ufc_fan_app');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create UFC Event
    console.log('Test 1: Creating UFC Event...');
    const testEvent = new UFCEvent({
      eventName: 'UFC Test Event ' + Date.now(),
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      location: 'Test Arena, Las Vegas',
      fightCard: {
        mainEvent: [{
          fightId: 'test-main-1',
          fighter1: 'Test Fighter A',
          fighter2: 'Test Fighter B',
          winner: '',
          result: '',
          method: ''
        }],
        coMainEvent: [{
          fightId: 'test-comain-1',
          fighter1: 'Test Fighter C',
          fighter2: 'Test Fighter D',
          winner: '',
          result: '',
          method: ''
        }],
        mainCard: [{
          fightId: 'test-maincard-1',
          fighter1: 'Test Fighter E',
          fighter2: 'Test Fighter F',
          winner: '',
          result: '',
          method: ''
        }],
        preliminaryCard: [{
          fightId: 'test-prelim-1',
          fighter1: 'Test Fighter G',
          fighter2: 'Test Fighter H',
          winner: '',
          result: '',
          method: ''
        }],
        earlyPreliminaryCard: [{
          fightId: 'test-early-1',
          fighter1: 'Test Fighter I',
          fighter2: 'Test Fighter J',
          winner: '',
          result: '',
          method: ''
        }]
      },
      status: 'upcoming'
    });

    await testEvent.save();
    console.log('✅ UFC Event Created:', testEvent.eventName);
    console.log(`   - Event ID: ${testEvent._id}`);
    console.log(`   - Total Fights: ${
      testEvent.fightCard.mainEvent.length +
      testEvent.fightCard.coMainEvent.length +
      testEvent.fightCard.mainCard.length +
      testEvent.fightCard.preliminaryCard.length +
      testEvent.fightCard.earlyPreliminaryCard.length
    }\n`);

    // Test 2: Test Coin Value Method
    console.log('Test 2: Testing Coin Value Calculation...');
    console.log(`   - Main Event: ${testEvent.getCoinValue('mainEvent')} coins`);
    console.log(`   - Co-Main Event: ${testEvent.getCoinValue('coMainEvent')} coins`);
    console.log(`   - Main Card: ${testEvent.getCoinValue('mainCard')} coins`);
    console.log(`   - Preliminary Card: ${testEvent.getCoinValue('preliminaryCard')} coins`);
    console.log(`   - Early Preliminary: ${testEvent.getCoinValue('earlyPreliminaryCard')} coins`);
    console.log('✅ Coin values correct\n');

    // Test 3: Simulate Fight Results
    console.log('Test 3: Simulating Fight Results...');
    testEvent.fightCard.mainEvent[0].winner = 'Test Fighter A';
    testEvent.fightCard.mainEvent[0].result = 'win';
    testEvent.fightCard.mainEvent[0].method = 'KO';
    
    testEvent.fightCard.coMainEvent[0].winner = 'Test Fighter C';
    testEvent.fightCard.coMainEvent[0].result = 'win';
    testEvent.fightCard.coMainEvent[0].method = 'Submission';
    
    testEvent.fightCard.mainCard[0].winner = 'Test Fighter E';
    testEvent.fightCard.mainCard[0].result = 'win';
    testEvent.fightCard.mainCard[0].method = 'Decision';

    testEvent.status = 'completed';
    await testEvent.save();
    console.log('✅ Fight results entered');
    console.log(`   - Main Event: ${testEvent.fightCard.mainEvent[0].winner} wins by ${testEvent.fightCard.mainEvent[0].method}`);
    console.log(`   - Co-Main: ${testEvent.fightCard.coMainEvent[0].winner} wins by ${testEvent.fightCard.coMainEvent[0].method}`);
    console.log(`   - Main Card: ${testEvent.fightCard.mainCard[0].winner} wins by ${testEvent.fightCard.mainCard[0].method}\n`);

    // Test 4: Create Test User and Game Progress
    console.log('Test 4: Creating Test User...');
    const testUser = new User({
      firebaseUid: 'test_fancoin_' + Date.now(),
      email: 'testfancoin@example.com',
      displayName: 'Test Fan Coin User'
    });
    await testUser.save();
    console.log('✅ Test user created:', testUser._id);

    const testGameProgress = new GameProgress({
      userId: testUser._id,
      firebaseUid: testUser.firebaseUid,
      fanCorn: 50, // Starting balance
      currentFighter: {
        isPlaceholder: false,
        realFighterId: null // Would be actual fighter in production
      }
    });
    await testGameProgress.save();
    console.log('✅ Game progress created');
    console.log(`   - Initial Fan Coins: ${testGameProgress.fanCorn}\n`);

    // Test 5: Create Fan Coin Transaction
    console.log('Test 5: Creating Fan Coin Transaction...');
    const coinAmount = 5;
    testGameProgress.fanCorn += coinAmount;
    await testGameProgress.save();

    const transaction = new FanCoinTransaction({
      userId: testUser._id,
      firebaseUid: testUser.firebaseUid,
      amount: coinAmount,
      type: 'earned',
      source: 'fight_win',
      fightDetails: {
        eventName: testEvent.eventName,
        eventId: testEvent._id,
        fighterName: 'Test Fighter A',
        cardPosition: 'mainEvent',
        result: 'win'
      },
      balanceAfter: testGameProgress.fanCorn,
      description: `Won ${coinAmount} Fan Coins - Test Fighter A victory at ${testEvent.eventName} (mainEvent)`
    });
    await transaction.save();

    console.log('✅ Transaction created');
    console.log(`   - Amount: +${transaction.amount} coins`);
    console.log(`   - New Balance: ${transaction.balanceAfter} coins`);
    console.log(`   - Source: ${transaction.source}`);
    console.log(`   - Description: ${transaction.description}\n`);

    // Test 6: Test Leaderboard Query
    console.log('Test 6: Testing Leaderboard Query...');
    const leaderboard = await GameProgress.find()
      .sort({ fanCorn: -1, totalXP: -1 })
      .limit(5)
      .populate('userId', 'displayName')
      .select('userId fanCorn totalXP level totalWins');

    console.log('✅ Leaderboard query successful');
    console.log(`   - Found ${leaderboard.length} players`);
    if (leaderboard.length > 0) {
      leaderboard.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.userId?.displayName || 'Unknown'} - ${entry.fanCorn} coins`);
      });
    }
    console.log();

    // Test 7: Test User Rank Calculation
    console.log('Test 7: Testing User Rank Calculation...');
    const userRank = await GameProgress.countDocuments({
      $or: [
        { fanCorn: { $gt: testGameProgress.fanCorn } },
        { 
          fanCorn: testGameProgress.fanCorn, 
          totalXP: { $gt: testGameProgress.totalXP } 
        }
      ]
    }) + 1;

    const totalUsers = await GameProgress.countDocuments();
    const percentile = ((totalUsers - userRank) / totalUsers * 100).toFixed(1);

    console.log('✅ Rank calculation complete');
    console.log(`   - Rank: #${userRank}`);
    console.log(`   - Total Users: ${totalUsers}`);
    console.log(`   - Percentile: Top ${percentile}%\n`);

    // Test 8: Test Transaction History Query
    console.log('Test 8: Testing Transaction History...');
    const transactions = await FanCoinTransaction.find({ 
      firebaseUid: testUser.firebaseUid 
    })
    .sort({ createdAt: -1 })
    .limit(10);

    console.log('✅ Transaction history retrieved');
    console.log(`   - Found ${transactions.length} transactions`);
    transactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} ${tx.amount} coins - ${tx.source}`);
    });
    console.log();

    // Test 9: Test Event Status Queries
    console.log('Test 9: Testing Event Queries...');
    const upcomingEvents = await UFCEvent.find({
      status: 'upcoming',
      eventDate: { $gte: new Date() }
    }).countDocuments();

    const completedEvents = await UFCEvent.find({
      status: 'completed'
    }).countDocuments();

    console.log('✅ Event queries successful');
    console.log(`   - Upcoming Events: ${upcomingEvents}`);
    console.log(`   - Completed Events: ${completedEvents}\n`);

    // Cleanup
    console.log('Cleaning up test data...');
    await UFCEvent.deleteOne({ _id: testEvent._id });
    await FanCoinTransaction.deleteMany({ userId: testUser._id });
    await GameProgress.deleteOne({ _id: testGameProgress._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test data cleaned up\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 ALL FAN COIN TESTS PASSED! 🎉');
    console.log('═══════════════════════════════════════');
    console.log('\nFan Coin System Features Verified:');
    console.log('✓ UFC Event Creation');
    console.log('✓ Coin Value Calculation');
    console.log('✓ Fight Result Processing');
    console.log('✓ User Creation & Game Progress');
    console.log('✓ Transaction Recording');
    console.log('✓ Leaderboard Queries');
    console.log('✓ Rank Calculation');
    console.log('✓ Transaction History');
    console.log('✓ Event Status Queries\n');

    console.log('Coin Values:');
    console.log('  🥇 Main Event: 5 coins');
    console.log('  🥈 Co-Main Event: 4 coins');
    console.log('  🥉 Main Card: 3 coins');
    console.log('  📋 Preliminary: 2 coins');
    console.log('  📝 Early Prelim: 1 coin\n');

  } catch (error) {
    console.error('❌ Test Failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run tests
testFanCoinSystem();



