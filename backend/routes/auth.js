const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const GMAIL_RE = /^[a-z0-9][a-z0-9._%+-]*@gmail\.com$/i;
const normalizeGmail = (value) => {
  const email = String(value || '').trim().toLowerCase();
  if (!GMAIL_RE.test(email)) return '';
  const [local] = email.split('@');
  return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`;
};
const sign = (user) => jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

function serverError(res, err, where) {
  console.error(`[${where}]`, err);
  const body = { error: 'Erreur serveur' };
  if (process.env.NODE_ENV !== 'production') body.detail = err.code || err.message;
  return res.status(500).json(body);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function mailer() {
  const gmailUser = process.env.GMAIL_USER;
  const appPassword = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!gmailUser || !appPassword) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: appPassword } });
}

router.post('/register', async (req, res) => {
  const email = normalizeGmail(req.body?.email);
  const name = String(req.body?.name || '').trim() || null;
  const password = String(req.body?.password || '');
  if (!email) return res.status(400).json({ error: 'Entrez une adresse Gmail valide.' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum' });
  const transport = mailer();
  if (!transport) return res.status(503).json({ error: 'La confirmation par e-mail n’est pas configurée. Réessayez plus tard.' });

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE lower(email) = $1', [email]);
    if (existing.rowCount) return res.status(409).json({ error: 'Cette adresse Gmail est déjà utilisée.' });
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query('BEGIN');
    const inserted = await client.query(
      'INSERT INTO users (name, email, password_hash, email_verified) VALUES ($1, $2, $3, FALSE) RETURNING id',
      [name, email, passwordHash]
    );
    const userId = inserted.rows[0].id;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await client.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [userId, tokenHash]
    );
    await client.query('COMMIT');

    const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:3001').replace(/\/$/, '');
    const verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(rawToken)}`;
    try {
      await transport.sendMail({
        from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        to: email,
        subject: 'Confirmez votre adresse Gmail — Finiova',
        text: `Bonjour${name ? ` ${name}` : ''},\n\nPour confirmer votre adresse et activer votre compte, ouvrez ce lien (valable 30 minutes) :\n${verifyUrl}\n\nSi vous n’avez pas créé de compte, ignorez ce message.`,
        html: `<p>Bonjour${name ? ` ${escapeHtml(name)}` : ''},</p><p>Confirmez votre adresse Gmail pour activer votre compte Finiova. Ce lien expire dans 30 minutes.</p><p><a href="${verifyUrl}">Confirmer mon adresse Gmail</a></p><p>Si vous n’avez pas créé de compte, ignorez ce message.</p>`
      });
    } catch (mailError) {
      console.error('[register email]', mailError);
      await pool.query('DELETE FROM users WHERE id = $1 AND email_verified = FALSE', [userId]);
      return res.status(503).json({ error: 'Impossible d’envoyer le message de confirmation. Vérifiez la configuration Gmail puis réessayez.' });
    }
    return res.status(201).json({ message: 'Compte créé. Consultez votre boîte Gmail et cliquez sur le lien de confirmation pour activer votre compte.' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* no active transaction */ }
    if (err.code === '23505') return res.status(409).json({ error: 'Cette adresse Gmail est déjà utilisée.' });
    return serverError(res, err, 'register');
  } finally { client.release(); }
});

router.post('/verify-email', async (req, res) => {
  const token = String(req.body?.token || '');
  if (!/^[a-f0-9]{64}$/i.test(token)) return res.status(400).json({ error: 'Lien de confirmation invalide.' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'SELECT user_id FROM email_verification_tokens WHERE token_hash = $1 AND expires_at > NOW() FOR UPDATE',
      [tokenHash]
    );
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Lien expiré ou déjà utilisé. Recommencez l’inscription.' });
    }
    const userId = result.rows[0].user_id;
    await client.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [userId]);
    await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
    await client.query('COMMIT');
    return res.json({ message: 'Adresse Gmail confirmée. Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* no active transaction */ }
    return serverError(res, err, 'verify-email');
  } finally { client.release(); }
});

router.post('/login', async (req, res) => {
  try {
    const email = normalizeGmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Adresse Gmail et mot de passe requis' });
    const result = await pool.query('SELECT id, name, email, password_hash, email_verified FROM users WHERE email = $1', [email]);
    const row = result.rows[0];
    const ok = row && (await bcrypt.compare(password, row.password_hash));
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });
    if (!row.email_verified) return res.status(403).json({ error: 'Confirmez votre adresse Gmail depuis le lien reçu avant de vous connecter.' });
    const user = { id: row.id, name: row.name, email: row.email };
    return res.json({ token: sign(user), user });
  } catch (err) { return serverError(res, err, 'login'); }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1 AND email_verified = TRUE', [req.user.id]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Utilisateur introuvable ou adresse non confirmée' });
    return res.json({ user: result.rows[0] });
  } catch (err) { return serverError(res, err, 'me'); }
});
module.exports = router;
