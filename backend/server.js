require('dotenv').config();
const app = require('./app');
const pool = require('./db');

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

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET manquant : configurez la variable d’environnement.');
  }
  await ensureEmailVerificationSchema();
  const port = Number(process.env.PORT || 4000);
  return app.listen(port, () => console.log(`API sur http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Démarrage du backend impossible :', err.message);
    process.exit(1);
  });
}

module.exports = { start, ensureEmailVerificationSchema };
