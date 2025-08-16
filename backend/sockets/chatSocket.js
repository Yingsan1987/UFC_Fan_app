const Message = require('../models/Message');

function chatSocket(io) {
  io.on('connection', (socket) => {
    console.log('👥 User connected');

    socket.on('chatMessage', async (msg) => {
      const message = new Message(msg);
      await message.save();
      io.emit('chatMessage', message);
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected');
    });
  });
}

module.exports = chatSocket;
