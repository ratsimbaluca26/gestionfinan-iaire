const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const values = [req.user.id];
    let monthFilter = '';
    if (/^\d{4}-\d{2}$/.test(req.query.ym || '')) {
      values.push(req.query.ym);
      monthFilter = `AND to_char(t.date, 'YYYY-MM') = $${values.length}`;
    }
    const result = await db.query(`
      SELECT t.*, c.name AS "clientName", s.name AS "supplierName"
      FROM transactions t
      LEFT JOIN clients c ON t."clientId" = c.id AND c.user_id = t.user_id
      LEFT JOIN suppliers s ON t."supplierId" = s.id AND s.user_id = t.user_id
      WHERE t.user_id = $1 ${monthFilter}
      ORDER BY t.date DESC, t.id DESC
    `, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET /transactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, category, amount, total, paid, description, date, clientId, supplierId, sub } = req.body;
    if (!['in', 'out'].includes(type) || !category || !date) {
      return res.status(400).json({ error: 'Type, catégorie et date requis' });
    }
    const numericAmount = Number(amount || 0);
    const numericTotal = Number(total || 0);
    const numericPaid = Number(paid || 0);
    if (![numericAmount, numericTotal, numericPaid].every(Number.isFinite) ||
      numericAmount < 0 || numericTotal < 0 || numericPaid < 0 || numericPaid > numericTotal && numericTotal > 0) {
      return res.status(400).json({ error: 'Montants invalides' });
    }
    if (clientId) {
      const client = await db.query('SELECT id FROM clients WHERE id = $1 AND user_id = $2', [clientId, req.user.id]);
      if (!client.rowCount) return res.status(400).json({ error: 'Client invalide' });
    }
    if (supplierId) {
      const supplier = await db.query('SELECT id FROM suppliers WHERE id = $1 AND user_id = $2', [supplierId, req.user.id]);
      if (!supplier.rowCount) return res.status(400).json({ error: 'Fournisseur invalide' });
    }
    const result = await db.query(`
      INSERT INTO transactions (user_id, type, category, amount, total, paid, description, date, "clientId", "supplierId", sub)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `, [req.user.id, type, category, numericAmount, numericTotal, numericPaid,
      description || null, date, clientId || null, supplierId || null, sub || null]);
    res.status(201).json({ message: 'Transaction enregistrée avec succès', id: result.rows[0].id });
  } catch (error) {
    console.error('Erreur POST /transactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/pay', async (req, res) => {
  try {
    const payment = Number(req.body?.amount);
    if (!Number.isFinite(payment) || payment <= 0) return res.status(400).json({ error: 'Montant de paiement invalide' });
    const result = await db.query(`
      UPDATE transactions
      SET paid = paid + $1, amount = amount + $1
      WHERE id = $2 AND user_id = $3 AND paid + $1 <= total
      RETURNING id
    `, [payment, req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Transaction introuvable ou montant supérieur au reste dû' });
    res.json({ message: 'Paiement enregistré avec succès' });
  } catch (error) {
    console.error('Erreur PUT /transactions/:id/pay:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Transaction introuvable' });
    res.json({ message: 'Transaction supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /transactions/:id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
