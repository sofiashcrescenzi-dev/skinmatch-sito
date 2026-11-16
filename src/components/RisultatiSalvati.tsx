'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PERCORSI_SCELTA, percorsoPerId } from '@/lib/dati';
import { leggiSalvati, salvaRisultato, togliRisultato, cancellaTutto, MEMORIA, EVENTO_SALVATI, type Salvato } from '@/lib/salvati';
import Icona from '@/components/Icona';

// I RISULTATI SALVATI SU QUESTO TELEFONO (16/11/2026): il bottone «Salva il risultato», l'elenco «I tuoi risultati» e,
// per la pagina /cookie, quello che il sito tiene in questo browser con il tasto per cancellarlo. Vedi lib/salvati.ts.

export function useSalvati() {
  const [lista, setLista] = useState<Salvato[] | null>(null);
  useEffect(() => {
    const leggi = () => setLista(leggiSalvati());
    leggi();
    window.addEventListener(EVENTO_SALVATI, leggi);
    window.addEventListener('storage', leggi);
    return () => { window.removeEventListener(EVENTO_SALVATI, leggi); window.removeEventListener('storage', leggi); };
  }, []);
  return lista;
}

const data = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });

export function BottoneSalva({ percorso, codice, titolo }: { percorso: string; codice: string; titolo: string }) {
  const lista = useSalvati();
  if (!lista) return null;
  const gia = lista.find((x) => x.percorso === percorso);
  if (gia?.codice === codice) {
    return (
      <span className="salvato-nota" role="status">
        <Icona nome="spunta" size={18} /> Salvato su questo telefono · <Link href="/test" className="link">i tuoi risultati</Link>
      </span>
    );
  }
  return (
    <button type="button" className="bottone" onClick={() => salvaRisultato({ percorso, codice, titolo })}>
      <Icona nome="scarica" size={18} />{gia ? 'Salva al posto di quello del ' + data(gia.quando) : 'Salva il risultato'}
    </button>
  );
}

// L'elenco: un risultato per test, con «Rivedi» e «Togli». Non mostra niente finché non c'è un risultato salvato.
export function RisultatiSalvati({ compatto = false }: { compatto?: boolean }) {
  const lista = useSalvati();
  if (!lista?.length) return null;
  const mancano = PERCORSI_SCELTA.filter((p) => !lista.some((x) => x.percorso === p.id));
  return (
    <section className="salvati carta pila" aria-labelledby="salvati-titolo" style={{ ['--gap' as string]: '12px' }}>
      <div className="pila" style={{ ['--gap' as string]: '4px' }}>
        <h2 id="salvati-titolo" className="titolo-3">I tuoi risultati</h2>
        {!compatto && <p className="piccolo">Restano su questo telefono: non li vediamo noi. Si tolgono da qui o dalla pagina dei <Link href="/cookie" className="link">cookie</Link>.</p>}
      </div>
      <ul className="salvati-lista">
        {lista.map((s) => {
          const p = percorsoPerId(s.percorso);
          return (
            <li key={s.percorso}>
              <span className="salvati-testo">
                <span className="etichetta">{p?.nome || s.percorso} · {data(s.quando)}</span>
                <b>{s.titolo}</b>
              </span>
              <span className="salvati-azioni">
                <a href={`/risultato#${s.codice}`} className="chip">Rivedi</a>
                {!compatto && <button type="button" className="link-btn" onClick={() => togliRisultato(s.percorso)}>Togli</button>}
              </span>
            </li>
          );
        })}
      </ul>
      {mancano.length > 0 && (
        <p className="piccolo">Ti manca{mancano.length > 1 ? 'no' : ''}: {mancano.map((p, i) => <span key={p.id}>{i ? ', ' : ''}<Link href={`/test?percorso=${p.id}&nuovo=1`} className="link">{p.nome.toLowerCase()}</Link></span>)}.</p>
      )}
    </section>
  );
}

// Per /cookie: cosa c'è adesso in questo browser, e il tasto per toglierlo.
export function DatiSuQuestoTelefono() {
  const [qui, setQui] = useState<string[] | null>(null);
  const [fatto, setFatto] = useState(false);
  useEffect(() => {
    const leggi = () => setQui(MEMORIA.filter((m) => { try { return (m.dove === 'locale' ? localStorage : sessionStorage).getItem(m.chiave) !== null; } catch { return false; } }).map((m) => m.chiave));
    leggi();
    window.addEventListener(EVENTO_SALVATI, leggi);
    return () => window.removeEventListener(EVENTO_SALVATI, leggi);
  }, []);
  if (!qui) return null;
  return (
    <section className="carta pila" aria-labelledby="qui-titolo" style={{ ['--gap' as string]: '12px' }}>
      <h2 id="qui-titolo" className="titolo-3">Cosa c’è adesso su questo telefono</h2>
      {!qui.length ? <p className="piccolo">Niente: Skinmatch non ha salvato nulla in questo browser.</p> : (
        <>
          <ul className="pila piccolo" style={{ ['--gap' as string]: '6px', paddingLeft: 18, margin: 0 }}>
            {MEMORIA.filter((m) => qui.includes(m.chiave)).map((m) => <li key={m.chiave}>{m.cosa}</li>)}
          </ul>
          <div><button type="button" className="bottone secondario" onClick={() => { cancellaTutto(); setFatto(true); }}><Icona nome="elimina" size={18} />Cancella tutto</button></div>
        </>
      )}
      {fatto && <p className="piccolo" role="status">Fatto: i risultati e le risposte del test sono stati cancellati da questo browser.</p>}
    </section>
  );
}
