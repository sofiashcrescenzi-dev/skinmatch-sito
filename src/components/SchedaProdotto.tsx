'use client';

import Link from 'next/link';
import { negozio } from '@/lib/formato';
import { indirizzo, categoriaDi } from '@/lib/indirizzo';
import FotoProdotto, { tonoProdotto } from '@/components/FotoProdotto';
import type { Prodotto } from '@/lib/catalogo';
import { CATALOGO } from '@/lib/dati';
import Campione from '@/components/Campione';
import InfoNegozio from '@/components/InfoNegozio';

// Un prodotto: foto, marca, nome e «La scheda completa» portano alla sua pagina (/catalogo/<categoria>/<oggetto>);
// in fondo i tag e, per ultimo, il bottone prezzo + «Compra qui» verso il negozio (link di affiliazione,
// rel sponsored, il clic si conta senza dati personali). Niente prezzo ogni 10 ml (Federico, 15/10).
export default function SchedaProdotto({ p, da, sopra, sotto, conTag = true }: { p: Prodotto; da: string; sopra?: React.ReactNode; sotto?: React.ReactNode; conTag?: boolean }) {
  const dove = negozio(p);
  const href = indirizzo(p);
  const tag = conTag ? p.tag.map((t) => CATALOGO.tag.find((x) => x.id === t)?.nome).filter(Boolean).slice(0, 3) : [];
  const misura = p.scheda?.misura ? `${String(p.scheda.misura.valore).replace('.', ',')} ${p.scheda.misura.unita}` : null;
  const foto = <FotoProdotto src={p.image} alt={`${p.brand} ${p.name}`} variante="carta" tono={tonoProdotto(categoriaDi(p)?.id)} />;
  return (
    <div className="carta carta-prodotto">
      {sopra}
      <div className="prodotto">
        {href ? <Link href={href} className="foto-carta" tabIndex={-1} aria-hidden="true">{foto}</Link> : <div className="foto-carta">{foto}</div>}
        <div className="pila" style={{ ['--gap' as string]: '4px', minWidth: 0 }}>
          <span className="marca">{p.brand}</span>
          {href ? <Link href={href} className="nome">{p.name}</Link> : <span className="nome">{p.name}</span>}
          {p.subtitle && <span className="sottotitolo">{p.subtitle}</span>}
          {/* la descrizione ripete attivi e formato, già scritti sotto: resta solo per chi non ha la scheda */}
          {p.description && !p.scheda && <span className="piccolo">{p.description}</span>}
          {(p.scheda?.attivi || []).length > 0 && (
            <span className="piccolo" style={{ color: 'var(--terra)', fontWeight: 700 }}>
              {p.scheda!.attivi.slice(0, 3).map((a) => a.nome + (a.perc ? ` ${String(a.perc).replace('.', ',')}%` : '')).join(' · ')}
            </span>
          )}
          {href && <Link href={href} className="piccolo link-scheda">La scheda completa</Link>}
        </div>
      </div>
      {sotto}
      {/* in fondo: i tag e sotto il «Compra qui» (Federico, 15/10) */}
      <div className="carta-fondo">
        {tag.length > 0 && <div className="riga-chip">{tag.map((t) => <span key={t} className="chip tenue">{t}</span>)}</div>}
        <div className="riga-compra">
          <Campione href={p.affiliateUrl} prezzo={p.price} dove={dove} id={p.id} da={da} />
          {misura && <span className="piccolo">{misura}</span>}
        </div>
        <InfoNegozio negozio={dove} prezzo={p.price} breve />
      </div>
    </div>
  );
}
