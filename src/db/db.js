const { Pool } = require('pg');

// Force using the environment variable
console.log("DATABASE_URL being used:", process.env.DATABASE_URL ? "Yes (starts with " + process.env.DATABASE_URL.substring(0, 50) + "...)" : "MISSING!");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,   // ← Must use this
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection on startup (very helpful)
pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to PostgreSQL using External URL');
    client.release();
  })
  .catch(err => {
    console.error('❌ DB Connection Failed:', err.message);
    console.error('Full error:', err);
  });

module.exports = pool;