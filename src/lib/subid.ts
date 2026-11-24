// IL SUBID DEI LINK AI NEGOZI (24/11/2026, Federico: «voglio che lo adegui anche per skinmatch»).
// Fino a oggi Awin portava sempre «skinmatch» e Adtraction niente: una vendita non diceva né da quale fonte era arrivata
// la visita né quale prodotto. Ora, al clic, il link prende «smq» + una lettera della fonte + il prodotto (solo lettere e
// cifre, come vuole Adtraction): per esempio smqc + biodermasensibioh2o = arrivata da ChatGPT. Dice «da dove» e «quale
// scheda», mai «chi». Le reti lo rimandano con la vendita (scripts/admin/vendite.py → vendite.subid) e la Dashboard lo
// legge (fonteDalSubid). ⚠️ Le lettere non si cambiano: le vendite già arrivate le userebbero col significato vecchio.
export const CODICE_FONTE: Record<string, string> = {
  google: 'g', bing: 'b', altro_motore: 'm',
  chatgpt: 'c', perplexity: 'p', gemini: 'e', claude: 'l', copilot: 'o', altra_ia: 'a',
  instagram: 'i', tiktok: 't', facebook: 'f', youtube: 'y', threads: 'h', pinterest: 'n', link_in_bio: 'k',
  altro_sito: 's', diretto: 'd',
};
const FONTE_DEL_CODICE = Object.fromEntries(Object.entries(CODICE_FONTE).map(([f, c]) => [c, f]));

export function subidPer(fonte: string, prodotto: string): string {
  return ('smq' + (CODICE_FONTE[fonte] || 'x') + String(prodotto || '').toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 48);
}

/** La fonte scritta nel SubID di una vendita, o null (vendite di prima del 24/11, o fonte non nota). */
export function fonteDalSubid(subid: string | null | undefined): string | null {
  const m = /^smq([a-z])/.exec(String(subid || '').toLowerCase());
  return (m && FONTE_DEL_CODICE[m[1]]) || null;
}

/** Il link con il SubID: Adtraction lo vuole in «epi», Awin in «clickref». Gli altri link restano come sono. */
export function conSubid(href: string, subid: string): string {
  try {
    const u = new URL(href);
    if (/(^|\.)adt\d*\.com$|adtraction/.test(u.hostname)) u.searchParams.set('epi', subid);
    else if (/(^|\.)awin1\.com$/.test(u.hostname)) u.searchParams.set('clickref', subid);
    else return href;
    return u.toString();
  } catch { return href; }
}
