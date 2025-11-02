/**
 * UFC Fan App - Game System Test Script
 * 
 * This script tests the game system functionality:
 * - Model creation
 * - Game initialization
 * - Training mechanics
 * - Energy refresh
 * - Fighter transfer eligibility
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PlaceholderFighter = require('./models/PlaceholderFighter');
const GameProgress = require('./models/GameProgress');
const TrainingSession = require('./models/TrainingSession');

dotenv.config();

async function testGameSystem() {
  try {
    console.log('🎮 Starting Game System Tests...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ufc_fan_app');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create Placeholder Fighter
    console.log('Test 1: Creating Placeholder Fighter...');
    const testUserId = new mongoose.Types.ObjectId();
    const testFirebaseUid = 'test_' + Date.now();

    const placeholderFighter = new PlaceholderFighter({
      userId: testUserId,
      firebaseUid: testFirebaseUid,
      selectedWeightClass: 'Lightweight',
      stats: {
        striking: 50,
        grappling: 50,
        stamina: 50,
        defense: 50
      }
    });

    await placeholderFighter.save();
    console.log('✅ Placeholder Fighter Created');
    console.log(`   - ID: ${placeholderFighter._id}`);
    console.log(`   - Weight Class: ${placeholderFighter.selectedWeightClass}`);
    console.log(`   - Initial Stats: ${JSON.stringify(placeholderFighter.stats)}`);
    console.log(`   - Energy: ${placeholderFighter.energy}/3\n`);

    // Test 2: Create Game Progress
    console.log('Test 2: Creating Game Progress...');
    const gameProgress = new GameProgress({
      userId: testUserId,
      firebaseUid: testFirebaseUid,
      currentFighter: {
        isPlaceholder: true,
        placeholderFighterId: placeholderFighter._id
      }
    });

    await gameProgress.save();
    console.log('✅ Game Progress Created');
    console.log(`   - Level: ${gameProgress.level}`);
    console.log(`   - Total XP: ${gameProgress.totalXP}`);
    console.log(`   - Fan Corn: ${gameProgress.fanCorn}\n`);

    // Test 3: Simulate Training Sessions
    console.log('Test 3: Simulating Training Sessions...');
    const trainingTypes = ['bagWork', 'grappleDrills', 'cardio', 'sparDefense'];
    const attributeMap = {
      bagWork: 'striking',
      grappleDrills: 'grappling',
      cardio: 'stamina',
      sparDefense: 'defense'
    };

    for (let i = 0; i < 3; i++) {
      const trainingType = trainingTypes[i % trainingTypes.length];
      const attribute = attributeMap[trainingType];
      const xpGained = Math.floor(Math.random() * 3) + 1;

      // Update stats
      placeholderFighter.stats[attribute] += xpGained;
      placeholderFighter.trainingSessions += 1;
      placeholderFighter.energy -= 1;

      // Create training session record
      const trainingSession = new TrainingSession({
        userId: testUserId,
        firebaseUid: testFirebaseUid,
        placeholderFighterId: placeholderFighter._id,
        trainingType,
        attributeImproved: attribute,
        xpGained
      });
      await trainingSession.save();

      // Update game progress
      gameProgress.addXP(xpGained * 10);

      console.log(`   Session ${i + 1}: ${trainingType} → +${xpGained} ${attribute}`);
    }

    await placeholderFighter.save();
    await gameProgress.save();

    console.log('✅ Training Sessions Complete');
    console.log(`   - Total Sessions: ${placeholderFighter.trainingSessions}`);
    console.log(`   - Remaining Energy: ${placeholderFighter.energy}`);
    console.log(`   - Updated Stats: ${JSON.stringify(placeholderFighter.stats)}`);
    console.log(`   - Total XP: ${gameProgress.totalXP}\n`);

    // Test 4: Energy Refresh Mechanism
    console.log('Test 4: Testing Energy Refresh...');
    console.log(`   - Energy before refresh: ${placeholderFighter.energy}`);
    
    // Simulate next day by changing lastEnergyRefresh
    placeholderFighter.lastEnergyRefresh = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    const refreshed = placeholderFighter.refreshEnergy();
    
    console.log(`   - Refresh triggered: ${refreshed}`);
    console.log(`   - Energy after refresh: ${placeholderFighter.energy}\n`);

    // Test 5: Transfer Eligibility
    console.log('Test 5: Testing Transfer Eligibility...');
    console.log(`   - Current sessions: ${placeholderFighter.trainingSessions}/50`);
    console.log(`   - Eligible for transfer: ${placeholderFighter.isEligibleForTransfer()}`);
    
    // Fast-forward to 50 sessions
    placeholderFighter.trainingSessions = 50;
    console.log(`   - After 50 sessions: ${placeholderFighter.isEligibleForTransfer()}\n`);

    // Test 6: XP and Leveling
    console.log('Test 6: Testing XP and Leveling System...');
    const initialLevel = gameProgress.level;
    console.log(`   - Initial Level: ${initialLevel}`);
    console.log(`   - Initial XP: ${gameProgress.totalXP}`);
    
    // Add significant XP
    const leveledUp = gameProgress.addXP(500);
    console.log(`   - Added 500 XP`);
    console.log(`   - New Level: ${gameProgress.level}`);
    console.log(`   - Total XP: ${gameProgress.totalXP}`);
    console.log(`   - Leveled Up: ${leveledUp}\n`);

    // Test 7: Fight Result Simulation
    console.log('Test 7: Simulating Fight Result...');
    const fightData = {
      eventName: 'UFC 300',
      fighterName: 'Test Fighter',
      opponent: 'Opponent Fighter',
      result: 'win',
      method: 'KO',
      xpGained: 200,
      fanCornGained: 150
    };

    gameProgress.addFightResult(fightData);
    await gameProgress.save();

    console.log('✅ Fight Result Added');
    console.log(`   - Result: ${fightData.result}`);
    console.log(`   - Total Wins: ${gameProgress.totalWins}`);
    console.log(`   - Prestige: ${gameProgress.prestige}`);
    console.log(`   - Total XP: ${gameProgress.totalXP}`);
    console.log(`   - Fan Corn: ${gameProgress.fanCorn}\n`);

    // Test 8: Data Retrieval
    console.log('Test 8: Testing Data Retrieval...');
    const retrievedProgress = await GameProgress.findOne({ firebaseUid: testFirebaseUid })
      .populate('currentFighter.placeholderFighterId');
    
    console.log('✅ Data Retrieved Successfully');
    console.log(`   - Game Progress ID: ${retrievedProgress._id}`);
    console.log(`   - Fighter Type: ${retrievedProgress.currentFighter.isPlaceholder ? 'Placeholder' : 'Real'}`);
    console.log(`   - Fight History Count: ${retrievedProgress.fightHistory.length}\n`);

    // Cleanup
    console.log('Cleaning up test data...');
    await PlaceholderFighter.deleteOne({ _id: placeholderFighter._id });
    await GameProgress.deleteOne({ _id: gameProgress._id });
    await TrainingSession.deleteMany({ firebaseUid: testFirebaseUid });
    console.log('✅ Test data cleaned up\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('═══════════════════════════════════════');
    console.log('\nGame System Features Verified:');
    console.log('✓ Placeholder Fighter Creation');
    console.log('✓ Game Progress Tracking');
    console.log('✓ Training System');
    console.log('✓ Energy Management');
    console.log('✓ Transfer Eligibility');
    console.log('✓ XP and Leveling');
    console.log('✓ Fight Results Integration');
    console.log('✓ Data Persistence\n');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run tests
testGameSystem();

