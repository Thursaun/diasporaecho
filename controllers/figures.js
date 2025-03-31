const Figure = require('../models/figure');

const getFigures = (req, res, next) => {
    Figure.find({})
        .then((figures) => res.status(200).json(figures))
        .catch((err) => res.status(500).json({ message: err.message }));
};

const deleteFigure = (req, res, next) => {
    Figure.findByIdAndDelete(req.params.id)
        .then((figure) => {
            if (!figure) {
                return res.status(404).json({ message: 'Figure not found' });
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