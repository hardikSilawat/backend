const Topic = require("../models/Topic");
const Subtopic = require("../models/SubTopic");
const { errorResponse, successResponse } = require("../utils/response");
const logger = require("../utils/logger");
const { default: mongoose } = require("mongoose");
const SubTopic = require("../models/SubTopic");
const CompletedProblem = require("../models/CompletedProblem");

// @desc    Get all topics
// @route   GET /api/v1/topics
// @access  Public
// @desc    Get all topics
// @route   GET /api/v1/topics
// @access  Public
exports.getTopics = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const [total, topics] = await Promise.all([
      Topic.countDocuments(query),
      Topic.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    ]);

    return successResponse(res, 200, "Topics retrieved successfully", {
      topics,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    logger.error(`Get topics error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Search topics
// @route   GET /api/v1/topics/search
// @access  Public
exports.searchTopics = async (req, res) => {
  try {
    const { q: query = "", page = 1, limit = 10 } = req.query;
    const { topics, pagination } = await Topic.search(query, {
    
      page,
      limit,
    });

    return successResponse(res, 200, "Topics search results", topics, {
      pagination,
    });
  } catch (error) {
    logger.error(`Search topics error: ${error.message}`, { error });
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Get single topic by ID
// @route   GET /api/v1/topics/:id
// @access  Public
exports.getTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return errorResponse(res, 404, "Topic not found");
    }

    return successResponse(res, 200, "Topic retrieved successfully", topic);
  } catch (error) {
    logger.error(`Get topic error: ${error.message}`, { error });
    if (error.name === "CastError") {
      return errorResponse(res, 400, "Invalid topic ID format");
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Get single topic by slug
// @route   GET /api/v1/topics/slug/:slug
// @access  Public
exports.getTopicBySlug = async (req, res) => {
  try {
    const topic = await Topic.findOne({ slug: req.params.slug });

    if (!topic) {
      return errorResponse(res, 404, "Topic not found");
    }

    return successResponse(res, 200, "Topic retrieved successfully", topic);
  } catch (error) {
    logger.error(`Get topic by slug error: ${error.message}`, { error });
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Create new topic
// @route   POST /api/v1/topics
// @access  Private/Admin
exports.createTopic = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if topic exists
    const existingTopic = await Topic.findOne({ name });
    if (existingTopic) {
      return errorResponse(res, 400, "Topic with this name already exists");
    }

    const topicData = {
      name,
      description,
    };

    const topic = await Topic.create(topicData);

    return successResponse(res, 201, "Topic created successfully", topic);
  } catch (error) {
    logger.error(`Create topic error: ${error.message}`, { error });
    if (error.name === "ValidationError") {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Update topic
// @route   PUT /api/v1/topics/:id
// @access  Private/Admin
exports.updateTopic = async (req, res) => {
  try {
    const { name, description,  isActive } = req.body;

    let topic = await Topic.findById(req.params.id);
    if (!topic) {
      return errorResponse(res, 404, "Topic not found");
    }

    // Check if name is being updated and if it's already taken
    if (name && name !== topic.name) {
      const existingTopic = await Topic.findOne({ name });
      if (existingTopic && !existingTopic._id.equals(topic._id)) {
        return errorResponse(res, 400, "Topic with this name already exists");
      }
    }

    // Update fields
    topic.name = name || topic.name;
    if (description !== undefined) topic.description = description;
    if (isActive !== undefined) topic.isActive = isActive;

    await topic.save();

    return successResponse(res, 200, "Topic updated successfully", topic);
  } catch (error) {
    logger.error(`Update topic error: ${error.message}`, { error });
    if (error.name === "ValidationError") {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};

// @desc    Delete topic
// @route   DELETE /api/v1/topics/:id
// @access  Private/Admin
exports.deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return errorResponse(res, 404, "Topic not found");
    }

    // Check if topic has any subtopics
    const subtopics = await SubTopic.find({ topic: topic._id });

    if (subtopics.length > 0) {
      // Delete all completed problems for these subtopics
      await CompletedProblem.deleteMany({
        subtopic: { $in: subtopics.map(st => st._id) }
      });
      
      // Delete all subtopics
      await SubTopic.deleteMany({ topic: topic._id });
    }

    // Delete the topic
    await Topic.deleteOne({ _id: topic._id });

    return successResponse(
      res,
      200,
      subtopics.length > 0
        ? "Topic and all associated data deleted successfully"
        : "Topic deleted successfully",
      null
    );
  } catch (error) {
    logger.error(`Delete topic error: ${error.message}`, {
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
    if (error.name === "CastError") {
      return errorResponse(res, 400, "Invalid topic ID format");
    }
    return errorResponse(res, 500, "Server error", error.message);
  }
};
