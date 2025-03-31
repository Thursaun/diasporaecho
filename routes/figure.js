const express = require('express');
const router = express.Router();
const Figure = require('../models/figure');

router.get('/', function(req, res) {
    const { q, rows, start, sort } = req.query;

    smithsonianService.searchFigures({
        q,
        rows: rows ? parseInt(rows) : 10,
        start: start ? parseInt(start) : 0,
        sort,
    })
    .then(function(results) {
        res.json(results);
    })
    .catch(function(err) {
        res.status(500).json({ error: err.message });
    });
});

router.get('/:id', function(req, res) {
    const searchTerm = req.params.term;

    smithsonianService.searchFigures({
        q: searchTerm,
    })
    .then(function(results) {
        res.json(results);
    })
    .catch(function(err) {
        res.status(500).json({ error: err.message });
    });
});

module.exports = router;