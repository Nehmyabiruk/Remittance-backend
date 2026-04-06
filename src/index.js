const express = require('express');
const cors = require('cors');
require('dotenv').config();
app.use(cors({ origin: true })); // allow all for now

const app = express();

// Now you can use app
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use("/api/transactions", require("./routes/transactionRoutes"));

// Simple root route to test server is alive
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Auth routes
const authRoutes = require('./routes/authroutes');
app.use('/api/auth', authRoutes);

// Start server
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});