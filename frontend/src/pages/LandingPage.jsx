import React from 'react';
import { Link } from 'react-router-dom';

const contactEmail = process.env.REACT_APP_CONTACT_EMAIL || '';

export default function LandingPage({ user }) {
  return <div className="overflow-hidden bg-white font-sans text-slate-900">
    <section className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-red-50 via-white to-stone-100" />
      <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex border-l-4 border-red-700 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-red-800 shadow-sm">Gestion financière personnelle</p>
          <h1 className="font-sans text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl">Votre argent, <span className="text-red-700">enfin maîtrisé.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Suivez vos entrées, vos dépenses, vos clients et vos fournisseurs dans un espace clair, simple et privé.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/register'} className="rounded-full bg-red-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-700/15 transition hover:-translate-y-0.5 hover:bg-red-800">{user ? 'Ouvrir mon tableau de bord' : 'Commencer gratuitement'}</Link>
            <a href="#fonctionnalites" className="rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">Découvrir les fonctionnalités</a>
          </div>
          <p className="mt-6 text-sm text-slate-500">Un compte personnel. Des données séparées et confidentielles.</p>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-5 rounded-[2.5rem] border border-slate-200" />
          <div className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-500">Solde disponible</p><p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">1 250 000 Ar</p></div><span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700">Résumé</span></div>
            <div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-slate-600">Entrées</p><p className="mt-2 font-bold text-emerald-800">+ 1 800 000 Ar</p></div><div className="rounded-2xl bg-red-50 p-4"><p className="text-sm text-slate-600">Sorties</p><p className="mt-2 font-bold text-red-800">− 550 000 Ar</p></div></div>
            <div className="mt-6 border-t border-slate-100 pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Activité récente</h2><span className="text-xs font-semibold text-slate-500">Ce mois</span></div><div className="space-y-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Vente en ligne</p><p className="mt-1 text-xs text-slate-500">Client · Aujourd’hui</p></div><strong className="text-sm text-emerald-700">+ 250 000 Ar</strong></div><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Fournitures</p><p className="mt-1 text-xs text-slate-500">Fournisseur · Hier</p></div><strong className="text-sm text-red-700">− 85 000 Ar</strong></div></div></div>
          </div>
        </div>
      </div>
    </section>
    <section id="fonctionnalites" className="scroll-mt-24 bg-white px-5 py-20"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="mb-4 border-l-4 border-red-700 pl-3 text-xs font-bold uppercase tracking-[.18em] text-red-800">Tout au même endroit</p><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Une gestion qui va à l’essentiel.</h2><p className="mt-4 leading-7 text-slate-600">Fini les calculs éparpillés. Retrouvez vos finances et vos contacts dans un tableau de bord conçu pour vous.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3"><article className="rounded-2xl border border-slate-200 p-6 transition hover:border-slate-300 hover:shadow-lg"><span className="mb-5 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase text-slate-700">01 · Solde</span><h3 className="text-lg font-bold">Un solde personnel</h3><p className="mt-2 text-sm leading-6 text-slate-600">Visualisez vos entrées et sorties en ariary et vérifiez votre solde avant une dépense.</p></article><article className="rounded-2xl border border-slate-200 p-6 transition hover:border-slate-300 hover:shadow-lg"><span className="mb-5 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase text-slate-700">02 · Contacts</span><h3 className="text-lg font-bold">Clients et fournisseurs</h3><p className="mt-2 text-sm leading-6 text-slate-600">Organisez votre carnet professionnel et reliez les opérations aux bons contacts.</p></article><article className="rounded-2xl border border-slate-200 p-6 transition hover:border-slate-300 hover:shadow-lg"><span className="mb-5 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase text-slate-700">03 · Recherche</span><h3 className="text-lg font-bold">Retrouvez vos opérations</h3><p className="mt-2 text-sm leading-6 text-slate-600">Filtrez votre historique par période, catégorie ou texte pour retrouver une transaction rapidement.</p></article></div></div></section>
    <section className="bg-slate-950 px-5 py-16 text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center"><div><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-red-300">Passez à une gestion plus simple</p><h2 className="text-3xl font-bold tracking-tight">Prêt à mieux suivre votre budget ?</h2></div><Link to={user ? '/dashboard' : '/register'} className="rounded-full bg-red-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-red-600">{user ? 'Accéder à mon compte' : 'Créer mon compte'}</Link></div></section>
    <footer className="border-t border-slate-200 bg-white px-5 py-7"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row"><span>Finiova — Gestion financière personnelle</span>{contactEmail && <a className="font-medium text-slate-700 hover:underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>}</div></footer>
  </div>;
}
