const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression'); // Import compression
const { errors } = require('celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const limiter = require('./middlewares/rateLimiter');
const routes = require('./routes/index');


require('dotenv').config();
const { MONGODB_URL } = require('./config/config');

const app = express();

const PORT = process.env.PORT || 3000;

// PERFORMANCE: Optimized compression — level 6 is the sweet spot for CPU vs size
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));
app.use(helmet());

// PERFORMANCE: Keep-alive headers to reuse TCP connections
app.use((req, res, next) => {
  res.set({
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100',
  });
  next();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://thursaun.github.io',
  'https://Thursaun.github.io',
  'https://diasporaecho.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Explicit preflight handling for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());

// PERFORMANCE: Lightweight health endpoint — no DB, no auth, no rate limit.
// Responds instantly even during cold start (before MongoDB connects).
// Clients can ping this to wake Render without blocking on DB queries.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

app.use(requestLogger);
app.use(limiter);
app.use('/api', routes);

// PERFORMANCE: MongoDB connection with optimized pooling
// PERFORMANCE: Import featured figures service to warm cache on startup
const FeaturedFiguresService = require('./services/featuredFiguresService');

mongoose.connect(MONGODB_URL, {
  maxPoolSize: 10,       // Handle concurrent requests without waiting
  socketTimeoutMS: 30000, // 30s socket timeout
  serverSelectionTimeoutMS: 5000, // Fail fast if server unreachable
})
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.name);

    // PERFORMANCE: Pre-warm the featured figures cache on startup.
    // First request after cold start would otherwise trigger multiple DB queries.
    // By warming here, /api/figures/featured responds from memory instantly.
    FeaturedFiguresService.getOrRefreshFeatured()
      .then((figures) => {
        console.log(`🔥 Warmed featured figures cache: ${figures.length} figures ready`);
      })
      .catch((err) => {
        console.warn('⚠️ Failed to warm featured cache (non-critical):', err.message);
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Connection string (without password):', MONGODB_URL.replace(/:[^:]*@/, ':***@'));
    process.exit(1);
  });

app.use(errorLogger);
app.use(errors());
app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).send({
    message: statusCode === 500
      ? 'Internal Server Error'
      : message,
  });
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('🔗 Backend ready for connections');
});

module.exports = app;