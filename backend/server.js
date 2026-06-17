const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const chatSocket = require('./sockets/chatSocket');
const trainSocket = require('./sockets/trainSocket');

dotenv.config();

// Connect to MongoDB (optional - app can work without it)
connectDB().catch(err => {
  console.log('⚠️  MongoDB connection failed, but app will continue running');
  console.log('📰 News API will work without database');
});

const app = express();
const server = http.createServer(app);

// CORS allow-list. Set FRONTEND_URL on the server to your site origin(s),
// comma-separated (e.g. "https://kurokuku.lol,https://www.kurokuku.lol").
// When configured, only those origins are allowed (no "*" + credentials mismatch).
// When NOT set, we fall back to the previous permissive behavior so the app
// keeps working — but log a warning, since this is unsafe for production.
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.length === 0) {
  console.warn('⚠️  FRONTEND_URL is not set in production — CORS is running in permissive mode. Set FRONTEND_URL to lock it down.');
}

const corsOrigin = (origin, callback) => {
  // Allow non-browser / same-origin requests (no Origin header).
  if (!origin) return callback(null, true);
  // No allow-list configured -> preserve prior permissive behavior.
  if (ALLOWED_ORIGINS.length === 0) return callback(null, true);
  return callback(null, ALLOWED_ORIGINS.includes(origin));
};

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: corsOrigin,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/fighters', require('./routes/fighters'));
app.use('/api/events', require('./routes/events'));
app.use('/api/upcoming-events', require('./routes/upcoming-events'));
app.use('/api/fight-details', require('./routes/fight-details'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/news', require('./routes/news'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/game', require('./routes/game'));
app.use('/api/train-to-ufc', require('./routes/train-to-ufc'));
app.use('/api/fancoins', require('./routes/fancoins'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sportradar', require('./routes/sportradar'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/fantasy',    require('./routes/fantasy'));

// Sockets
chatSocket(io);
trainSocket(io);

app.get('/', (req, res) => res.json({ 
  message: "UFC Fan App API running",
  status: "healthy",
  uptime: process.uptime(),
  timestamp: new Date().toISOString()
}));

// Health check endpoint for keep-alive pings
app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check available at /api/health`);
  
  // Log server ready time
  console.log(`⏱️  Server started in ${process.uptime().toFixed(2)}s`);
});
