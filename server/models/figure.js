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
  // Multi-category support: figures can belong to multiple categories
  categories: {
    type: [String],
    enum: [
      "Scholars & Educators",
      "Activists & Freedom Fighters",
      "Political Leaders",
      "Arts & Entertainment",
      "Musicians",
      "Inventors & Innovators",
      "Athletes",
      "Pan-African Leaders",
      "Literary Icons",
      "Business & Entrepreneurs",
    ],
    default: ["Scholars & Educators"],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'At least one category is required'
    }
  },
  // PERFORMANCE: Featured figures tracking for daily rotation
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  featuredRank: {
    type: Number,  // 1 = 🥇 Most Liked, 2 = 🥈 Popular, 3 = 🥉 Featured
    default: null,
  },
  featuredSince: {
    type: Date,
    default: null,
  },
  // Enhanced metadata from Wikidata
  occupation: {
    type: [String],
    default: [],
  },
  birthPlace: {
    type: String,
    default: null,
  },
  deathPlace: {
    type: String,
    default: null,
  },
  awards: {
    type: [String],
    default: [],
  },
  education: {
    type: [String],
    default: [],
  },
  notableWorks: {
    type: [String],
    default: [],
  },
  movement: {
    type: [String],
    default: [],
  },
  // Tracking Metrics for Featured Selection
  views: {
    type: Number,
    default: 0,
    index: true,
  },
  searchHits: {
    type: Number,
    default: 0,
    index: true,
  },
  // PRIMARY FIGURE PRIORITIZATION: For boosting people of color in search
  isPrimaryFigure: {
    type: Boolean,
    default: true,  // Assume primary unless marked as ally
    index: true,
  },
  ethnicGroup: {
    type: [String],  // From Wikidata P172
    default: [],
  },
});

// PERFORMANCE: Compound indexes for common queries
FigureSchema.index({ name: 1, imageUrl: 1 });
FigureSchema.index({ name: 'text', description: 'text', category: 'text' });
FigureSchema.index({ occupation: 1 });
FigureSchema.index({ likes: -1, createdAt: -1 }); // Most Liked sorting
FigureSchema.index({ views: -1, createdAt: -1 }); // Most Popular sorting
FigureSchema.index({ searchHits: -1, createdAt: -1 }); // Featured (Search) sorting
FigureSchema.index({ isFeatured: 1, featuredRank: 1 }); // Featured lookup
FigureSchema.index({ createdAt: -1 }); // Default sorting

module.exports = mongoose.model("Figure", FigureSchema);

