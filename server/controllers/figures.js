const Figure = require("../models/figure");
const User = require("../models/user");
const { ERROR_MESSAGES } = require("../config/constants");
const NotFoundError = require("../utils/errors/NotFoundError");
const UnauthorizedError = require("../utils/errors/UnauthorizedError");
const FeaturedFiguresService = require("../services/featuredFiguresService");
const { cacheService, CACHE_TTL } = require("../services/cacheService");

// PERFORMANCE: Optimized getFigures with caching
const getFigures = async (req, res, next) => {
  try {
    const cacheKey = 'figures:all';
    
    // Check cache first
    const cached = cacheService.get(cacheKey);
    if (cached) {
      // Add cache headers for browser caching
      res.set({
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'X-Cache': 'HIT'
      });
      return res.status(200).json(cached);
    }

    // Fetch from database
    const figures = await Figure.find({})
      .select("-owners")
      .sort({ createdAt: -1 })
      .lean() // PERFORMANCE: Return plain objects
      .exec();

    // Cache the result
    cacheService.set(cacheKey, figures, CACHE_TTL.FIGURES_ALL);

    res.set({
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      'X-Cache': 'MISS'
    });
    res.status(200).json(figures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFigureById = (req, res, next) => {
  const { id } = req.params;

  Figure.findById(id)
    .then((figure) => {
      if (!figure) {
        throw new NotFoundError(ERROR_MESSAGES.FIGURE_NOT_FOUND);
      }
      res.status(200).json(figure);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        return res.status(400).json({ message: ERROR_MESSAGES.BAD_REQUEST });
      }
      return res.status(500).json({ message: err.message });
    });
};

const getFigureByWikipediaId = (req, res, next) => {
  const { wikipediaId } = req.params;

  Figure.findOne({ wikipediaId })
    .then((figure) => {
      if (!figure) {
        throw new NotFoundError(ERROR_MESSAGES.FIGURE_NOT_FOUND);
      }
      res.status(200).json(figure);
    })
    .catch((err) => {
      if (err.name === "CastError") {
        return res.status(400).json({ message: ERROR_MESSAGES.BAD_REQUEST });
      }
      return res.status(500).json({ message: err.message });
    });
};

const saveFigure = (req, res, next) => {
  const userId = req.user._id;
  const figureData = req.body;

  console.log("Saving figure:", figureData);
  console.log("User ID:", userId);

  if (!figureData.name) {
    return res.status(400).json({ message: "Figure name is required" });
  }

  // FIX: Don't require wikipediaId in request, generate if missing
  const wikipediaId = figureData.wikipediaId || 
    `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log("Using wikipediaId:", wikipediaId);

  // Check if figure already exists by wikipediaId
  Figure.findOne({ wikipediaId })
    .then((existingFigure) => {
      if (existingFigure) {
        console.log("Figure exists, adding user to owners");
        if (!existingFigure.owners.includes(userId)) {
          existingFigure.owners.push(userId);
          return existingFigure.save();
        }
        return existingFigure;
      } else {
        console.log("Creating new figure with wikipediaId:", wikipediaId);
        const newFigure = new Figure({
          name: figureData.name,
          description: figureData.description || "",
          imageUrl: figureData.imageUrl || figureData.image || "",
          years: figureData.years || "",
          category: figureData.category || "Intellectuals Leaders",
          tags: figureData.tags || [],
          source: figureData.source || "Wikipedia",
          wikipediaId: wikipediaId,
          owners: [userId],
          likes: 0,
          likedBy: [],
        });
        return newFigure.save();
      }
    })
    .then((savedFigure) => {
      console.log("Figure saved, updating user");
      return User.findById(userId).then((user) => {
        if (!user) {
          throw new Error("User not found");
        }
        
        if (!user.savedFigures.includes(savedFigure._id)) {
          user.savedFigures.push(savedFigure._id);
          return user.save().then(() => savedFigure);
        }
        return savedFigure;
      });
    })
    .then((finalFigure) => {
      console.log("Save operation completed successfully");
      const { owners, ...publicFigure } = finalFigure.toObject();
      res.status(200).json(publicFigure);
    })
    .catch((error) => {
      console.error("Error in saveFigure:", error);
      res.status(500).json({ 
        message: "Failed to save figure", 
        error: error.message 
      });
    });
};

const likeFigure = (req, res, next) => {
  const userId = req.user._id;
  const figureId = req.params.figureId;

  console.log("Liking figure with ID:", figureId);
  console.log("User ID:", userId);

  const findQuery = figureId.startsWith('custom_') || figureId.includes('_') 
    ? { wikipediaId: figureId }
    : { $or: [{ _id: figureId }, { wikipediaId: figureId }] };

  Figure.findOne(findQuery)
    .then((figure) => {
      if (!figure) {
        console.log("Figure not found with ID:", figureId);
        return res.status(404).json({ message: "Figure not found" });
      }

      console.log("Found figure:", figure.name);
      console.log("Current likes:", figure.likes);
      console.log("Current likedBy:", figure.likedBy);

      const userLikedIndex = figure.likedBy.indexOf(userId);

      if (userLikedIndex === -1) {
        figure.likedBy.push(userId);
        figure.likes = figure.likedBy.length;
        console.log("Adding like. New likes count:", figure.likes);
      } else {
        figure.likedBy.splice(userLikedIndex, 1);
        figure.likes = figure.likedBy.length;
        console.log("Removing like. New likes count:", figure.likes);
      }

      return figure.save();
    })
    .then((savedFigure) => {
      console.log("Saved figure with likes:", savedFigure.likes);
      res.status(200).json(savedFigure);
    })
    .catch((error) => {
      console.error("Error in likeFigure:", error);
      next(error);
    });
};


const unsaveFigure = (req, res, next) => {
  const { _id: userId } = req.user;
  const { figureId } = req.params;

  console.log('Unsaving figure:', figureId, 'for user:', userId);

  User.findByIdAndUpdate(
    userId,
    { $pull: { savedFigures: figureId } },
    { new: true }
  )
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log(`Figure ${figureId} removed from user ${userId}'s saved list`);

      const findQuery = figureId.match(/^[0-9a-fA-F]{24}$/) 
        ? { _id: figureId } 
        : { wikipediaId: figureId };

      return Figure.findOne(findQuery);
    })
    .then((figure) => {
      if (figure) {
        figure.owners = figure.owners.filter(
          (ownerId) => ownerId.toString() !== userId.toString()
        );

        return figure.save().then(() => {
          console.log(`User ${userId} removed from figure ${figureId}'s owners`);
          res.status(200).json({ 
            message: 'Figure unsaved successfully',
            figureId: figureId 
          });
        });
      } else {
        console.log(`Figure ${figureId} not found, but removed from user's saved list`);
        res.status(200).json({ 
          message: 'Figure removed from saved list',
          figureId: figureId 
        });
      }
    })
    .catch((error) => {
      console.error('Error unsaving figure:', error);
      next(error);
    });
};

