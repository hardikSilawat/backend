const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic");
const topicWithSubtopicsController = require('../controllers/topicWithSubtopics');
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", topicController.getTopics);
router.get("/search", topicController.searchTopics);
router.get("/all", topicWithSubtopicsController.getAllTopicsWithSubtopics);
router.get("/:id", topicController.getTopic);
router.get("/slug/:slug", topicController.getTopicBySlug);

// Get all topics with subtopics

// Protected routes (require authentication)
router.use(protect);

router.post("/", topicController.createTopic);

router
  .route("/:id")
  .put(topicController.updateTopic)
  .delete(topicController.deleteTopic);

module.exports = router;
