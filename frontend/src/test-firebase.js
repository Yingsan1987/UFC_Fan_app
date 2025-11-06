// Quick Firebase Configuration Test
// Run this in browser console to test if Firebase is configured correctly

console.log('🔥 Firebase Configuration Test');
console.log('================================');

// Check if environment variables are loaded
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Loaded' : '❌ Missing');
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing');

// Show actual values (only for debugging - remove in production!)
console.log('\n📋 Current Values:');
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Storage Bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log('Messaging Sender ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
console.log('App ID:', import.meta.env.VITE_FIREBASE_APP_ID);

// Check if values are the default placeholders
if (import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key') {
  console.error('❌ ERROR: You are still using placeholder values!');
  console.log('👉 Update your .env file with real Firebase credentials');
}

console.log('\n✅ If all values show correctly, Firebase is configured!');
console.log('⚠️  If you see "undefined", restart your dev server!');




