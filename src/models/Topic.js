const mongoose = require("mongoose");
const slugify = require("slugify");

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Topic name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Topic name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for problems
topicSchema.virtual("problems", {
  ref: "Problem",
  localField: "_id",
  foreignField: "topic",
  justOne: false,
});

// Generate slug from name
topicSchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();

  try {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});

// Add text index for search
topicSchema.index({
  name: "text",
  description: "text",
});

// Indexes for performance
topicSchema.index({ slug: 1, isActive: 1 });
topicSchema.index({ difficulty: 1, isActive: 1 });

// Static method for search
topicSchema.statics.search = async function (query, options = {}) {
  const { page = 1, limit = 10, difficulty } = options;
  const skip = (page - 1) * limit;

  const searchQuery = {
    $and: [
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    ],
  };

  if (difficulty) {
    searchQuery.$and.push({ difficulty: { $in: difficulty.split(",") } });
  }

  const [topics, total] = await Promise.all([
    this.find(searchQuery)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(searchQuery),
  ]);

  return {
    topics,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = mongoose.model("Topic", topicSchema);
