// server/index.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Import our new auth routes

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// 1. Enable CORS for all requests
app.use(cors());
// 2. Enable built-in middleware to parse JSON request bodies
app.use(express.json());

// --- Routes ---
// Mount our auth routes on the /api/auth path
app.use('/api/auth', authRoutes);

// Original test route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the AI Question Checker API!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});