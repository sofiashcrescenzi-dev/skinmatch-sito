// LE SITEMAP DI SKINMATCH (15/11/2026, Federico: «mi crei la sitemap di Skinmatch?»).
// Prima era un file solo con tutto dentro. Ora /sitemap.xml è un indice con un file per sezione: in Search Console
// ogni file mostra quante delle sue pagine Google ha indicizzato, e si vede subito se mancano le schede o gli articoli.
// Dentro ci sono solo le pagine da indicizzare: niente admin, niente risultati del test (noindex), le pagine legali
// solo quando i dati del titolare sono completi (prima sono noindex). Le schede portano la loro foto (image sitemap).
// ⚠️ Nessuna data inventata: la data c'è solo dove la pagina la porta da sé (gli articoli).
import { BIOTIPI, CATALOGO, ARTICOLI } from '@/lib/dati';
import { nelGruppo, PRODOTTI, indirizzo } from '@/lib/catalogo';
import { completo } from '@/lib/legale';

export const BASE = 'https://skinmatch.it';

type Voce = { url: string; lastmod?: string; immagini?: string[] };

export const FILE: Record<string, () => Voce[]> = {
  'pagine.xml': () => [
    ...['', '/test', '/biotipi', '/integratori', '/glossario', '/chi-siamo', ...(completo() ? ['/privacy', '/cookie', '/note-legali'] : [])]
      .map((p) => ({ url: `${BASE}${p}` })),
    ...BIOTIPI.map((b) => ({ url: `${BASE}/biotipi/${b.id}` })),
  ],
  'catalogo.xml': () => [
    { url: `${BASE}/catalogo` },
    ...[...CATALOGO.categorie, ...CATALOGO.tag].filter((g) => nelGruppo(g.id).length).map((g) => ({ url: `${BASE}/catalogo/${g.id}` })),
  ],
  'schede.xml': () => PRODOTTI.flatMap((p) => {
    const u = indirizzo(p);
    return u ? [{ url: `${BASE}${u}`, immagini: p.image && /^https:\/\//.test(p.image) ? [p.image] : undefined }] : [];
  }),
  'rivista.xml': () => [
    ...(ARTICOLI.length ? [{ url: `${BASE}/rivista` }] : []),
    { url: `${BASE}/rivista/lo-sapevi-che` },
    ...ARTICOLI.map((a) => ({ url: `${BASE}/rivista/${a.slug}`, lastmod: a.aggiornato_il || a.pubblicato_il })),
  ],
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function urlset(voci: Voce[]): string {
  const righe = voci.map((v) => `<url><loc>${esc(v.url)}</loc>${v.lastmod ? `<lastmod>${esc(v.lastmod)}</lastmod>` : ''}${
    (v.immagini || []).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${righe.join('\n')}\n</urlset>\n`;
}

export function indice(): string {
  const righe = Object.keys(FILE).filter((f) => FILE[f]().length).map((f) => `<sitemap><loc>${BASE}/sitemaps/${f}</loc></sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${righe.join('\n')}\n</sitemapindex>\n`;
}

export const xml = (corpo: string) => new Response(corpo, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
