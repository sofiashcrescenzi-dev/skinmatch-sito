'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TEST, NOZIONI, percorsoPerId, type Nozione as N } from '@/lib/dati';
import { consiglia, domandeDi, type Risposte } from '@/lib/motore';
import { ConTermini } from '@/components/Termini';
import { useRouter } from 'next/navigation';
import { codifica } from '@/lib/condividi';
import Foto from '@/components/Foto';
import { segna } from '@/lib/eventi';
import { Luna } from '@/components/Inviti';
import Nozione from '@/components/Nozione';

// IL TEST (quattro percorsi: viso, cute e capelli, integrazione, tutto insieme).
// ⚠️ Le risposte restano su questo telefono (localStorage): al sito arriva solo il conteggio
// di test iniziati e finiti, senza le risposte (tappa 9 delle «Tappe di Skinmatch»).
const CHIAVE = 'skinmatch-test-2';
const VECCHI: Record<string, string> = { capelli: 'cute', completa: 'completo' };
type Stato = { percorso: string | null; risposte: Risposte; passo: number; fine: boolean; inizio?: number | null; pausa?: string | null; ultima?: number };

// ⚠️ LE PAUSE (23/10/2026, Federico: «i funnel più interattivi, una nozione ogni 4-5 domande o a ogni tipo di
// paragrafo, tutte correlate»): dopo una domanda che ha nozioni agganciate (src/data/nozioni.json, campo «dopo»)
// ne compare una, se dall'ultima pausa sono passate almeno DISTANZA domande. Prima quelle mai viste su questo telefono:
// chi rifà il test ne trova di nuove.
const DISTANZA = 2;
const VISTE = 'skinmatch-nozioni-viste';
function pausaDopo(domanda: string, passo: number, ultima?: number): N | null {
  if (ultima !== undefined && passo - ultima < DISTANZA) return null;
  const qui = NOZIONI.filter((n) => n.dopo === domanda);
  if (!qui.length) return null;
  let viste: string[] = [];
  try { viste = JSON.parse(localStorage.getItem(VISTE) || '[]'); } catch { /* niente */ }
  const nuove = qui.filter((n) => !viste.includes(n.id));
  const tra = nuove.length ? nuove : qui;
  const n = tra[Math.floor(Math.random() * tra.length)];
  try { localStorage.setItem(VISTE, JSON.stringify([...viste.filter((x) => x !== n.id), n.id].slice(-64))); } catch { /* niente */ }
  return n;
}
const VUOTO: Stato = { percorso: null, risposte: {}, passo: 0, fine: false, inizio: null };

