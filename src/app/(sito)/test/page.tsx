'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TEST, percorsoPerId } from '@/lib/dati';
import { consiglia, domandeDi, type Risposte } from '@/lib/motore';
import { ConTermini } from '@/components/Termini';
import Risultato from '@/components/Risultato';
import Foto from '@/components/Foto';
import { segna } from '@/lib/eventi';
import { Luna } from '@/components/Inviti';

// IL TEST (quattro percorsi: viso, cute e capelli, integrazione, tutto insieme).
// ⚠️ Le risposte restano su questo telefono (localStorage): al sito arriva solo il conteggio
// di test iniziati e finiti, senza le risposte (tappa 9 delle «Tappe di Skinmatch»).
const CHIAVE = 'skinmatch-test-2';
const VECCHI: Record<string, string> = { capelli: 'cute', completa: 'completo' };
type Stato = { percorso: string | null; risposte: Risposte; passo: number; fine: boolean };
const VUOTO: Stato = { percorso: null, risposte: {}, passo: 0, fine: false };

export default function TestPage() {
  const [s, setS] = useState<Stato>(VUOTO);
  const [pronto, setPronto] = useState(false);
  const iniziato = useRef<string | null>(null);
  const testa = useRef<HTMLDivElement>(null);
  const inCorsa = useRef(false);

  useEffect(() => {
    let st = VUOTO;
    try { const x = JSON.parse(localStorage.getItem(CHIAVE) || 'null'); if (x && typeof x === 'object') st = { ...VUOTO, ...x }; } catch { /* niente */ }
    const q = new URLSearchParams(window.location.search).get('percorso');
    const id = q ? VECCHI[q] || q : null;
    if (id && percorsoPerId(id) && id !== st.percorso) st = { ...VUOTO, percorso: id };
    setS(st);
    setPronto(true);
  }, []);
  useEffect(() => { if (pronto) try { localStorage.setItem(CHIAVE, JSON.stringify(s)); } catch { /* niente */ } }, [s, pronto]);
  useEffect(() => { testa.current?.scrollIntoView({ block: 'start' }); }, [s.passo, s.fine, s.percorso]);

  const percorso = s.percorso ? percorsoPerId(s.percorso) : null;
  const domande = useMemo(() => (percorso ? domandeDi(percorso, s.risposte) : []), [percorso, s.risposte]);
  const risultato = useMemo(() => (percorso && s.fine ? consiglia(percorso, s.risposte) : null), [percorso, s.fine, s.risposte]);
  useEffect(() => {
    if (risultato) segna({ e: 'test_fine', p: risultato.percorso.id, b: risultato.aree.map((a) => a.biotipo?.id || '').filter(Boolean) });
  }, [risultato]);

  if (!pronto) return <main className="contenitore sezione" style={{ minHeight: '60vh' }} />;

  // la scelta del percorso
  if (!percorso) {
    return (
      <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(24px, 4vw, 40px)' }}>
        <header className="pila" style={{ ['--gap' as string]: '12px' }}>
          <span className="etichetta">Il test</span>
          <h1 className="sopratitolo">Da dove partiamo?</h1>
          <p className="intro">Domande su quello che vedi allo specchio, non su come pensi di essere. Ne escono il tuo biotipo e i prodotti giusti, ognuno con un&apos;alternativa che costa meno. Non è una diagnosi.</p>
        </header>
        <div className="griglia" style={{ ['--min' as string]: '250px' }}>
          {TEST.percorsi.map((p) => (
            <button key={p.id} type="button" className="carta-foto con-luna" style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer', padding: 0 }}
              onClick={() => setS({ ...VUOTO, percorso: p.id })}>
              <Foto nome={p.immagine} sizes="(max-width: 760px) 100vw, 25vw" />
              <span className="corpo">
                <span className="titolo-3">{p.nome}</span>
                <span className="piccolo">{p.descrizione}</span>
                <Luna>{p.domande.length} domande · circa {p.minuti} minuti</Luna>
              </span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (risultato) {
    return (
      <main className="contenitore sezione" ref={testa} style={{ scrollMarginTop: 90 }}>
        <Risultato r={risultato} rifai={() => setS({ ...VUOTO, percorso: percorso.id })} cambia={() => setS(VUOTO)} />
      </main>
    );
  }

  const passo = Math.min(s.passo, domande.length - 1);
  const d = domande[passo];
  const scelte = ([] as string[]).concat(s.risposte[d.id] ?? []);
  const avanti = (risposte: Risposte) => {
    if (iniziato.current !== percorso.id) { iniziato.current = percorso.id; segna({ e: 'test_inizio', p: percorso.id }); }
    const nuove = domandeDi(percorso, risposte);
    const prossimo = passo + 1;
    setS({ ...s, risposte, passo: prossimo, fine: prossimo >= nuove.length });
  };
  const tocca = (id: string) => {
    if (!d.multipla) {
      // la mezzaluna si chiude (220 ms), poi la domanda dopo (animazione 2 di Zeno)
      if (inCorsa.current) return;
      inCorsa.current = true;
      const risposte = { ...s.risposte, [d.id]: id };
      setS({ ...s, risposte });
      setTimeout(() => { inCorsa.current = false; avanti(risposte); }, 260);
      return;
    }
    const o = d.opzioni.find((x) => x.id === id)!;
    let nuove = scelte.includes(id) ? scelte.filter((x) => x !== id) : [...scelte, id];
    nuove = o.esclusiva ? (scelte.includes(id) ? [] : [id]) : nuove.filter((x) => !d.opzioni.find((y) => y.id === x)?.esclusiva);
    setS({ ...s, risposte: { ...s.risposte, [d.id]: nuove } });
  };

  return (
    <main className="contenitore stretto sezione pila" ref={testa} style={{ ['--gap' as string]: '22px', scrollMarginTop: 90 }}>
      <div className="pila" style={{ ['--gap' as string]: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span className="etichetta">{percorso.titolo}</span>
          <span className="piccolo">{passo + 1} di {domande.length}</span>
        </div>
        <div className="barra" role="progressbar" aria-valuemin={0} aria-valuemax={domande.length} aria-valuenow={passo + 1}><i style={{ transform: `scaleX(${1 - (passo + 1) / domande.length})` }} /></div>
      </div>
      <div key={d.id} className="pila entra" style={{ ['--gap' as string]: '8px' }}>
        <h1 className="titolo-2"><ConTermini testo={d.testo} /></h1>
        {d.aiuto && <p className="piccolo">{d.aiuto}</p>}
      </div>
      <div key={`${d.id}-r`} className="pila entra" style={{ ['--gap' as string]: '10px' }} role="group" aria-label={d.testo}>
        {d.opzioni.map((o) => (
          <button key={o.id} type="button" className={`opzione${d.multipla ? ' multipla' : ''}`} aria-pressed={scelte.includes(o.id)} onClick={() => tocca(o.id)}>
            <span className="segno" aria-hidden="true" />
            <span>{o.testo}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        <button type="button" className="bottone secondario" onClick={() => (passo === 0 ? setS(VUOTO) : setS({ ...s, passo: passo - 1 }))}>
          {passo === 0 ? 'Cambia test' : 'Indietro'}
        </button>
        {d.multipla && <button type="button" className="bottone" disabled={!scelte.length} onClick={() => avanti(s.risposte)}>Avanti</button>}
      </div>
    </main>
  );
}
