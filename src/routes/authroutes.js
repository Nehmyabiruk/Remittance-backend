const express = require("express");
const router = express.Router();

// Import controller functions
const { register, login, updateProfile, changePassword } = require("../controllers/authcontroller");
const authMiddleware = require("../middleware/authmiddleware");

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Protected Routes
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;