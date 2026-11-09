import React, { useEffect, useState } from 'react';
import { createClient, deleteClient, getClients, updateClient } from '../api';

const blank = { name: '', email: '', phone: '' };
export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setError(''); const result = await getClients(); setClients(result.data || []); }
    catch (err) { setError(err.response?.data?.error || 'Erreur de chargement des clients'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const submit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      if (editingId) await updateClient(editingId, form);
      else await createClient(form);
      setForm(blank); setEditingId(null); await load();
    } catch (err) { setError(err.response?.data?.error || 'Erreur lors de l’enregistrement du client'); }
  };
  const edit = (client) => { setEditingId(client.id); setForm({ name: client.name || '', email: client.email || '', phone: client.phone || '' }); };
  const remove = async (client) => {
    if (!window.confirm(`Supprimer le client « ${client.name} » ?`)) return;
    try { await deleteClient(client.id); await load(); }
    catch (err) { setError(err.response?.data?.error || 'Erreur lors de la suppression'); }
  };
  return <section className="card contacts-card"><div className="section-heading"><div><p className="eyebrow">VOTRE CARNET</p><h2>Mes clients</h2></div><span className="count-pill">{clients.length}</span></div>
    <form onSubmit={submit} className="contact-form"><label>Nom<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du client" /></label><div className="row"><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@exemple.fr" /></label><label>Téléphone<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06…" /></label></div><div className="contact-form-actions"><button type="submit" className="btn">{editingId ? 'Enregistrer' : 'Ajouter'}</button>{editingId && <button type="button" className="btn secondary-btn" onClick={() => { setEditingId(null); setForm(blank); }}>Annuler</button>}</div></form>
    {error && <div className="err" role="alert">{error}</div>}
    {loading ? <p>Chargement…</p> : clients.length === 0 ? <div className="empty-state"><strong>Aucun client</strong><p>Ajoutez votre premier client ci-dessus.</p></div> : <ul className="list contact-list">{clients.map((client) => <li key={client.id}><div><strong>{client.name}</strong><span className="contact-detail">{[client.email, client.phone].filter(Boolean).join(' · ') || 'Aucune coordonnée'}</span></div><div className="contact-actions"><button className="btn small secondary-btn" onClick={() => edit(client)}>Modifier</button><button className="btn small danger-btn" onClick={() => remove(client)}>Supprimer</button></div></li>)}</ul>}
  </section>;
}
