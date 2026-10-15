'use client';

import { useEffect, useState } from 'react';
import { euro } from '@/lib/formato';
import { negozioPerNome } from '@/lib/dati';
import Icona from '@/components/Icona';

// Spedizione e codici sconto del negozio, vicino a «Compra qui» (Federico, 15/10). Dati da admin › Negozi.
// Un codice scaduto sparisce anche senza ripubblicare (si controlla nel browser); il codice si copia al tocco.
export default function InfoNegozio({ negozio, prezzo, breve }: { negozio?: string | null; prezzo: number; breve?: boolean }) {
  const n = negozioPerNome(negozio);
  const [oggi, setOggi] = useState('');
  const [copiato, setCopiato] = useState('');
  useEffect(() => setOggi(new Date().toISOString().slice(0, 10)), []);
  if (!n) return null;
  const sp = n.spedizione;
  const gratis = sp.gratis_da != null && prezzo >= sp.gratis_da;
  const spedizione = sp.costo == null && sp.gratis_da == null ? null
    : gratis ? 'Spedizione gratuita'
    : `Spedizione ${sp.costo != null ? euro(sp.costo) : ''}${sp.gratis_da != null ? `, gratis da ${euro(sp.gratis_da)}` : ''}`;
  const codici = n.codici.filter((c) => c.codice && (!c.scade || !oggi || c.scade >= oggi));
  if (breve) return spedizione || codici.length ? (
    <span className="info-negozio breve">{spedizione && <span><Icona nome="spedizione" size={16} /> {spedizione}</span>}{codici.length ? <b><Icona nome="codice" size={16} /> {codici[0].codice}</b> : null}</span>
  ) : null;
  return (
    <div className="info-negozio">
      {spedizione && <p><Icona nome="spedizione" size={18} /> <b>{spedizione}</b>{sp.tempi ? ` · ${sp.tempi}` : ''}{sp.nota ? ` · ${sp.nota}` : ''} <span className="piccolo">da {n.nome}</span></p>}
      {codici.map((c) => (
        <p key={c.codice} className="codice-sconto">
          <Icona nome="codice" size={18} />
          <button type="button" onClick={() => { navigator.clipboard?.writeText(c.codice).then(() => { setCopiato(c.codice); setTimeout(() => setCopiato(''), 1800); }).catch(() => {}); }} aria-label={`Copia il codice ${c.codice}`}>
            {copiato === c.codice ? 'Copiato' : c.codice}
          </button>
          <span>{c.descrizione}{c.scade ? ` · fino al ${new Date(c.scade + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}` : ''}</span>
        </p>
      ))}
    </div>
  );
}
