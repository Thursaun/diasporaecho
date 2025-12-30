const jwt = require('jsonwebtoken');
const UnauthorizedError = require('../utils/errors/UnauthorizedError');
const { JWT_SECRET } = require('../config/config');
const { ERROR_MESSAGES } = require('../config/constants');
const User = require('../models/user');

module.exports = async function (req, res, next) {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
    }

    const token = authorization.replace('Bearer ', '');

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        // Fetch user with role for admin checks
        const user = await User.findById(payload._id).select('_id role name email');
        if (!user) {
            return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
        }

        req.user = user;
        return next();
    } catch (err) {
        return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
    }
};