const { Pool } = require("pg");

const pool = new Pool({
  user: "admin_user",          // PostgreSQL username
  host: "localhost",           // PostgreSQL server
  database: "user_management", // Database name
  password: "6642",            // PostgreSQL password
  port: 5432,                  // Default PostgreSQL port
});

module.exports = pool;