const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic");
const topicWithSubtopicsController = require("../controllers/topicWithSubtopics");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", topicController.getTopics);
router.get("/search", topicController.searchTopics);


//////////////////// User Dashboard APIS (Protected routes)

router.get('/progress', protect, topicWithSubtopicsController.getProgressStats);
router.get(
  "/all",
  protect,
  topicWithSubtopicsController.getAllTopicsWithSubtopics
);
router.post(
  "/toggle-complete",
  protect,
  topicWithSubtopicsController.toggleSubtopicCompletion
);

router.get(
  "/completed/:subtopicId",
  protect,
  topicWithSubtopicsController.getSubtopicCompletionStatus
);

//////////////////////////////////////////////////////////////////

// Admin APIS :
router.get("/:id", topicController.getTopic);
router.get("/slug/:slug", topicController.getTopicBySlug);

router.post("/", topicController.createTopic);

router
  .route("/:id")
  .put(topicController.updateTopic)
  .delete(topicController.deleteTopic);

module.exports = router;
