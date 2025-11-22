// In topicWithSubtopics.js
const Topic = require("../models/Topic");
const Subtopic = require("../models/SubTopic");
const CompletedProblem = require("../models/CompletedProblem");
const { errorResponse, successResponse } = require("../utils/response");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

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
          pipeline: [
            { $sort: { order: 1 } }, // Sort subtopics by order
            {
              $lookup: {
                from: "completedproblems",
                let: { subtopicId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$subtopic", "$$subtopicId"] },
                          {
                            $eq: [
                              "$user",
                              req.user?._id
                                ? new mongoose.Types.ObjectId(req.user._id)
                                : null,
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: "completionInfo",
              },
            },
            {
              $addFields: {
                isCompleted: { $gt: [{ $size: "$completionInfo" }, 0] },
              },
            },
            {
              $project: {
                completionInfo: 0, // Remove the completionInfo array from the final output
              },
            },
          ],
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
                isCompleted: "$$subtopic.isCompleted",
              },
            },
          },
        },
      },
    ]);

    if (!topics || topics.length === 0) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: "No topics found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Topics with subtopics retrieved successfully",
      data: topics,
    });
  } catch (error) {
    logger.error(`Get all topics with subtopics error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    return errorResponse(
      res,
      500,
      "Failed to retrieve topics with subtopics",
      error.message
    );
  }
};

// @desc    Toggle completion status of a subtopic for the authenticated user
// @route   POST /api/v1/topics/toggle-complete
// @access  Private
exports.toggleSubtopicCompletion = async (req, res) => {
  try {
    const { subtopicId } = req.body;

    // Input validation
    if (!subtopicId) {
      return errorResponse(res, 400, "Subtopic ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(subtopicId)) {
      return errorResponse(res, 400, "Invalid subtopic ID format");
    }

    // Check if subtopic exists
    const subtopic = await Subtopic.findById(subtopicId);
    if (!subtopic) {
      return errorResponse(res, 404, "Subtopic not found");
    }

    // Check if the subtopic is already marked as completed
    const existingCompletion = await CompletedProblem.findOne({
      user: req.user._id,
      subtopic: subtopicId,
    });

    let isCompleted;
    let message;

    if (existingCompletion) {
      // Remove from completed problems
      await CompletedProblem.deleteOne({ _id: existingCompletion._id });
      isCompleted = false;
      message = "Subtopic marked as not completed";
    } else {
      // Add to completed problems
      await CompletedProblem.create({
        user: req.user._id,
        subtopic: subtopicId,
      });
      isCompleted = true;
      message = "Subtopic marked as completed";
    }

    // Get updated progress stats
    const progress = await getUserProgressStats(req.user._id);

    // Return response with progress
    return res.status(200).json({
      success: true,
      status: 200,
      message,
      data: {
        isCompleted,
        progress,
      },
    });
  } catch (error) {
    logger.error(`Toggle subtopic completion error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    return errorResponse(
      res,
      500,
      "Failed to update subtopic completion status",
      error.message
    );
  }
};
// @desc    Get user's completion status for a subtopic
// @route   GET /api/v1/topics/completed/:subtopicId
// @access  Private
exports.getSubtopicCompletionStatus = async (req, res) => {
  try {
    const { subtopicId } = req.params;

    // Input validation
    if (!subtopicId) {
      return errorResponse(res, 400, "Subtopic ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(subtopicId)) {
      return errorResponse(res, 400, "Invalid subtopic ID format");
    }

    // Check if the subtopic exists in CompletedProblem collection
    const existingCompletion = await CompletedProblem.findOne({
      user: req.user._id,
      subtopic: subtopicId,
    });

    const isCompleted = !!existingCompletion;

    // Get current progress stats
    const progress = await getUserProgressStats(req.user._id);

    // Return response with progress
    return res.status(200).json({
      success: true,
      status: 200,
      message: isCompleted
        ? "Subtopic is completed"
        : "Subtopic is not completed",
      data: {
        isCompleted,
        progress,
      },
    });
  } catch (error) {
    logger.error(`Get subtopic completion status error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    return errorResponse(
      res,
      500,
      "Failed to get subtopic completion status",
      error.message
    );
  }
};

// Helper function to get progress stats for a user
const getUserProgressStats = async (userId) => {
  const subtopics = await Subtopic.aggregate([
    {
      $lookup: {
        from: "completedproblems",
        let: { subtopicId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$subtopic", "$$subtopicId"] },
                  { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                ],
              },
            },
          },
        ],
        as: "completionInfo",
      },
    },
    {
      $project: {
        difficulty: 1,
        isCompleted: { $gt: [{ $size: "$completionInfo" }, 0] },
      },
    },
  ]);

  const progress = {
    easy: { completed: 0, total: 0, percentage: 0 },
    medium: { completed: 0, total: 0, percentage: 0 },
    tough: { completed: 0, total: 0, percentage: 0 },
    overall: { completed: 0, total: 0, percentage: 0 },
  };

  // Calculate progress
  subtopics.forEach((subtopic) => {
    const difficulty = subtopic.difficulty?.toLowerCase() || "medium";
    if (progress[difficulty]) {
      progress[difficulty].total++;
      progress.overall.total++;
      if (subtopic.isCompleted) {
        progress[difficulty].completed++;
        progress.overall.completed++;
      }
    }
  });

  // Calculate percentages
  Object.keys(progress).forEach((key) => {
    if (progress[key].total > 0) {
      progress[key].percentage = Math.round(
        (progress[key].completed / progress[key].total) * 100
      );
    }
  });

  return progress;
};
// @desc    Get progress statistics for all difficulty levels
// @route   GET /api/v1/topics/progress
// @access  Private
exports.getProgressStats = async (req, res) => {
  try {
    const progress = await getUserProgressStats(req.user._id);

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Progress statistics retrieved successfully",
      data: progress,
    });
  } catch (error) {
    logger.error(`Get progress stats error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    return errorResponse(
      res,
      500,
      "Failed to retrieve progress statistics",
      error.message
    );
  }
};
