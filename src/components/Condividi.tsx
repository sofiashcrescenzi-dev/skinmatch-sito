'use client';

import { useEffect, useState } from 'react';
import Icona from '@/components/Icona';

// IL MESSAGGIO E IL LINK, INSIEME (Federico, 30/10/2026): «Condividi» apre il foglio di condivisione del telefono,
// «Copia» li mette negli appunti, pronti da incollare. Il link sta in fondo al testo, sulla sua riga, e non nel campo
// «url»: con tutti e due, WhatsApp su iPhone a volte tiene solo il link e perde il messaggio.
const pieno = (indirizzo?: string) => (indirizzo ? new URL(indirizzo, window.location.origin).toString() : window.location.href);
const tutto = (messaggio: string | undefined, indirizzo?: string) => (messaggio ? `${messaggio}\n${pieno(indirizzo)}` : pieno(indirizzo));

// Dove il foglio di condivisione non c'è (il computer) il bottone non compare: resta «Copia».
export default function Condividi({ titolo, messaggio, indirizzo, testo = 'Condividi il risultato' }: { titolo: string; messaggio?: string; indirizzo?: string; testo?: string }) {
  const [puo, setPuo] = useState(true);
  useEffect(() => setPuo(typeof navigator.share === 'function'), []);
  if (!puo) return null;
  const via = async () => {
    try { await navigator.share({ title: titolo, text: tutto(messaggio, indirizzo) }); } catch { /* annullato */ }
  };
  return (
    <button type="button" className="bottone" onClick={via}>
      <Icona nome="condividi" size={18} />{testo}
    </button>
  );
}

// Senza il foglio di condivisione «Copia» resta l'unico modo di mandarlo: diventa il bottone principale.
export function Copia({ messaggio, indirizzo }: { messaggio?: string; indirizzo?: string }) {
  const [fatto, setFatto] = useState(false);
  const [primario, setPrimario] = useState(false);
  useEffect(() => setPrimario(typeof navigator.share !== 'function'), []);
  const via = async () => {
    try {
      await navigator.clipboard.writeText(tutto(messaggio, indirizzo));
      setFatto(true);
      setTimeout(() => setFatto(false), 2400);
    } catch { /* il browser non lo permette */ }
  };
  return (
    <button type="button" className={primario ? 'bottone' : 'bottone secondario'} onClick={via} aria-live="polite">
      <Icona nome={fatto ? 'spunta' : 'copia'} size={18} />{fatto ? 'Copiato: incollalo dove vuoi' : 'Copia messaggio e link'}
    </button>
  );
}

// ⚠️ TUTTI I MODI DI CONDIVIDERE (24/11/2026, Federico: «con sotto tutti i vari condividi»): sotto «Guarda la mia
// routine», il foglio del telefono (dove c'è), WhatsApp, Telegram, Facebook, l'email e «Copia». Gli indirizzi sono quelli
// pubblici di condivisione di ogni servizio: nessuno script esterno, il clic apre il servizio in una scheda nuova.
export function Condivisioni({ titolo, messaggio, indirizzo }: { titolo: string; messaggio?: string; indirizzo?: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => setUrl(pieno(indirizzo)), [indirizzo]);
  const testo = messaggio || titolo;
  const e = encodeURIComponent;
  const voci: [string, string][] = url ? [
    ['WhatsApp', `https://wa.me/?text=${e(`${testo}\n${url}`)}`],
    ['Telegram', `https://t.me/share/url?url=${e(url)}&text=${e(testo)}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`],
    ['Email', `mailto:?subject=${e(titolo)}&body=${e(`${testo}\n${url}`)}`],
  ] : [];
  return (
    <div className="condivisioni" role="group" aria-label="Condividi il risultato">
      <span className="piccolo">Condividi</span>
      <div className="condivisioni-voci">
        <Condividi titolo={titolo} messaggio={messaggio} indirizzo={indirizzo} testo="Altro…" />
        {voci.map(([n, h]) => <a key={n} className="chip" href={h} target={n === 'Email' ? undefined : '_blank'} rel="noopener">{n}</a>)}
        <Copia messaggio={messaggio} indirizzo={indirizzo} />
      </div>
    </div>
  );
}
