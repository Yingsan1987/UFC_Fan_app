// Quick test script to verify Stripe connection
// Run this with: node scripts/test-stripe.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  try {
    console.log('🧪 Testing Stripe connection...');
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
      console.log('💡 Make sure to set your Stripe secret key in Render environment variables');
      return;
    }

    // Test 1: Check if we can connect to Stripe
    console.log('📡 Testing API connection...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Connected to Stripe account:', account.display_name || account.id);
    console.log('📊 Account type:', account.type);
    console.log('🌍 Country:', account.country);

    // Test 2: List existing products
    console.log('\n📦 Checking existing products...');
    const products = await stripe.products.list({ limit: 10 });
    
    if (products.data.length === 0) {
      console.log('⚠️  No products found. You need to create the subscription product.');
      console.log('💡 Go to Stripe Dashboard > Products > Add Product');
      console.log('   Name: "UFC Fan App Premium Membership"');
      console.log('   Price: $5.00/month');
    } else {
      console.log('✅ Found', products.data.length, 'products:');
      products.data.forEach(product => {
        console.log(`   - ${product.name} (${product.id})`);
      });
    }

    // Test 3: List existing prices
    console.log('\n💰 Checking existing prices...');
    const prices = await stripe.prices.list({ limit: 10 });
    
    if (prices.data.length === 0) {
      console.log('⚠️  No prices found. You need to create the subscription price.');
    } else {
      console.log('✅ Found', prices.data.length, 'prices:');
      prices.data.forEach(price => {
        const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A';
        const interval = price.recurring ? price.recurring.interval : 'one-time';
        console.log(`   - $${amount} ${interval} (${price.id})`);
      });
    }

    // Test 4: Check webhooks
    console.log('\n🔗 Checking webhook endpoints...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    
    if (webhooks.data.length === 0) {
      console.log('⚠️  No webhook endpoints found.');
      console.log('💡 Go to Stripe Dashboard > Developers > Webhooks > Add endpoint');
      console.log('   URL: https://your-backend-url.onrender.com/api/stripe/webhook');
    } else {
      console.log('✅ Found', webhooks.data.length, 'webhook endpoints:');
      webhooks.data.forEach(webhook => {
        console.log(`   - ${webhook.url} (${webhook.status})`);
      });
    }

    console.log('\n🎉 Stripe connection test completed!');
    
  } catch (error) {
    console.error('❌ Stripe connection failed:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('💡 Check that your STRIPE_SECRET_KEY is correct in Render environment variables');
    } else if (error.message.includes('No such account')) {
      console.log('💡 Your Stripe account might not be activated or the key is incorrect');
    }
  }
}

// Run the test
testStripeConnection();







