// IL CATALOGO: i prodotti dei feed (products.ts, products-feed.ts) con sopra le correzioni
// fatte a mano dall'admin (src/data/catalogo.json → modifiche), le categorie e i filtri.
//
// ⚠️ products.ts e products-feed.ts li scrivono l'importazione dai merchant e chi cura la
// selezione: qui non si toccano. Una correzione (un tag, un tipo di pelle, «nascondi»)
// vive nelle modifiche per id e sopravvive al prossimo aggiornamento dei feed.

import { PRODUCTS, type Product } from './products';
import { CATALOGO, type Modifica } from './dati';
import { rispetta, inCategoria } from './indirizzo';

export { rispetta, categoriaDi, inCategoria, indirizzo } from './indirizzo';

export type Prodotto = Product & { tag: string[] };

export function applica(p: Product, m?: Modifica): Product {
  if (!m) return p;
  const q = { ...p } as Product;
  if (m.name) q.name = m.name;
  if (m.description) q.description = m.description;
  if (m.tier) q.tier = m.tier;
  if (m.skinTypes) q.skinTypes = m.skinTypes as Product['skinTypes'];
  if (m.concerns) q.concerns = m.concerns as Product['concerns'];
  if (m.hairConcerns) q.hairConcerns = m.hairConcerns as Product['hairConcerns'];
  if (m.scalpTypes) q.scalpTypes = m.scalpTypes as Product['scalpTypes'];
  if (m.pregnancySafe !== undefined) q.pregnancySafe = m.pregnancySafe;
  if (m.sensitiveSafe !== undefined) q.sensitiveSafe = m.sensitiveSafe;
  if (m.categoria) q.categoriaSito = m.categoria;
  return q;
}


// Tutti i prodotti in vendita, corretti e con i loro tag. Fuori i segnaposto e i nascosti.
export const PRODOTTI: Prodotto[] = PRODUCTS.filter((p) => p.affiliateUrl !== '#' && !p.isPlaceholder)
  .filter((p) => !CATALOGO.modifiche[p.id]?.nascosto)
  .map((p) => {
    const m = CATALOGO.modifiche[p.id];
    const q = applica(p, m);
    const tag = CATALOGO.tag.filter((t) => rispetta(q, t.regola)).map((t) => t.id);
    const piu = (m?.tag_piu || []).filter((t) => !tag.includes(t));
    return { ...q, tag: [...tag, ...piu].filter((t) => !(m?.tag_meno || []).includes(t)) };
  });

export const prodottoPerId = (id: string) => PRODOTTI.find((p) => p.id === id);
export const nelGruppo = (slug: string) => {
  const c = CATALOGO.categorie.find((x) => x.id === slug);
  if (c) return PRODOTTI.filter((p) => inCategoria(p, c));
  return PRODOTTI.filter((p) => p.tag.includes(slug));
};

export { euro, negozio } from './formato';

// I prodotti da mostrare nella pagina di un biotipo: quelli che rispondono ai suoi bisogni,
// al massimo due per categoria, così la pagina mostra una routine e non sei creme uguali.
const CATEGORIE_AREA: Record<string, string[]> = { pelle: ['detergenti', 'sieri', 'creme', 'attivi', 'barba', 'cerotti'], cute: ['shampoo', 'capelli'], integrazione: ['integratori'] };
type ConBisogni = { area: string; bisogni: { pelle?: string[]; concerns?: string[]; capelli?: string[]; cute?: string[] } };
const voto = (p: Product, b: ConBisogni) => {
  const k = b.bisogni;
  return ((p.skinTypes || []).some((t) => k.pelle?.includes(t)) ? 2 : 0) +
    (p.concerns || []).filter((c) => k.concerns?.includes(c)).length * 1.5 +
    ((p.hairConcerns || []).some((c) => k.capelli?.includes(c)) ? 3 : 0) +
    ((p.scalpTypes || []).some((c) => k.cute?.includes(c)) ? 1 : 0) +
    (p.linkPending ? 0 : 0.2);
};
export function prodottiPer(b: ConBisogni, quanti = 6): Prodotto[] {
  const per: Record<string, number> = {};
  return PRODOTTI.filter((p) => CATEGORIE_AREA[b.area]?.includes(p.category) && p.category !== 'cerotti')
    .map((p) => ({ p, v: voto(p, b) }))
    .filter((x) => x.v >= 2)
    .sort((a, b2) => b2.v - a.v || a.p.price - b2.p.price)
    .filter((x) => (per[x.p.category] = (per[x.p.category] || 0) + 1) <= 2)
    .slice(0, quanti)
    .map((x) => x.p);
}

// I biotipi a cui un prodotto risponde (la sua pagina): stessa area, il tipo di pelle o di cute e
// almeno un bisogno in comune; mai un prodotto che pizzica a un biotipo che reagisce. Prima i più vicini.
export function biotipiPer<B extends ConBisogni & { id: string; tipo: string }>(p: Product, biotipi: B[]): B[] {
  const soglia: Record<string, number> = { pelle: 3.5, cute: 3, integrazione: 1.5 };
  return biotipi
    .filter((b) => CATEGORIE_AREA[b.area]?.includes(p.category))
    .filter((b) => !(b.bisogni.pelle?.includes('sensibile') && p.sensitiveSafe === false))
    .map((b) => ({ b, v: voto(p, b) - (b.tipo === 'tratto' ? 0.5 : 0) }))
    .filter((x) => x.v >= soglia[x.b.area])
    .sort((a, b2) => b2.v - a.v)
    .map((x) => x.b);
}