// PERFORMANCE: Optimized featured figures using daily caching
const getFeaturedFigures = async (req, res, next) => {
  try {
    // Smart get: Returns cached featured figures or refreshes if >24h old
    const featuredFigures = await FeaturedFiguresService.getOrRefreshFeatured();

    // PERFORMANCE: Add HTTP cache headers for browser caching (24 hours)
    res.set({
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600', // 24h cache, 1h stale
      'ETag': `"featured-${featuredFigures[0]?.featuredSince || Date.now()}"`,
      'Vary': 'Accept-Encoding'
    });

    res.status(200).json(featuredFigures);
  } catch (error) {
    console.error('Error getting featured figures:', error);
    next(error);
  }
};

// WIKIPEDIA-STYLE SEARCH: Fuzzy matching with intelligent ranking
const searchFigures = async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const searchTerm = query.trim().toLowerCase();
    const searchWords = searchTerm.split(/\s+/);

    // PERFORMANCE: Use MongoDB text search first for speed
    const textSearchResults = await Figure.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .select('-owners')
      .sort({ score: { $meta: "textScore" } })
      .lean()
      .limit(50);

    // Build flexible search patterns like Wikipedia for supplemental results
    const searchPatterns = [];

    // 1. Exact phrase match (highest priority)
    searchPatterns.push({ name: { $regex: `^${query}$`, $options: 'i' } });

    // 2. Starts with query (very high priority)
    searchPatterns.push({ name: { $regex: `^${query}`, $options: 'i' } });

    // 3. Contains exact phrase
    searchPatterns.push({ name: { $regex: query, $options: 'i' } });

    // 4. Flexible word order - all words present
    if (searchWords.length > 1) {
      const flexiblePattern = searchWords.map(word => `(?=.*${word})`).join('');
      searchPatterns.push({ name: { $regex: flexiblePattern, $options: 'i' } });
    }

    // 5. Any word matches (partial match)
    searchWords.forEach(word => {
      if (word.length >= 2) {
        searchPatterns.push({ name: { $regex: word, $options: 'i' } });
      }
    });

    // 6. Search in occupation, category, tags
    searchPatterns.push({ occupation: { $in: [new RegExp(query, 'i')] } });
    searchPatterns.push({ category: { $regex: query, $options: 'i' } });
    searchPatterns.push({ tags: { $in: [new RegExp(query, 'i')] } });
    searchPatterns.push({ years: { $regex: query, $options: 'i' } });

    // Get supplemental regex results
    const regexResults = await Figure.find({
      $or: searchPatterns
    })
      .select('-owners')
      .lean()
      .limit(50);

    // Combine and deduplicate results
    const allResults = [...textSearchResults, ...regexResults];
    const uniqueResults = Array.from(
      new Map(allResults.map(fig => [fig._id.toString(), fig])).values()
    );

    // WIKIPEDIA-STYLE RANKING: Sort by relevance
    const rankedFigures = uniqueResults.map(figure => {
      let score = 0;
      const nameLower = figure.name.toLowerCase();
      const descLower = (figure.description || '').toLowerCase();

      // Exact match = highest score
      if (nameLower === searchTerm) {
        score += 1000;
      }
      // Starts with query = very high score
      else if (nameLower.startsWith(searchTerm)) {
        score += 500;
      }
      // Contains exact phrase = high score
      else if (nameLower.includes(searchTerm)) {
        score += 250;
      }
      // All words present = good score
      else if (searchWords.every(word => nameLower.includes(word))) {
        score += 100;
      }
      // Some words present = lower score
      else {
        const matchCount = searchWords.filter(word => nameLower.includes(word)).length;
        score += matchCount * 30;
      }

      // Boost if query appears in first 200 chars of description
      if (descLower.substring(0, 200).includes(searchTerm)) {
        score += 75;
      }

      // Boost score if occupation matches
      if (figure.occupation && figure.occupation.some(occ =>
        occ.toLowerCase().includes(searchTerm))) {
        score += 50;
      }

      // Boost if category matches
      if (figure.category && figure.category.toLowerCase().includes(searchTerm)) {
        score += 40;
      }

      // Boost if tags match
      if (figure.tags && figure.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm))) {
        score += 35;
      }

      // Boost by popularity (likes) - Wikipedia prioritizes popular pages
      score += Math.min(figure.likes || 0, 50); // Cap at 50 points

      // Boost if from MongoDB text search (already relevant)
      if (figure.score) {
        score += figure.score * 10;
      }

      return { ...figure, _searchScore: score };
    });

    // Sort by score (descending)
    const sortedFigures = rankedFigures
      .sort((a, b) => b._searchScore - a._searchScore)
      .map(({ _searchScore, score, ...figure }) => figure); // Remove search scores

    console.log(`🔍 Search "${query}": Found ${sortedFigures.length} results`);
    res.status(200).json(sortedFigures);
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
};

module.exports = {
  getFigures,
  saveFigure,
  unsaveFigure,
  likeFigure,
  getFigureById,
  getFigureByWikipediaId,
  getFeaturedFigures,
  searchFigures,
};
