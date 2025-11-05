/**
 * Script to set a user as Premium with unlimited energy for testing
 * 
 * Usage:
 *   node scripts/set-premium-user.js <email>
 * 
 * Example:
 *   node scripts/set-premium-user.js yingsan1987@gmail.com
 */

const admin = require('firebase-admin');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Initialize Firebase Admin if not already initialized
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized');
    } else {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT not found in environment variables');
      console.log('   Please set up Firebase service account in .env file');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  process.exit(1);
}

const setPremiumUser = async (email) => {
  try {
    console.log(`🔧 Setting premium status for: ${email}`);
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get user from Firebase
    const firebaseUser = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found Firebase user: ${firebaseUser.uid}`);
    
    // Set custom claims for premium access
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      stripeRole: 'premium',
      premiumSince: Date.now(),
      adminTester: true // Special flag for testing
    });
    console.log('✅ Set Firebase custom claims (stripeRole: premium)');
    
    // Update user in MongoDB
    const user = await User.findOne({ firebaseUid: firebaseUser.uid });
    if (user) {
      console.log(`✅ Found MongoDB user: ${user.email}`);
      console.log(`   Current username: ${user.username || 'not set'}`);
      console.log(`   Member since: ${user.createdAt}`);
    } else {
      console.log('⚠️  User not found in MongoDB - will be created on next login');
    }
    
    console.log('\n🎉 SUCCESS! User is now Premium with unlimited energy!');
    console.log('\n📋 Premium Benefits:');
    console.log('   ✅ Unlimited game energy (can play with 0 energy)');
    console.log('   ✅ Premium badge on profile');
    console.log('   ✅ Special admin tester flag');
    console.log('\n⚠️  Note: User must sign out and sign back in for changes to take effect');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('   User with this email does not exist in Firebase');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.log('\nUsage: node scripts/set-premium-user.js <email>');
  console.log('Example: node scripts/set-premium-user.js yingsan1987@gmail.com');
  process.exit(1);
}

// Run the script
setPremiumUser(email);

