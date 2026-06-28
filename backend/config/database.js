const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB connection options for better performance
    const options = {
      maxPoolSize: 10,           // Maintain up to 10 socket connections
      minPoolSize: 2,            // Maintain at least 2 connections
      serverSelectionTimeoutMS: 5000,  // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,    // Close sockets after 45 seconds of inactivity
      family: 4,                 // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority'
    };

    // Accept either env var name — render.yaml documents MONGODB_URI while the
    // app historically read MONGO_URI. Supporting both avoids a silent failure
    // (mongoose.connect(undefined) -> 5s serverSelectionTimeout on every request).
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error(
        'No MongoDB connection string found. Set MONGO_URI (or MONGODB_URI) in your environment.'
      );
    }

    const conn = await mongoose.connect(mongoUri, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Connection event handlers
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
