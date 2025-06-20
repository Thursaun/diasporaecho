const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Figure = require('../models/figure');
const BadRequestError = require('../utils/errors/BadRequestError');
const NotFoundError = require('../utils/errors/NotFoundError');
const ConflictError = require('../utils/errors/ConflictError');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/config');
const { ERROR_MESSAGES } = require('../config/constants');

function getCurrentUser(req, res, next) {
    const { _id } = req.user;

    User.findById(_id)
        .orFail(() => {
            throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
        })
        .then((user) => res.status(200).send(user))
        .catch(next);
}

function createUser(req, res, next) {
    const { name, email, password } = req.body;

    bcrypt.hash(password, 10)
        .then((hash) => User.create({ name, email, password: hash }))
        .then((user) => {
            res.status(201).send({
                name: user.name,
                email: user.email,
                _id: user._id,
            });
        })
        .catch((err) => {
            if (err.code === 11000) {
                return next(new ConflictError(ERROR_MESSAGES.EMAIL_CONFLICT));
            }
            if (err.name === 'ValidationError') {
                return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
            }
            return next(err);
        });
}

function login(req, res, next) {
    const { email, password } = req.body;

    User.findUserByCredentials(email, password)
        .then((user) => {
            const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
            res.status(200).send({ token });
        })
        .catch(next);
}

const saveFigure = (req, res, next) => {
  const userId = req.user._id;
  const figureData = req.body;

  console.log("Saving figure:", figureData);
  console.log("User ID:", userId);

  if (!figureData.name) {
    return res.status(400).json({ message: "Figure name is required" });
  }

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
        }
        return existingFigure.save();
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
        
        // Use the MongoDB ObjectId, not string comparison
        const figureExists = user.savedFigures.some(savedId => 
          savedId.toString() === savedFigure._id.toString()
        );
        
        if (!figureExists) {
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
const getSavedFigures = (req, res, next) => {
    const { _id: userId } = req.user;

    User.findById(userId)
        .populate('savedFigures')
        .then((user) => {
            if (!user) {
                throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
            } 
            
            const savedFigures = Array.isArray(user.savedFigures) ? user.savedFigures : [];
            
            console.log(`User ${userId} has ${savedFigures.length} saved figures`);
            console.log('First saved figure:', savedFigures[0]); // Debug log
            res.status(200).send(savedFigures);
        })
        .catch(next);
};

module.exports = {
    getCurrentUser,
    createUser,
    login,
    saveFigure,
    getSavedFigures,
};