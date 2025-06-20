const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { errors } = require('celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const limiter = require('./middlewares/rateLimiter');
const routes = require('./routes/index');


require('dotenv').config();
const { MONGODB_URL} = require('./config/config');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://thursaun.github.io',
    'https://Thursaun.github.io'
  ],
  credentials: true
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