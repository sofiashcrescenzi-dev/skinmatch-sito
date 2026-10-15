'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { percorsoPerId } from '@/lib/dati';
import { consiglia } from '@/lib/motore';
import { decodifica } from '@/lib/condividi';
import Risultato from '@/components/Risultato';
import Condividi from '@/components/Condividi';
import { Invito } from '@/components/Inviti';
import Icona from '@/components/Icona';

// LA PAGINA DEL RISULTATO: /risultato#<codice> (lib/condividi.ts). Ci arriva chi finisce il test e chi
// apre un link condiviso; il risultato si ricalcola qui, dalle risposte nel codice.
const CHIAVE = 'skinmatch-test-2';

export default function RisultatoPage() {
  const [codice, setCodice] = useState<string | null>(null);
  const [mio, setMio] = useState(false);
  useEffect(() => {
    const leggi = () => {
      const c = window.location.hash.slice(1);
      setCodice(c);
      try {
        const st = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
        const d = decodifica(c);
        setMio(!!st && !!d && st.percorso === d.percorso && JSON.stringify(st.risposte) === JSON.stringify(d.risposte));
      } catch { setMio(false); }
    };
    leggi();
    window.addEventListener('hashchange', leggi);
    return () => window.removeEventListener('hashchange', leggi);
  }, []);
  const dati = useMemo(() => (codice ? decodifica(codice) : null), [codice]);
  const percorso = dati ? percorsoPerId(dati.percorso) : null;
  const r = useMemo(() => (dati && percorso ? consiglia(percorso, dati.risposte) : null), [dati, percorso]);

  if (codice === null) return <main className="contenitore sezione" style={{ minHeight: '60vh' }} />;
  if (!r || !percorso) {
    return (
      <main className="contenitore sezione pila" style={{ ['--gap' as string]: '16px', minHeight: '50vh' }}>
        <span className="etichetta">Il risultato</span>
        <h1 className="titolo-2">Questo link non contiene un risultato</h1>
        <p className="intro">Forse si è tagliato copiandolo. Il test dura pochi minuti.</p>
        <div><Invito href="/test">Fai il test</Invito></div>
      </main>
    );
  }
  const azioni = (
    <div className="azioni-risultato">
      {mio ? (<>
        <Condividi titolo={`Il mio risultato Skinmatch: ${r.aree.map((a) => a.biotipo?.titolo).filter(Boolean).join(', ')}`} />
        <Link href={`/test?percorso=${percorso.id}&nuovo=1`} className="bottone secondario"><Icona nome="aggiorna" size={18} />Rifai il test</Link>
        <Link href="/test?nuovo=1" className="bottone secondario">Prova un altro test</Link>
      </>) : (<>
        <Invito href={`/test?percorso=${percorso.id}&nuovo=1`}>Fai il test anche tu</Invito>
        <Condividi titolo="Un risultato del test di Skinmatch" />
      </>)}
    </div>
  );
  return (
    <main className="contenitore sezione">
      <Risultato r={r} azioni={azioni} condiviso={!mio} />
    </main>
  );
}
