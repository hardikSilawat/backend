const Problem = require('../models/Problem');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all problems
// @route   GET /api/v1/problems
// @access  Private
// In controllers/problems.js
exports.getProblems = asyncHandler(async (req, res, next) => {
  // Group problems by topic and subtopic
  const problems = await Problem.aggregate([
    { $match: { isActive: true } },
    { $sort: { topic: 1, subtopic: 1, order: 1 } },
    {
      $group: {
        _id: {
          topic: '$topic',
          subtopic: '$subtopic'
        },
        problems: { $push: '$$ROOT' }
      }
    },
    {
      $group: {
        _id: '$_id.topic',
        subtopics: {
          $push: {
            name: '$_id.subtopic',
            problems: '$problems'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    count: problems.length,
    data: problems
  });
});
// @desc    Get single problem
// @route   GET /api/v1/problems/:id
// @access  Private
exports.getProblem = asyncHandler(async (req, res, next) => {
  const problem = await Problem.findById(req.params.id);

  if (!problem) {
    return next(
      new ErrorResponse(`Problem not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: problem
  });
});

// @desc    Get problems by topic
// @route   GET /api/v1/problems/topic/:topic
// @access  Private
exports.getProblemsByTopic = asyncHandler(async (req, res, next) => {
  const { topic } = req.params;
  
  const problems = await Problem.find({ 
    topic: topic.charAt(0).toUpperCase() + topic.slice(1),
    isActive: true 
  }).sort('order');

  res.status(200).json({
    success: true,
    count: problems.length,
    data: problems
  });
});

// @desc    Create new problem
// @route   POST /api/v1/problems
// @access  Private/Admin
exports.createProblem = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const problem = await Problem.create(req.body);

  res.status(201).json({
    success: true,
    data: problem
  });
});

// @desc    Update problem
// @route   PUT /api/v1/problems/:id
// @access  Private/Admin
exports.updateProblem = asyncHandler(async (req, res, next) => {
  let problem = await Problem.findById(req.params.id);

  if (!problem) {
    return next(
      new ErrorResponse(`Problem not found with id of ${req.params.id}`, 404)
    );
  }

  problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: problem });
});

// @desc    Delete problem
// @route   DELETE /api/v1/problems/:id
// @access  Private/Admin
exports.deleteProblem = asyncHandler(async (req, res, next) => {
  const problem = await Problem.findById(req.params.id);

  if (!problem) {
    return next(
      new ErrorResponse(`Problem not found with id of ${req.params.id}`, 404)
    );
  }

  await problem.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Mark problem as completed
// @route   PUT /api/v1/problems/:id/complete
// @access  Private
exports.markProblemCompleted = asyncHandler(async (req, res, next) => {
  const problem = await Problem.findById(req.params.id);

  if (!problem) {
    return next(
      new ErrorResponse(`Problem not found with id of ${req.params.id}`, 404)
    );
  }

  const user = await User.findById(req.user.id);
  
  // Check if problem is already completed
  if (user.completedProblems.includes(req.params.id)) {
    // Remove from completed problems
    user.completedProblems = user.completedProblems.filter(
      problemId => problemId.toString() !== req.params.id
    );
    await user.save();
    
    return res.status(200).json({
      success: true,
      completed: false,
      data: user.completedProblems
    });
  }

  // Add to completed problems
  user.completedProblems.push(req.params.id);
  await user.save();

  res.status(200).json({
    success: true,
    completed: true,
    data: user.completedProblems
  });
});

// @desc    Get user's completed problems
// @route   GET /api/v1/problems/completed
// @access  Private
exports.getCompletedProblems = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('completedProblems');
  
  res.status(200).json({
    success: true,
    count: user.completedProblems.length,
    data: user.completedProblems
  });
});
