import React, { useEffect, useState } from 'react';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  payTransaction,
  getClients,
  createClient,
  getSuppliers,      // ✅ ajout
  createSupplier     // ✅ ajout
} from '../api';
import TransactionForm from './TransactionForm';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]); // ✅ ajout
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = async () => {
    try {
      setError('');

      const [txRes, clientRes, supplierRes] = await Promise.all([
        getTransactions(month),
        getClients(),
        getSuppliers() // ✅ ajout
      ]);

      setTransactions(txRes.data);
      setClients(clientRes.data);
      setSuppliers(supplierRes.data); // ✅ ajout
    } catch (err) {
      console.error(err);
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
    return res.data; // pour récupérer l'id dans TransactionForm
  };

  const onCreateSupplier = async (data) => { // ✅ ajout
    const res = await createSupplier(data);
    await load();
    return res.data; // { id, name }
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
          suppliers={suppliers}              // ✅ ajout
          onCreate={onCreate}
          onCreateClient={onCreateClient}
          onCreateSupplier={onCreateSupplier} // ✅ ajout (sinon pas de “+ Nouveau fournisseur”)
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

          {/* le reste de ton historique inchangé */}
        </section>
      </div>
    </div>
  );
}