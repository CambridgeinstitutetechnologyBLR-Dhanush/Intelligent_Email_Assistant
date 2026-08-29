const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const config = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const gmailRoutes = require('./routes/gmailRoutes');
const emailRoutes = require('./routes/emailRoutes');
const threadRoutes = require('./routes/threadRoutes');
const aiRoutes = require('./routes/aiRoutes');
const draftRoutes = require('./routes/draftRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Queue imports
const emailSyncQueue = require('./queues/emailSyncQueue');
const aiQueue = require('./queues/aiQueue');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Global middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(apiLimiter);

// Connect to MongoDB
connectDB();

// Initialize queues (graceful fallback if Redis unavailable)
emailSyncQueue.init();
aiQueue.init();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/activity', activityRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
server.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

module.exports = app;
