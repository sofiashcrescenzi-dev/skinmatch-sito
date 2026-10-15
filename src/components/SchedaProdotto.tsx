'use client';

import Link from 'next/link';
import { euro, negozio } from '@/lib/formato';
import { indirizzo } from '@/lib/indirizzo';
import type { Prodotto } from '@/lib/catalogo';
import { CATALOGO } from '@/lib/dati';
import Campione from '@/components/Campione';

// Un prodotto: foto, marca, nome e attivi portano alla sua pagina (/catalogo/<categoria>/<oggetto>);
// sotto, a tutta larghezza, il bottone prezzo + «Compra qui» verso il negozio (link di affiliazione,
// rel sponsored, il clic si conta senza dati personali). I tag stanno in fondo, alla loro altezza.
export default function SchedaProdotto({ p, da, sopra, sotto, conTag = true }: { p: Prodotto; da: string; sopra?: React.ReactNode; sotto?: React.ReactNode; conTag?: boolean }) {
  const dove = negozio(p);
  const href = indirizzo(p);
  const tag = conTag ? p.tag.map((t) => CATALOGO.tag.find((x) => x.id === t)?.nome).filter(Boolean).slice(0, 3) : [];
  const unita = p.scheda?.misura?.unita === 'g' ? 'g' : 'ml';
  const foto = p.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy" decoding="async" width={96} height={96} />
  ) : (
    <span className="piccolo" style={{ textAlign: 'center', padding: 6 }}>{p.brand}</span>
  );
  return (
    <div className="carta carta-prodotto">
      {sopra}
      <div className="prodotto">
        {href ? <Link href={href} className="img" tabIndex={-1} aria-hidden="true">{foto}</Link> : <div className="img">{foto}</div>}
        <div className="pila" style={{ ['--gap' as string]: '4px', minWidth: 0 }}>
          <span className="marca">{p.brand}</span>
          {href ? <Link href={href} className="nome">{p.name}</Link> : <span className="nome">{p.name}</span>}
          {p.description && <span className="piccolo">{p.description}</span>}
          {(p.scheda?.attivi || []).length > 0 && (
            <span className="piccolo" style={{ color: 'var(--terra)', fontWeight: 700 }}>
              {p.scheda!.attivi.slice(0, 3).map((a) => a.nome + (a.perc ? ` ${String(a.perc).replace('.', ',')}%` : '')).join(' · ')}
            </span>
          )}
        </div>
      </div>
      <div className="riga-compra">
        <Campione href={p.affiliateUrl} prezzo={p.price} dove={dove} id={p.id} da={da} />
        {p.scheda?.al_10 ? <span className="piccolo">{euro(p.scheda.al_10)} ogni 10 {unita}</span> : null}
      </div>
      {sotto}
      {tag.length > 0 && <div className="riga-chip in-fondo">{tag.map((t) => <span key={t} className="chip tenue">{t}</span>)}</div>}
    </div>
  );
}
