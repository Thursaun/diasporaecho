const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const BadRequestError = require('../utils/errors/BadRequestError');
const NotFoundError = require('../utils/errors/NotFoundError');
const ConflictError = require('../utils/errors/ConflictError');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/config');
const { ERROR_MESSAGES } = require('../config/constants');

function getCurrentUser(req, res, next) {
    const { _id } = req.user;

    User.findById(_id)
        .orFail(() => {
            throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
        })
        .then((user) => res.status(200).send(user))
        .catch(next);
}

function createUser(req, res, next) {
    const { name, email, password } = req.body;

    bcrypt.hash(password, 10)
        .then((hash) => User.create({ name, email, password: hash }))
        .then((user) => {
            res.status(201).send({
                name: user.name,
                email: user.email,
                _id: user._id,
            });
        })
        .catch((err) => {
            if (err.code === 11000) {
                return next(new ConflictError(ERROR_MESSAGES.EMAIL_CONFLICT));
            }
            if (err.name === 'ValidationError') {
                return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
            }
            return next(err);
        });
}

function login(req, res, next) {
    const { email, password } = req.body;

    User.findUserByCredentials(email, password)
        .then((user) => {
            const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
            res.status(200).send({ token });
        })
        .catch(next);
}

module.exports = {
    getCurrentUser,
    createUser,
    login,
};