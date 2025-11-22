// In topicWithSubtopics.js
const Topic = require("../models/Topic");
const Subtopic = require("../models/SubTopic");
const CompletedProblem = require("../models/CompletedProblem");
const { errorResponse, successResponse } = require("../utils/response");
const logger = require("../utils/logger");

// @desc    Get all topics with their subtopics and user completion status
// @route   GET /api/v1/topics/all
// @access  Public (but requires authentication for completion status)
exports.getAllTopicsWithSubtopics = async (req, res) => {
  try {
    // Get all active topics with their subtopics
    const topics = await Topic.aggregate([
      { $match: { isActive: true } },
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: "subtopics",
          localField: "_id",
          foreignField: "topic",
          as: "subtopics",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          slug: 1,
          subtopics: {
            $map: {
              input: "$subtopics",
              as: "subtopic",
              in: {
                _id: "$$subtopic._id",
                name: "$$subtopic.name",
                slug: "$$subtopic.slug",
                difficulty: "$$subtopic.difficulty",
                youtubeLink: "$$subtopic.youtubeLink",
                leetcodeLink: "$$subtopic.leetcodeLink",
                articleLink: "$$subtopic.articleLink",
                order: "$$subtopic.order",
                status: "$$subtopic.status",
              },
            },
          },
        },
      },
    ]);

    if (!topics || topics.length === 0) {
      return successResponse(res, 200, "No topics found", []);
    }

    // If user is authenticated, get their completed subtopics
    let completedSubtopicIds = [];
    if (req.user && req.user.id) {
      const completedProblems = await CompletedProblem.find({
        user: req.user.id,
        subtopic: {
          $in: topics.flatMap((topic) => topic.subtopics.map((st) => st._id)),
        },
      }).select("subtopic -_id");

      completedSubtopicIds = completedProblems
        .map((cp) => (cp.subtopic ? cp.subtopic.toString() : null))
        .filter(Boolean);
    }

    // Add completion status to each subtopic
    const topicsWithCompletion = topics.map((topic) => ({
      ...topic,
      subtopics: (topic.subtopics || []).map((subtopic) => ({
        ...subtopic,
        isCompleted: completedSubtopicIds.includes(subtopic._id.toString()),
      })),
    }));

    return successResponse(
      res,
      200,
      "Topics with subtopics retrieved successfully",
      topicsWithCompletion
    );
  } catch (error) {
    logger.error(`Get all topics with subtopics error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    return errorResponse(res, 500, "Server error", error.message);
  }
};
