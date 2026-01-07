const router = require('express').Router();
const { getCurrentUser, saveFigure, getSavedFigures } = require('../controllers/users');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/me', getCurrentUser);
router.post('/me/saved', saveFigure);
router.get('/me/saved', getSavedFigures);

module.exports = router;