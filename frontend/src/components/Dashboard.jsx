import React, { useEffect, useMemo, useState } from 'react';
import { getTransactions, createTransaction, deleteTransaction, payTransaction, getClients, createClient, getSuppliers, createSupplier } from '../api';
import TransactionForm from './TransactionForm';

const money = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
const iconBox = 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    try {
      setError('');
      const [txRes, clientRes, supplierRes] = await Promise.all([getTransactions(), getClients(), getSuppliers()]);
      setTransactions(txRes.data || []); setClients(clientRes.data || []); setSuppliers(supplierRes.data || []);
    } catch (err) { setError(err.response?.data?.error || 'Impossible de charger vos données. Vérifiez votre connexion.'); }
  };
  useEffect(() => { load(); }, []);

  const monthTransactions = useMemo(() => transactions.filter((tx) => String(tx.date || '').slice(0, 7) === month), [transactions, month]);
  const categories = useMemo(() => [...new Set(monthTransactions.map((tx) => tx.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')), [monthTransactions]);
  const visibleTransactions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fr');
    return monthTransactions.filter((tx) => {
      const matchesCategory = !category || tx.category === category;
      const text = [tx.category, tx.description, tx.clientName, tx.supplierName, tx.sub, tx.amount].join(' ').toLocaleLowerCase('fr');
      return matchesCategory && (!term || text.includes(term));
    });
  }, [monthTransactions, search, category]);
  const incoming = monthTransactions.filter((tx) => tx.type === 'in').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const outgoing = monthTransactions.filter((tx) => tx.type === 'out').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const balance = transactions.reduce((sum, tx) => sum + (tx.type === 'in' ? 1 : -1) * Number(tx.amount || 0), 0);
  const create = async (data) => { await createTransaction(data); await load(); };
  const addClient = async (data) => { const result = await createClient(data); await load(); return result.data; };
  const addSupplier = async (data) => { const result = await createSupplier(data); await load(); return result.data; };
  const remove = async (id) => { if (window.confirm('Voulez-vous vraiment supprimer cette transaction ?')) { try { await deleteTransaction(id); await load(); } catch (err) { setError(err.response?.data?.error || 'Suppression impossible'); } } };
  const pay = async (id, remaining) => { const amount = Number(window.prompt('Montant du paiement', String(remaining))); if (amount > 0) { try { await payTransaction(id, amount); await load(); } catch (err) { setError(err.response?.data?.error || 'Paiement impossible'); } } };

  return <div className="space-y-6 md:space-y-8">
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-bold tracking-[.16em] text-forest-700">VOTRE ESPACE FINANCIER</p><h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Bonjour, bienvenue 👋</h1><p className="mt-2 text-sm text-slate-500">Gardez un œil sur vos finances, simplement.</p></div><label className="mb-0 grid gap-2 text-sm font-semibold text-slate-600">Période<input className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label></section>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-800 to-forest-900 p-6 text-white shadow-soft sm:p-8"><div className="pointer-events-none absolute -right-10 -top-32 h-72 w-72 rounded-full border border-white/10 shadow-[0_0_0_35px_rgba(255,255,255,.04),0_0_0_75px_rgba(255,255,255,.03)]"/><p className="relative text-sm text-forest-100">Solde personnel total</p><h2 className="relative mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{money(balance)}</h2><p className="relative mt-2 text-sm text-forest-100">Calculé à partir de toutes vos entrées et sorties</p><p className="relative mt-6 border-t border-white/15 pt-4 text-xs capitalize text-forest-100">{new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p></section>
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[['↙', 'Entrées du mois', money(incoming), 'bg-emerald-50 text-emerald-700'], ['↗', 'Sorties du mois', money(outgoing), 'bg-rose-50 text-rose-700'], ['♙', 'Mes clients', clients.length, 'bg-indigo-50 text-indigo-700'], ['▤', 'Mes fournisseurs', suppliers.length, 'bg-amber-50 text-amber-700']].map(([icon, label, value, color]) => <article key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"><span className={`${iconBox} ${color}`}>{icon}</span><div><p className="text-xs text-slate-500">{label}</p><strong className="mt-1 block font-display text-lg font-bold">{value}</strong></div></article>)}
    </section>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(290px,.78fr)_minmax(0,1.5fr)]">
      <TransactionForm clients={clients} suppliers={suppliers} onCreate={create} onCreateClient={addClient} onCreateSupplier={addSupplier}/>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-[11px] font-bold tracking-[.15em] text-forest-700">VOTRE ACTIVITÉ</p><h2 className="mt-1 font-display text-xl font-bold">Historique des opérations</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{visibleTransactions.length}</span></div>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1.4fr_.8fr]"><label className="mb-0 grid gap-1.5 text-xs font-semibold text-slate-600">Rechercher<input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Description, client, fournisseur…" /></label><label className="mb-0 grid gap-1.5 text-xs font-semibold text-slate-600">Catégorie<select className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Toutes les catégories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        {visibleTransactions.length === 0 ? <div className="grid min-h-48 place-content-center justify-items-center text-center"><span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-forest-50 text-xl text-forest-700">✦</span><strong className="text-sm">{search || category ? 'Aucune opération ne correspond à la recherche' : 'Rien à afficher pour cette période'}</strong><p className="mt-1 text-xs text-slate-500">Modifiez les filtres ou ajoutez une opération.</p></div> : <ul className="divide-y divide-slate-100">{visibleTransactions.map((tx) => { const remaining = Math.max(0, Number(tx.total || 0) - Number(tx.paid || 0)); return <li key={tx.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[40px_minmax(0,1fr)_auto_auto]"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tx.type === 'in' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{tx.type === 'in' ? '↙' : '↗'}</span><div className="min-w-0"><strong className="block truncate text-sm">{tx.category || 'Opération'}</strong><span className="block truncate text-xs text-slate-500">{tx.clientName || tx.supplierName || tx.description || 'Sans détail'}</span><small className="text-xs text-slate-400">{tx.date ? new Date(`${String(tx.date).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : ''}{remaining > 0 ? ` · Reste ${money(remaining)}` : ''}</small></div><strong className={`whitespace-nowrap text-sm ${tx.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>{tx.type === 'in' ? '+' : '−'}{money(tx.amount)}</strong><div className="col-span-2 flex justify-end gap-2 sm:col-span-1">{remaining > 0 && <button className="rounded-lg bg-forest-50 px-2.5 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-100" onClick={() => pay(tx.id, remaining)}>Payer</button>}<button className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label="Supprimer l’opération" onClick={() => remove(tx.id)}>×</button></div></li>; })}</ul>}
      </section>
    </div>
  </div>;
}
