const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  topic: {
    type: String,
    required: [true, 'Please add a topic'],
    enum: [
      'Arrays',
      'Strings',
      'Linked Lists',
      'Stacks',
      'Queues',
      'Trees',
      'Graphs',
      'Sorting',
      'Searching',
      'Dynamic Programming',
      'Backtracking',
      'Greedy',
      'Bit Manipulation',
      'Math',
      'Other'
    ]
  },
  subtopic: {
    type: String,
    required: [true, 'Please add a subtopic'],
    enum: {
      'Arrays': [
        'Array Basics',
        'Hashing',
        'Sliding Window',
        'Two Pointers',
        'Prefix Sum',
        'Kadane\'s Algorithm',
        'Merging Intervals',
        'Cyclic Sort',
        'In-place Array Manipulation'
      ],
      'Strings': [
        'String Basics',
        'String Matching',
        'String Manipulation',
        'String Hashing',
        'Suffix Arrays',
        'Regular Expressions'
      ],
      'Linked Lists': [
        'Singly Linked Lists',
        'Doubly Linked Lists',
        'Circular Linked Lists',
        'Fast and Slow Pointers',
        'Linked List Manipulation'
      ],
      'Stacks': [
        'Implementation',
        'Monotonic Stack',
        'Parentheses Problems',
        'Postfix/Prefix Evaluation'
      ],
      'Queues': [
        'Implementation',
        'Priority Queue/Heap',
        'Deque',
        'BFS'
      ],
      'Trees': [
        'Binary Trees',
        'Binary Search Trees',
        'N-ary Trees',
        'Trie',
        'Segment Trees',
        'Binary Indexed Tree',
        'AVL Trees',
        'Red-Black Trees'
      ],
      'Graphs': [
        'Graph Representation',
        'BFS/DFS',
        'Topological Sort',
        'Shortest Path',
        'Minimum Spanning Tree',
        'Strongly Connected Components',
        'Eulerian Path/Circuit',
        'Network Flow'
      ],
      'Sorting': [
        'Comparison Sorts',
        'Non-comparison Sorts',
        'Sorting with Custom Comparators'
      ],
      'Searching': [
        'Binary Search',
        'Ternary Search',
        'Interpolation Search'
      ],
      'Dynamic Programming': [
        '0/1 Knapsack',
        'Unbounded Knapsack',
        'Fibonacci',
        'LCS',
        'LIS',
        'Edit Distance',
        'Matrix Chain Multiplication',
        'DP on Trees',
        'DP on Grids',
        'Digit DP',
        'Bitmask DP'
      ],
      'Backtracking': [
        'Subsets',
        'Permutations',
        'Combinations',
        'N-Queens',
        'Sudoku'
      ],
      'Greedy': [
        'Activity Selection',
        'Fractional Knapsack',
        'Job Sequencing',
        'Huffman Coding'
      ],
      'Bit Manipulation': [
        'Bitwise Operations',
        'Bitmasking',
        'Bit Tricks'
      ],
      'Math': [
        'Number Theory',
        'Combinatorics',
        'Geometry',
        'Probability',
        'Game Theory'
      ],
      'Other': [
        'System Design',
        'OOP Design',
        'Concurrency',
        'SQL',
        'Shell Scripting'
      ]
    }[this.topic]
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  // ... rest of the schema remains the same
  youtubeLink: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  leetcodeLink: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  articleLink: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  order: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add a compound index to ensure order is unique within each topic and subtopic
ProblemSchema.index({ topic: 1, subtopic: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Problem', ProblemSchema);