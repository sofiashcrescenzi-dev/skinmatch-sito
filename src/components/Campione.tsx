'use client';

import { euro } from '@/lib/formato';
import { segna } from '@/lib/eventi';

// i4 · Il campione: il prezzo e «Compra qui», due tasselli che si incontrano al passaggio (Federico,
// 15/10: un bottone vero, non «Vedi su Liki24» sottolineato). Il negozio è nell'etichetta per chi
// usa il lettore di schermo e nella nota di affiliazione della pagina.
// Il link è di affiliazione (rel sponsored) e il clic si conta senza dati personali (lib/eventi.ts).
export default function Campione({ href, prezzo, dove, id, da, da_prezzo }: { href: string; prezzo: number; dove: string | null; id: string; da: string; da_prezzo?: boolean }) {
  return (
    <a className="campione" href={href} target="_blank" rel="sponsored nofollow noopener"
      aria-label={`Acquista${dove ? ` su ${dove}` : ''}, ${da_prezzo ? 'da ' : ''}${euro(prezzo)}`}
      onClick={() => segna({ e: 'clic', id, m: dove || 'negozio', da })}>
      <span className="cp">{da_prezzo ? <small>da&nbsp;</small> : null}{euro(prezzo)}</span>
      <span className="cn">Acquista</span>
    </a>
  );
}
