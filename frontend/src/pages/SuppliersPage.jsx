import React, { useEffect, useState } from 'react';
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from '../api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSuppliers = async () => {
    try { setError(''); const res = await getSuppliers(); setSuppliers(res.data || []); }
    catch (err) { setError(err.response?.data?.error || 'Erreur de chargement des fournisseurs'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadSuppliers(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const supplierName = name.trim();
    if (!supplierName) return;
    try {
      setError('');
      if (editingId) await updateSupplier(editingId, { name: supplierName });
      else await createSupplier({ name: supplierName });
      setName(''); setEditingId(null); await loadSuppliers();
    } catch (err) { setError(err.response?.data?.error || 'Erreur lors de l’enregistrement du fournisseur'); }
  };
  const edit = (supplier) => { setEditingId(supplier.id); setName(supplier.name); };
  const remove = async (supplier) => {
    if (!window.confirm(`Supprimer le fournisseur « ${supplier.name} » ?`)) return;
    try { await deleteSupplier(supplier.id); await loadSuppliers(); }
    catch (err) { setError(err.response?.data?.error || 'Erreur lors de la suppression'); }
  };

  return <section className="card contacts-card"><div className="section-heading"><div><p className="eyebrow">VOTRE CARNET</p><h2>Mes fournisseurs</h2></div><span className="count-pill">{suppliers.length}</span></div>
    <form onSubmit={handleSubmit} className="contact-form"><label>Nom du fournisseur<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Fournitures Martin" /></label><div className="contact-form-actions"><button type="submit" className="btn">{editingId ? 'Enregistrer' : 'Ajouter'}</button>{editingId && <button type="button" className="btn secondary-btn" onClick={() => { setEditingId(null); setName(''); }}>Annuler</button>}</div></form>
    {error && <div className="err" role="alert">{error}</div>}
    {loading ? <p>Chargement…</p> : suppliers.length === 0 ? <div className="empty-state"><strong>Aucun fournisseur</strong><p>Ajoutez votre premier fournisseur ci-dessus.</p></div> : <ul className="list contact-list">{suppliers.map((supplier) => <li key={supplier.id}><div><strong>{supplier.name}</strong></div><div className="contact-actions"><button className="btn small secondary-btn" onClick={() => edit(supplier)}>Modifier</button><button className="btn small danger-btn" onClick={() => remove(supplier)}>Supprimer</button></div></li>)}</ul>}
  </section>;
}
