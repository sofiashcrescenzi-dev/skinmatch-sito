'use client';

// «GUARDA LA TUA ROUTINE» (15/11/2026, proposta accettata da Federico): sotto la giornata del risultato, un pulsante che
// apre un video di circa quindici secondi coi prodotti della persona (routine-video/Routine.tsx). Il player (Remotion)
// si scarica solo al tocco: chi non lo apre non paga niente in peso della pagina. I dati sono quelli di Giornata.tsx:
// stessi momenti, stessa numerazione continua dalla mattina alla sera, stessi prezzi delle scelte top.
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Giornata, Passo } from '@/lib/giornata';
import type { DatiVideo, PassoVideo } from './routine-video/Routine';

const Lettore = dynamic(() => import('./routine-video/Lettore'), {
  ssr: false,
  loading: () => <div className="gr-attesa" role="status">Preparo il video…</div>,
});

export function datiVideo(g: Giornata, biotipo?: string, nome?: string): DatiVideo {
  // senza prodotti a pranzo, mattina e sera si seguono (come nella giornata)
  const due = !g.momenti.some((m) => m.id === 'pranzo' && m.passi.length);
  let k = 0;
  const passo = (p: Passo): PassoVideo => {
    const x = p.scelta.consigliato.prodotto;
    return { n: ++k, passaggio: p.scelta.passaggio.nome, prodotto: x.name, marca: x.brand, foto: x.image || undefined, ogni: p.orario.ogni };
  };
  const momenti = (due ? g.momenti.filter((m) => m.id !== 'pranzo') : g.momenti)
    .filter((m) => m.passi.length)
    .map((m) => ({ id: m.id, nome: m.nome, ora: m.ora, passi: m.passi.map(passo) }));
  return { biotipo, momenti, settimana: g.settimana.map(passo), minuti: g.minuti, costo: g.costoTop, alternativa: g.costoAlternative, nome };
}

export default function GuardaRoutine({ g, biotipo }: { g: Giornata; biotipo?: string }) {
  const [aperto, setAperto] = useState(false);
  const dati = useMemo(() => datiVideo(g, biotipo), [g, biotipo]);
  if (!dati.momenti.length) return null;
  return (
    <section className="gr carta" aria-labelledby="gr-titolo">
      <div className="pila" style={{ ['--gap' as string]: '6px' }}>
        <span className="etichetta">In un video</span>
        <h2 id="gr-titolo" className="titolo-3">La tua routine, dalla mattina alla sera</h2>
        <p className="piccolo">Quindici secondi coi tuoi prodotti, nell’ordine in cui si usano. Puoi fermarlo e tornare indietro.</p>
      </div>
      {aperto ? (
        <div className="gr-schermo"><Lettore dati={dati} /></div>
      ) : (
        <button type="button" className="bottone" onClick={() => setAperto(true)}>
          <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M1 1.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 1 1.5Z" fill="currentColor" /></svg>
          Guarda la tua routine
        </button>
      )}
    </section>
  );
}

// ⚠️ IL VIDEO IN SOVRIMPRESSIONE (24/11/2026, Federico: «c'è uno spazio vuoto sotto l'immagine rappresentativa e accanto al
// consiglio del medico. Qui mettere la cta che rimanda al video in overlay Guarda la mia routine»). Il bottone sta sotto la
// foto del biotipo; il video si apre in un <dialog> (Esc o la X per chiudere) e il player si scarica solo al tocco.
export function GuardaInSovrimpressione({ g, biotipo, nome, testo = 'Guarda la mia routine' }: { g: Giornata; biotipo?: string; nome?: string; testo?: string }) {
  const [aperto, setAperto] = useState(false);
  const rif = useRef<HTMLDialogElement>(null);
  const dati = useMemo(() => datiVideo(g, biotipo, nome), [g, biotipo, nome]);
  useEffect(() => {
    const d = rif.current; if (!d) return;
    if (aperto && !d.open) d.showModal();
    if (!aperto && d.open) d.close();
  }, [aperto]);
  if (!dati.momenti.length) return null;
  return (
    <>
      <button type="button" className="bottone gr-apri" onClick={() => setAperto(true)}>
        <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M1 1.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 1 1.5Z" fill="currentColor" /></svg>
        {testo}
      </button>
      <dialog ref={rif} className="gr-sovra" aria-label="Il video della routine" onClose={() => setAperto(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setAperto(false); }}>
        <div className="gr-sovra-dentro">
          <button type="button" className="gr-chiudi" onClick={() => setAperto(false)} aria-label="Chiudi il video">×</button>
          {aperto && <Lettore dati={dati} />}
        </div>
      </dialog>
    </>
  );
}
