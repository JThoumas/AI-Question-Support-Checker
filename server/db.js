// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Export the pool so we can use it in other files
module.exports = {
  query: (text, params) => pool.query(text, params),
};