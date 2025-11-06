const Message = require('../models/Message');

function chatSocket(io) {
  io.on('connection', async (socket) => {
    console.log('👥 User connected');

    // Send recent chat history to newly connected user
    try {
      const recentMessages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      
      // Reverse to show oldest first
      socket.emit('chatHistory', recentMessages.reverse());
      console.log(`📜 Sent ${recentMessages.length} recent messages to user`);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }

    socket.on('chatMessage', async (msg) => {
      try {
        const message = new Message(msg);
        await message.save();
        io.emit('chatMessage', message);
        console.log(`💬 Message from ${msg.user}: ${msg.text?.substring(0, 50) || '[Image]'}`);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected');
    });
  });
}

module.exports = chatSocket;
