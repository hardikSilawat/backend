// models/CompletedProblem.js
const mongoose = require("mongoose");

const CompletedProblemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subtopic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subtopic",
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate completions
CompletedProblemSchema.index({ user: 1, subtopic: 1 }, { unique: true });

module.exports = mongoose.model("CompletedProblem", CompletedProblemSchema);
