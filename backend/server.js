require('dotenv').config(); // doit être chargé EN PREMIER
const express = require('express');
const cors = require('cors');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant : copiez .env.example en .env');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:4000' }));
app.use(express.json());              // AVANT les routes, sinon req.body est vide

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/transactions', require('./routes/transactions')); // Route des transactions ajoutée
app.use('/api/suppliers', require('./routes/suppliers'));  

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API sur http://localhost:${port}`));