const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, created_at FROM clients WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /clients]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des clients' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim() || null;
    const phone = String(req.body?.phone || '').trim() || null;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const result = await pool.query(
      'INSERT INTO clients (user_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
      [req.user.id, name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[POST /clients]', err);
    res.status(500).json({ error: 'Erreur lors de la création du client' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim() || null;
    const phone = String(req.body?.phone || '').trim() || null;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const result = await pool.query(
      'UPDATE clients SET name = $1, email = $2, phone = $3 WHERE id = $4 AND user_id = $5 RETURNING id, name, email, phone',
      [name, email, phone, req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Client introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[PUT /clients/:id]', err);
    res.status(500).json({ error: 'Erreur lors de la modification du client' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Client introuvable' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /clients/:id]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du client' });
  }
});

module.exports = router;
