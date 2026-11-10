CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(32),
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE TABLE IF NOT EXISTS clients (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, email VARCHAR(255), phone VARCHAR(50), created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS suppliers (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW());
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_user_name ON suppliers(user_id, name);
CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, type VARCHAR(50), category VARCHAR(100), amount NUMERIC(12,2) NOT NULL DEFAULT 0, total NUMERIC(12,2) NOT NULL DEFAULT 0, paid NUMERIC(12,2) NOT NULL DEFAULT 0, description TEXT, date DATE, "clientId" INTEGER REFERENCES clients(id) ON DELETE SET NULL, "supplierId" INTEGER REFERENCES suppliers(id) ON DELETE SET NULL, sub VARCHAR(255), created_at TIMESTAMP NOT NULL DEFAULT NOW());
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
UPDATE transactions t SET user_id = c.user_id FROM clients c WHERE t.user_id IS NULL AND t."clientId" = c.id;
UPDATE transactions t SET user_id = s.user_id FROM suppliers s WHERE t.user_id IS NULL AND t."supplierId" = s.id AND s.user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions("clientId");
CREATE INDEX IF NOT EXISTS idx_transactions_supplier_id ON transactions("supplierId");
