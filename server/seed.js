require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('⚠️  Admin user already exists. Skipping seed.');
    } else {
      const passwordHash = await bcrypt.hash('admin123', 12);
      await User.create({ username: 'admin', passwordHash });
      console.log('✅ Admin user created: username=admin, password=admin123');
      console.log('⚠️  IMPORTANT: Change the admin password after first login!');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
