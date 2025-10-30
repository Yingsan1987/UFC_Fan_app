const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const chatSocket = require('./sockets/chatSocket');

dotenv.config();

// Connect to MongoDB (optional - app can work without it)
connectDB().catch(err => {
  console.log('⚠️  MongoDB connection failed, but app will continue running');
  console.log('📰 News API will work without database');
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors({
  origin: (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*'),
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/fighters', require('./routes/fighters'));
app.use('/api/events', require('./routes/events'));
app.use('/api/fight-details', require('./routes/fight-details'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/news', require('./routes/news'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/forums', require('./routes/forums'));

// Chat socket
chatSocket(io);

app.get('/', (req, res) => res.json({ message: "UFC Fan App API running" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
