require('dotenv').config();
const mysql = require('mysql2/promise'); // IMPORTANT : version "promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test au démarrage : affiche clairement le problème MySQL s'il y en a un
pool.query('SELECT 1')
  .then(() => console.log('MySQL connecté :', process.env.DB_NAME))
  .catch((err) => console.error('MySQL ERREUR :', err.code, '-', err.message));

module.exports = pool;
