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

app.use(compression()); // Use compression
app.use(helmet());

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

app.use(requestLogger);
app.use(limiter);
app.use('/api', routes);

mongoose.connect(MONGODB_URL)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.name);
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