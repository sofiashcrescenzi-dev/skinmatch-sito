'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { pezzi } from '@/lib/glossario';
import type { Termine } from '@/lib/dati';

// La «i» dei termini tecnici (tappa 4): una sola finestra per pagina, aperta dal termine toccato.
const Apri = createContext<(t: Termine) => void>(() => {});

export function TerminiProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<Termine | null>(null);
  const chiudi = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!t) return;
    chiudi.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setT(null);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [t]);
  return (
    <Apri.Provider value={setT}>
      {children}
      {t && (
        <div className="velo-scuro" onClick={(e) => e.target === e.currentTarget && setT(null)}>
          <div className="popup" role="dialog" aria-modal="true" aria-labelledby="termine-titolo">
            <button ref={chiudi} type="button" className="chiudi" onClick={() => setT(null)} aria-label="Chiudi">×</button>
            <h3 id="termine-titolo" className="titolo-3">{t.nome}</h3>
            <p className="testo" style={{ fontSize: 15.5 }}>{t.testo}</p>
            {t.video && <a className="link" href={t.video} target="_blank" rel="noopener">Guarda la spiegazione in video</a>}
            <Link className="piccolo" href={`/glossario#${t.id}`} onClick={() => setT(null)}>Tutti i termini del glossario →</Link>
          </div>
        </div>
      )}
    </Apri.Provider>
  );
}

// Un testo con i termini del glossario accesi (la prima volta per blocco).
export function ConTermini({ testo, salta }: { testo: string; salta?: string }) {
  const apri = useContext(Apri);
  return (
    <>
      {pezzi(testo, new Set(), salta).map((p, i) =>
        p.termine ? (
          <button key={i} type="button" className="termine" onClick={() => apri(p.termine!)}>{p.testo}</button>
        ) : (
          <span key={i}>{p.testo}</span>
        ),
      )}
    </>
  );
}
