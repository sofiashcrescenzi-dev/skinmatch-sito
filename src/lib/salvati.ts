// I RISULTATI SALVATI (16/11/2026, Federico: «strutturare per bene la cosa dei cookie e permettere di salvare il risultato
// dei test»). Prima il telefono ricordava solo l'ultimo test fatto: chi faceva la pelle e poi la cute perdeva il primo.
// Ora «Salva il risultato» tiene un risultato per test (il più recente), con il codice che lo ricostruisce
// (lib/condividi.ts), il nome del biotipo e la data. Resta nella memoria locale di questo browser: non arriva a noi.
// È uno strumento tecnico chiesto da chi usa il sito (il bottone), quindi senza consenso; è descritto in /cookie,
// dove si vede e si cancella (DatiSuQuestoTelefono).
export const CHIAVE_SALVATI = 'skinmatch-risultati';
export const EVENTO_SALVATI = 'skinmatch-salvati';

export type Salvato = { percorso: string; codice: string; titolo: string; quando: string };

export function leggiSalvati(): Salvato[] {
  try {
    const x = JSON.parse(localStorage.getItem(CHIAVE_SALVATI) || '[]');
    return Array.isArray(x) ? x.filter((s) => s && typeof s.percorso === 'string' && typeof s.codice === 'string') : [];
  } catch { return []; }
}

function scrivi(lista: Salvato[]) {
  try { localStorage.setItem(CHIAVE_SALVATI, JSON.stringify(lista)); } catch { /* memoria piena o bloccata */ }
  window.dispatchEvent(new Event(EVENTO_SALVATI));
}

export function salvaRisultato(s: Omit<Salvato, 'quando'>) {
  scrivi([{ ...s, quando: new Date().toISOString() }, ...leggiSalvati().filter((x) => x.percorso !== s.percorso)]);
}

export function togliRisultato(percorso: string) {
  scrivi(leggiSalvati().filter((x) => x.percorso !== percorso));
}

// Tutto quello che Skinmatch tiene in questo browser, con il perché: la stessa lista della pagina /cookie.
export const MEMORIA: { chiave: string; dove: 'locale' | 'sessione'; cosa: string; quanto: string }[] = [
  { chiave: CHIAVE_SALVATI, dove: 'locale', cosa: 'I risultati dei test che hai scelto di salvare, uno per test.', quanto: 'Finché non li togli' },
  { chiave: 'skinmatch-test-2', dove: 'locale', cosa: 'Le risposte del test in corso o dell’ultimo fatto, per riprendere da dove eri.', quanto: 'Finché non rifai il test o lo cancelli' },
  { chiave: 'skinmatch-nozioni-viste', dove: 'locale', cosa: 'Le curiosità del test già lette, per non ripeterle.', quanto: 'Finché non lo cancelli' },
  { chiave: 'skinmatch-ricaricata', dove: 'sessione', cosa: 'L’ora dell’ultima ricarica automatica dopo un errore, per non ripeterla di continuo.', quanto: 'Fino alla chiusura della scheda' },
  { chiave: 'sm-arrivo', dove: 'sessione', cosa: 'Un segno che la visita è già stata contata, senza sapere chi sei.', quanto: 'Fino alla chiusura della scheda' },
];

export function cancellaTutto() {
  for (const m of MEMORIA) {
    try { (m.dove === 'locale' ? localStorage : sessionStorage).removeItem(m.chiave); } catch { /* niente */ }
  }
  window.dispatchEvent(new Event(EVENTO_SALVATI));
}
