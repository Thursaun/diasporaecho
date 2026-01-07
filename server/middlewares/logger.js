const winston = require('winston');
const expressWinston = require('express-winston');

const requestLogger = expressWinston.logger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        }),
    ],
    format: winston.format.json(),
    level: 'info',
    msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
});

const errorLogger = expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        }),
    ],
    format: winston.format.json(),
    level: 'error',
});

module.exports = {
    requestLogger,
    errorLogger,
};