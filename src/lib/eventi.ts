// I CONTEGGI DEL SITO, SENZA DATI PERSONALI (tappa 9: le risposte del test restano nel telefono).
// Si manda solo cosa è successo (test iniziato o finito, clic verso un negozio, una pagina che si rompe) e su cosa:
// niente identificativi, niente cookie; dal 23/11/2026 anche le risposte scelte, solo per sommarle. Il Worker li somma per giorno
// (worker/index.ts → tabella eventi_giorno) e l'admin li mostra nelle schede Traffico e Test.
// ⚠️ LE RISPOSTE E I PRODOTTI PROPOSTI, CONTATI (23/11/2026, Federico: «sì inizia a registrare e anche quanti click poi
// avvengono e a quale prodotto»): per i report ai marchi si sommano per giorno quante volte viene scelta ogni risposta
// (r, «domanda:opzione») e quante volte ogni prodotto compare nella routine di un biotipo (proposti, «biotipo|prodotto»).
// Mai una persona: il Worker aggiunge 1 a dei contatori e butta il resto. Le risposte sulla salute (condizioni della
// pelle e della cute, gravidanza, menopausa, farmaci) non partono mai: si tolgono qui, nel telefono (NON_CONTARE).
// I clic per prodotto c'erano già: «clic» ha l'id del prodotto.
export const NON_CONTARE = new Set(['condizioni', 'condizioni_cute', 'gravidanza', 'menopausa', 'farmaci']);
export type Evento =
  | { e: 'test_inizio'; p: string }
  | { e: 'test_fine'; p: string; b: string[]; s?: number; r?: string[] } // s: i secondi dalla prima risposta al risultato
  | { e: 'proposti'; p: string; ids: string[] }
  | { e: 'clic'; id: string; m: string; da: string }
  | { e: 'guasto'; m: string; pg: string }
  | { e: 'arrivo'; f: string; pg: string }; // la famiglia della fonte (chatgpt, google, instagram…) e la sezione d'ingresso // un errore JavaScript: il messaggio e il percorso, senza query né «#»

// le risposte come coppie «domanda:opzione», senza quelle sulla salute e senza il testo libero
export function risposteDaContare(risposte: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const [d, v] of Object.entries(risposte || {})) {
    if (NON_CONTARE.has(d)) continue;
    for (const o of Array.isArray(v) ? v : [v]) if (typeof o === 'string' && /^[a-z0-9_-]{1,40}$/.test(o)) out.push(`${d}:${o}`);
  }
  return out.slice(0, 60);
}

export function segna(ev: Evento) {
  try {
    const corpo = JSON.stringify(ev);
    if (navigator.sendBeacon) navigator.sendBeacon('/api/evento', new Blob([corpo], { type: 'application/json' }));
    else fetch('/api/evento', { method: 'POST', body: corpo, keepalive: true, headers: { 'content-type': 'application/json' } });
  } catch {
    /* il conteggio non deve mai rompere la pagina */
  }
}
