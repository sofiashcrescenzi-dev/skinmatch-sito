import Link from 'next/link';
import { TIPO_NOZIONE, immagine, type Nozione as N } from '@/lib/dati';
import Foto from '@/components/Foto';

// UNA NOZIONE (23/10/2026): la pausa del test e la carta della Rivista, «Lo sapevi che…».
// ⚠️ SI LEGGE E BASTA (25/10/2026, Federico: «non devono essere altre scelte multiple o altri lavori da fare,
// devono essere cose da leggere»): niente domande, niente bottoni. Il fatto, la fonte, e se serve un approfondimento.
// Nel test il link di approfondimento apre una scheda nuova, per non perdere il punto del test.
// La foto (24/10/2026, Federico: «un'immagine rappresentativa quando c'è una nozione») è public/immagini/
// nozione-<id>, scelta su Pexels con i crediti in crediti.json; se non c'è, la carta resta senza.
export default function Nozione({ n, livello = 'h2', nuovaScheda = false }: { n: N; livello?: 'h1' | 'h2' | 'h3'; nuovaScheda?: boolean }) {
  const Titolo = livello;
  const fuori = nuovaScheda ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <article className="carta nozione pila" data-tipo={n.tipo}>
      {immagine(`nozione-${n.id}`) && <Foto nome={`nozione-${n.id}`} className="foto-nozione" credito priorita={livello === 'h1'} sizes={livello === 'h1' ? '(max-width: 760px) 100vw, 720px' : '(max-width: 760px) 100vw, 400px'} />}
      <span className="etichetta">{TIPO_NOZIONE[n.tipo]}</span>
      <Titolo className={livello === 'h1' ? 'titolo-2' : 'titolo-3'}>{n.titolo}</Titolo>
      <p>{n.testo}</p>
      <p className="piccolo">
        Fonte: <a className="link" href={n.fonte} target="_blank" rel="noopener nofollow">{n.fonte_nome}</a>
        {n.legame && <> · <Link className="link" href={n.legame} {...fuori}>Approfondisci</Link></>}
      </p>
    </article>
  );
}
