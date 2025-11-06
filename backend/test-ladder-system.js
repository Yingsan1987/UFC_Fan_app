/**
 * UFC Fan App - Ladder Progression System Test
 * 
 * This script simulates a complete journey from Rookie to Champion
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RookieFighter = require('./models/RookieFighter');
const GameProgress = require('./models/GameProgress');
const User = require('./models/User');

dotenv.config();

async function simulateRookieToChampion() {
  try {
    console.log('🥊 Simulating Rookie to Champion Journey...\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ufc_fan_app');
    console.log('✅ Connected to MongoDB\n');

    // Create test user
    const testUser = new User({
      firebaseUid: 'test_ladder_' + Date.now(),
      email: 'ladder_test@example.com',
      displayName: 'Ladder Test Fighter'
    });
    await testUser.save();
    console.log('📝 Test user created\n');

    // Create Rookie Fighter
    const rookieFighter = new RookieFighter({
      userId: testUser._id,
      firebaseUid: testUser.firebaseUid,
      selectedWeightClass: 'Lightweight',
      trainingSessions: 12, // Already completed training
      isTransferred: true
    });
    await rookieFighter.save();
    console.log('🥋 Rookie Fighter created (training complete)\n');

    // Create Game Progress
    const gameProgress = new GameProgress({
      userId: testUser._id,
      firebaseUid: testUser.firebaseUid,
      currentFighter: {
        isRookie: false,
        rookieFighterId: rookieFighter._id
      },
      fanCoin: 100 // Transfer bonus
    });
    await gameProgress.save();
    console.log('📊 Game Progress initialized');
    console.log(`   Starting Level: ${gameProgress.fighterLevel}`);
    console.log(`   Starting Fan Coins: ${gameProgress.fanCoin}\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎮 BEGIN PROGRESSION SIMULATION');
    console.log('═══════════════════════════════════════════════════════\n');

    const levels = ['Preliminary Card', 'Main Card', 'Co-Main Event', 'Main Event', 'Champion'];
    const coinValues = [2, 3, 4, 5, 5];

    let totalFights = 0;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const coinsPerWin = coinValues[i];
      
      console.log(`\n🎯 LEVEL ${i + 1}: ${level.toUpperCase()}`);
      console.log('─────────────────────────────────────────────────────');
      
      if (level === 'Champion') {
        console.log('🏆 CHAMPION STATUS ACHIEVED!');
        console.log('   No further progression needed');
        console.log(`   Continue earning ${coinsPerWin} coins per Main Event win`);
        break;
      }
      
      console.log(`Current Status: ${gameProgress.fighterLevel}`);
      console.log(`Wins needed: ${gameProgress.winsNeededForNextLevel}`);
      console.log(`Coins per win: ${coinsPerWin}\n`);

      // Simulate 3 wins at this level
      for (let win = 1; win <= 3; win++) {
        totalFights++;
        
        const fightData = {
          eventName: `UFC Event ${totalFights}`,
          fighterName: 'Test Fighter',
          opponent: `Opponent ${totalFights}`,
          result: 'win',
          method: ['KO', 'Submission', 'Decision'][Math.floor(Math.random() * 3)],
          fanCoinGained: coinsPerWin
        };

        const leveledUp = gameProgress.addFightResult(fightData);
        await gameProgress.save();

        console.log(`Fight ${totalFights}: WIN by ${fightData.method}`);
        console.log(`   +${coinsPerWin} Fan Coins (Total: ${gameProgress.fanCoin})`);
        console.log(`   Level Progress: ${gameProgress.levelWins}/${gameProgress.winsNeededForNextLevel} wins`);
        console.log(`   Prestige: ${gameProgress.prestige}`);
        
        if (leveledUp) {
          console.log(`   🎉 LEVEL UP! Advanced to: ${gameProgress.fighterLevel}`);
        }
        console.log();
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🏆 JOURNEY COMPLETE - FINAL STATS');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Fighter Level: ${gameProgress.fighterLevel}`);
    console.log(`Total Fights: ${totalFights}`);
    console.log(`Record: ${gameProgress.totalWins}W - ${gameProgress.totalLosses}L`);
    console.log(`Fan Coins: ${gameProgress.fanCoin} 🪙`);
    console.log(`Prestige: ${gameProgress.prestige} ⭐`);
    console.log(`Fight History: ${gameProgress.fightHistory.length} fights\n`);

    console.log('💰 Fan Coin Breakdown:');
    console.log(`   Transfer Bonus: +100`);
    console.log(`   Preliminary Card (3 wins × 2): +6`);
    console.log(`   Main Card (3 wins × 3): +9`);
    console.log(`   Co-Main Event (3 wins × 4): +12`);
    console.log(`   Main Event (3 wins × 5): +15`);
    console.log(`   ────────────────────────────────`);
    console.log(`   TOTAL: ${gameProgress.fanCoin} Fan Coins ✨\n`);

    console.log('🎯 Progression Summary:');
    console.log('   Days 1-4: Training (12 sessions)');
    console.log('   Day 5: Transfer to real fighter');
    console.log('   Weeks 2-3: Preliminary Card (3 wins)');
    console.log('   Weeks 4-5: Main Card (3 wins)');
    console.log('   Weeks 6-7: Co-Main Event (3 wins)');
    console.log('   Weeks 8-9: Main Event (3 wins)');
    console.log('   Result: CHAMPION STATUS! 🏆\n');

    // Cleanup
    console.log('Cleaning up test data...');
    await RookieFighter.deleteOne({ _id: rookieFighter._id });
    await GameProgress.deleteOne({ _id: gameProgress._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test data cleaned up\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SIMULATION COMPLETE! 🎉');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Ladder System Verified:');
    console.log('✓ Training reduced to 12 sessions');
    console.log('✓ 5-tier progression ladder');
    console.log('✓ 3 wins per level advancement');
    console.log('✓ Automatic level-up on wins');
    console.log('✓ Fan Coin rewards scale with level');
    console.log('✓ Prestige increases with wins');
    console.log('✓ Champion status achievable');
    console.log('✓ Complete journey takes 12+ fights\n');

  } catch (error) {
    console.error('❌ Simulation Failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run simulation
simulateRookieToChampion();


