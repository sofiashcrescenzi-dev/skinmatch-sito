// QUANDO DUE PRODOTTI SI POSSONO CONFRONTARE (Federico, 15/10: «un siero all'1% di retinolo mi devi
// consigliare un altro simile, non un idratante diverso»; «il formato al massimo un 33% di differenza»;
// «da un tonico per cuoio capelluto mi hai consigliato come top un siero per sopracciglia… è davvero simile?»).
// Una regola sola, usata dall'alternativa del test (motore.ts); la stessa in Python per il confronto
// delle pagine prodotto (scripts/catalogo/al_sito.py, simili()). Zona, forma, pezzi e lavoro li calcola
// una volta sola il Python (scripts/catalogo/traduci.py e al_sito.py lavoro()) e li scrive nella scheda.
// 1. stesso passaggio, stessa zona (viso, occhi, labbra, cute, capelli, corpo…), stessa forma (acqua micellare
//    con acqua micellare, fiale con fiale, solare colorato con solare colorato), stessa forza, stessa fascia di
//    protezione solare, stesso genere se il titolo lo dice (anticaduta donna con donna); mai lo stesso prodotto
//    sotto un altro titolo;
// 2. stesso attivo principale (quello che il titolo nomina, se no il più pesante di src/data/attivi.json: lo
//    sceglie al_sito.py principale()); se tutti e due dichiarano la percentuale, al massimo il doppio
//    (retinolo 1% con 0,5%, non con 0,1%);
// 3. almeno un lavoro in comune;
// 4. formato vicino: la misura più grande al massimo un terzo più della più piccola, e così i pezzi
//    (capsule, fiale, cerotti); senza misure da confrontare, nessun confronto.
import { ATTIVI, type Attivo } from './dati';
import type { Product, Scheda } from './products';

// i campi per i confronti che al_sito.py aggiunge alla scheda
type SchedaConfronto = Scheda & {
  zona?: string | null; forma?: string | null; pezzi?: number | null; lavoro?: string[]; per?: 'uomo' | 'donna' | null;
  principale?: { id: string; perc: number | null } | null;
};
const sc = (p: Product) => p.scheda as SchedaConfronto | undefined;
export const zonaDi = (p: Product) => sc(p)?.zona ?? null;
export const formaDi = (p: Product) => sc(p)?.forma ?? null;

export function principale(p: Product): { attivo: Attivo; perc: number | null } | null {
  const x = sc(p)?.principale;
  const g = x ? ATTIVI.find((a) => a.id === x.id) : undefined;
  return g ? { attivo: g, perc: x!.perc } : null;
}

const vicini = (x: number, y: number) => Math.max(x, y) / Math.min(x, y) <= 1.33;

export function formatoVicino(a: Product, b: Product): boolean {
  const ma = a.scheda?.misura, mb = b.scheda?.misura, na = sc(a)?.pezzi, nb = sc(b)?.pezzi;
  if (!!ma !== !!mb || !!na !== !!nb || !(ma || na)) return false;
  const u = (m: { unita: string }) => (m.unita === 'g' ? 'ml' : m.unita);
  if (ma && mb && (u(ma) !== u(mb) || !vicini(ma.valore, mb.valore))) return false;
  return !na || !nb || vicini(na, nb);
}

// la protezione solare in tre fasce: bassa (sotto 30), media (30-49), alta (50 e 50+)
const fasciaSpf = (s: Scheda) => (!s.spf ? null : s.spf >= 50 ? 'alta' : s.spf >= 30 ? 'media' : 'bassa');

// lo stesso prodotto con due titoli nel catalogo: stessa marca, metà delle parole del nome in comune, gli stessi numeri
function parole(n: string): [Set<string>, string] {
  const t = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return [new Set(t.match(/[a-z]{3,}/g) || []), [...new Set(t.match(/\d+/g) || [])].sort().join(' ')];
}
export function stessoProdotto(a: Product, b: Product): boolean {
  if (a.brand.toLowerCase() !== b.brand.toLowerCase()) return false;
  const [wa, da] = parole(a.name), [wb, db] = parole(b.name);
  const comuni = [...wa].filter((w) => wb.has(w)).length;
  return da === db && comuni >= 0.5 * Math.max(1, new Set([...wa, ...wb]).size);
}

export function simili(a: Product, b: Product): boolean {
  const sa = sc(a), sb = sc(b);
  if (!sa || !sb) return false;
  if (sa.passaggio !== sb.passaggio || sa.zona !== sb.zona || sa.forma !== sb.forma || sa.forza !== sb.forza) return false;
  if (fasciaSpf(sa) !== fasciaSpf(sb) || (sa.per ?? null) !== (sb.per ?? null) || stessoProdotto(a, b)) return false;
  const pa = principale(a), pb = principale(b);
  if (pa?.attivo.id !== pb?.attivo.id) return false;
  if (pa?.perc && pb?.perc && Math.max(pa.perc, pb.perc) / Math.min(pa.perc, pb.perc) > 2) return false;
  if (!(sa.lavoro || []).some((k) => (sb.lavoro || []).includes(k))) return false;
  return formatoVicino(a, b);
}

// costa meno davvero: almeno un quinto in meno e, se si sa, non di più ogni 10 ml (al_sito.py meno_caro())
export function menoCaro(q: Product, s: Product): boolean {
  const qa = q.scheda?.al_10, sa = s.scheda?.al_10;
  return q.price <= s.price * 0.8 && !(qa && sa && qa >= sa);
}
