const express = require("express");
const {
  getProblems,
  getProblem,
  getProblemsByTopic,
  createProblem,
  updateProblem,
  deleteProblem,
  markProblemCompleted,
  getCompletedProblems,
} = require("../controllers/problems");

const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/", protect, getProblems);
router.get("/:id", protect, getProblem);
router.get("/topic/:topic", protect, getProblemsByTopic);
router.get("/completed", protect, getCompletedProblems);

// Protected routes (require authentication and admin role)
router.post("/", protect, createProblem);
router.put("/:id", protect, updateProblem);
router.delete("/:id", protect, deleteProblem);

// User-specific routes
router.put("/:id/complete", protect, markProblemCompleted);

module.exports = router;
