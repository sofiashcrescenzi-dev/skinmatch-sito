// I CONTEGGI DEL SITO, SENZA DATI PERSONALI (tappa 9: le risposte del test restano nel telefono).
// Si manda solo cosa è successo (test iniziato o finito, clic verso un negozio, una pagina che si rompe) e su cosa:
// niente risposte, niente identificativi, niente cookie. Il Worker li somma per giorno
// (worker/index.ts → tabella eventi_giorno) e l'admin li mostra nelle schede Traffico e Test.
export type Evento =
  | { e: 'test_inizio'; p: string }
  | { e: 'test_fine'; p: string; b: string[]; s?: number } // s: i secondi dalla prima risposta al risultato
  | { e: 'clic'; id: string; m: string; da: string }
  | { e: 'guasto'; m: string; pg: string }; // un errore JavaScript: il messaggio e il percorso, senza query né «#»

export function segna(ev: Evento) {
  try {
    const corpo = JSON.stringify(ev);
    if (navigator.sendBeacon) navigator.sendBeacon('/api/evento', new Blob([corpo], { type: 'application/json' }));
    else fetch('/api/evento', { method: 'POST', body: corpo, keepalive: true, headers: { 'content-type': 'application/json' } });
  } catch {
    /* il conteggio non deve mai rompere la pagina */
  }
}
