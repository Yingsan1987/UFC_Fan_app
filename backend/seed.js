require('dotenv').config();
const mongoose = require('mongoose');
const Fighter = require('./models/Fighter');
const connectDB = require('./config/database');

const seedFighters = async () => {
  await connectDB();

  const fighters = [
    { name: 'Conor McGregor', division: 'Lightweight', record: '22-6-0' },
    { name: 'Khabib Nurmagomedov', division: 'Lightweight', record: '29-0-0' },
    { name: 'Jon Jones', division: 'Heavyweight', record: '27-1-0 (1 NC)' },
    { name: 'Israel Adesanya', division: 'Middleweight', record: '24-3-0' }
  ];

  try {
    await Fighter.deleteMany();
    await Fighter.insertMany(fighters);
    console.log('✅ Fighters seeded successfully');
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding fighters:', err);
    process.exit(1);
  }
};

seedFighters();
