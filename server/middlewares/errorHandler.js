const { ERROR_MESSAGES } = require('../config/constants');

module.exports = (err, req, res, next) => {
    const { statusCode = 500, message } = err;

    res.status(statusCode).send({
        message: statusCode === 500
            ? ERROR_MESSAGES.INTERNAL_SERVER_ERROR
            : message,
    });

    next();
}