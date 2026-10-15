'use client';

import { euro, negozio } from '@/lib/formato';
import type { Prodotto } from '@/lib/catalogo';
import { CATALOGO } from '@/lib/dati';
import { segna } from '@/lib/eventi';

// Un prodotto: foto, marca, nome, prezzo e il link al negozio. Il link è di affiliazione
// (rel sponsored) e il clic si conta, senza dati personali (lib/eventi.ts).
export default function SchedaProdotto({ p, da, sopra, sotto, conTag = true }: { p: Prodotto; da: string; sopra?: React.ReactNode; sotto?: React.ReactNode; conTag?: boolean }) {
  const dove = negozio(p);
  const tag = conTag ? p.tag.map((t) => CATALOGO.tag.find((x) => x.id === t)?.nome).filter(Boolean).slice(0, 3) : [];
  return (
    <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
      {sopra}
      <div className="prodotto">
        <div className="img">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy" decoding="async" />
          ) : (
            <span className="piccolo" style={{ textAlign: 'center', padding: 6 }}>{p.brand}</span>
          )}
        </div>
        <div className="pila" style={{ ['--gap' as string]: '4px', minWidth: 0 }}>
          <span className="marca">{p.brand}</span>
          <span className="nome">{p.name}</span>
          {p.description && <span className="piccolo">{p.description}</span>}
          {(p.scheda?.attivi || []).length > 0 && (
            <span className="piccolo" style={{ color: 'var(--terra)', fontWeight: 700 }}>
              {p.scheda!.attivi.slice(0, 3).map((a) => a.nome + (a.perc ? ` ${String(a.perc).replace('.', ',')}%` : '')).join(' · ')}
            </span>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'baseline', marginTop: 2 }}>
            <span className="prezzo">{euro(p.price)}</span>
            {p.scheda?.al_10 ? <span className="piccolo">{euro(p.scheda.al_10)} ogni 10 ml</span> : null}
            <a className="compra" href={p.affiliateUrl} target="_blank" rel="sponsored nofollow noopener" onClick={() => segna({ e: 'clic', id: p.id, m: dove || 'negozio', da })}>
              {dove ? `Vedi su ${dove}` : 'Vedi il prodotto'}
            </a>
          </div>
        </div>
      </div>
      {tag.length > 0 && <div className="riga-chip">{tag.map((t) => <span key={t} className="chip tenue">{t}</span>)}</div>}
      {sotto}
    </div>
  );
}
