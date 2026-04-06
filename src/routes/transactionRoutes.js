const express = require("express");
const router = express.Router();

// Import middleware
const authMiddleware = require("../middleware/authmiddleware");

// Import controller
const { 
  getExchangeRate, 
  sendMoney, 
  getTransactionHistory
} = require("../controllers/transactioncontroller");

// Routes
router.get("/exchange-rate", getExchangeRate);
router.post("/send", authMiddleware, sendMoney);
router.get("/history", authMiddleware, getTransactionHistory);

module.exports = router;