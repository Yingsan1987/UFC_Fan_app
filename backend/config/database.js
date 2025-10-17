const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ensure the connection string includes the database name 'test'
    let mongoURI = process.env.MONGO_URI;
    if (mongoURI && !mongoURI.includes('/test')) {
      // If the URI doesn't specify a database, append '/test'
      mongoURI = mongoURI.endsWith('/') ? `${mongoURI}test` : `${mongoURI}/test`;
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    throw err; // Don't exit process, just throw error
  }
};

module.exports = connectDB;
