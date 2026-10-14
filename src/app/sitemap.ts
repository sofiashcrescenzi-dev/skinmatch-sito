import type { MetadataRoute } from 'next';
import { BIOTIPI, CATALOGO, ARTICOLI } from '@/lib/dati';
import { nelGruppo } from '@/lib/catalogo';

export const dynamic = 'force-static';

const BASE = 'https://skinmatch.it';

// Solo le pagine da indicizzare: niente admin, niente rivista vuota.
export default function sitemap(): MetadataRoute.Sitemap {
  const pagine = ['', '/test', '/biotipi', '/catalogo', '/glossario', ...(ARTICOLI.length ? ['/rivista'] : [])];
  return [
    ...pagine.map((p) => ({ url: `${BASE}${p}` })),
    ...BIOTIPI.map((b) => ({ url: `${BASE}/biotipi/${b.id}` })),
    ...[...CATALOGO.categorie, ...CATALOGO.tag].filter((g) => nelGruppo(g.id).length).map((g) => ({ url: `${BASE}/catalogo/${g.id}` })),
    ...ARTICOLI.map((a) => ({ url: `${BASE}/rivista/${a.slug}`, lastModified: a.aggiornato_il || a.pubblicato_il })),
  ];
}
