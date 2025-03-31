const mongoose = require('mongoose');

const FigureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    birthYear: {
        type: Number,
        required: true,
    },
    deathYear: {
        type: Number,
    },
    biography: {
        type: String,
        required: true,
    },
    contributions: [{
        type: String,
        required: true,
    }],
    imageUrl: {
        type: String,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
    }],
    era: {
        type: String,
        required: true,
    },
    region: {
        type: String,
        required: true,
    },
    references: [{
       title: String,
       url: String
    }],
    featuredQuote: {
        type: String,
    },
    tags: [{
        type: String,
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});     

module.exports = mongoose.model('Figure', FigureSchema);
