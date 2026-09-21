import type { MetadataRoute } from 'next';
import { ALL_BIOTYPES } from '@/lib/quiz';

export const dynamic = 'force-static';

const BASE = 'https://skinmatch.it';

// Pagine principali del sito.
const pages = ['', '/catalogo', '/test', '/biotipi'];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = pages.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
  }));

  // Le pagine /biotipi/[id] sono generate da ALL_BIOTYPES, così restano
  // sempre sincronizzate senza dover aggiornare due elenchi separati.
  const biotypeEntries = ALL_BIOTYPES.map((b) => ({
    url: `${BASE}/biotipi/${b.id}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...biotypeEntries];
}
