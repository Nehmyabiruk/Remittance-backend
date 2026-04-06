// db.js
const { Pool } = require('pg');
require('dotenv').config(); // ← add this (npm install dotenv)

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'remittance bank login', // consider renaming to remittance_bank (no spaces)
  password: process.env.DB_PASSWORD || '017231',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;