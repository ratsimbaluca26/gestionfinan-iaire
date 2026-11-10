const express = require('express');
const cors = require('cors');
const pool = require('./db');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant : configurez la variable d’environnement.');
  process.exit(1);
}
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3001' }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/suppliers', require('./routes/suppliers'));

async function ensureEmailVerificationSchema() {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE');
  await pool.query(`CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id)');
}

const port = process.env.PORT || 4000;
ensureEmailVerificationSchema()
  .then(() => app.listen(port, () => console.log(`API sur http://localhost:${port}`)))
  .catch((err) => { console.error('Initialisation du schéma e-mail impossible:', err); process.exit(1); });
