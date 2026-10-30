'use client';

import { useEffect } from 'react';
import { guasto } from '@/lib/guasti';

// GLI ERRORI CHE NON PASSANO DALLA PAGINA D'ERRORE (30/10/2026, Federico: «a volte il test dà errore»). Su un sito
// statico un errore JavaScript non lascia traccia: si rompe per chi guarda e noi non lo sappiamo. Qui si contano
// quelli dei tocchi e delle promesse; quelli del disegno della pagina li conta app/(sito)/error.tsx.
// Come Guasti.jsx dei siti di Agoranomos, ma i conteggi restano a Skinmatch (worker, tabella eventi_giorno).
export default function Guasti() {
  useEffect(() => {
    const suErrore = (e: ErrorEvent) => guasto(e.message, e.filename);
    const suPromessa = (e: PromiseRejectionEvent) => guasto((e.reason as Error)?.message || String(e.reason));
    window.addEventListener('error', suErrore);
    window.addEventListener('unhandledrejection', suPromessa);
    return () => {
      window.removeEventListener('error', suErrore);
      window.removeEventListener('unhandledrejection', suPromessa);
    };
  }, []);
  return null;
}
