const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// Définir le fuseau horaire UTC pour toutes les connexions
(async () => {
  try {
    await pool.query("SET timezone = 'UTC';");
  } catch (error) {
    console.error('Error setting timezone:', error);
  }
})();

module.exports = pool;