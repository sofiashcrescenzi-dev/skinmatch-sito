// IL RISULTATO DA CONDIVIDERE (Federico, 15/10): /risultato#<codice>. Il codice contiene percorso e
// risposte; sta dopo il «#», che il browser non manda mai al server: le risposte restano di chi le
// condivide, come promette il test. Chi apre il link rivede lo stesso risultato, calcolato sul suo telefono.
import type { Risposte, Risultato } from './motore';
import { giornataDi, MOMENTI } from './giornata';

export function codifica(percorso: string, risposte: Risposte): string {
  const json = JSON.stringify({ p: percorso, r: risposte });
  const b = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodifica(codice: string): { percorso: string; risposte: Risposte } | null {
  try {
    const b = atob(codice.replace(/-/g, '+').replace(/_/g, '/'));
    const x = JSON.parse(new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0))));
    if (!x || typeof x.p !== 'string' || typeof x.r !== 'object') return null;
    return { percorso: x.p, risposte: x.r };
  } catch {
    return null;
  }
}

// ⚠️ IL MESSAGGIO CHE PARTE CON IL LINK (30/10/2026, Federico: «il contenuto condiviso deve far capire la skincare della
// persona e spingere a fare il test»). Il link porta il biotipo nell'indirizzo, /risultato/<biotipo>#<codice>: così
// l'anteprima di WhatsApp, Telegram o Messaggi mostra la carta di quel biotipo (public/condividi/<biotipo>.jpg,
// scripts/carte_condivisione.mjs) e non quella generica. Il biotipo lo sceglie di mostrare chi condivide; le
// risposte restano dopo il «#», come prima.
const DOMANDA: Record<string, string> = { viso: 'E tu che pelle hai?', completo: 'E tu che pelle hai?', cute: 'E la tua cute com’è?', integrazione: 'E a te cosa servirebbe?' };
const unisci = (v: string[]) => (v.length < 2 ? v.join('') : `${v.slice(0, -1).join(', ')} e ${v[v.length - 1]}`);

export const primoBiotipo = (r: Risultato) => r.aree.find((a) => a.biotipo)?.biotipo || null;

export function indirizzoCondiviso(r: Risultato, codice: string): string {
  const b = primoBiotipo(r);
  return `/risultato${b ? `/${b.id}` : ''}#${codice}`;
}

export function messaggio(r: Risultato, mio: boolean): { titolo: string; testo: string } {
  const aree = r.aree.filter((a) => a.biotipo);
  const [a0, ...altre] = aree;
  const minuti = `Il test dura circa ${r.percorso.minuti} minuti`;
  if (!a0) return { titolo: 'Il test di Skinmatch', testo: `${minuti}, con domande su quello che vedi allo specchio.` };
  const b = a0.biotipo!;
  if (!mio) {
    return { titolo: `Un risultato di Skinmatch: ${b.titolo}`, testo: `Guarda questo risultato del test di Skinmatch: ${b.titolo}. ${minuti}: scopri il tuo.` };
  }
  const g = giornataDi(r);
  const n = g.passi.length + g.settimana.length;
  const quando = unisci(MOMENTI.filter((m) => g.passi.some((p) => p.orario.momenti.includes(m.id))).map((m) => m.nome.toLowerCase()));
  const righe = [
    `Ho fatto il test di Skinmatch. ${a0.area === 'integrazione' ? 'Il mio profilo' : 'Il mio biotipo'}: ${b.titolo}. «${b.motto}»`,
    ...altre.map((a) => `${a.area === 'cute' ? 'La cute' : 'Per l’integrazione'}: ${a.biotipo!.titolo}.`),
    n ? `Ne è uscita una routine di ${n} ${n === 1 ? 'prodotto' : 'prodotti'}${quando ? ` (${quando})` : ''}, e per ognuno un’alternativa che di solito costa meno.` : '',
    `${DOMANDA[r.percorso.id] || DOMANDA.viso} ${minuti}:`,
  ];
  return { titolo: `Il mio biotipo Skinmatch: ${b.titolo}`, testo: righe.filter(Boolean).join('\n') };
}
