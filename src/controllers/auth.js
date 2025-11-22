// src/controllers/auth.js
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../utils/logger");
const Topic = require("../models/Topic");
const SubTopic = require("../models/SubTopic");
const CompletedProblem = require("../models/CompletedProblem");

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    if (await User.isEmailTaken(email))
      return errorResponse(res, 400, "Email already in use");

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
    });

    const token = user.getSignedJwtToken();
    user.token = token;

    return successResponse(res, 201, "User registered successfully", user);
  } catch (err) {
    logger.error("Registration error", {
      error: err.message,
      stack: err.stack,
    });
    return errorResponse(
      res,
      500,
      "Server error during registration",
      err.message
    );
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "Please provide email and password");
    }

    // Check for user
    const user = await User.findOne({ email, role }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      logger.warn("Failed login attempt", { email, role });
      return errorResponse(res, 401, "Invalid credentials");
    }

    user.token = user.getSignedJwtToken();
    await user.save();
    logger.info("User logged in", { userId: user._id });

    const userObj = user.toObject();
    delete userObj.password;

    return successResponse(res, 200, "Login successful", userObj);
  } catch (err) {
    logger.error("Login error", { error: err.message, stack: err.stack });
    return errorResponse(res, 500, "Server error during login", err.message);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    return successResponse(res, 200, "User retrieved successfully", user);
  } catch (err) {
    logger.error("Get user error", { error: err.message, stack: err.stack });
    return errorResponse(res, 500, "Server error", err.message);
  }
};

// @desc    Logout user
// @route   GET /api/v1/auth/logout
// @access  Private
// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { token: "" } },
      { new: true }
    );

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    logger.info("User logged out", { userId: req.user.id });
    return successResponse(res, 200, "Logout successful", null);
  } catch (err) {
    logger.error(`Logout error: ${err.message}`, {
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      userId: req.user?.id,
    });
    return errorResponse(res, 500, "Error during logout", err.message);
  }
};

// @desc    Get all users
// @route   GET /api/v1/auth/admin/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = req.query.search
      ? {
          $or: ["name", "email", "phone"].map((f) => ({
            [f]: { $regex: req.query.search, $options: "i" },
          })),
        }
      : {};

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password -token -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return successResponse(res, 200, "Users retrieved successfully", {
      users,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    logger.error("Get user error", { error: err.message, stack: err.stack });
    return errorResponse(res, 500, "Server error", err.message);
  }
};

// @desc    Update user
// @route   PUT /api/v1/auth/admin/update-details/:id
// @access  Private/Admin
exports.updateUsers = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const updates = {};

    // Only include fields that are provided in the request
    if (name) updates.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        return errorResponse(res, 400, "Email already in use");
      }
      updates.email = email.toLowerCase();
    }
    if (role && ["user", "admin"].includes(role)) {
      // Only allow role update if user is admin
      if (req.user.role === "admin") {
        updates.role = role;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -token -__v");

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    logger.info("User updated", {
      updatedBy: req.user.id,
      userId: user._id,
      updates: Object.keys(updates),
    });

    return successResponse(res, 200, "User updated successfully", user);
  } catch (err) {
    logger.error(`Update user error: ${err.message}`, {
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      userId: req.params.id,
      updatedBy: req.user?.id,
    });
    return errorResponse(res, 500, "Error updating user", err.message);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/auth/admin/delete-user/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 404, "User not found");
    }
    logger.info("User deleted", {
      deletedBy: req.user.id,
      userId: user._id,
    });
    return successResponse(res, 200, "User deleted successfully", user);
  } catch (err) {
    logger.error(`Delete user error: ${err.message}`, {
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      userId: req.params.id,
      deletedBy: req.user?.id,
    });
    return errorResponse(res, 500, "Error deleting user", err.message);
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get total users (excluding admins)
    const totalUsers = await User.countDocuments({ role: "user" });

    // Get total active topics
    const totalTopics = await Topic.countDocuments({ isActive: true });

    // Get total subtopics
    const totalSubtopics = await SubTopic.countDocuments();

    // Get completed problems statistics
    const completedStats = await CompletedProblem.aggregate([
      {
        $lookup: {
          from: "subtopics",
          localField: "subtopic",
          foreignField: "_id",
          as: "subtopicData",
        },
      },
      {
        $unwind: "$subtopicData",
      },
      {
        $group: {
          _id: null,
          totalCompleted: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
    ]);

    // Get user progress statistics
    const userProgress = await CompletedProblem.aggregate([
      {
        $group: {
          _id: "$user",
          completedCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          averageCompletion: { $avg: "$completedCount" },
          maxCompletion: { $max: "$completedCount" },
        },
      },
    ]);

    // Get topic-wise completion stats
    const topicStats = await CompletedProblem.aggregate([
      {
        $lookup: {
          from: "subtopics",
          localField: "subtopic",
          foreignField: "_id",
          as: "subtopicData",
        },
      },
      { $unwind: "$subtopicData" },
      {
        $lookup: {
          from: "topics",
          localField: "subtopicData.topic",
          foreignField: "_id",
          as: "topicData",
        },
      },
      { $unwind: "$topicData" },
      {
        $group: {
          _id: "$topicData._id",
          topicName: { $first: "$topicData.name" },
          completedCount: { $sum: 1 },
        },
      },
      { $sort: { completedCount: -1 } },
      { $limit: 5 },
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await CompletedProblem.aggregate([
      {
        $match: {
          completedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        users: {
          total: totalUsers,
          activeToday: 0,
          newThisWeek: await User.countDocuments({
            role: "user", // Add this line to filter only 'user' role
            createdAt: { $gte: sevenDaysAgo },
          }),
        },
        topics: {
          total: totalTopics,
          subtopics: totalSubtopics,
          completionRate:
            totalSubtopics > 0
              ? ((completedStats[0]?.totalCompleted || 0) / totalSubtopics) *
                100
              : 0,
        },
        progress: {
          totalCompleted: completedStats[0]?.totalCompleted || 0,
          averagePerUser: userProgress[0]?.averageCompletion
            ? Math.round(userProgress[0].averageCompletion * 100) / 100
            : 0,
          maxCompleted: userProgress[0]?.maxCompletion || 0,
        },
        topTopics: topicStats,
        recentActivity,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({
      success: false,
      message: "Error retrieving dashboard statistics",
      error: err.message,
    });
  }
};
