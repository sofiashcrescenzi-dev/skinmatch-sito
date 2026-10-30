'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { guasto, fileSparito } from '@/lib/guasti';

// LA PAGINA D'ERRORE DI SKINMATCH (30/10/2026). Prima c'era quella di Next, in inglese: «Application error».
// Se manca un file perché il sito è stato pubblicato di nuovo mentre la pagina era aperta, si ricarica da sola,
// una volta: il test riprende dal punto in cui era (le risposte sono nel telefono). Il resto si conta e si spiega.
const CHIAVE = 'skinmatch-ricaricata';

export default function Errore({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [ricarico, setRicarico] = useState(false);
  useEffect(() => {
    guasto(error?.message);
    if (!fileSparito(error?.message || '')) return;
    let ultima = 0;
    try { ultima = Number(sessionStorage.getItem(CHIAVE)) || 0; } catch { /* niente */ }
    if (Date.now() - ultima < 60_000) return;
    try { sessionStorage.setItem(CHIAVE, String(Date.now())); } catch { /* niente */ }
    setRicarico(true);
    window.location.reload();
  }, [error]);
  if (ricarico) return <main className="contenitore sezione" style={{ minHeight: '60vh' }} />;
  return (
    <main className="contenitore stretto sezione pila" style={{ ['--gap' as string]: '16px', minHeight: '50vh' }}>
      <span className="etichetta">Qualcosa si è inceppato</span>
      <h1 className="titolo-2">Questa pagina non si è caricata bene</h1>
      <p className="intro">Se stavi facendo il test, le risposte sono salve su questo telefono: riprova e riparti da dove eri.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="bottone" onClick={() => window.location.reload()}>Riprova</button>
        <Link href="/test" className="bottone secondario" onClick={() => retry()}>Torna al test</Link>
      </div>
    </main>
  );
}
