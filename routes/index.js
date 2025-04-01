const router = require('express').Router();
const userRoutes = require('./users');
const figureRoutes = require('./figures');
const { login, createUser } = require('../controllers/users');
const auth = require('../middlewares/auth');
const {validateSignUp, validateSignin} = require('../middlewares/validation');
const NotFoundError = require('../utils/errors/NotFoundError');
const { ERROR_MESSAGES } = require('../config/constants');

// Public routes
router.post('/signin', validateSignin, login);
router.post('/signup', validateSignUp, createUser);

// Protected routes
router.use(auth);
router.use('/users', userRoutes);
router.use('/figures', figureRoutes);

// 404 route
router.use((req, res, next) => {
    next(new NotFoundError(ERROR_MESSAGES.NOT_FOUND));
});

module.exports = router;