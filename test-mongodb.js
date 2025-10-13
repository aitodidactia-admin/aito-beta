const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection and data saving
async function testMongoDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-ai-agent', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create test user schema
    const userSchema = new mongoose.Schema({
      userId: { type: String, required: true, unique: true },
      username: { type: String, default: 'Guest' },
      ipAddress: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    });

    const User = mongoose.model('User', userSchema);

    // Create a test user
    const testUser = new User({
      userId: `test_${Date.now()}`,
      username: 'Test User',
      ipAddress: '127.0.0.1'
    });

    console.log('💾 Saving test user to database...');
    const savedUser = await testUser.save();
    console.log('✅ Test user saved successfully:', {
      userId: savedUser.userId,
      username: savedUser.username,
      ipAddress: savedUser.ipAddress,
      createdAt: savedUser.createdAt
    });

    // Query the user back
    console.log('🔍 Querying user from database...');
    const foundUser = await User.findOne({ userId: savedUser.userId });
    console.log('✅ User found in database:', foundUser);

    // Count total users
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);

    console.log('🎉 MongoDB test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testMongoDB();
