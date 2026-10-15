'use client';

import { useState } from 'react';
import Icona from '@/components/Icona';

// Condividi la pagina: sul telefono il foglio di condivisione del sistema, altrove copia il link.
export default function Condividi({ titolo, testo = 'Condividi il risultato' }: { titolo: string; testo?: string }) {
  const [fatto, setFatto] = useState(false);
  const via = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: titolo, url }); return; }
      await navigator.clipboard.writeText(url);
      setFatto(true);
      setTimeout(() => setFatto(false), 2200);
    } catch { /* annullato */ }
  };
  return (
    <button type="button" className="bottone" onClick={via}>
      <Icona nome={fatto ? 'spunta' : 'condividi'} size={18} />{fatto ? 'Link copiato' : testo}
    </button>
  );
}
