const express = require('express');
const cors = require('cors');
const pool = require('./db');
const databaseReady = require('./utils/databaseReady');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3001' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  if (!(await databaseReady(pool))) {
    return res.status(503).json({ ok: false, database: 'unavailable' });
  }
  return res.json({ ok: true, database: 'available' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/suppliers', require('./routes/suppliers'));

module.exports = app;
