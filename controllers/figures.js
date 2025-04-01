const Figure = require('../models/figure');
const { ERROR_MESSAGES } = require('../config/constants');
const NotFoundError = require('../utils/errors/NotFoundError');
const UnauthorizedError = require('../utils/errors/unauthorizedError');

const getFigures = (req, res, next) => {
    Figure.find({})
        .then((figures) => res.status(200).json(figures))
        .catch((err) => res.status(500).json({ message: err.message }));
};

const deleteFigure = (req, res, next) => {
    Figure.findByIdAndDelete(req.params.id)
        .then((figure) => {
            if (!figure) {
                throw new NotFoundError(ERROR_MESSAGES.FIGURE_NOT_FOUND);
            }
            if (figure.owner.toString() !== req.user._id) {
                throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
            }
            res.status(200).json({ message: 'Figure deleted successfully' });
        })
        .catch((err) => res.status(500).json({ message: err.message }));
}

const likeFigure = (req, res, next) => {
    Figure.findByIdAndUpdate(req.params.id)
        .then((figure) => {
            if (!figure) {
                return res.status(404).json({ message: 'Figure not found' });
            }
            figure.likes = (figure.likes || 0) + 1;
            return figure.save();
        })
        .then((figure) => res.status(200).json(figure))
        .catch((err) => res.status(500).json({ message: err.message }));
}



module.exports = {
    getFigures, deleteFigure, likeFigure
};