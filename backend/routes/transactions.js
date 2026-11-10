const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');
const nodemailer = require('nodemailer');

router.use(requireAuth);

function createReceiptMailer() {
  const gmailUser = String(process.env.GMAIL_USER || '').trim();
  const appPassword = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!gmailUser || !appPassword) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: appPassword }
  });
}
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))} Ar`;

router.get('/', async (req, res) => {
  try {
    const values = [req.user.id];
    let monthFilter = '';
    if (/^\d{4}-\d{2}$/.test(req.query.ym || '')) {
      values.push(req.query.ym);
      monthFilter = `AND to_char(t.date, 'YYYY-MM') = $${values.length}`;
    }
    const result = await db.query(`
      SELECT t.*, c.name AS "clientName", c.email AS "clientEmail", s.name AS "supplierName"
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
    if (!['in', 'out'].includes(type) || !category || !date) return res.status(400).json({ error: 'Type, catégorie et date requis' });
    const numericAmount = Number(amount || 0);
    const numericTotal = Number(total || 0);
    const numericPaid = Number(paid || 0);
    if (![numericAmount, numericTotal, numericPaid].every(Number.isFinite) || numericAmount < 0 || numericTotal < 0 || numericPaid < 0 || (numericPaid > numericTotal && numericTotal > 0)) return res.status(400).json({ error: 'Montants invalides' });
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
    `, [req.user.id, type, category, numericAmount, numericTotal, numericPaid, description || null, date, clientId || null, supplierId || null, sub || null]);
    res.status(201).json({ message: 'Transaction enregistrée avec succès', id: result.rows[0].id });
  } catch (error) {
    console.error('Erreur POST /transactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/pay', async (req, res) => {
  const payment = Number(req.body?.amount);
  const sendReceipt = req.body?.sendReceipt === true;
  if (!Number.isFinite(payment) || payment <= 0) return res.status(400).json({ error: 'Montant de paiement invalide' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(`
      UPDATE transactions SET paid = paid + $1, amount = amount + $1
      WHERE id = $2 AND user_id = $3 AND paid + $1 <= total
      RETURNING id, type, category, amount, total, paid, description, date, "clientId"
    `, [payment, req.params.id, req.user.id]);
    if (!updated.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction introuvable ou montant supérieur au reste dû' });
    }

    const tx = updated.rows[0];
    const recipientResult = tx.clientId
      ? await client.query('SELECT name, email FROM clients WHERE id = $1 AND user_id = $2', [tx.clientId, req.user.id])
      : { rows: [] };
    await client.query('COMMIT');

    let receiptEmail = null;
    let emailError = null;
    if (sendReceipt) {
      if (tx.type !== 'in') {
        emailError = 'Le reçu par e-mail est disponible uniquement pour un paiement reçu (entrée). Le paiement a été enregistré.';
      } else {
        const recipient = recipientResult.rows[0]?.email?.trim();
        const gmailUser = String(process.env.GMAIL_USER || '').trim();
        const transport = createReceiptMailer();
        if (!recipient) {
          emailError = 'Aucune adresse e-mail n’est enregistrée pour ce client. Le paiement a été enregistré.';
        } else if (!transport) {
          emailError = 'Gmail expéditeur non configuré sur le backend. Le paiement a été enregistré.';
        } else {
          const clientName = recipientResult.rows[0].name || 'Client';
          const date = tx.date ? new Date(`${String(tx.date).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
          const receiptNo = `FIN-${tx.id}-${Date.now().toString(36).toUpperCase()}`;
          const remaining = Math.max(0, Number(tx.total) - Number(tx.paid));
          const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h1>Reçu de paiement</h1><p>Bonjour ${escapeHtml(clientName)},</p><p>Nous confirmons la réception d’un paiement.</p><table style="border-collapse:collapse;width:100%"><tr><td style="padding:8px;border-bottom:1px solid #ddd">Numéro du reçu</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(receiptNo)}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Opération</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(tx.category)}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Montant reçu</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(money(payment))}</strong></td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Total réglé</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(tx.paid))}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Reste dû</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(remaining))}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Date</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(date)}</td></tr></table><p>Facture envoyée par ${escapeHtml(gmailUser)} via Finiova.</p></div>`;
          try {
            await transport.sendMail({
              from: { name: 'Finiova', address: gmailUser },
              to: recipient,
              subject: `Reçu de paiement ${receiptNo}`,
              text: `Reçu de paiement ${receiptNo}\nClient : ${clientName}\nOpération : ${tx.category}\nPaiement reçu : ${money(payment)}\nTotal réglé : ${money(tx.paid)}\nReste dû : ${money(remaining)}\nDate : ${date}\nEnvoyé par ${gmailUser} via Finiova.`,
              html
            });
            receiptEmail = recipient;
          } catch (mailError) {
            console.error('[payment receipt email]', mailError);
            emailError = 'Le paiement est enregistré, mais Gmail n’a pas pu envoyer le reçu. Vérifiez le Gmail expéditeur et son mot de passe d’application.';
          }
        }
      }
    }
    return res.json({ message: 'Paiement enregistré avec succès', receiptEmail, emailError });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* no active transaction */ }
    console.error('Erreur PUT /transactions/:id/pay:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
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
