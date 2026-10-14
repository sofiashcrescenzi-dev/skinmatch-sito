'use client';

import { useState } from 'react';
import { TERMINI, type Termine } from '@/lib/dati';
import { useDocumento, BarraSalva, Campo, Testo, Titolo, Vuoto, nuovoId } from './base';

// IL GLOSSARIO (15/10/2026): i termini con la «i». Le parole di un termine si accendono da sole
// ovunque compaiano sul sito (src/lib/glossario.ts): una parola per riga, la più lunga vince.
const CATEGORIE = ['pelle', 'ingredienti', 'prodotti', 'capelli', 'integrazione', 'condizioni'];
type Doc = { termini: Termine[] };

export default function Glossario() {
  const doc = useDocumento<Doc>('glossario', { termini: TERMINI });
  const [q, setQ] = useState('');
  const g = doc.dati;
  if (doc.errore) return <Vuoto>Non riesco a leggere il glossario: {doc.errore}</Vuoto>;
  if (!g) return <Vuoto>Carico…</Vuoto>;
  const metti = (i: number, t: Termine) => doc.setDati({ termini: g.termini.map((x, j) => (j === i ? t : x)) });
  const cerca = q.trim().toLowerCase();
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="Due righe per termine, scritte per chi non è del mestiere: niente promesse, niente diagnosi. Il video è facoltativo (un link a Instagram o a un file).">Il glossario ({g.termini.length} termini)</Titolo>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <input className="adm-input" style={{ maxWidth: 360 }} type="search" placeholder="Cerca" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="bottone secondario" onClick={() => {
          const nome = prompt('Il nome del termine nuovo'); if (!nome) return;
          doc.setDati({ termini: [{ id: nuovoId(nome, g.termini.map((t) => t.id)), nome, categoria: 'pelle', testo: '', parole: [nome.toLowerCase()] }, ...g.termini] });
        }}>+ termine</button>
      </div>
      {g.termini.map((t, i) => (!cerca || `${t.nome} ${t.parole.join(' ')}`.toLowerCase().includes(cerca)) && (
        <details key={t.id} className="carta" open={!t.testo}>
          <summary><b>{t.nome}</b> <span className="piccolo">· {t.categoria} · {t.parole.length} parole{t.video ? ' · video' : ''}</span></summary>
          <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
            <div className="adm-due">
              <Campo etichetta="Nome"><Testo valore={t.nome} cambia={(v) => metti(i, { ...t, nome: v })} /></Campo>
              <Campo etichetta="Gruppo"><select className="adm-input" value={t.categoria} onChange={(e) => metti(i, { ...t, categoria: e.target.value })}>{CATEGORIE.map((c) => <option key={c}>{c}</option>)}</select></Campo>
            </div>
            <Campo etichetta="Spiegazione"><Testo lungo valore={t.testo} cambia={(v) => metti(i, { ...t, testo: v })} /></Campo>
            <div className="adm-due">
              <Campo etichetta="Parole che accendono la «i»" aiuto="Separate da virgola. Le sigle (SPF, BHA) contano solo in maiuscolo.">
                <Testo valore={t.parole.join(', ')} cambia={(v) => metti(i, { ...t, parole: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
              </Campo>
              <Campo etichetta="Video (facoltativo)"><Testo valore={t.video} placeholder="https://www.instagram.com/p/…" cambia={(v) => metti(i, { ...t, video: v || undefined })} /></Campo>
            </div>
            <button type="button" className="chip" style={{ justifySelf: 'end' }} onClick={() => confirm(`Togliere «${t.nome}»?`) && doc.setDati({ termini: g.termini.filter((_, j) => j !== i) })}>Togli il termine</button>
          </div>
        </details>
      ))}
      <BarraSalva doc={doc} cosa="glossario" />
    </div>
  );
}
