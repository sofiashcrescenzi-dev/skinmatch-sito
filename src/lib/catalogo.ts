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
  if (m.sottotitolo) q.subtitle = m.sottotitolo;
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
type ConBisogni = { id?: string; area: string; bisogni: { pelle?: string[]; concerns?: string[]; capelli?: string[]; cute?: string[] } };

// ⚠️ I PROFILI DELICATI (7/11/2026, b-delicati; Federico: «non possiamo selezionarli noi manualmente uno ad uno»). Per le
// condizioni dichiarate nel test, la pelle reattiva e il cuoio capelluto sensibile l'elenco non nasce dai bisogni ma da
// una regola per profilo che legge l'INCI intero (scripts/catalogo/delicati.py): entra solo chi ha il profilo nel campo
// «delicati» di prodotti.json, ordinato dal suo punteggio. Senza INCI intero, con retinoidi, acidi forti, profumo, oli
// essenziali o alcol denaturato non si entra. Prima l'elenco di atopica e psoriasi era lo stesso, col siero al retinolo.
export const PROFILI_DELICATI = ['atopica', 'psoriasica', 'rosacea', 'reattiva', 'disidratata-sensibile', 'psoriasi-cuoio-capelluto', 'cute-sensibile'];
type ConDelicati = { delicati?: Record<string, number> };
export const delicatoPer = (p: Product, profilo: string) => (p as Product & ConDelicati).delicati?.[profilo];
const eDelicato = (b: ConBisogni) => !!b.id && PROFILI_DELICATI.includes(b.id);

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
  const delicato = eDelicato(b);
  return PRODOTTI.filter((p) => CATEGORIE_AREA[b.area]?.includes(p.category) && p.category !== 'cerotti')
    // un profilo delicato: solo i prodotti della sua regola, prima i più adatti; gli altri biotipi mai un prodotto
    // che i dati marcano «non per pelli sensibili» se il biotipo lo è
    .filter((p) => (delicato ? delicatoPer(p, b.id!) !== undefined : !(b.bisogni.pelle?.includes('sensibile') && p.sensitiveSafe === false)))
    .map((p) => ({ p, v: voto(p, b) + (delicato ? delicatoPer(p, b.id!)! : 0) }))
    // anche per un profilo delicato il prodotto deve rispondere a qualcosa: un bisogno o il tipo di pelle o di cute in
    // comune, oppure l'indicazione del produttore (+3 nel punteggio); se no un tonico anticaduta finiva fra i prodotti
    // per le placche del cuoio capelluto
    .filter((x) => (delicato ? voto(x.p, b) >= 1 || delicatoPer(x.p, b.id!)! >= 4 : x.v >= 2))
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
    .filter((b) => !eDelicato(b) || delicatoPer(p, b.id) !== undefined)
    .map((b) => ({ b, v: voto(p, b) - (b.tipo === 'tratto' ? 0.5 : 0) }))
    .filter((x) => x.v >= soglia[x.b.area])
    .sort((a, b2) => b2.v - a.v)
    .map((x) => x.b);
}
