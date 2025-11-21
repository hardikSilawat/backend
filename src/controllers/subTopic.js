const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const SubTopic = require("../models/SubTopic");
const logger = require("../utils/logger");
const { successResponse, errorResponse } = require("../utils/response");

// @desc    Get all subtopics
// @route   GET /api/v1/subtopics
// @access  Private
exports.getSubtopics = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.topic) {
      query.topic = req.query.topic;
    }
    if (req.query.difficulty) {
      query.difficulty = { $in: req.query.difficulty.split(",") };
    }
    if (req.query.status) {
      query.status = { $in: req.query.status.split(",") };
    }

    const [total, subtopics] = await Promise.all([
      SubTopic.countDocuments(query),
      SubTopic.find(query)
        .populate("topic", "name slug")
        .sort({ order: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return successResponse(res, 200, "Subtopics retrieved successfully", {
      subtopics,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    logger.error(`Get subtopics error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Get single subtopic by ID
// @route   GET /api/v1/subtopics/:id
// @access  Private
exports.getSubtopic = async (req, res) => {
  try {
    const subtopic = await SubTopic.findById(req.params.id).populate(
      "topic",
      "name slug"
    );

    if (!subtopic) {
      return errorResponse(res, 404, "Subtopic not found");
    }

    return successResponse(
      res,
      200,
      "Subtopic retrieved successfully",
      subtopic
    );
  } catch (error) {
    logger.error(`Get subtopic error: ${error.message}`, { error });
    if (error.name === "CastError") {
      return errorResponse(res, 400, "Invalid subtopic ID format");
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Create new subtopic
// @route   POST /api/v1/subtopics
// @access  Private/Admin
exports.createSubtopic = async (req, res) => {
  try {
    const { name, topic, difficulty, order, status } = req.body;

    // Check if subtopic with same name exists for the topic
    const existingSubtopic = await SubTopic.findOne({ name, topic });
    if (existingSubtopic) {
      return errorResponse(
        res,
        400,
        "Subtopic with this name already exists for the selected topic"
      );
    }

    const subtopic = await SubTopic.create({
      name,
      topic,
      difficulty: difficulty || "medium",
      order: order || 0,
      status: status || "pending",
      ...req.body,
    });

    return successResponse(res, 201, "Subtopic created successfully", subtopic);
  } catch (error) {
    logger.error(`Create subtopic error: ${error.message}`, { error });
    if (error.name === "ValidationError") {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Update subtopic
// @route   PUT /api/v1/subtopics/:id
// @access  Private/Admin
exports.updateSubtopic = async (req, res) => {
  try {
    const { name, topic, difficulty, order, status } = req.body;

    let subtopic = await SubTopic.findById(req.params.id);
    if (!subtopic) {
      return errorResponse(res, 404, "Subtopic not found");
    }

    // Check if name is being updated and if it's already taken
    if (name && name !== subtopic.name) {
      const existingSubtopic = await SubTopic.findOne({
        name,
        topic: topic || subtopic.topic,
      });
      if (existingSubtopic && !existingSubtopic._id.equals(subtopic._id)) {
        return errorResponse(
          res,
          400,
          "Subtopic with this name already exists for the selected topic"
        );
      }
    }

    // Update fields
    subtopic.name = name || subtopic.name;
    if (topic) subtopic.topic = topic;
    if (difficulty) subtopic.difficulty = difficulty;
    if (order !== undefined) subtopic.order = order;
    if (status) subtopic.status = status;

    // Update other fields
    Object.keys(req.body).forEach((field) => {
      if (["name", "topic", "difficulty", "order", "status"].includes(field))
        return;
      subtopic[field] = req.body[field];
    });

    await subtopic.save();

    return successResponse(res, 200, "Subtopic updated successfully", subtopic);
  } catch (error) {
    logger.error(`Update subtopic error: ${error.message}`, { error });
    if (error.name === "ValidationError") {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Delete subtopic
// @route   DELETE /api/v1/subtopics/:id
// @access  Private/Admin
exports.deleteSubtopic = async (req, res) => {
  try {
    const subtopic = await SubTopic.findById(req.params.id);

    if (!subtopic) {
      return errorResponse(res, 404, "Subtopic not found");
    }

    // Using deleteOne() instead of remove()
    await SubTopic.deleteOne({ _id: subtopic._id });

    return successResponse(res, 200, "Subtopic deleted successfully", null);
  } catch (error) {
    logger.error(`Delete subtopic error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    if (error.name === "CastError") {
      return errorResponse(res, 400, "Invalid subtopic ID format");
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Update subtopic status
// @route   PUT /api/v1/subtopics/:id/status
// @access  Private
exports.updateSubtopicStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "completed"].includes(status)) {
      return errorResponse(
        res,
        400,
        "Status must be either 'pending' or 'completed'"
      );
    }

    const subtopic = await SubTopic.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("topic", "name slug");

    if (!subtopic) {
      return errorResponse(res, 404, "Subtopic not found");
    }

    return successResponse(
      res,
      200,
      "Subtopic status updated successfully",
      subtopic
    );
  } catch (error) {
    logger.error(`Update subtopic status error: ${error.message}`, { error });
    if (error.name === "CastError") {
      return errorResponse(res, 400, "Invalid subtopic ID format");
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Get subtopics by topic
// @route   GET /api/v1/subtopics/topic/:topicId
// @access  Private
exports.getSubtopicsByTopic = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = { topic: req.params.topicId };
    
    if (req.query.status) {
      query.status = { $in: req.query.status.split(",") };
    }
    if (req.query.difficulty) {
      query.difficulty = { $in: req.query.difficulty.split(",") };
    }

    const [total, subtopics] = await Promise.all([
      SubTopic.countDocuments(query),
      SubTopic.find(query)
        .populate("topic", "name slug")
        .sort({ order: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return successResponse(res, 200, "Subtopics retrieved successfully", {
      subtopics,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error(`Get subtopics by topic error: ${error.message}`, { 
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    if (error.name === "CastError") {
      return errorResponse(res, 400, "Invalid topic ID format");
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Get completed subtopics
// @route   GET /api/v1/subtopics/completed
// @access  Private
exports.getCompletedSubtopics = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, subtopics] = await Promise.all([
      SubTopic.countDocuments({ status: "completed" }),
      SubTopic.find({ status: "completed" })
        .populate("topic", "name slug")
        .sort({ "topic.name": 1, order: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return successResponse(
      res,
      200,
      "Completed subtopics retrieved successfully",
      {
        subtopics,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          total,
        },
      }
    );
  } catch (error) {
    logger.error(`Get completed subtopics error: ${error.message}`, { error });
    return errorResponse(res, 500, "Server error", error.message);
  }
};
