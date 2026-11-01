import React, { useEffect, useState } from 'react';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  payTransaction,
  getClients,
  createClient,
  getSuppliers,
  createSupplier
} from '../api';
import TransactionForm from './TransactionForm';

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
        getTransactions(month),
        getClients(),
        getSuppliers()
      ]);

      setTransactions(txRes.data);
      setClients(clientRes.data);
      setSuppliers(supplierRes.data);
    } catch (err) {
      setError('Erreur de chargement des données');
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const onCreate = async (data) => {
    await createTransaction(data);
    await load();
  };

  const onCreateClient = async (data) => {
    const res = await createClient(data);
    await load();
    return res.data;
  };

  const onCreateSupplier = async (data) => {
    const res = await createSupplier(data);
    await load();
    return res.data;
  };

  const onDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette transaction ?')) {
      await deleteTransaction(id);
      await load();
    }
  };

  const onPay = async (id, amount) => {
    await payTransaction(id, amount);
    await load();
  };

  const incoming = transactions
    .filter(x => x.type === 'in')
    .reduce((sum, x) => sum + Number(x.amount || 0), 0);

  const outgoing = transactions
    .filter(x => x.type === 'out')
    .reduce((sum, x) => sum + Number(x.amount || 0), 0);

  return (
    <div>
      <div className="hero">
        <small>
          {new Date(`${month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </small>

        <h2 style={{ marginTop: 8, fontSize: '2.3rem' }}>
          {(incoming - outgoing).toFixed(2)} €
        </h2>

        <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
          <span>Entrées: {incoming.toFixed(2)} €</span>
          <span>Sorties: {outgoing.toFixed(2)} €</span>
        </div>
      </div>

      <div className="grid">
        <TransactionForm
          clients={clients}
          suppliers={suppliers}
          onCreate={onCreate}
          onCreateClient={onCreateClient}
          onCreateSupplier={onCreateSupplier}
        />

        <section className="card">
          <h3>Historique</h3>
          {error && <div className="err">{error}</div>}

          <div style={{ marginBottom: 12 }}>
            <label>
              Mois
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
          </div>

          <ul className="list">
            {transactions.length === 0 ? (
              <li className="empty">Aucune opération pour ce mois.</li>
            ) : (
              transactions.map((tx) => {
                const remaining = (Number(tx.total || 0) || 0) - (Number(tx.paid || 0) || 0);

                return (
                  <li key={tx.id}>
                    <div>
                      <div>
                        <strong>{tx.category}</strong>
                        {tx.clientName && <small style={{ marginLeft: 8, color: '#666' }}>({tx.clientName})</small>}
                        {tx.supplierName && <small style={{ marginLeft: 8, color: '#666' }}>({tx.supplierName})</small>}
                      </div>
                      <div className="d">{tx.description || '—'} · {tx.date}</div>
                      {tx.total > 0 && (
                        <small style={{ display: 'block', color: remaining > 0 ? '#d97706' : '#059669' }}>
                          Payé: {Number(tx.paid || 0).toFixed(2)} € / Total: {Number(tx.total).toFixed(2)} €
                          {remaining > 0 && ` (Reste: ${remaining.toFixed(2)} €)`}
                        </small>
                      )}
                    </div>

                    <span className={`amt ${tx.type === 'in' ? 'in' : 'out'}`}>
                      {tx.type === 'in' ? '+' : '-'}{Number(tx.amount || 0).toFixed(2)} €
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {remaining > 0 && (
                        <>
                          <input
                            id={`pay-${tx.id}`}
                            type="number"
                            placeholder="Montant"
                            style={{ width: 90 }}
                          />
                          <button
                            className="btn small"
                            onClick={async () => {
                              const inputEl = document.getElementById(`pay-${tx.id}`);
                              const p = parseFloat(inputEl.value);
                              if (p > 0) {
                                await onPay(tx.id, p);
                                inputEl.value = '';
                              }
                            }}
                          >
                            Payer
                          </button>
                        </>
                      )}

                      <button
                        className="btn small"
                        style={{ background: '#A3295F' }}
                        onClick={() => onDelete(tx.id)}
                      >
                        Suppr.
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}