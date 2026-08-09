const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { successResponse } = require('./utils/response');

const app = express();

// ── Security ──
app.use(helmet());

// ── CORS ──
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// ── Request logging ──
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Body parsing ──
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate limiting ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api/', apiLimiter);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  return successResponse(res, null, 'Server is running');
});

// ── Routes ──
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// ── 404 Handler ──
app.use(notFound);

// ── Centralized Error Handler ──
app.use(errorHandler);

module.exports = app;
