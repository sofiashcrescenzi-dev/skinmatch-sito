// LE PAROLE CHE ACCENDONO LA «i» (tappa 4 delle «Tappe di Skinmatch»).
//
// ⚠️ IN AUTOMATICO, OVUNQUE (il PO: «mette la i di info anche su altre keyword, andrà fatto in
// automatico ovunque poi quella parola si trova»). Ogni termine del glossario ha le sue parole:
// dove compaiono in un testo del sito diventano tocca-e-leggi, solo la prima volta per blocco
// di testo (più volte di fila sarebbe rumore). Le sigle (SPF, UVA, BHA) contano solo in
// maiuscolo, così «uva» resta un frutto.

import { TERMINI, type Termine } from './dati';

export type Pezzo = { testo: string; termine?: Termine };

const sigla = (s: string) => s.length <= 5 && s === s.toUpperCase() && /[A-Z]/.test(s);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const VOCI = TERMINI.flatMap((t) => [t.nome, ...t.parole].map((p) => ({ parola: p, termine: t })))
  .sort((a, b) => b.parola.length - a.parola.length);
const RE = new RegExp('(?<![\\p{L}\\p{N}])(' + VOCI.map((v) => esc(v.parola)).join('|') + ')(?![\\p{L}\\p{N}])', 'giu');

function voceDi(trovata: string) {
  return VOCI.find((v) => (sigla(v.parola) ? v.parola === trovata : v.parola.toLowerCase() === trovata.toLowerCase()));
}

// Divide un testo in pezzi: testo semplice e termini del glossario. `gia` tiene i termini già
// accesi in questo blocco; `salta` un termine da non accendere (dentro la sua stessa scheda).
export function pezzi(testo: string, gia: Set<string> = new Set(), salta?: string): Pezzo[] {
  const out: Pezzo[] = [];
  let ultimo = 0;
  for (const m of testo.matchAll(RE)) {
    const v = voceDi(m[0]);
    if (!v || gia.has(v.termine.id) || v.termine.id === salta) continue;
    gia.add(v.termine.id);
    if (m.index! > ultimo) out.push({ testo: testo.slice(ultimo, m.index) });
    out.push({ testo: m[0], termine: v.termine });
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < testo.length) out.push({ testo: testo.slice(ultimo) });
  return out;
}
