'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Il menu a pillola (lo stesso schema di sofiacrescenzi.it). La Rivista compare quando ha
// almeno un articolo: una sezione vuota nel menu sarebbe una promessa non mantenuta.
export default function Header({ rivista }: { rivista: boolean }) {
  const [aperto, setAperto] = useState(false);
  const qui = usePathname();
  useEffect(() => setAperto(false), [qui]);
  const voci = [
    { nome: 'Biotipi', href: '/biotipi' },
    { nome: 'Catalogo', href: '/catalogo' },
    { nome: 'Glossario', href: '/glossario' },
    ...(rivista ? [{ nome: 'Rivista', href: '/rivista' }] : []),
  ];
  const attivo = (h: string) => (qui === h || qui?.startsWith(h + '/') ? 'page' : undefined);
  return (
    <>
      <div className="sm-nav">
        <nav aria-label="Navigazione principale" className="sm-nav-pill">
          <Link href="/" className="sm-nav-logo" aria-label="Skinmatch, la home">
            <span>Skinmatch</span>
          </Link>
          <div className="sm-nav-links">
            {voci.map((v) => <Link key={v.href} href={v.href} className="sm-nav-link" aria-current={attivo(v.href)}>{v.nome}</Link>)}
          </div>
          <Link href="/test" className="sm-nav-cta">Fai il test</Link>
          <button className="sm-nav-burger" onClick={() => setAperto((x) => !x)} aria-label={aperto ? 'Chiudi il menu' : 'Apri il menu'} aria-expanded={aperto}>
            <span style={{ transform: aperto ? 'translateY(3.25px) rotate(45deg)' : 'none' }} />
            <span style={{ transform: aperto ? 'translateY(-3.25px) rotate(-45deg)' : 'none' }} />
          </button>
        </nav>
        {aperto && (
          <div className="sm-nav-menu">
            <Link href="/test">Il test</Link>
            {voci.map((v) => <Link key={v.href} href={v.href}>{v.nome}</Link>)}
          </div>
        )}
      </div>
      <div className="sm-nav-spazio" />
    </>
  );
}
