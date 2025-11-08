# Stripe Integration Troubleshooting Guide

## 🚨 Common Issues with Live Stripe Integration

### 1. **Missing Stripe Products and Prices**

**Problem**: The subscription payment fails because the price ID doesn't exist.

**Solution**: You need to create the products and prices in your Stripe Dashboard:

#### Manual Setup in Stripe Dashboard:

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Navigate to Products** (left sidebar)
3. **Click "Add Product"**
4. **Create Product:**
   - **Name**: `UFC Fan App Premium Membership`
   - **Description**: `Premium membership for UFC Fan App with exclusive features`
   - **Click "Save Product"**

5. **Add Pricing:**
   - **Price**: `$5.00`
   - **Billing Period**: `Monthly`
   - **Click "Save Price"**

6. **Copy the Price ID** (starts with `price_`) and add it to your Render environment variables:
   ```
   REACT_APP_STRIPE_PRICE_ID=price_your_actual_price_id_here
   ```

### 2. **Webhook Configuration Missing**

**Problem**: Payment events aren't being processed properly.

**Solution**: Set up webhooks in Stripe Dashboard:

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com)**
2. **Navigate to Developers > Webhooks**
3. **Click "Add endpoint"**
4. **Set Endpoint URL**: `https://your-backend-url.onrender.com/api/stripe/webhook`
5. **Select Events:**
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. **Click "Add endpoint"**
7. **Copy the Webhook Signing Secret** and add it to Render:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 3. **Environment Variables Not Set Correctly**

**Problem**: Backend can't access Stripe keys.

**Solution**: Verify all environment variables are set in Render Dashboard:

#### Backend Environment Variables:
```
NODE_ENV=production
PORT=10000
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Frontend Environment Variables:
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key_here
REACT_APP_STRIPE_PRICE_ID=price_your_price_id_here
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

### 4. **CORS Issues**

**Problem**: Frontend can't communicate with backend.

**Solution**: Check your backend CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-url.onrender.com', // Update this
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));
```

### 5. **Test vs Live Keys Mismatch**

**Problem**: Using test keys in production or vice versa.

**Solution**: Ensure you're using the correct keys:
- **Development**: Use test keys (`sk_test_` and `pk_test_`)
- **Production**: Use live keys (`sk_live_` and `pk_live_`)

## 🔍 Debugging Steps

### Step 1: Check Render Logs
1. Go to your Render Dashboard
2. Click on your backend service
3. Go to "Logs" tab
4. Look for error messages

### Step 2: Test Backend API
Visit: `https://your-backend-url.onrender.com`
Should show: `{"message": "UFC Fan App API running"}`

### Step 3: Test Stripe Endpoint
Try making a test request to your Stripe endpoint:
```bash
curl -X POST https://your-backend-url.onrender.com/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1.99, "currency": "usd"}'
```

### Step 4: Check Browser Console
1. Open your frontend app
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Try to make a payment
5. Look for error messages

### Step 5: Verify Stripe Dashboard
1. Go to Stripe Dashboard
2. Check "Payments" section for any failed attempts
3. Check "Events" section for webhook events

## 🧪 Testing Checklist

### Before Testing with Real Money:
- [ ] Products and prices created in Stripe Dashboard
- [ ] Environment variables set in Render
- [ ] Webhook endpoint configured
- [ ] CORS settings updated
- [ ] Using live keys in production
- [ ] Frontend URL updated in CORS

### Test with Small Amounts:
- [ ] Test coffee purchase ($1.99)
- [ ] Test subscription ($5.00)
- [ ] Check Stripe Dashboard for successful payments
- [ ] Verify webhook events are received

## 🆘 Still Not Working?

### Check These Common Issues:

1. **Domain Not Added to Stripe Account**
   - Go to Stripe Dashboard > Settings > Domains
   - Add your production domain

2. **Account Not Activated**
   - Ensure your Stripe account is fully activated
   - Complete all required verification steps

3. **Insufficient Permissions**
   - Check that your Stripe account has the necessary permissions
   - Ensure you're using the correct API keys

4. **Network/Firewall Issues**
   - Check if Render is blocking certain requests
   - Verify webhook endpoint is accessible

### Get Help:
- [Stripe Support](https://support.stripe.com)
- [Stripe Documentation](https://stripe.com/docs)
- [Render Documentation](https://render.com/docs)

## 📞 Quick Fix Commands

If you need to quickly test locally with your live keys:

1. **Create temporary .env file** (don't commit this):
```bash
cd backend
echo "STRIPE_SECRET_KEY=sk_live_your_key_here" > .env
```

2. **Run setup script**:
```bash
node scripts/setup-stripe.js
```

3. **Delete .env file**:
```bash
rm .env
```

4. **Add the Price ID to Render environment variables**







