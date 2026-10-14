'use client';

import { useEffect, useMemo, useState } from 'react';
import { CATALOGO } from '@/lib/dati';
import { PRODOTTI, rispetta } from '@/lib/catalogo';
import SchedaProdotto from '@/components/SchedaProdotto';

// Il catalogo con i filtri: categoria, filtri (premium, K-beauty, qualità/prezzo...), per chi,
// ricerca. I filtri stanno nell'indirizzo (?categoria=sieri&tag=k-beauty), così si condividono.
const PASSO = 24;
export default function Catalogo({ categoria: c0 = '', tag: t0 = '' }: { categoria?: string; tag?: string }) {
  const [categoria, setCategoria] = useState(c0);
  const [tag, setTag] = useState<string[]>(t0 ? [t0] : []);
  const [q, setQ] = useState('');
  const [quanti, setQuanti] = useState(PASSO);
  const fisso = !!(c0 || t0);
  useEffect(() => {
    if (fisso) return;
    const u = new URLSearchParams(window.location.search);
    if (u.get('categoria')) setCategoria(u.get('categoria')!);
    const t = u.getAll('tag');
    if (u.get('kbeauty') === '1') t.push('k-beauty');
    if (t.length) setTag(t);
  }, [fisso]);
  useEffect(() => {
    if (fisso) return;
    const u = new URLSearchParams();
    if (categoria) u.set('categoria', categoria);
    tag.forEach((t) => u.append('tag', t));
    history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
  }, [categoria, tag, fisso]);
  const cat = CATALOGO.categorie.find((x) => x.id === categoria);
  const lista = useMemo(() => {
    const parole = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return PRODOTTI.filter((p) => !cat || rispetta(p, cat.regola))
      .filter((p) => tag.every((t) => p.tag.includes(t)))
      .filter((p) => parole.every((w) => `${p.brand} ${p.name} ${p.description}`.toLowerCase().includes(w)))
      .sort((a, b) => Number(!!a.linkPending) - Number(!!b.linkPending) || a.brand.localeCompare(b.brand));
  }, [cat, tag, q]);
  const conta = (r: (p: (typeof PRODOTTI)[number]) => boolean) => PRODOTTI.filter(r).length;
  return (
    <div className="pila" style={{ ['--gap' as string]: '18px' }}>
      <div className="pila" style={{ ['--gap' as string]: '10px' }}>
        {!c0 && (
          <div className="riga-chip" role="group" aria-label="Categoria">
            <button type="button" className="chip" aria-pressed={!categoria} onClick={() => { setCategoria(''); setQuanti(PASSO); }}>Tutto</button>
            {CATALOGO.categorie.filter((x) => conta((p) => rispetta(p, x.regola))).map((x) => (
              <button key={x.id} type="button" className="chip" aria-pressed={categoria === x.id} onClick={() => { setCategoria(categoria === x.id ? '' : x.id); setQuanti(PASSO); }}>{x.nome}</button>
            ))}
          </div>
        )}
        <div className="riga-chip" role="group" aria-label="Filtri">
          {CATALOGO.tag.filter((x) => x.id !== t0 && conta((p) => p.tag.includes(x.id))).map((x) => (
            <button key={x.id} type="button" className="chip" aria-pressed={tag.includes(x.id)} title={x.descrizione}
              onClick={() => { setTag(tag.includes(x.id) ? tag.filter((y) => y !== x.id) : [...tag, x.id]); setQuanti(PASSO); }}>{x.nome}</button>
          ))}
        </div>
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setQuanti(PASSO); }} placeholder="Cerca una marca o un prodotto" aria-label="Cerca nel catalogo"
          style={{ font: 'inherit', fontSize: 16, padding: '11px 16px', borderRadius: 999, border: '1px solid var(--riga)', background: 'var(--foglio)', color: 'var(--testo)', maxWidth: 480 }} />
        <span className="piccolo" role="status">{lista.length} prodotti</span>
      </div>
      <div className="griglia" style={{ ['--min' as string]: '300px' }}>
        {lista.slice(0, quanti).map((p) => <SchedaProdotto key={p.id} p={p} da={c0 || t0 ? `catalogo-${c0 || t0}` : 'catalogo'} />)}
      </div>
      {lista.length > quanti && <button type="button" className="bottone secondario" style={{ justifySelf: 'center' }} onClick={() => setQuanti(quanti + PASSO)}>Mostra altri {Math.min(PASSO, lista.length - quanti)}</button>}
      <p className="piccolo">I prezzi sono indicativi e possono cambiare nel negozio. Alcuni link sono di affiliazione: se compri, Skinmatch riceve una piccola commissione, a te non costa nulla in più.</p>
    </div>
  );
}
