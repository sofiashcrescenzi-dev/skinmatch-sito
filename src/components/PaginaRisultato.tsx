'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { percorsoPerId, PERCORSI_SCELTA } from '@/lib/dati';
import { consiglia } from '@/lib/motore';
import { codifica, decodifica, indirizzoCondiviso, messaggio } from '@/lib/condividi';
import Risultato from '@/components/Risultato';
import Condividi, { Copia } from '@/components/Condividi';
import { Invito } from '@/components/Inviti';
import Icona from '@/components/Icona';
import { BottoneSalva } from '@/components/RisultatiSalvati';

// LA PAGINA DEL RISULTATO: /risultato#<codice> e /risultato/<biotipo>#<codice> (lib/condividi.ts). Ci arriva chi
// finisce il test e chi apre un link condiviso; il risultato si ricalcola qui, dalle risposte nel codice.
const CHIAVE = 'skinmatch-test-2';

// il nome che il risultato salvato porta nell'elenco: i biotipi delle sue aree («Mista · Cute grassa»)
const titoloDi = (r: ReturnType<typeof consiglia>) => r.aree.map((a) => a.biotipo?.titolo).filter(Boolean).join(' · ');

export default function PaginaRisultato() {
  const [codice, setCodice] = useState<string | null>(null);
  const [mio, setMio] = useState(false);
  useEffect(() => {
    const leggi = () => {
      const c = window.location.hash.slice(1);
      setCodice(c);
      try {
        const st = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
        const d = decodifica(c);
        // il proprio risultato: lo stesso codice (i link corti) o le stesse risposte (i link di prima del 30/10)
        setMio(!!st && !!d && d !== 'vecchio' && st.percorso === d.percorso &&
          (c === codifica(st.percorso, st.risposte) || JSON.stringify(st.risposte) === JSON.stringify(d.risposte)));
      } catch { setMio(false); }
    };
    leggi();
    window.addEventListener('hashchange', leggi);
    return () => window.removeEventListener('hashchange', leggi);
  }, []);
  const letto = useMemo(() => (codice ? decodifica(codice) : null), [codice]);
  const dati = letto === 'vecchio' ? null : letto;
  const percorso = dati ? percorsoPerId(dati.percorso) : null;
  const r = useMemo(() => (dati && percorso ? consiglia(percorso, dati.risposte) : null), [dati, percorso]);

  // ⚠️ ALTO QUANTO LO SCHERMO (7/11/2026, Friday: CLS 0,254 a 390 px): con 60vh il piede compariva a metà schermo e
  // spariva quando arrivava il risultato. Fuori dallo schermo il suo spostamento non conta e non si vede.
  if (codice === null) return <main className="contenitore sezione" style={{ minHeight: '100svh' }} />;
  if (!r || !percorso) {
    return (
      <main className="contenitore sezione pila" style={{ ['--gap' as string]: '16px', minHeight: '50vh' }}>
        <span className="etichetta">Il risultato</span>
        <h1 className="titolo-2">{letto === 'vecchio' ? 'Il test è cambiato da quando è stato condiviso questo risultato' : 'Questo link non contiene un risultato'}</h1>
        <p className="intro">{letto === 'vecchio' ? 'Le domande non sono più le stesse, quindi non possiamo ricostruirlo. Il test dura pochi minuti.' : 'Forse si è tagliato copiandolo. Il test dura pochi minuti.'}</p>
        <div><Invito href="/test">Fai il test</Invito></div>
      </main>
    );
  }
  const m = messaggio(r, mio);
  const indirizzo = indirizzoCondiviso(r, codice);
  const azioni = (
    <div className="azioni-risultato">
      {mio ? (<>
        <BottoneSalva percorso={percorso.id} codice={codice} titolo={titoloDi(r) || percorso.nome} />
        <Condividi titolo={m.titolo} messaggio={m.testo} indirizzo={indirizzo} />
        <Copia messaggio={m.testo} indirizzo={indirizzo} />
        <Link href={`/test?percorso=${percorso.id}&nuovo=1`} className="bottone secondario"><Icona nome="aggiorna" size={18} />Rifai il test</Link>
      </>) : (<>
        <Invito href={`/test?percorso=${percorso.id}&nuovo=1`}>Scopri il tuo biotipo</Invito>
        <Condividi titolo={m.titolo} messaggio={m.testo} indirizzo={indirizzo} testo="Condividi" />
        <Copia messaggio={m.testo} indirizzo={indirizzo} />
      </>)}
    </div>
  );
  // ⚠️ GLI ALTRI TEST, PER INTERESSE (16/11/2026, Federico: «spingere sul poter fare i vari test in base al proprio
  // interesse»): in fondo al proprio risultato, gli altri due test con cosa ne esce; non più un generico «altro test».
  const altri = PERCORSI_SCELTA.filter((x) => x.id !== percorso.id);
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(32px, 5vw, 56px)' }}>
      <Risultato r={r} azioni={azioni} condiviso={!mio} metodoCambiato={!!dati?.metodoCambiato} />
      {mio && (
        <section className="altri-test pila" aria-labelledby="altri-titolo" style={{ ['--gap' as string]: '14px' }}>
          <h2 id="altri-titolo" className="titolo-2">Ti interessa anche…</h2>
          <div className="griglia" style={{ ['--min' as string]: '240px' }}>
            {altri.map((x) => (
              <Link key={x.id} href={`/test?percorso=${x.id}&nuovo=1`} className="carta pila altro-test" style={{ ['--gap' as string]: '6px' }}>
                <span className="titolo-3">{x.nome}</span>
                <span className="piccolo">{x.descrizione.split(/\.\s/)[0]}.</span>
                <span className="piccolo"><b>Circa {x.minuti} minuti</b> · Inizia →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
