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
