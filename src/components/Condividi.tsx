'use client';

import { useState } from 'react';
import Icona from '@/components/Icona';

const pieno = (indirizzo?: string) => (indirizzo ? new URL(indirizzo, window.location.origin).toString() : window.location.href);

// Condividi il risultato: sul telefono il foglio di condivisione del sistema, con il messaggio e il link (lib/condividi.ts,
// messaggio); dove non c'è (il computer), si copiano messaggio e link insieme, pronti da incollare.
export default function Condividi({ titolo, messaggio, indirizzo, testo = 'Condividi il risultato' }: { titolo: string; messaggio?: string; indirizzo?: string; testo?: string }) {
  const [fatto, setFatto] = useState(false);
  const via = async () => {
    const url = pieno(indirizzo);
    try {
      if (navigator.share) { await navigator.share({ title: titolo, text: messaggio, url }); return; }
      await navigator.clipboard.writeText(messaggio ? `${messaggio} ${url}` : url);
      setFatto(true);
      setTimeout(() => setFatto(false), 2200);
    } catch { /* annullato */ }
  };
  return (
    <button type="button" className="bottone" onClick={via}>
      <Icona nome={fatto ? 'spunta' : 'condividi'} size={18} />{fatto ? 'Copiato, pronto da incollare' : testo}
    </button>
  );
}

// Solo il link, per mandarselo o incollarlo dove si vuole (Federico, 30/10/2026: «al condividi aggiungi il copia»).
export function Copia({ indirizzo }: { indirizzo?: string }) {
  const [fatto, setFatto] = useState(false);
  const via = async () => {
    try {
      await navigator.clipboard.writeText(pieno(indirizzo));
      setFatto(true);
      setTimeout(() => setFatto(false), 2200);
    } catch { /* il browser non lo permette */ }
  };
  return (
    <button type="button" className="bottone secondario" onClick={via} aria-live="polite">
      <Icona nome={fatto ? 'spunta' : 'copia'} size={18} />{fatto ? 'Link copiato' : 'Copia il link'}
    </button>
  );
}
