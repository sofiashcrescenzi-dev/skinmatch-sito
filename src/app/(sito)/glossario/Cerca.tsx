'use client';

import { useState } from 'react';

// La ricerca nel glossario: porta al termine, senza ricaricare.
export default function Cerca({ termini }: { termini: { id: string; nome: string; parole: string[] }[] }) {
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const trovati = t.length < 2 ? [] : termini.filter((x) => [x.nome, ...x.parole].some((p) => p.toLowerCase().includes(t))).slice(0, 8);
  return (
    <div className="pila" style={{ ['--gap' as string]: '8px', maxWidth: 560 }}>
      <label htmlFor="cerca-termine" className="piccolo">Cerca un termine</label>
      <input id="cerca-termine" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="es. niacinamide, forfora, SPF"
        style={{ font: 'inherit', fontSize: 16, padding: '12px 16px', borderRadius: 999, border: '1px solid var(--riga)', background: 'var(--foglio)', color: 'var(--testo)' }} />
      {trovati.length > 0 && <div className="riga-chip">{trovati.map((x) => <a key={x.id} href={`#${x.id}`} className="chip">{x.nome}</a>)}</div>}
      {t.length >= 2 && !trovati.length && <span className="piccolo">Nessun termine con «{q}».</span>}
    </div>
  );
}
