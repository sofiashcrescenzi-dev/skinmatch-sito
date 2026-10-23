'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TIPO_NOZIONE, type Nozione as N } from '@/lib/dati';

// UNA NOZIONE (23/10/2026): la pausa del test e la carta della Rivista, «Lo sapevi che…».
// Il quiz si risponde con un tocco: si vede subito se è giusto, poi il fatto e la fonte.
// Nel test il link di approfondimento apre una scheda nuova, per non perdere il punto del test.
export default function Nozione({ n, livello = 'h2', nuovaScheda = false }: { n: N; livello?: 'h1' | 'h2' | 'h3'; nuovaScheda?: boolean }) {
  const [scelta, setScelta] = useState<number | null>(null);
  const quiz = n.tipo === 'quiz' ? n.quiz : undefined;
  const svelata = !quiz || scelta !== null;
  const Titolo = livello;
  const fuori = nuovaScheda ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <article className="carta nozione pila" data-tipo={n.tipo}>
      <span className="etichetta">{TIPO_NOZIONE[n.tipo]}</span>
      <Titolo className={livello === 'h1' ? 'titolo-2' : 'titolo-3'}>{quiz ? quiz.domanda : n.titolo}</Titolo>
      {quiz && (
        <div className="pila" style={{ ['--gap' as string]: '8px' }} role="group" aria-label={quiz.domanda}>
          {quiz.opzioni.map((o, i) => (
            <button key={o} type="button" className="opzione" disabled={scelta !== null}
              data-esito={scelta === null ? undefined : i === quiz.giusta ? 'giusta' : i === scelta ? 'sbagliata' : undefined}
              onClick={() => setScelta(i)}>
              <span>{o}</span>
            </button>
          ))}
        </div>
      )}
      {svelata && (
        <div className="pila entra" style={{ ['--gap' as string]: '10px' }} aria-live="polite">
          {quiz && <p className="nozione-esito">{scelta === quiz.giusta ? 'Giusto.' : `Era «${quiz.opzioni[quiz.giusta]}».`} {n.titolo}</p>}
          <p>{n.testo}</p>
          <p className="piccolo">
            Fonte: <a className="link" href={n.fonte} target="_blank" rel="noopener nofollow">{n.fonte_nome}</a>
            {n.legame && <> · <Link className="link" href={n.legame} {...fuori}>Approfondisci</Link></>}
          </p>
        </div>
      )}
    </article>
  );
}
