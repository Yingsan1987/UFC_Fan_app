# Stripe Integration Setup Guide

This guide will help you set up Stripe payment processing for your UFC Fan App.

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** > **API Keys**
3. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Set Up Environment Variables

### Backend Environment Variables
Create a `.env` file in your `backend` folder with:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database Configuration (if using MongoDB)
MONGODB_URI=your_mongodb_connection_string_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables
Create a `.env` file in your `frontend` folder with:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
REACT_APP_STRIPE_PRICE_ID=price_your_price_id_here
```

## Step 3: Create Stripe Products and Prices

Run the setup script to create the subscription product and price:

```bash
cd backend
node scripts/setup-stripe.js
```

This will create:
- A product called "UFC Fan App Premium Membership"
- A monthly price of $5.00 USD
- Output the Price ID that you need for your frontend .env file

## Step 4: Set Up Webhooks (Optional but Recommended)

1. In your Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and add it to your backend .env file

## Step 5: Test the Integration

### Test Credit Card Numbers
Use these test card numbers in development:

**Successful Payment:**
- 4242 4242 4242 4242 (Visa)
- 5555 5555 5555 4444 (Mastercard)

**Declined Payment:**
- 4000 0000 0000 0002 (Card declined)

**Requires Authentication:**
- 4000 0025 0000 3155 (Requires authentication)

Use any future expiry date and any 3-digit CVC.

### Test the Flow
1. Start your backend server: `npm start`
2. Start your frontend: `npm start`
3. Navigate to the Support page
4. Try purchasing a coffee or subscribing to premium
5. Use the test card numbers above

## Step 6: Go Live (Production)

When ready for production:

1. Switch to live keys in your environment variables
2. Update your webhook endpoint URL to your production domain
3. Test with real small amounts first
4. Ensure your domain is added to your Stripe account

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**
   - Check that your API keys are correctly set in environment variables
   - Ensure you're using test keys in development and live keys in production

2. **"Price ID Not Found" Error**
   - Run the setup script to create the price
   - Ensure the Price ID is correctly set in your frontend .env file

3. **Webhook Errors**
   - Check that your webhook endpoint URL is accessible
   - Verify the webhook signing secret matches your Stripe dashboard

4. **CORS Errors**
   - Ensure your backend CORS settings include your frontend domain
   - Check that your API routes are properly configured

### Getting Help

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [React Stripe.js Documentation](https://stripe.com/docs/stripe-js/react)

## Security Notes

- Never commit your `.env` files to version control
- Use test keys during development
- Only use live keys in production
- Always validate payments on your backend
- Use HTTPS in production

## Features Included

✅ One-time payments for coffee purchases
✅ Recurring subscriptions for premium membership
✅ Secure card input with Stripe Elements
✅ Payment confirmation and error handling
✅ Webhook support for payment events
✅ Customer creation and management
✅ Subscription cancellation support







