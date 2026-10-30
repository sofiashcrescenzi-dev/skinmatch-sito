'use client';

import { useState } from 'react';
import Icona from '@/components/Icona';

// Condividi il risultato: sul telefono il foglio di condivisione del sistema, con il messaggio e il link (lib/condividi.ts,
// messaggio); altrove si copiano messaggio e link insieme, pronti da incollare.
export default function Condividi({ titolo, messaggio, indirizzo, testo = 'Condividi il risultato' }: { titolo: string; messaggio?: string; indirizzo?: string; testo?: string }) {
  const [fatto, setFatto] = useState(false);
  const via = async () => {
    const url = indirizzo ? new URL(indirizzo, window.location.origin).toString() : window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: titolo, text: messaggio, url }); return; }
      await navigator.clipboard.writeText(messaggio ? `${messaggio}\n${url}` : url);
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
