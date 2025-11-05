/**
 * Script to remove premium status from a user
 * 
 * Usage:
 *   node scripts/remove-premium-user.js <email>
 * 
 * Example:
 *   node scripts/remove-premium-user.js user@example.com
 */

const admin = require('../config/firebase');
const mongoose = require('mongoose');
require('dotenv').config();

const removePremiumUser = async (email) => {
  try {
    console.log(`🔧 Removing premium status for: ${email}`);
    
    // Get user from Firebase
    const firebaseUser = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found Firebase user: ${firebaseUser.uid}`);
    
    // Remove custom claims
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      stripeRole: null,
      premiumSince: null,
      adminTester: null
    });
    console.log('✅ Removed Firebase custom claims');
    
    console.log('\n🎉 SUCCESS! User is now Free tier');
    console.log('\n⚠️  Note: User must sign out and sign back in for changes to take effect');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('   User with this email does not exist in Firebase');
    }
  } finally {
    process.exit(0);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.log('\nUsage: node scripts/remove-premium-user.js <email>');
  console.log('Example: node scripts/remove-premium-user.js user@example.com');
  process.exit(1);
}

// Run the script
removePremiumUser(email);

