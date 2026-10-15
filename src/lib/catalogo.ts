// IL CATALOGO: i prodotti dei feed (products.ts, products-feed.ts) con sopra le correzioni
// fatte a mano dall'admin (src/data/catalogo.json → modifiche), le categorie e i filtri.
//
// ⚠️ products.ts e products-feed.ts li scrivono l'importazione dai merchant e chi cura la
// selezione: qui non si toccano. Una correzione (un tag, un tipo di pelle, «nascondi»)
// vive nelle modifiche per id e sopravvive al prossimo aggiornamento dei feed.

import { PRODUCTS, type Product } from './products';
import { CATALOGO, type RegolaProdotti, type Modifica } from './dati';

export type Prodotto = Product & { tag: string[] };

function applica(p: Product, m?: Modifica): Product {
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
  return q;
}

export function rispetta(p: Product, r: RegolaProdotti): boolean {
  if (r.categoria && p.category !== r.categoria) return false;
  if (r.con_bisogno && !p.concerns?.includes(r.con_bisogno as never)) return false;
  if (r.senza_bisogno && p.concerns?.includes(r.senza_bisogno as never)) return false;
  if (r.fascia && !r.fascia.includes(p.tier)) return false;
  if (r.marca && !r.marca.some((m) => m.toLowerCase() === p.brand.toLowerCase())) return false;
  if (r.coreano !== undefined && p.korean !== r.coreano) return false;
  if (r.sensibili && p.sensitiveSafe !== true) return false;
  if (r.gravidanza && p.pregnancySafe !== true) return false;
  if (r.genere && !r.genere.includes(p.gender)) return false;
  return true;
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
export const categoriaDi = (p: Product) => CATALOGO.categorie.find((c) => rispetta(p, c.regola));
export const nelGruppo = (slug: string) => {
  const c = CATALOGO.categorie.find((x) => x.id === slug);
  if (c) return PRODOTTI.filter((p) => rispetta(p, c.regola));
  return PRODOTTI.filter((p) => p.tag.includes(slug));
};

export { euro, negozio } from './formato';

// I prodotti da mostrare nella pagina di un biotipo: quelli che rispondono ai suoi bisogni,
// al massimo due per categoria, così la pagina mostra una routine e non sei creme uguali.
const CATEGORIE_AREA: Record<string, string[]> = { pelle: ['detergenti', 'sieri', 'creme', 'attivi', 'barba'], cute: ['shampoo', 'capelli'], integrazione: ['integratori'] };
export function prodottiPer(b: { area: string; bisogni: { pelle?: string[]; concerns?: string[]; capelli?: string[]; cute?: string[] } }, quanti = 6): Prodotto[] {
  const k = b.bisogni;
  const voto = (p: Prodotto) =>
    ((p.skinTypes || []).some((t) => k.pelle?.includes(t)) ? 2 : 0) +
    (p.concerns || []).filter((c) => k.concerns?.includes(c)).length * 1.5 +
    ((p.hairConcerns || []).some((c) => k.capelli?.includes(c)) ? 3 : 0) +
    ((p.scalpTypes || []).some((c) => k.cute?.includes(c)) ? 1 : 0) +
    (p.linkPending ? 0 : 0.2);
  const per: Record<string, number> = {};
  return PRODOTTI.filter((p) => CATEGORIE_AREA[b.area]?.includes(p.category))
    .map((p) => ({ p, v: voto(p) }))
    .filter((x) => x.v >= 2)
    .sort((a, b2) => b2.v - a.v || a.p.price - b2.p.price)
    .filter((x) => (per[x.p.category] = (per[x.p.category] || 0) + 1) <= 2)
    .slice(0, quanti)
    .map((x) => x.p);
}
