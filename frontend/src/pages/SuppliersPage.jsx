import React, { useEffect, useState } from 'react';
import { getSuppliers, createSupplier } from '../api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSuppliers = async () => {
    try {
      setError('');
      const res = await getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const supplierName = name.trim();
    if (!supplierName) return;

    try {
      setError('');
      await createSupplier({ name: supplierName });
      setName('');
      await loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du fournisseur');
    }
  };

  return (
    <section className="card">
      <h3>Fournisseurs</h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du fournisseur"
          style={{ flex: 1, minWidth: 200 }}
        />
        <button type="submit" className="btn">Ajouter</button>
      </form>

      {error && <div className="err">{error}</div>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul className="list">
          {suppliers.length === 0 ? (
            <li className="empty">Aucun fournisseur enregistré.</li>
          ) : (
            suppliers.map((supplier) => (
              <li key={supplier.id}>
                <div>
                  <strong>{supplier.name}</strong>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}
