# Deployment Guide for UFC Fan App

This guide will help you deploy your UFC Fan App to Render with proper environment variable configuration.

## 🚀 Render Deployment Setup

### Step 1: Push to GitHub
Your code is now safe to push to GitHub since .env files are properly ignored:

```bash
git add .
git commit -m "Add Stripe integration and deployment configuration"
git push origin main
```

### Step 2: Deploy Backend to Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the backend service:**
   - **Name**: `ufc-fan-app-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. **Set Environment Variables in Render Dashboard:**
   ```
   NODE_ENV=production
   PORT=10000
   STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   MONGODB_URI=your_mongodb_connection_string_here (if using MongoDB)
   ```

### Step 3: Deploy Frontend to Render

1. **Click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure the frontend service:**
   - **Name**: `ufc-fan-app-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free

4. **Set Environment Variables in Render Dashboard:**
   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key_here
   REACT_APP_STRIPE_PRICE_ID=price_your_price_id_here
   REACT_APP_API_URL=https://ufc-fan-app-backend.onrender.com/api
   ```

### Step 4: Update Stripe Configuration

1. **Switch to Live Keys**: Update your Render environment variables with live Stripe keys
2. **Update Webhook Endpoint**: In Stripe Dashboard, set webhook URL to:
   ```
   https://ufc-fan-app-backend.onrender.com/api/stripe/webhook
   ```
3. **Test with Real Payments**: Use small amounts to test the live integration

## 🔧 Environment Variables Reference

### Backend (.env - for local development)
```env
NODE_ENV=development
PORT=5000
STRIPE_SECRET_KEY=sk_test_your_test_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
MONGODB_URI=your_mongodb_connection_string_here
```

### Frontend (.env - for local development)
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_stripe_publishable_key_here
REACT_APP_STRIPE_PRICE_ID=price_your_price_id_here
REACT_APP_API_URL=http://localhost:5000/api
```

### Render Backend Environment Variables
```
NODE_ENV=production
PORT=10000
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
MONGODB_URI=your_mongodb_connection_string_here
```

### Render Frontend Environment Variables
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key_here
REACT_APP_STRIPE_PRICE_ID=price_your_price_id_here
REACT_APP_API_URL=https://ufc-fan-app-backend.onrender.com/api
```

## 🧪 Testing Your Deployment

### 1. Test Backend
Visit: `https://ufc-fan-app-backend.onrender.com`
Should show: `{"message": "UFC Fan App API running"}`

### 2. Test Frontend
Visit your frontend URL and test:
- Navigation works
- Support page loads
- Payment form appears
- API calls work

### 3. Test Stripe Integration
- Use test card numbers in development
- Use real small amounts in production
- Check Stripe Dashboard for successful payments

## 🔒 Security Checklist

- ✅ .env files are in .gitignore
- ✅ No sensitive keys in code
- ✅ Environment variables set in Render
- ✅ Using HTTPS in production
- ✅ Webhook endpoints configured
- ✅ Test with small amounts first

## 🚨 Important Notes

1. **Never commit .env files** - They're now properly ignored
2. **Use test keys in development** - Switch to live keys only in production
3. **Test webhooks** - Ensure your webhook endpoint is accessible
4. **Monitor payments** - Check Stripe Dashboard regularly
5. **Backup your keys** - Store them securely outside of code

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in package.json
2. **Environment Variables Not Working**: Ensure they're set in Render Dashboard
3. **API Calls Fail**: Check CORS settings and API URLs
4. **Stripe Errors**: Verify keys are correct and webhook is configured

### Getting Help:
- [Render Documentation](https://render.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

## 🎉 Success!

Once deployed, your UFC Fan App will have:
- ✅ Secure payment processing with Stripe
- ✅ Coffee support options ($1.99 Tim Hortons, $3.99 Starbucks)
- ✅ Premium subscription ($5.00/month)
- ✅ Professional deployment on Render
- ✅ Secure environment variable management







