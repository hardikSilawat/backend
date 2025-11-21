const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load env vars
dotenv.config({ path: "./.env" });

// Connect to database
connectDB();

// Route files
const auth = require("./routes/auth");
const topics = require("./routes/topic");
const subtopics = require("./routes/subTopic");

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/topics", topics);
app.use("/api/v1/subtopics", subtopics);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
