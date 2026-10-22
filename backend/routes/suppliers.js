const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function serverError(res, err, where) {
  console.error(`[${where}]`, err);
  const body = { error: 'Server error' };
  if (process.env.NODE_ENV !== 'production') body.detail = err.code || err.message;
  return res.status(500).json(body);
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, created_at AS createdAt FROM suppliers ORDER BY name ASC'
    );
    return res.json(rows);
  } catch (err) {
    return serverError(res, err, 'GET /suppliers');
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name requis' });

    const [result] = await pool.query(
      'INSERT INTO suppliers (name) VALUES (?)',
      [name]
    );

    return res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ce fournisseur existe déjà' });
    }
    return serverError(res, err, 'POST /suppliers');
  }
});

module.exports = router;
