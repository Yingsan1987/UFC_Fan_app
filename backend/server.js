const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const chatSocket = require('./sockets/chatSocket');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/fighters', require('./routes/fighters'));
app.use('/api/events', require('./routes/events'));
app.use('/api/chat', require('./routes/chat'));

// Chat socket
chatSocket(io);

app.get('/', (req, res) => res.json({ message: "UFC Fan App API running" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
