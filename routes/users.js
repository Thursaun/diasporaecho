const router = require('express').Router();
const { getCurrentUser} = require('../controllers/users');

router.get('/me', getCurrentUser);

module.exports = router;