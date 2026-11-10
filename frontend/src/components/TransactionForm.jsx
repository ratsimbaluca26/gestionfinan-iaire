import React, { useEffect, useMemo, useState } from 'react';

const categories = {
  in: ['Vente en ligne', 'Couture', 'Bourse', 'Autre entrée'],
  out: ['Fournitures de couture', 'Achat d\'habillement', 'Dépense personnelle', 'Frais', 'Crédit', 'Autre sortie']
};
const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100';
const labelClass = 'mb-0 block text-xs font-semibold text-slate-600';

export default function TransactionForm({ clients = [], suppliers = [], balance = 0, onCreate, onCreateClient, onCreateSupplier }) {
  const [type, setType] = useState('in');
  const [category, setCategory] = useState(categories.in[0]);
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('');
  const [paid, setPaid] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sub, setSub] = useState('Nourriture');
  const [selectedClient, setSelectedClient] = useState('');
  const [newClient, setNewClient] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isClientFlow = useMemo(() => type === 'in' && ['Vente en ligne', 'Couture'].includes(category), [type, category]);
  const isSupplierFlow = useMemo(() => type === 'out' && ['Fournitures de couture', 'Achat d\'habillement'].includes(category), [type, category]);
  const needsCounterparty = isClientFlow || isSupplierFlow;
  const paymentNow = needsCounterparty ? Number(paid || 0) : Number(amount || 0);
  const insufficientBalance = type === 'out' && paymentNow > 0 && paymentNow > Number(balance || 0);
  useEffect(() => { setCategory(categories[type][0]); setSelectedClient(''); setSelectedSupplier(''); setNewClient(''); setNewSupplier(''); }, [type]);
  useEffect(() => { setSelectedClient(''); setSelectedSupplier(''); setNewClient(''); setNewSupplier(''); }, [category]);

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { type, category, description, date };
      if (needsCounterparty) {
        const totalNum = Number(total); const paidNum = Number(paid || 0);
        if (!total || !Number.isFinite(totalNum) || totalNum <= 0) throw new Error('Montant total valide requis.');
        if (!Number.isFinite(paidNum) || paidNum < 0 || paidNum > totalNum) throw new Error('Le montant payé doit être compris entre 0 et le total.');
        payload.total = totalNum; payload.paid = paidNum; payload.amount = paidNum;
        if (isClientFlow) { let id = selectedClient; if (id === 'new') { if (!newClient.trim()) throw new Error('Nom du client requis.'); const result = await onCreateClient({ name: newClient.trim(), kind: category === 'Couture' ? 'couture' : 'vente' }); id = result?.id ?? result?.data?.id; } if (!id) throw new Error('Choisissez un client.'); payload.clientId = Number(id); }
        if (isSupplierFlow) { let id = selectedSupplier; if (id === 'new') { if (!newSupplier.trim()) throw new Error('Nom du fournisseur requis.'); const result = await onCreateSupplier({ name: newSupplier.trim() }); id = result?.id ?? result?.data?.id; } if (!id) throw new Error('Choisissez un fournisseur.'); payload.supplierId = Number(id); }
      } else {
        const number = Number(amount); if (!amount || !Number.isFinite(number) || number <= 0) throw new Error('Montant valide requis.'); payload.amount = number;
        if (category === 'Dépense personnelle') payload.sub = sub;
      }
      if (type === 'out' && paymentNow > Number(balance || 0)) throw new Error(`Solde insuffisant : disponible ${Number(balance || 0).toFixed(0)} Ar, requis ${paymentNow.toFixed(0)} Ar.`);
      await onCreate(payload); setAmount(''); setTotal(''); setPaid(''); setDescription(''); setSelectedClient(''); setSelectedSupplier(''); setNewClient(''); setNewSupplier('');
    } catch (err) { setError(err.response?.data?.error || err.message || 'Impossible d’enregistrer l’opération.'); }
    finally { setSaving(false); }
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"><p className="mb-1 text-[11px] font-bold tracking-[.15em] text-slate-600">NOUVELLE ÉCRITURE</p><h2 className="mb-5 font-sans text-xl font-bold">Ajouter une opération</h2>
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"><button type="button" className={`rounded-lg py-2 text-sm font-semibold ${type === 'in' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-500'}`} onClick={() => setType('in')}>Entrée</button><button type="button" className={`rounded-lg py-2 text-sm font-semibold ${type === 'out' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500'}`} onClick={() => setType('out')}>Sortie</button></div>
      <label className={labelClass}>Catégorie<select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>{categories[type].map((item) => <option key={item}>{item}</option>)}</select></label>
      {isClientFlow && <><label className={labelClass}>Client<select className={inputClass} value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}><option value="">Choisir un client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}<option value="new">Nouveau client</option></select></label>{selectedClient === 'new' && <label className={labelClass}>Nom du client<input className={inputClass} value={newClient} onChange={(e) => setNewClient(e.target.value)} /></label>}</>}
      {isSupplierFlow && <><label className={labelClass}>Fournisseur<select className={inputClass} value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}><option value="">Choisir un fournisseur</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}<option value="new">Nouveau fournisseur</option></select></label>{selectedSupplier === 'new' && <label className={labelClass}>Nom du fournisseur<input className={inputClass} value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} /></label>}</>}
      {needsCounterparty ? <div className="grid grid-cols-2 gap-3"><label className={labelClass}>Montant total<input className={inputClass} type="number" min="0.01" step="1" value={total} onChange={(e) => setTotal(e.target.value)} /></label><label className={labelClass}>À payer maintenant<input className={inputClass} type="number" min="0" step="1" value={paid} onChange={(e) => setPaid(e.target.value)} /></label></div> : <><label className={labelClass}>Montant (Ar)<input className={inputClass} type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>{category === 'Dépense personnelle' && <label className={labelClass}>Type de dépense<select className={inputClass} value={sub} onChange={(e) => setSub(e.target.value)}><option>Nourriture</option><option>Vêtement</option><option>Divers</option></select></label>}</>}
      {type === 'out' && <p className={`rounded-lg px-3 py-2 text-xs ${insufficientBalance ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`} role={insufficientBalance ? 'alert' : undefined}>Solde disponible : {Number(balance || 0).toLocaleString('fr-FR')} Ar{insufficientBalance ? ` — montant demandé : ${paymentNow.toLocaleString('fr-FR')} Ar` : ''}</p>}
      <label className={labelClass}>Description<input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ajouter une note…" /></label>
      <label className={labelClass}>Date<input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={saving || insufficientBalance}>{saving ? 'Enregistrement…' : insufficientBalance ? 'Solde insuffisant' : 'Enregistrer l’opération'}</button>
    </form>
  </section>;
}
