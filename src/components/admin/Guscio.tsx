'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApi } from './base';

// Le schede dell'admin, nell'ordine chiesto dal PO il 15/10/2026.
// ⚠️ 13/11/2026, Federico: «Traffico diventa Dashboard», «Squadra non mi serve; chiama alerts solo quando ci sono
// problematiche» (la scheda diventa «Avvisi»), «l'admin strutturalo con le tab in verticale». Sul telefono le schede
// stanno in un menu che si apre: in verticale, in colonna, non piu una fila da scorrere.
const SCHEDE = [
  ['/admin', 'Dashboard'], ['/admin/squadra', 'Avvisi'], ['/admin/test', 'Test fatti'], ['/admin/domande', 'Domande'], ['/admin/glossario', 'Glossario'], ['/admin/nozioni', 'Nozioni'],
  ['/admin/catalogo', 'Catalogo'], ['/admin/negozi', 'Negozi'], ['/admin/marche', 'Marche'], ['/admin/biotipi', 'Biotipi'], ['/admin/revisioni', 'Revisioni'], ['/admin/rivista', 'Rivista'], ['/admin/chi-siamo', 'Chi siamo'], ['/admin/social', 'Social'], ['/admin/icone', 'Icone'],
];

export default function Guscio({ children }: { children: React.ReactNode }) {
  const qui = (usePathname() || '/admin').replace(/\/$/, '') || '/admin';
  const chi = useApi<{ email: string }>('/api/admin/chi');
  const attuale = SCHEDE.find(([h]) => h === qui)?.[1] || 'Admin';
  const elenco = SCHEDE.map(([h, n]) => <Link key={h} href={h} aria-current={qui === h ? 'page' : undefined}>{n}</Link>);
  return (
    <div className="adm adm-colonne-guscio">
      <header className="adm-testa">
        <div className="contenitore" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', justifyContent: 'space-between', paddingBlock: 12 }}>
          <Link href="/" className="titolo" style={{ fontSize: 18, fontWeight: 600, textDecoration: 'none', color: 'var(--testo)' }}>Skinmatch · admin</Link>
          <span className="piccolo">{chi.dati?.email || (chi.errore ? 'accesso non attivo' : '…')}</span>
        </div>
        <details className="contenitore adm-menu">
          <summary>{attuale} <span aria-hidden="true">▾</span></summary>
          <nav className="adm-schede-v" aria-label="Schede dell'admin">{elenco}</nav>
        </details>
      </header>
      <div className="adm-corpo">
        <nav className="adm-lato adm-schede-v" aria-label="Schede dell'admin">{elenco}</nav>
        <main className="pila adm-principale" style={{ ['--gap' as string]: '24px', paddingBlock: '24px 120px' }}>
          {chi.errore ? <div className="consulto"><b>L&apos;admin non risponde</b><span>{chi.errore}</span></div> : children}
        </main>
      </div>
    </div>
  );
}
