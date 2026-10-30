'use client';

import { useEffect } from 'react';
import { guasto } from '@/lib/guasti';

// L'ULTIMA RETE (30/10/2026): un errore nel layout principale, fuori da app/(sito)/error.tsx. Sostituisce tutta la
// pagina, quindi niente stili del sito: poche righe nei colori del marchio e un bottone per ricaricare.
export default function ErroreGlobale({ error }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { guasto(error?.message); }, [error]);
  return (
    <html lang="it">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#faf6f4', color: '#2e1c15', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: 520, padding: 24 }}>
          <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: '0 0 12px' }}>Questa pagina non si è caricata bene</h1>
          <p style={{ fontSize: 17, lineHeight: 1.5, margin: '0 0 20px' }}>Se stavi facendo il test, le risposte sono salve su questo telefono: riprova e riparti da dove eri.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ font: 'inherit', fontWeight: 700, background: '#2e1c15', color: '#faf6f4', border: 0, borderRadius: 999, padding: '12px 22px', cursor: 'pointer' }}>Riprova</button>
        </main>
      </body>
    </html>
  );
}
