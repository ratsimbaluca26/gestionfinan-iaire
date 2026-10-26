const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT t.*, c.name AS "clientName", s.name AS "supplierName"
      FROM transactions t
      LEFT JOIN clients c ON t."clientId" = c.id
      LEFT JOIN suppliers s ON t."supplierId" = s.id
      ORDER BY t.date DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET /transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      type,
      category,
      amount,
      total,
      paid,
      description,
      date,
      clientId,
      supplierId,
      sub
    } = req.body;

    const query = `
      INSERT INTO transactions (
        type, category, amount, total, paid, description, date, "clientId", "supplierId", sub
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const params = [
      type,
      category,
      amount || 0,
      total || 0,
      paid || 0,
      description || null,
      date,
      clientId || null,
      supplierId || null,
      sub || null
    ];

    const result = await db.query(query, params);

    res.status(201).json({
      message: 'Transaction enregistrée avec succès',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Erreur POST /transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const result = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);
    const tx = result.rows[0];

    if (!tx) {
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    const newPaid = Number(tx.paid || 0) + Number(amount);
    const newAmount = Number(tx.amount || 0) + Number(amount);

    await db.query(
      'UPDATE transactions SET paid = $1, amount = $2 WHERE id = $3',
      [newPaid, newAmount, id]
    );

    res.json({ message: 'Paiement enregistré avec succès' });
  } catch (error) {
    console.error('Erreur PUT /transactions/:id/pay:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM transactions WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    res.json({ message: 'Transaction supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /transactions/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
