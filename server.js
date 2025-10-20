const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] 📨 ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-ai-agent', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: 'Guest' },
  ipAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  totalSessions: { type: Number, default: 0 }
});

// Conversation Session Schema
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  ipAddress: { type: String, required: true },
  conversationData: {
    messages: [{
      role: { type: String, enum: ['user', 'assistant'] },
      content: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    summary: { type: String },
    topics: [{ type: String }]
  },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' }
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  feedbackId: { type: String, required: true, unique: true },
  email: { type: String },
  message: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'reviewed', 'resolved'], default: 'new' }
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);
const ConversationSession = mongoose.model('ConversationSession', sessionSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const Admin = mongoose.model('Admin', adminSchema);


// Admin seeder function
async function seedAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const admin = new Admin({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@aito-ai.com',
        role: 'super_admin'
      });
      await admin.save();
      console.log('✅ Default admin created: username: admin, password: 123456');
    } else {
      console.log('✅ Admin already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  }
}

// Middleware for admin authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Admin authentication routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign(
      { adminId: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`[${new Date().toISOString()}] 🔐 Admin login: ${username}`);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Admin login error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin change password
app.put('/api/admin/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const admin = await Admin.findById(req.admin._id);
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedNewPassword;
    await admin.save();

    console.log(`[${new Date().toISOString()}] 🔐 Admin password changed: ${admin.username}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Password change error:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes

// Create or get user
app.post('/api/users', async (req, res) => {
  try {
    const { ipAddress } = req.body;
    console.log(`[${new Date().toISOString()}] 👤 Creating/getting user for IP: ${ipAddress}`);
    
    // Check if user already exists by IP
    let user = await User.findOne({ ipAddress });
    
    if (!user) {
      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      user = new User({
        userId,
        username: 'Guest',
        ipAddress,
      });
      await user.save();
      console.log(`[${new Date().toISOString()}] ✅ NEW USER CREATED:`, {
        userId: user.userId,
        username: user.username,
        ipAddress: user.ipAddress,
        createdAt: user.createdAt
      });
    } else {
      // Update last active time
      user.lastActiveAt = new Date();
      await user.save();
      console.log(`[${new Date().toISOString()}] 🔄 EXISTING USER UPDATED:`, {
        userId: user.userId,
        username: user.username,
        ipAddress: user.ipAddress,
        lastActiveAt: user.lastActiveAt,
        totalSessions: user.totalSessions
      });
    }
    
    res.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        ipAddress: user.ipAddress,
        totalSessions: user.totalSessions
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error creating/getting user:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user username
app.put('/api/users/:userId/username', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;
    
    const user = await User.findOneAndUpdate(
      { userId },
      { username, lastActiveAt: new Date() },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        ipAddress: user.ipAddress,
        totalSessions: user.totalSessions
      }
    });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start conversation session
app.post('/api/sessions', async (req, res) => {
  try {
    const { userId, ipAddress } = req.body;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${new Date().toISOString()}] 🎤 Starting session for user: ${userId}`);
    
    const session = new ConversationSession({
      sessionId,
      userId,
      startTime: new Date(),
      ipAddress,
      status: 'active'
    });
    
    await session.save();
    console.log(`[${new Date().toISOString()}] ✅ SESSION STARTED:`, {
      sessionId: session.sessionId,
      userId: session.userId,
      startTime: session.startTime,
      ipAddress: session.ipAddress,
      status: session.status
    });
    
    // Update user's total sessions
    await User.findOneAndUpdate(
      { userId },
      { $inc: { totalSessions: 1 }, lastActiveAt: new Date() }
    );
    console.log(`[${new Date().toISOString()}] 📊 User session count updated for: ${userId}`);
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        startTime: session.startTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error starting session:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// End conversation session
app.put('/api/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { conversationData } = req.body;
    
    console.log(`[${new Date().toISOString()}] 🛑 Ending session: ${sessionId}`);
    
    const endTime = new Date();
    const session = await ConversationSession.findOne({ sessionId });
    
    if (!session) {
      console.log(`[${new Date().toISOString()}] ❌ Session not found: ${sessionId}`);
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const duration = Math.floor((endTime - session.startTime) / 1000); // in seconds
    
    session.endTime = endTime;
    session.duration = duration;
    
    // Determine session status based on conversation data or reason
    const messageCount = conversationData?.messages?.length || 0;
    if (messageCount === 0) {
      session.status = 'abandoned'; // No messages = abandoned call
    } else {
      session.status = 'completed'; // Has messages = completed call
    }
    
    if (conversationData) {
      session.conversationData = conversationData;
      console.log(`[${new Date().toISOString()}] 💬 Conversation data saved: ${messageCount} messages`);
    }
    
    await session.save();
    console.log(`[${new Date().toISOString()}] ✅ SESSION ENDED:`, {
      sessionId: session.sessionId,
      userId: session.userId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      messageCount: session.conversationData?.messages?.length || 0,
      status: session.status
    });
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error ending session:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add conversation message
app.post('/api/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content } = req.body;
    
    console.log(`[${new Date().toISOString()}] 💬 Adding message to session ${sessionId}:`, { role, content: content?.substring(0, 50) + '...' });
    
    const session = await ConversationSession.findOneAndUpdate(
      { sessionId },
      { $push: { 'conversationData.messages': { role, content, timestamp: new Date() } } },
      { new: true }
    );
    
    if (!session) {
      console.log(`[${new Date().toISOString()}] ❌ Session not found for message: ${sessionId}`);
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    console.log(`[${new Date().toISOString()}] ✅ Message saved to session ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error adding message:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user sessions
app.get('/api/users/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const sessions = await ConversationSession.find({ userId })
      .sort({ startTime: -1 })
      .limit(50); // Limit to last 50 sessions
    
    res.json({
      success: true,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        messageCount: session.conversationData?.messages?.length || 0
      }))
    });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session details
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ConversationSession.findOne({ sessionId }).populate('userId');
    
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        conversationData: session.conversationData
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark session as abandoned (for cleanup of incomplete sessions)
app.put('/api/sessions/:sessionId/abandon', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`[${new Date().toISOString()}] 🚫 Marking session as abandoned: ${sessionId}`);
    
    const endTime = new Date();
    const session = await ConversationSession.findOne({ sessionId });
    
    if (!session) {
      console.log(`[${new Date().toISOString()}] ❌ Session not found for abandon: ${sessionId}`);
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    const duration = Math.floor((endTime - session.startTime) / 1000);
    
    session.endTime = endTime;
    session.duration = duration;
    session.status = 'abandoned';
    
    await session.save();
    console.log(`[${new Date().toISOString()}] ✅ SESSION ABANDONED:`, {
      sessionId: session.sessionId,
      userId: session.userId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status
    });
    
    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error abandoning session:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
// Submit feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message, rating, category } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    console.log(`[${new Date().toISOString()}] 📝 New feedback submission from: ${name}`);
    
    // Generate unique feedback ID
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const feedback = new Feedback({
      feedbackId,
      name,
      email: email || '',
      message,
      rating,
      category,
      ipAddress,
      status: 'new'
    });
    
    await feedback.save();
    
    console.log(`[${new Date().toISOString()}] ✅ Feedback saved:`, {
      feedbackId: feedback.feedbackId,
      name: feedback.name,
      rating: feedback.rating,
      category: feedback.category,
      createdAt: feedback.createdAt
    });
    
    res.json({
      success: true,
      feedback: {
        feedbackId: feedback.feedbackId,
        name: feedback.name,
        rating: feedback.rating,
        category: feedback.category,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error saving feedback:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all feedback (admin endpoint)
app.get('/api/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.find({}).sort({ createdAt: -1 });
    
    console.log(`[${new Date().toISOString()}] 📊 Retrieved ${feedback.length} feedback entries`);
    
    res.json({
      success: true,
      feedback: feedback.map(f => ({
        feedbackId: f.feedbackId,
        name: f.name,
        email: f.email,
        message: f.message,
        rating: f.rating,
        category: f.category,
        createdAt: f.createdAt,
        status: f.status
      }))
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error retrieving feedback:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, message, rating, category } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`[${new Date().toISOString()}] 📝 New feedback submission from: ${name}`);
    
    // Generate unique feedback ID
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const feedback = new Feedback({
      feedbackId,
      name,
      email,
      message,
      rating,
      category,
      ipAddress,
      userAgent
    });
    
    await feedback.save();
    
    console.log(`[${new Date().toISOString()}] ✅ FEEDBACK SAVED:`, {
      feedbackId: feedback.feedbackId,
      name: feedback.name,
      category: feedback.category,
      rating: feedback.rating,
      submittedAt: feedback.submittedAt
    });
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback.feedbackId
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error saving feedback:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Admin dashboard routes
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching users:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/user/:userId/sessions', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await ConversationSession.find({ userId })
      .sort({ startTime: -1 });

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching user sessions:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/feedback', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find({})
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalFeedback = await Feedback.countDocuments();

    res.json({
      success: true,
      feedback,
      pagination: {
        page,
        limit,
        total: totalFeedback,
        pages: Math.ceil(totalFeedback / limit)
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching feedback:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/feedback/:feedbackId/status', authenticateAdmin, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findOneAndUpdate(
      { feedbackId },
      { status },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error updating feedback status:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSessions = await ConversationSession.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    const activeSessions = await ConversationSession.countDocuments({ status: 'active' });

    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    const recentFeedback = await Feedback.find({})
      .sort({ submittedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers,
          totalSessions,
          totalFeedback,
          activeSessions
        },
        recentUsers,
        recentFeedback
      }
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching dashboard data:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Voice AI Agent API is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🔐 Admin panel available at http://localhost:${PORT}/backoffice`);
  
  // Seed admin user
  await seedAdmin();
});
