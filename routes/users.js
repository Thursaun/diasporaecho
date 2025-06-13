const router = require('express').Router();
const { getCurrentUser, saveFigure, getSavedFigures, removeSavedFigure} = require('../controllers/users');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/me', getCurrentUser);
router.post('/me/saved', saveFigure);
router.get('/me/saved', getSavedFigures);
router.delete('/me/saved/:figureId', removeSavedFigure);

module.exports = router;