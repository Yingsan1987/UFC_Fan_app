import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle, Heart, Shield, Zap, Coffee } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const COFFEES = [
  { id: 'tim',       name: "Tim's Coffee",    emoji: '☕', price: 199,  label: '$1.99', desc: 'Quick thanks!' },
  { id: 'starbucks', name: "Starbucks Brew",  emoji: '🍵', price: 399,  label: '$3.99', desc: 'Keep it going!'  },
  { id: 'energy',    name: "Energy Drink",    emoji: '⚡', price: 599,  label: '$5.99', desc: 'Big support!'   },
];

const PREMIUM_FEATURES = [
  { icon: Crown,  text: 'Priority access to new features'     },
  { icon: Zap,    text: 'Exclusive game modes & tournaments'   },
  { icon: Shield, text: 'Ad-free experience'                   },
  { icon: Heart,  text: 'Premium profile badge'                },
  { icon: Coffee, text: 'Support ongoing UFC data updates'     },
];

const CARD_STYLE = {
  style: {
    base: { color: '#1f2937', fontFamily: 'system-ui, sans-serif', fontSize: '15px', '::placeholder': { color: '#9ca3af' } },
    invalid: { color: '#ef4444' },
  },
};

function PaymentForm({ type, coffee, onSuccess, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState({ name: '', email: '' });

  const price = type === 'coffee' ? coffee?.label : '$5.00/mo';
  const label = type === 'coffee' ? coffee?.name  : 'Premium Membership';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError(null);
    try {
      const card = elements.getElement(CardElement);
      if (type === 'coffee') {
        const { data: d } = await axios.post(`${API_URL}/stripe/create-payment-intent`, {
          amount: coffee.price, currency: 'usd',
          metadata: { type: 'coffee_purchase', coffee_type: coffee.id, customer_name: data.name, customer_email: data.email },
        });
        const result = await stripe.confirmCardPayment(d.clientSecret, {
          payment_method: { card, billing_details: { name: data.name, email: data.email } },
        });
        if (result.error) throw new Error(result.error.message);
      } else {
        const { data: d } = await axios.post(`${API_URL}/stripe/create-subscription`, {
          email: data.email, name: data.name,
        });
        const result = await stripe.confirmCardPayment(d.clientSecret, {
          payment_method: { card, billing_details: { name: data.name, email: data.email } },
        });
        if (result.error) throw new Error(result.error.message);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-black text-gray-900">{label}</h3>
          <p className="text-red-600 font-bold text-sm">{price}</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Full Name</label>
          <input type="text" required placeholder="John Smith"
            value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email</label>
          <input type="email" required placeholder="you@example.com"
            value={data.email} onChange={e => setData(d => ({ ...d, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Card Details</label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
            <CardElement options={CARD_STYLE} />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !stripe}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-3 rounded-xl hover:from-red-700 hover:to-red-900 transition-all disabled:opacity-50">
            {loading ? 'Processing…' : `Pay ${price}`}
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
            Cancel
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" /> Secured by Stripe
        </p>
      </form>
    </motion.div>
  );
}

function SuccessScreen({ onClose }) {
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-green-200 p-8 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">Thank you! 🎉</h3>
      <p className="text-gray-500 text-sm mb-6">Your payment was successful. We really appreciate your support!</p>
      <button onClick={onClose}
        className="bg-gradient-to-r from-red-600 to-red-800 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
        Back to Home
      </button>
    </motion.div>
  );
}

function SupportContent() {
  const [selected, setSelected]   = useState(null); // { type, coffee? }
  const [succeeded, setSucceeded] = useState(false);

  if (succeeded) return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <SuccessScreen onClose={() => setSucceeded(false)} />
    </div>
  );

  if (selected) return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <PaymentForm
        type={selected.type}
        coffee={selected.coffee}
        onSuccess={() => { setSelected(null); setSucceeded(true); }}
        onCancel={() => setSelected(null)}
      />
    </div>
  );

  const hasStripe = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white px-4 py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-5xl mb-4">❤️</div>
          <h1 className="text-4xl font-black mb-2">Support the App</h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            UFC Fan App is built with passion. Help keep the servers running and new features coming!
          </p>
          {!hasStripe && (
            <div className="mt-4 inline-block bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-xs font-semibold px-4 py-2 rounded-full">
              ⚠️ Payment processing not configured — contact admin
            </div>
          )}
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Buy a coffee */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl font-black text-gray-900 mb-1 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" /> Buy Us a Coffee
          </h2>
          <p className="text-gray-500 text-sm mb-4">A small contribution goes a long way.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COFFEES.map(c => (
              <motion.button key={c.id} whileTap={{ scale: 0.97 }}
                onClick={() => hasStripe && setSelected({ type: 'coffee', coffee: c })}
                className={`bg-white rounded-2xl shadow-md border-2 border-gray-100 p-5 text-center hover:border-amber-400 hover:shadow-lg transition-all group ${!hasStripe ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{c.emoji}</div>
                <div className="font-black text-gray-900 text-sm">{c.name}</div>
                <div className="text-amber-600 font-black text-xl mt-1">{c.label}</div>
                <div className="text-gray-400 text-xs mt-0.5">{c.desc}</div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Premium membership */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-black text-gray-900">Premium Membership</h2>
                </div>
                <p className="text-gray-600 text-sm">Unlock the full UFC Fan App experience</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">$5</div>
                <div className="text-gray-400 text-xs">per month</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-yellow-600" />
                  </div>
                  {text}
                </div>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => hasStripe && setSelected({ type: 'subscription' })}
              className={`w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black px-8 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2 justify-center ${!hasStripe ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Crown className="w-5 h-5" /> Start Premium — $5/mo
            </motion.button>
          </div>
        </motion.section>

        {/* Why support */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { emoji: '🏃', title: 'Keep It Fast', desc: 'Server costs keep the app running quickly for everyone' },
            { emoji: '🔄', title: 'Fresh Data',   desc: 'Fighter stats, rankings, and news stay up to date'     },
            { emoji: '🎮', title: 'More Games',   desc: 'Your support funds new game modes and features'        },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 text-center">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <div className="font-black text-gray-900 text-sm mb-1">{item.title}</div>
              <div className="text-gray-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </motion.section>

        <p className="text-center text-xs text-gray-400">
          Questions? Reach us at <span className="text-red-600 font-semibold">support@ufcfanapp.com</span>
        </p>
      </div>
    </div>
  );
}

export default function Support() {
  return stripePromise ? (
    <Elements stripe={stripePromise}>
      <SupportContent />
    </Elements>
  ) : (
    <SupportContent />
  );
}
