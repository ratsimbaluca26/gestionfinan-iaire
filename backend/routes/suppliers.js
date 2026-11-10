const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function serverError(res, err, where) {
  console.error(`[${where}]`, err);
  const body = { error: 'Erreur serveur' };
  if (process.env.NODE_ENV !== 'production') body.detail = err.code || err.message;
  return res.status(500).json(body);
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at AS "createdAt" FROM suppliers WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { return serverError(res, err, 'GET /suppliers'); }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const result = await pool.query(
      'INSERT INTO suppliers (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at AS "createdAt"',
      [req.user.id, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Ce fournisseur existe déjà' });
    return serverError(res, err, 'POST /suppliers');
  }
});

router.put('/:id', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const result = await pool.query(
      'UPDATE suppliers SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name, created_at AS "createdAt"',
      [name, req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Fournisseur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Ce fournisseur existe déjà' });
    return serverError(res, err, 'PUT /suppliers/:id');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Fournisseur introuvable' });
    res.json({ ok: true });
  } catch (err) { return serverError(res, err, 'DELETE /suppliers/:id'); }
});

module.exports = router;
