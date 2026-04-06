const express = require('express');
const cors = require('cors');
require('dotenv').config();

// MUST define app FIRST
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Auth routes
const authRoutes = require('./routes/authroutes');
app.use('/api/auth', authRoutes);

// Transactions routes
app.use("/api/transactions", require("./routes/transactionRoutes"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});