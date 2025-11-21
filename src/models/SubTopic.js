const mongoose = require("mongoose");
const slugify = require("slugify");

const SubtopicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a subtopic name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"]
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "Please select a topic"]
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "tough"],
      default: "easy"
    },
    youtubeLink: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ],
    },
    leetcodeLink: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ],
    },
    articleLink: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ],
    },
    order: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name
SubtopicSchema.pre("save", async function (next) {
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
SubtopicSchema.index({
  name: "text",
  description: "text",
  subtopic: "text",
});

// Indexes for performance
SubtopicSchema.index({ topic: 1, isActive: 1 });
SubtopicSchema.index({ difficulty: 1, isActive: 1 });
SubtopicSchema.index({ topic: 1, order: 1 }, { unique: true });

// Static method for search
SubtopicSchema.statics.search = async function (query, options = {}) {
  const { page = 1, limit = 10, difficulty, topic } = options;
  const skip = (page - 1) * limit;

  const searchQuery = {
    $and: [
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } }
        ]
      }
    ]
  };

  if (difficulty) {
    searchQuery.$and.push({ difficulty: { $in: difficulty.split(",") } });
  }

  if (topic) {
    searchQuery.$and.push({ topic });
  }

  const [subtopics, total] = await Promise.all([
    this.find(searchQuery)
      .populate("topic", "name slug")
      .sort({ order: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(searchQuery)
  ]);

  return {
    subtopics,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model("Subtopic", SubtopicSchema);