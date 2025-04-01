const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { errors } = require('celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const limiter = require('./middlewares/rateLimiter');
const routes = require('./routes/index');


require('dotenv').config();
const { PORT , MONGODB_URL} = require('./config/config');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(requestLogger);
app.use(limiter);
app.use('/api', routes);

mongoose.connect(MONGODB_URL || 'mongodb://localhost:27017/diasporaecho')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

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


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;