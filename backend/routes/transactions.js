const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT t.*, c.name as clientName, s.name as supplierName
      FROM transactions t
      LEFT JOIN clients c ON t.clientId = c.id
      LEFT JOIN suppliers s ON t.supplierId = s.id
      ORDER BY t.date DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
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
        type, category, amount, total, paid, description, date, clientId, supplierId, sub
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    const [result] = await db.query(query, params);

    res.status(201).json({
      message: 'Transaction enregistrée avec succès',
      id: result.insertId
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

    const [rows] = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    const tx = rows[0];
    const newPaid = Number(tx.paid || 0) + Number(amount);
    const newAmount = Number(tx.amount || 0) + Number(amount);

    const query = `
      UPDATE transactions
      SET paid = ?, amount = ?
      WHERE id = ?
    `;

    await db.query(query, [newPaid, newAmount, id]);

    res.json({ message: 'Paiement enregistré avec succès' });
  } catch (error) {
    console.error('Erreur PUT /transactions/:id/pay:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM transactions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    res.json({ message: 'Transaction supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /transactions/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
