'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApi } from './base';

// Le schede dell'admin, nell'ordine chiesto dal PO il 15/10/2026.
const SCHEDE = [
  ['/admin', 'Traffico'], ['/admin/test', 'Test fatti'], ['/admin/domande', 'Domande'], ['/admin/glossario', 'Glossario'],
  ['/admin/catalogo', 'Catalogo'], ['/admin/biotipi', 'Biotipi'], ['/admin/rivista', 'Rivista'], ['/admin/squadra', 'Squadra'],
];

export default function Guscio({ children }: { children: React.ReactNode }) {
  const qui = (usePathname() || '/admin').replace(/\/$/, '') || '/admin';
  const chi = useApi<{ email: string }>('/api/admin/chi');
  return (
    <div className="adm">
      <header className="adm-testa">
        <div className="contenitore" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', justifyContent: 'space-between', paddingBlock: 12 }}>
          <Link href="/" className="titolo" style={{ fontSize: 18, fontWeight: 600, textDecoration: 'none', color: 'var(--testo)' }}>Skinmatch · admin</Link>
          <span className="piccolo">{chi.dati?.email || (chi.errore ? 'accesso non attivo' : '…')}</span>
        </div>
        <nav className="contenitore adm-schede" aria-label="Schede dell'admin">
          {SCHEDE.map(([h, n]) => <Link key={h} href={h} aria-current={qui === h ? 'page' : undefined}>{n}</Link>)}
        </nav>
      </header>
      <main className="contenitore pila" style={{ ['--gap' as string]: '24px', paddingBlock: '24px 120px' }}>
        {chi.errore ? <div className="consulto"><b>L&apos;admin non risponde</b><span>{chi.errore}</span></div> : children}
      </main>
    </div>
  );
}
