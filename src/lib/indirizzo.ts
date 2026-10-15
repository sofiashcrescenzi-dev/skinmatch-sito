// L'INDIRIZZO DI UN PRODOTTO: /catalogo/<categoria>/<oggetto> (regola di tutti i siti: l'oggetto è
// tipo + modello, mai la marca; lo scrive scripts/catalogo/al_sito.py e non cambia più).
// Modulo leggero apposta: lo usano le schede del test e del catalogo senza tirarsi dietro i prodotti.

import { CATALOGO, type RegolaProdotti } from './dati';
import type { Product } from './products';

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
  if (r.segmento && !r.segmento.includes(p.segment || '')) return false;
  return true;
}

// Un prodotto sta in una categoria se ce l'ha messo l'admin (correzione «categoria») o, se no, per regola.
export const inCategoria = (p: Product, c: { id: string; regola: RegolaProdotti }) => (p.categoriaSito ? p.categoriaSito === c.id : rispetta(p, c.regola));
export const categoriaDi = (p: Product, categorie = CATALOGO.categorie) => categorie.find((c) => p.categoriaSito === c.id) || (p.categoriaSito ? undefined : categorie.find((c) => rispetta(p, c.regola)));

export function indirizzo(p: Product): string | null {
  const c = categoriaDi(p);
  return c && p.slug ? `/catalogo/${c.id}/${p.slug}` : null;
}
