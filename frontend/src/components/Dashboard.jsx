import React, { useEffect, useMemo, useState } from 'react';
import {
  getTransactions, createTransaction, deleteTransaction, payTransaction,
  getClients, createClient, getSuppliers, createSupplier
} from '../api';
import TransactionForm from './TransactionForm';

const money = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = async () => {
    try {
      setError('');
      const [txRes, clientRes, supplierRes] = await Promise.all([
        getTransactions(), getClients(), getSuppliers()
      ]);
      setTransactions(txRes.data || []);
      setClients(clientRes.data || []);
      setSuppliers(supplierRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de charger vos données. Vérifiez votre connexion.');
    }
  };

  useEffect(() => { load(); }, []);

  const monthTransactions = useMemo(
    () => transactions.filter((tx) => String(tx.date || '').slice(0, 7) === month),
    [transactions, month]
  );
  const incoming = monthTransactions.filter((tx) => tx.type === 'in').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const outgoing = monthTransactions.filter((tx) => tx.type === 'out').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const balance = transactions.reduce((sum, tx) => sum + (tx.type === 'in' ? 1 : -1) * Number(tx.amount || 0), 0);

  const onCreate = async (data) => { await createTransaction(data); await load(); };
  const onCreateClient = async (data) => { const result = await createClient(data); await load(); return result.data; };
  const onCreateSupplier = async (data) => { const result = await createSupplier(data); await load(); return result.data; };
  const onDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette transaction ?')) { await deleteTransaction(id); await load(); }
  };
  const onPay = async (id, amount) => { await payTransaction(id, amount); await load(); };

  return (
    <div className="dashboard">
      <section className="welcome-row">
        <div><p className="eyebrow">VOTRE ESPACE FINANCIER</p><h1>Bonjour, bienvenue 👋</h1><p className="muted">Gardez un œil sur vos finances, simplement.</p></div>
        <label className="month-picker">Période<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </section>

      {error && <div className="err notice" role="alert">{error}</div>}

      <section className="hero balance-card">
        <div className="balance-top"><span className="balance-label">Solde personnel total</span><span className="balance-icon" aria-hidden="true">↗</span></div>
        <h2>{money(balance)}</h2>
        <p>Calculé à partir de toutes vos entrées et sorties</p>
        <div className="balance-period">{new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
      </section>

      <section className="summary-grid" aria-label="Résumé du mois">
        <article className="summary-card"><span className="summary-icon income-icon">↙</span><div><p>Entrées du mois</p><strong>{money(incoming)}</strong></div></article>
        <article className="summary-card"><span className="summary-icon expense-icon">↗</span><div><p>Sorties du mois</p><strong>{money(outgoing)}</strong></div></article>
        <article className="summary-card"><span className="summary-icon clients-icon">♙</span><div><p>Mes clients</p><strong>{clients.length}</strong></div></article>
        <article className="summary-card"><span className="summary-icon suppliers-icon">▤</span><div><p>Mes fournisseurs</p><strong>{suppliers.length}</strong></div></article>
      </section>

      <div className="dashboard-grid">
        <TransactionForm clients={clients} suppliers={suppliers} onCreate={onCreate} onCreateClient={onCreateClient} onCreateSupplier={onCreateSupplier} />
        <section className="card history-card">
          <div className="section-heading"><div><p className="eyebrow">VOTRE ACTIVITÉ</p><h2>Dernières opérations</h2></div><span className="count-pill">{monthTransactions.length}</span></div>
          {monthTransactions.length === 0 ? (
            <div className="empty-state"><span aria-hidden="true">✦</span><strong>Rien à afficher pour cette période</strong><p>Ajoutez une opération pour commencer à suivre vos finances.</p></div>
          ) : (
            <ul className="list transaction-list">
              {monthTransactions.map((tx) => {
                const remaining = Math.max(0, Number(tx.total || 0) - Number(tx.paid || 0));
                return <li key={tx.id} className="transaction-row">
                  <span className={`transaction-icon ${tx.type === 'in' ? 'income-icon' : 'expense-icon'}`}>{tx.type === 'in' ? '↙' : '↗'}</span>
                  <div className="transaction-info"><strong>{tx.category || 'Opération'}</strong><span>{tx.clientName || tx.supplierName || tx.description || 'Sans détail'}</span><small>{tx.date ? new Date(`${String(tx.date).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : ''}</small>
                    {remaining > 0 && <small className="remaining">Reste à payer : {money(remaining)}</small>}
                  </div>
                  <strong className={`amt ${tx.type === 'in' ? 'in' : 'out'}`}>{tx.type === 'in' ? '+' : '−'}{money(tx.amount)}</strong>
                  <div className="transaction-actions">
                    {remaining > 0 && <button className="btn small secondary-btn" onClick={async () => { const value = Number(window.prompt('Montant du paiement', String(remaining))); if (value > 0) await onPay(tx.id, value); }}>Payer</button>}
                    <button className="icon-button" aria-label="Supprimer l’opération" title="Supprimer" onClick={() => onDelete(tx.id)}>×</button>
                  </div>
                </li>;
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
