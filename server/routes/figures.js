const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const {
  getFigures,
  likeFigure,
  getFigureById,
  getFigureByWikipediaId,
  getFeaturedFigures,
  saveFigure,
  unsaveFigure,
  searchFigures,
  ensureFigure,
  getPendingFigures,
  approveFigure,
  rejectFigure,
  bulkApproveFigures,
  bulkRejectFigures,
} = require("../controllers/figures");


router.get("/", getFigures);
router.get("/featured", getFeaturedFigures);
router.get("/search", searchFigures);
router.get("/wiki/:wikipediaId", getFigureByWikipediaId);

// Admin moderation routes - MUST come before /:id to avoid matching "admin" as an ID
router.get("/admin/pending", auth, admin, getPendingFigures);
router.post("/admin/:id/approve", auth, admin, approveFigure);
router.post("/admin/:id/reject", auth, admin, rejectFigure);
router.post("/admin/bulk-approve", auth, admin, bulkApproveFigures);
router.post("/admin/bulk-reject", auth, admin, bulkRejectFigures);

// Generic :id route - MUST be last (catches all unmatched paths)
router.get("/:id", getFigureById);

router.post("/ensure", ensureFigure);
router.post("/save", auth, saveFigure);
router.delete("/unsave/:figureId", auth, unsaveFigure);
router.post("/:figureId/like", auth, likeFigure);

module.exports = router;

