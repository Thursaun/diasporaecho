const Figure = require("../models/figure");
const User = require("../models/user");
const { ERROR_MESSAGES } = require("../config/constants");
const NotFoundError = require("../utils/errors/NotFoundError");
const UnauthorizedError = require("../utils/errors/UnauthorizedError");

const getFigures = (req, res, next) => {
  Figure.find({})
    .select("-owners")
    .sort({ createdAt: -1 })
    .then((figures) => res.status(200).json(figures))
    .catch((err) => res.status(500).json({ message: err.message }));
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

const getFeaturedFigures = (req, res, next) => {
  Figure.find({})
    .select("-owners -likedBy")
    .sort({ likes: -1 })
    .limit(3)
    .exec()
    .then((featuredFigures) => {
      res.status(200).json(featuredFigures);
    })
    .catch((error) => {
      next(error);
    });
};

const searchFigures = (req, res, next) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const searchRegex = new RegExp(query, 'i');
  
  Figure.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { tags: { $in: [searchRegex] } }
    ]
  })
    .select('-owners')
    .then(figures => {
      res.status(200).json(figures);
    })
    .catch(error => {
      next(error);
    });
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
