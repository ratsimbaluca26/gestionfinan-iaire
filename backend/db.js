require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'mon_budget',
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.query('SELECT 1')
  .then(() => console.log('PostgreSQL connecté :', process.env.DB_NAME || 'mon_budget'))
  .catch((err) => console.error('PostgreSQL ERREUR :', err.code, '-', err.message));

module.exports = pool;
