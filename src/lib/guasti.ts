import { segna } from './eventi';

// ⚠️ RUMORE CHE NON DICE NIENTE: un errore di uno script di un altro dominio arriva senza messaggio, le estensioni
// del browser girano nella pagina ma non sono nostre, «ResizeObserver loop» Chrome lo emette anche quando va tutto bene.
const RUMORE = [/^Script error\.?$/i, /extension:\/\//i, /ResizeObserver loop/i, /Non-Error promise rejection/i];

// ⚠️ IL TETTO NON È PRUDENZA: un errore dentro il disegno della pagina scatta centinaia di volte al secondo. Tre per
// caricamento bastano a sapere che qualcosa è rotto; il conteggio vero lo fa il worker, giorno per giorno.
let rimasti = 3;
const visti = new Set<string>();

export function guasto(messaggio: unknown, sorgente?: string) {
  const m = String(messaggio || '').slice(0, 160);
  if (!m || rimasti <= 0 || visti.has(m) || RUMORE.some((r) => r.test(m) || r.test(sorgente || ''))) return;
  visti.add(m);
  rimasti -= 1;
  segna({ e: 'guasto', m, pg: window.location.pathname });
}

// Un file della pagina che non c'è più: succede a chi ha aperto il sito prima di una pubblicazione, perché ogni
// pubblicazione sostituisce tutti i file JavaScript. Basta ricaricare: le risposte del test stanno nel telefono e il
// risultato nell'indirizzo, non si perde niente.
export const fileSparito = (m: string) =>
  /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(m);
