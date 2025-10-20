// Script to help set up Stripe products and prices
// Run this script to create the subscription product and price in Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('🚀 Setting up Stripe products and prices...');

    // Create the premium subscription product
    const product = await stripe.products.create({
      name: 'UFC Fan App Premium Membership',
      description: 'Premium membership for UFC Fan App with exclusive features including fight predictions, advanced analytics, priority support, and ad-free experience.',
      metadata: {
        app: 'ufc-fan-app',
        type: 'subscription'
      }
    });

    console.log('✅ Product created:', product.id);

    // Create the monthly price for $5.00
    const price = await stripe.prices.create({
      unit_amount: 500, // $5.00 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product: product.id,
      metadata: {
        app: 'ufc-fan-app',
        type: 'monthly_subscription'
      }
    });

    console.log('✅ Price created:', price.id);

    console.log('\n🎉 Setup complete!');
    console.log('📝 Add these to your environment variables:');
    console.log(`REACT_APP_STRIPE_PRICE_ID=${price.id}`);
    console.log('\n💡 Don\'t forget to:');
    console.log('1. Add your Stripe Publishable Key to frontend .env file');
    console.log('2. Add your Stripe Secret Key to backend .env file');
    console.log('3. Set up webhook endpoints in Stripe Dashboard');

  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
  }
}

// Run the setup
setupStripeProducts();
