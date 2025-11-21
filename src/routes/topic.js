const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", topicController.getTopics);
router.get("/search", topicController.searchTopics);
router.get("/:id", topicController.getTopic);
router.get("/slug/:slug", topicController.getTopicBySlug);

// Protected routes (require authentication)
router.use(protect);

router.post("/", topicController.createTopic);

router
  .route("/:id")
  .put(topicController.updateTopic)
  .delete(topicController.deleteTopic);

module.exports = router;
