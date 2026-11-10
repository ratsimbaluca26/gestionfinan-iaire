const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');
const nodemailer = require('nodemailer');

router.use(requireAuth);

function createUserMailer(user) {
  const appPassword = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!user?.email || !appPassword) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: user.email, pass: appPassword }
  });
}
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = (value) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))} Ar`;

router.get('/', async (req, res) => {
  try {
    const values = [req.user.id];
    let monthFilter = '';
    if (/^\d{4}-\d{2}$/.test(req.query.ym || '')) { values.push(req.query.ym); monthFilter = `AND to_char(t.date, 'YYYY-MM') = $${values.length}`; }
    const result = await db.query(`SELECT t.*, c.name AS "clientName", c.email AS "clientEmail", s.name AS "supplierName", u.email AS "ownerEmail"
      FROM transactions t LEFT JOIN clients c ON t."clientId" = c.id AND c.user_id = t.user_id
      LEFT JOIN suppliers s ON t."supplierId" = s.id AND s.user_id = t.user_id
      JOIN users u ON u.id = t.user_id WHERE t.user_id = $1 ${monthFilter} ORDER BY t.date DESC, t.id DESC`, values);
    res.json(result.rows);
  } catch (error) { console.error('Erreur GET /transactions:', error); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, category, amount, total, paid, description, date, clientId, supplierId, sub } = req.body;
    if (!['in', 'out'].includes(type) || !category || !date) return res.status(400).json({ error: 'Type, catégorie et date requis' });
    const numericAmount = Number(amount || 0); const numericTotal = Number(total || 0); const numericPaid = Number(paid || 0);
    if (![numericAmount, numericTotal, numericPaid].every(Number.isFinite) || numericAmount < 0 || numericTotal < 0 || numericPaid < 0 || (numericPaid > numericTotal && numericTotal > 0)) return res.status(400).json({ error: 'Montants invalides' });
    if (clientId) { const client = await db.query('SELECT id FROM clients WHERE id = $1 AND user_id = $2', [clientId, req.user.id]); if (!client.rowCount) return res.status(400).json({ error: 'Client invalide' }); }
    if (supplierId) { const supplier = await db.query('SELECT id FROM suppliers WHERE id = $1 AND user_id = $2', [supplierId, req.user.id]); if (!supplier.rowCount) return res.status(400).json({ error: 'Fournisseur invalide' }); }
    const result = await db.query(`INSERT INTO transactions (user_id, type, category, amount, total, paid, description, date, "clientId", "supplierId", sub)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [req.user.id, type, category, numericAmount, numericTotal, numericPaid, description || null, date, clientId || null, supplierId || null, sub || null]);
    res.status(201).json({ message: 'Transaction enregistrée avec succès', id: result.rows[0].id });
  } catch (error) { console.error('Erreur POST /transactions:', error); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.put('/:id/pay', async (req, res) => {
  const payment = Number(req.body?.amount);
  const sendReceipt = req.body?.sendReceipt === true;
  if (!Number.isFinite(payment) || payment <= 0) return res.status(400).json({ error: 'Montant de paiement invalide' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(`UPDATE transactions t SET paid = t.paid + $1, amount = t.amount + $1
      WHERE t.id = $2 AND t.user_id = $3 AND t.type = 'in' AND t.paid + $1 <= t.total
      RETURNING t.id, t.type, t.category, t.amount, t.total, t.paid, t.description, t.date, t."clientId"`, [payment, req.params.id, req.user.id]);
    if (!updated.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Transaction introuvable ou montant supérieur au reste dû' }); }
    const tx = updated.rows[0];
    const userResult = await client.query('SELECT name, email FROM users WHERE id = $1 AND email_verified = TRUE', [req.user.id]);
    const owner = userResult.rows[0];
    const clientResult = tx.clientId ? await client.query('SELECT name, email FROM clients WHERE id = $1 AND user_id = $2', [tx.clientId, req.user.id]) : { rows: [] };
    await client.query('COMMIT');

    let receiptEmail = null;
    let emailError = null;
    if (sendReceipt) {
      const recipient = clientResult.rows[0]?.email;
      if (!recipient) {
        emailError = 'Le client n’a pas d’adresse e-mail enregistrée. Le paiement a été enregistré sans envoi de facture.';
      } else {
        const transport = createUserMailer(owner);
        if (!transport) {
          emailError = 'Envoi indisponible : configurez GMAIL_APP_PASSWORD dans les variables du backend. Le paiement a été enregistré.';
        } else {
          const clientName = clientResult.rows[0].name;
          const date = tx.date ? new Date(`${String(tx.date).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
          const receiptNo = `FIN-${tx.id}-${Date.now().toString(36).toUpperCase()}`;
          const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h1>Reçu de paiement</h1><p>Bonjour ${escapeHtml(clientName)},</p><p>Nous confirmons la réception d’un paiement.</p><table style="border-collapse:collapse;width:100%"><tr><td style="padding:8px;border-bottom:1px solid #ddd">Numéro du reçu</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(receiptNo)}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Opération</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(tx.category)}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Montant reçu</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(money(payment))}</strong></td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Total de la transaction</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(tx.total))}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Total réglé</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(tx.paid))}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Reste dû</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(Math.max(0, Number(tx.total) - Number(tx.paid))))}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Date</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(date)}</td></tr></table><p>Émis par ${escapeHtml(owner.name || owner.email)} via Finiova.</p></div>`;
          try {
            await transport.sendMail({ from: { name: owner.name || 'Finiova', address: owner.email }, to: recipient, subject: `Reçu de paiement ${receiptNo}`, text: `Reçu de paiement ${receiptNo}\nClient : ${clientName}\nOpération : ${tx.category}\nPaiement reçu : ${money(payment)}\nTotal réglé : ${money(tx.paid)}\nReste dû : ${money(Math.max(0, Number(tx.total) - Number(tx.paid)))}\nDate : ${date}\nÉmis par ${owner.name || owner.email} via Finiova.`, html });
            receiptEmail = recipient;
          } catch (mailError) {
            console.error('[payment receipt email]', mailError);
            emailError = 'Le paiement est enregistré, mais l’envoi de la facture a échoué. Vérifiez la configuration Gmail.';
          }
        }
      }
    }
    return res.json({ message: 'Paiement enregistré avec succès', receiptEmail, emailError });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* no active transaction */ }
    console.error('Erreur PUT /transactions/:id/pay:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally { client.release(); }
});

router.delete('/:id', async (req, res) => {
  try { const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]); if (!result.rowCount) return res.status(404).json({ error: 'Transaction introuvable' }); res.json({ message: 'Transaction supprimée avec succès' }); }
  catch (error) { console.error('Erreur DELETE /transactions/:id:', error); res.status(500).json({ error: 'Erreur serveur' }); }
});
module.exports = router;
