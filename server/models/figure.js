const mongoose = require("mongoose");

const FigureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  years: {
    type: String,
  },
  source: {
    type: String,
    default: "Wikipedia",
  },
  sourceUrl: {
    type: String,
    default: "https://www.si.edu/",
  },
  owners: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    default: []
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []  // This ensures it's always an array
  },
  wikipediaId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contributions: [
    {
      type: String,
    },
  ],
  tags: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    enum: [
      "Intellectuals Leaders",
      "Civil Rights Activists",
      "Political Leaders",
      "Educators & Scholars",
      "Arts, Culture & Entertainment",
      "Inventors & Innovators",
      "Athletic Icons",
      "Freedom Fighters",
      "Pan-African Leaders",
      "Literary Icons",
    ],
    required: true,
  },
});

FigureSchema.index({ name: 1, imageUrl: 1 }); 
FigureSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model("Figure", FigureSchema);
