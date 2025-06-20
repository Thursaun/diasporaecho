const jwt = require('jsonwebtoken');
const UnauthorizedError = require('../utils/errors/unauthorizedError');
const { JWT_SECRET } = require('../config/config');
const { ERROR_MESSAGES } = require('../config/constants');

module.exports = function(req, res, next) {
    const {authorization} = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
    }

    const token = authorization.replace('Bearer ', '');

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
        }

        req.user = payload;
        return next();
    }
    );
};