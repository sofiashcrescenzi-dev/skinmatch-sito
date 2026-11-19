// LE PAGINE CHE RISPONDONO ALLE RICERCHE (19/11/2026, analisi delle ricerche; Federico: «fai tutte le modifiche che hai
// richiesto per skinmatch»). Google Trends e i suggerimenti di Google dicono che la gente cerca il prodotto per il suo
// problema («crema viso pelle grassa»), l'ingrediente («niacinamide a cosa serve») e la marca («cerave»), non il biotipo.
// Tre famiglie di pagine, tutte costruite sui dati che ci sono già:
// · /biotipi/<id>/<categoria>: una categoria per un tipo di pelle o di cute (prodottiPerCategoria), solo se ha almeno
//   MINIMO prodotti, così non nascono pagine vuote;
// · /ingredienti/<id>: un attivo di src/data/attivi.json (testi rivisti da Sofia) e i prodotti che lo hanno nell'INCI;
// · /marche/<slug>: una marca con almeno MINIMO_MARCA prodotti nel catalogo.
// ⚠️ Una pagina che sparisce (meno prodotti di prima) non dà 404: il Worker la rinvia alla pagina madre (worker/index.js).

import { BIOTIPI, CATALOGO, ATTIVI, conAttivo, type Attivo } from './dati';
import { PRODOTTI, prodottiPerCategoria, type Prodotto } from './catalogo';
import { principale } from './simili';

export const MINIMO = 4;
export const MINIMO_MARCA = 10;

// come si dice «per chi» nel titolo: «Crema viso per pelle mista», «Shampoo per capelli grassi»
export const PER: Record<string, string> = {
  atopica: 'dermatite atopica', psoriasica: 'psoriasi', acneica: 'pelle acneica', 'seborroica-disidratata': 'pelle grassa e disidratata',
  'seborroica-idratata': 'pelle grassa', 'disidratata-sensibile': 'pelle disidratata e sensibile', 'secca-disidratata': 'pelle secca e disidratata',
  secca: 'pelle secca', 'normale-disidratata': 'pelle normale disidratata', 'pelle-mista': 'pelle mista', normale: 'pelle normale',
  macchie: 'macchie sul viso', rosacea: 'rosacea e couperose', matura: 'pelle matura e rughe', menopausa: 'pelle in menopausa',
  reattiva: 'pelle sensibile', imperfezioni: 'brufoli e punti neri',
  'psoriasi-cuoio-capelluto': 'psoriasi del cuoio capelluto', seborroico: 'forfora grassa', diradamento: 'diradamento dei capelli',
  'caduta-reattiva': 'caduta dei capelli', 'secco-desquamante': 'forfora secca', 'capelli-secchi': 'capelli secchi', 'cute-grassa': 'capelli grassi',
  'cute-secca': 'cuoio capelluto secco', 'cute-sensibile': 'cuoio capelluto sensibile', 'capelli-trattati': 'capelli colorati o trattati',
};
// il prodotto al singolare, come si cerca
export const COSA: Record<string, string> = {
  detergenti: 'Detergente viso', sieri: 'Siero viso', creme: 'Crema viso', solari: 'Crema solare viso', attivi: 'Trattamenti',
  maschere: 'Maschera viso', occhi: 'Contorno occhi', shampoo: 'Shampoo', capelli: 'Lozioni e trattamenti',
};
const CATEGORIE: Record<string, string[]> = { pelle: ['detergenti', 'sieri', 'creme', 'solari', 'attivi', 'maschere', 'occhi'], cute: ['shampoo', 'capelli'] };

export type Incrocio = { biotipo: string; categoria: string; titolo: string; prodotti: Prodotto[] };
let _incroci: Incrocio[] | null = null;
export function incroci(): Incrocio[] {
  if (_incroci) return _incroci;
  _incroci = BIOTIPI.filter((b) => PER[b.id] && CATEGORIE[b.area]).flatMap((b) =>
    CATEGORIE[b.area].map((c) => ({ biotipo: b.id, categoria: c, titolo: `${COSA[c]} per ${PER[b.id]}`, prodotti: prodottiPerCategoria(b, c) })))
    .filter((x) => x.prodotti.length >= MINIMO);
  return _incroci;
}
export const incrocio = (biotipo: string, categoria: string) => incroci().find((x) => x.biotipo === biotipo && x.categoria === categoria);
export const incrociDelBiotipo = (id: string) => incroci().filter((x) => x.biotipo === id);
export const incrociDellaCategoria = (id: string) => incroci().filter((x) => x.categoria === id);
export const nomeCategoria = (id: string) => CATALOGO.categorie.find((c) => c.id === id)?.nome || id;

// GLI INGREDIENTI: prima i prodotti in cui è l'attivo principale, poi gli altri; dentro, i meno cari prima
export function prodottiConAttivo(a: Attivo): { principali: Prodotto[]; altri: Prodotto[] } {
  const con = PRODOTTI.filter((p) => conAttivo(p, a)).sort((x, y) => x.price - y.price);
  const eP = (p: Prodotto) => principale(p)?.attivo.id === a.id;
  return { principali: con.filter(eP), altri: con.filter((p) => !eP(p)) };
}
export const ingredienti = () => ATTIVI.filter((a) => PRODOTTI.some((p) => conAttivo(p, a)));

// LE MARCHE: l'indirizzo è il nome senza accenti e segni («La Roche-Posay» → la-roche-posay)
export const slugMarca = (m: string) => m.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' e ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let _marche: { nome: string; slug: string; prodotti: Prodotto[] }[] | null = null;
export function marche() {
  if (_marche) return _marche;
  const per = new Map<string, Prodotto[]>();
  for (const p of PRODOTTI) if (p.brand) per.set(p.brand, [...(per.get(p.brand) || []), p]);
  _marche = [...per].filter(([, v]) => v.length >= MINIMO_MARCA).map(([nome, prodotti]) => ({ nome, slug: slugMarca(nome), prodotti }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  return _marche;
}
export const marcaPerSlug = (s: string) => marche().find((m) => m.slug === s);
export const paginaMarca = (brand: string) => { const m = marche().find((x) => x.nome === brand); return m ? `/marche/${m.slug}` : null; };
