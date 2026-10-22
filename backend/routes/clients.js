const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, created_at FROM clients WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.code });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim() || null;
    const phone = String(req.body?.phone || '').trim() || null;
    if (!name) return res.status(400).json({ error: 'Nom requis' });

    const [r] = await pool.query(
      'INSERT INTO clients (user_id, name, email, phone) VALUES (?, ?, ?, ?)',
      [req.user.id, name, email, phone]
    );
    res.status(201).json({ id: r.insertId, name, email, phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.code });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: err.code });
  }
});

module.exports = router;
