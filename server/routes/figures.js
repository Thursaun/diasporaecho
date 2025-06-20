const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  getFigures,
  likeFigure,
  getFigureById,
  getFigureByWikipediaId,
  getFeaturedFigures,
  saveFigure,
  unsaveFigure,
  searchFigures,
} = require("../controllers/figures");


router.get("/", getFigures);
router.get("/featured", getFeaturedFigures);
router.get("/search", searchFigures);
router.get("/wiki/:wikipediaId", getFigureByWikipediaId);
router.get("/:id", getFigureById);

router.post("/save", auth, saveFigure);
router.delete("/unsave/:figureId", auth, unsaveFigure);
router.post("/:figureId/like", auth, likeFigure);

module.exports = router;
