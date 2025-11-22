const express = require("express");
const {
  register,
  login,
  getMe,
  logout,
  getUsers,
  updateUsers,
  deleteUser,
  getDashboardStats,
} = require("../controllers/auth");

const router = express.Router();
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

router.get("/admin/users", protect, getUsers);
router.put("/admin/update-details/:id", protect, updateUsers);
router.delete("/admin/delete-user/:id", protect, deleteUser);

router.get("/admin/dashboard-stats", getDashboardStats);

module.exports = router;
