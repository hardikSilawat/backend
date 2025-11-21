const express = require("express");
const {
  getSubtopics,
  getSubtopic,
  getSubtopicsByTopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  updateSubtopicStatus,
  getCompletedSubtopics,
} = require("../controllers/subTopic");

const router = express.Router();
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", protect, getSubtopics);
router.get("/completed", protect, getCompletedSubtopics);
router.get("/:id", protect, getSubtopic);
router.get("/topic/:topicId", protect, getSubtopicsByTopic);

// Protected routes (require authentication and admin role)
router.post("/", protect, createSubtopic);
router.put("/:id", protect, updateSubtopic);
router.delete("/:id", protect, deleteSubtopic);

// Status update route
router.put("/:id/status", protect, updateSubtopicStatus);

module.exports = router;
