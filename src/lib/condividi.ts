// IL RISULTATO DA CONDIVIDERE (Federico, 15/10): /risultato#<codice>. Il codice contiene percorso e
// risposte; sta dopo il «#», che il browser non manda mai al server: le risposte restano di chi le
// condivide, come promette il test. Chi apre il link rivede lo stesso risultato, calcolato sul suo telefono.
import type { Risposte } from './motore';

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
