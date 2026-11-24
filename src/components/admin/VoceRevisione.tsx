'use client';

import { useState } from 'react';
import { invia, quando } from './base';

// LA VOCE DEL REGISTRO DELLE REVISIONI (tolta da Revisioni.tsx il 21/11/2026 per usarla anche nel giro delle prove)
export type Riga = { id: number; chiave: string; contenuto: string; esito: 'approvato' | 'da_cambiare'; nota: string | null; chi: string; creato_il: string };

// etichette: i due bottoni, se non sono «approvo» e «va cambiato» (21/11/2026: sui punti da decidere di Zeno)
export function Voce({ chiave, titolo, contenuto, ultima, poi, children, etichette }: { chiave: string; titolo: string; contenuto: string; ultima?: Riga; poi: () => void; children?: React.ReactNode; etichette?: [string, string] }) {
  const [nota, setNota] = useState('');
  const [err, setErr] = useState('');
  const cambiato = !!ultima && ultima.contenuto !== contenuto;
  const stato = !ultima ? 'Da rivedere'
    : cambiato ? `Il testo è cambiato dopo la revisione del ${quando(ultima.creato_il)}: va riletto`
      : ultima.esito === 'approvato' ? `Approvato da ${ultima.chi.split('@')[0]} il ${quando(ultima.creato_il)}`
        : `Da cambiare (${ultima.chi.split('@')[0]}, ${quando(ultima.creato_il)})${ultima.nota ? `: ${ultima.nota}` : ''}`;
  const ok = !!ultima && !cambiato && ultima.esito === 'approvato';
  const decidi = async (esito: Riga['esito']) => {
    setErr('');
    try { await invia('/api/admin/revisioni', { chiave, contenuto, esito, nota }); setNota(''); poi(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <details className="carta">
      <summary><span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' , alignItems: 'center' }}>
        <b>{titolo}</b>
        <span className="chip tenue" style={{ color: ok ? 'var(--bene)' : cambiato || ultima?.esito === 'da_cambiare' ? 'var(--attenzione)' : undefined }}>{stato}</span>
      </span></summary>
      <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
        {children || <p className="testo" style={{ whiteSpace: 'pre-line', fontSize: 15 }}>{contenuto}</p>}
        <input className="adm-input" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Una nota (obbligatoria se va cambiato)" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="bottone" onClick={() => decidi('approvato')}>{etichette?.[0] || 'L’ho letto: approvo'}</button>
          <button type="button" className="bottone secondario" disabled={!nota.trim()} onClick={() => decidi('da_cambiare')}>{etichette?.[1] || 'Va cambiato'}</button>
        </div>
        {err && <p className="piccolo" style={{ color: 'var(--attenzione)' }}>{err}</p>}
      </div>
    </details>
  );
}