export default function TestPage() {
  const [s, setS] = useState<Stato>(VUOTO);
  const [pronto, setPronto] = useState(false);
  const [ultimo, setUltimo] = useState<string | null>(null);
  const router = useRouter();
  const iniziato = useRef<string | null>(null);
  const testa = useRef<HTMLDivElement>(null);
  const inCorsa = useRef(false);

  useEffect(() => {
    let st = VUOTO;
    try { const x = JSON.parse(localStorage.getItem(CHIAVE) || 'null'); if (x && typeof x === 'object') st = { ...VUOTO, ...x }; } catch { /* niente */ }
    const u = new URLSearchParams(window.location.search);
    const q = u.get('percorso');
    const id = q ? VECCHI[q] || q : null;
    // «Rifai il test» e «Prova un altro test» arrivano con ?nuovo=1: si riparte da capo
    if (u.get('nuovo')) st = { ...VUOTO, percorso: id && percorsoPerId(id) ? id : null, inizio: Date.now() };
    else if (id && percorsoPerId(id) && (id !== st.percorso || st.fine)) st = { ...VUOTO, percorso: id, inizio: Date.now() };
    // un test già finito: si sceglie di nuovo, con il link all'ultimo risultato
    if (st.fine && !id) { setUltimo(st.percorso ? codifica(st.percorso, st.risposte) : null); st = { ...st, percorso: null }; }
    setS(st);
    setPronto(true);
  }, []);
  useEffect(() => { if (pronto) try { localStorage.setItem(CHIAVE, JSON.stringify(s)); } catch { /* niente */ } }, [s, pronto]);
  useEffect(() => { testa.current?.scrollIntoView({ block: 'start' }); }, [s.passo, s.fine, s.percorso, s.pausa]);

  const percorso = s.percorso ? percorsoPerId(s.percorso) : null;
  const domande = useMemo(() => (percorso ? domandeDi(percorso, s.risposte) : []), [percorso, s.risposte]);
  const risultato = useMemo(() => (percorso && s.fine ? consiglia(percorso, s.risposte) : null), [percorso, s.fine, s.risposte]);
  useEffect(() => {
    if (!risultato) return;
    // quanto è durato, per il «circa N minuti» della scelta (solo i secondi, niente risposte)
    const secondi = s.inizio ? Math.round((Date.now() - s.inizio) / 1000) : 0;
    segna({ e: 'test_fine', p: risultato.percorso.id, b: risultato.aree.map((a) => a.biotipo?.id || '').filter(Boolean), ...(secondi >= 15 && secondi <= 1800 ? { s: secondi } : {}) });
    // il risultato ha la sua pagina, con un link da condividere (lib/condividi.ts)
    router.push(`/risultato#${codifica(risultato.percorso.id, s.risposte)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risultato]);

  if (!pronto) return <main className="contenitore sezione" style={{ minHeight: '60vh' }} />;

  // la scelta del percorso
  if (!percorso) {
    return (
      <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(24px, 4vw, 40px)' }}>
        <header className="pila" style={{ ['--gap' as string]: '12px' }}>
          <span className="etichetta">Il test</span>
          <h1 className="sopratitolo">Da dove partiamo?</h1>
          {ultimo && <a href={`/risultato#${ultimo}`} className="link">Rivedi il tuo ultimo risultato</a>}
          <p className="intro">Domande su quello che vedi allo specchio, non su come pensi di essere. Ne escono il tuo biotipo e i prodotti giusti, ognuno con un&apos;alternativa simile, di solito più economica. Non è una diagnosi.</p>
        </header>
        <div className="griglia" style={{ ['--min' as string]: '250px' }}>
          {TEST.percorsi.map((p) => (
            <button key={p.id} type="button" className="carta-foto con-luna" style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer', padding: 0 }}
              onClick={() => setS({ ...VUOTO, percorso: p.id, inizio: Date.now() })}>
              <Foto nome={p.immagine} sizes="(max-width: 760px) 100vw, 25vw" />
              <span className="corpo">
                <span className="titolo-3">{p.nome}</span>
                <span className="piccolo">{p.descrizione}</span>
                <Luna>Circa {p.minuti} {p.minuti === 1 ? 'minuto' : 'minuti'}</Luna>
              </span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (risultato) return <main className="contenitore sezione" style={{ minHeight: '60vh' }} />;

  const passo = Math.min(s.passo, domande.length - 1);
  const d = domande[passo];
  const pausa = s.pausa ? NOZIONI.find((n) => n.id === s.pausa) : undefined;
  if (pausa) {
    return (
      <main className="contenitore stretto sezione pila" ref={testa} style={{ ['--gap' as string]: '22px', scrollMarginTop: 90 }}>
        <div className="pila" style={{ ['--gap' as string]: '8px' }}>
          <span className="etichetta">{percorso.titolo}</span>
          <div className="barra" role="progressbar" aria-label="Avanzamento del test" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((passo / domande.length) * 100)}><i style={{ transform: `scaleX(${1 - passo / domande.length})` }} /></div>
        </div>
        <div key={pausa.id} className="entra"><Nozione n={pausa} livello="h1" nuovaScheda /></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
          <button type="button" className="bottone secondario" onClick={() => setS({ ...s, pausa: null, passo: Math.max(0, s.passo - 1) })}>Indietro</button>
          <button type="button" className="bottone" onClick={() => setS({ ...s, pausa: null })}>Continua il test</button>
        </div>
      </main>
    );
  }
  const scelte = ([] as string[]).concat(s.risposte[d.id] ?? []);
  const avanti = (risposte: Risposte) => {
    const primo = iniziato.current !== percorso.id;
    if (primo) { iniziato.current = percorso.id; segna({ e: 'test_inizio', p: percorso.id }); }
    const nuove = domandeDi(percorso, risposte);
    const prossimo = passo + 1;
    const fine = prossimo >= nuove.length;
    const pausa = fine ? null : pausaDopo(d.id, passo, s.ultima);
    setS({ ...s, risposte, passo: prossimo, fine, inizio: s.inizio ?? Date.now(), pausa: pausa?.id ?? null, ultima: pausa ? passo : s.ultima });
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
        </div>
        {/* niente «3 di 20» (Federico, 16/10): solo la barra */}
        <div className="barra" role="progressbar" aria-label="Avanzamento del test" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((passo + 1) / domande.length) * 100)}><i style={{ transform: `scaleX(${1 - (passo + 1) / domande.length})` }} /></div>
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
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginLeft: 'auto' }}>
          {d.saltabile && <button type="button" className="bottone secondario" onClick={() => { const r = { ...s.risposte }; delete r[d.id]; avanti(r); }}>Salta</button>}
          {d.multipla && <button type="button" className="bottone" disabled={!scelte.length} onClick={() => avanti(s.risposte)}>Avanti</button>}
        </span>
      </div>
    </main>
  );
}
