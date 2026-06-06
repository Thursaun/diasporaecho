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


const getSavedFigures = (req, res, next) => {
    const { _id: userId } = req.user;

    User.findById(userId)
        .populate('savedFigures')
        .then((user) => {
            if (!user) {
                throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
            } 
            
            const savedFigures = Array.isArray(user.savedFigures) ? user.savedFigures : [];
            
            console.log(`User ${userId} has ${savedFigures.length} saved figures`);
            console.log('First saved figure:', savedFigures[0]); // Debug log
            res.status(200).send(savedFigures);
        })
        .catch(next);
};

const googleSignIn = (req, res, next) => {
    const { token } = req.body;

    fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
        .then((response) => {
            if (!response.ok) {
                throw new BadRequestError("Invalid Google ID token");
            }
            return response.json();
        })
        .then((payload) => {
            const { email, name } = payload;
            
            if (!email) {
                throw new BadRequestError("Email not returned by Google");
            }

            // Find user by email
            return User.findOne({ email }).then((user) => {
                if (user) {
                    return user;
                }
                
                // Create user if not exists
                // Generate a random password since they sign in with Google
                return bcrypt.hash(Math.random().toString(36).slice(-10), 10)
                    .then((hashedPassword) => {
                        return User.create({
                            name: name || email.split('@')[0],
                            email,
                            password: hashedPassword,
                        });
                    });
            });
        })
        .then((user) => {
            const jwtToken = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
            res.status(200).send({ token: jwtToken });
        })
        .catch(next);
};

module.exports = {
    getCurrentUser,
    createUser,
    login,
    getSavedFigures,
    googleSignIn,
};