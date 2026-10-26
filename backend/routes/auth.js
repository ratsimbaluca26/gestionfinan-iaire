const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const sign = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

function serverError(res, err, where) {
  console.error(`[${where}]`, err);
  const body = { error: 'Server error' };
  if (process.env.NODE_ENV !== 'production') body.detail = err.code || err.message;
  return res.status(500).json(body);
}

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim() || null;
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email invalide' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [name, email, passwordHash]
    );

    const user = { id: result.rows[0].id, name, email };
    return res.status(201).json({ token: sign(user), user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' });
    return serverError(res, err, 'register');
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    const row = result.rows[0];
    const ok = row && (await bcrypt.compare(password, row.password_hash));
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });

    const user = { id: row.id, name: row.name, email: row.email };
    return res.json({ token: sign(user), user });
  } catch (err) {
    return serverError(res, err, 'login');
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ error: 'Utilisateur introuvable' });
    res.json({ user: row });
  } catch (err) {
    return serverError(res, err, 'me');
  }
});

module.exports = router;
