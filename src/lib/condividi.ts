// IL RISULTATO DA CONDIVIDERE (Federico, 15/10): /risultato#<codice>. Il codice contiene percorso e
// risposte; sta dopo il «#», che il browser non manda mai al server: le risposte restano di chi le
// condivide, come promette il test. Chi apre il link rivede lo stesso risultato, calcolato sul suo telefono.
//
// ⚠️ UN SEGNO PER DOMANDA (30/10/2026, Federico: «link troppo lunghi son difficili da condividere, è saltato
// trasferendolo al telefono»). Prima il codice era l'elenco delle risposte per intero, circa 600 caratteri; ora è
// «2» + il percorso + l'impronta del test + un segno per ogni domanda del percorso (l'opzione scelta; per le domande a
// più risposte i bit delle opzioni), una trentina di caratteri. L'impronta cambia se cambiano domande o opzioni: un
// link di un test diverso non dà un risultato sbagliato, dice che il test è cambiato (decodifica → «vecchio»).
// I link di prima (cominciano con «eyJ») si leggono ancora.
import type { Risposte, Risultato } from './motore';
import { giornataDi, MOMENTI } from './giornata';
import { TEST, type Domanda } from './dati';

const SEGNI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const domandeDel = (percorso: string): Domanda[] | null => {
  const p = TEST.percorsi.find((x) => x.id === percorso);
  return p ? p.domande.map((id) => TEST.domande.find((d) => d.id === id)).filter((d): d is Domanda => !!d) : null;
};
const larghezza = (d: Domanda) => (d.multipla ? Math.ceil(d.opzioni.length / 6) : 1);
function impronta(dd: Domanda[]): string {
  let h = 0x811c9dc5;
  for (const c of JSON.stringify(dd.map((d) => [d.id, !!d.multipla, d.opzioni.map((o) => o.id)]))) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return SEGNI[h & 63] + SEGNI[(h >>> 6) & 63];
}

export function codifica(percorso: string, risposte: Risposte): string {
  const dd = domandeDel(percorso), ip = TEST.percorsi.findIndex((x) => x.id === percorso);
  if (!dd || ip < 0) return '';
  let s = '2' + SEGNI[ip] + impronta(dd);
  for (const d of dd) {
    const v = risposte[d.id];
    if (!d.multipla) { s += SEGNI[typeof v === 'string' ? d.opzioni.findIndex((o) => o.id === v) + 1 : 0]; continue; }
    const scelte = Array.isArray(v) ? v : v ? [v] : [];
    for (let k = 0; k < larghezza(d); k++) {
      let bit = 0;
      d.opzioni.slice(k * 6, k * 6 + 6).forEach((o, i) => { if (scelte.includes(o.id)) bit |= 1 << i; });
      s += SEGNI[bit];
    }
  }
  return s;
}

export function decodifica(codice: string): { percorso: string; risposte: Risposte } | 'vecchio' | null {
  if (codice.startsWith('2')) {
    const p = TEST.percorsi[SEGNI.indexOf(codice[1])];
    const dd = p && domandeDel(p.id);
    if (!p || !dd) return null;
    if (codice.slice(2, 4) !== impronta(dd)) return 'vecchio';
    const risposte: Risposte = {};
    let i = 4;
    for (const d of dd) {
      if (!d.multipla) {
        const n = SEGNI.indexOf(codice[i++] ?? 'A');
        if (n > 0 && d.opzioni[n - 1]) risposte[d.id] = d.opzioni[n - 1].id;
        continue;
      }
      const scelte: string[] = [];
      for (let k = 0; k < larghezza(d); k++) {
        const bit = Math.max(0, SEGNI.indexOf(codice[i++] ?? 'A'));
        d.opzioni.slice(k * 6, k * 6 + 6).forEach((o, j) => { if (bit & (1 << j)) scelte.push(o.id); });
      }
      if (scelte.length) risposte[d.id] = scelte;
    }
    return { percorso: p.id, risposte };
  }
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
export const primoBiotipo = (r: Risultato) => r.aree.find((a) => a.biotipo)?.biotipo || null;

export function indirizzoCondiviso(r: Risultato, codice: string): string {
  const b = primoBiotipo(r);
  return `/risultato${b ? `/${b.id}` : ''}#${codice}`;
}

// ⚠️ UN MESSAGGIO COME LO SCRIVEREBBE UNA PERSONA (30/10/2026, Federico: «quando fai condividi o copia link vorrei
// anche del testo, tipo "hey guarda ho fatto il test su skinmatch.it ed è uscito che…", e il link con l'immagine»).
// Cosa è uscito, il motto, che routine ne viene e l'invito a farlo; il link in fondo, da solo sulla sua riga, così
// l'app ne fa l'anteprima con la carta. I limiti («prima un consulto con un medico») non entrano: li legge chi apre.
const COSA: Record<string, string> = { pelle: 'il mio biotipo è', cute: 'il biotipo della mia cute è', integrazione: 'il mio profilo è' };
const QUELLO: Record<string, string> = { pelle: 'il biotipo della pelle', cute: 'quello della cute', integrazione: 'il profilo per l’integrazione' };
const unisci = (v: string[]) => (v.length < 2 ? v.join('') : `${v.slice(0, -1).join(', ')} e ${v[v.length - 1]}`);

export function messaggio(r: Risultato, mio: boolean): { titolo: string; testo: string } {
  const aree = r.aree.filter((x) => x.biotipo);
  const tempo = `ci vogliono circa ${r.percorso.minuti} minuti`;
  const invito = `Fallo anche tu, ${tempo}: sono domande su quello che vedi allo specchio, e le risposte restano sul tuo telefono.`;
  if (!aree.length) return { titolo: 'Il test di Skinmatch', testo: `Ehi, guarda: su skinmatch.it c’è un test per capire che pelle hai e che prodotti usare. ${invito}` };
  const [a, ...altre] = aree;
  const b = a.biotipo!;
  if (!mio) {
    return { titolo: `Un risultato di Skinmatch: ${b.titolo}`, testo: `Ehi, guarda questo risultato del test di skinmatch.it: è uscito «${b.titolo}». ${invito}` };
  }
  const uscito = [`${COSA[a.area]} «${b.titolo}»`, ...altre.map((x) => `${QUELLO[x.area]} «${x.biotipo!.titolo}»`)];
  const g = giornataDi(r);
  const n = g.passi.length + g.settimana.length;
  const quando = unisci(MOMENTI.filter((m) => g.passi.some((p) => p.orario.momenti.includes(m.id))).map((m) => m.nome.toLowerCase()));
  const soloIntegratori = r.aree.every((x) => x.area === 'integrazione');
  const routine = !n ? '' : soloIntegratori
    ? `Mi ha consigliato ${n === 1 ? 'un integratore, con' : `${n} integratori, ognuno con`} un’alternativa che di solito costa meno.`
    : `Mi ha dato una routine di ${n} ${n === 1 ? 'prodotto' : 'prodotti'}${quando ? `, ${quando}` : ''}, e per ognuno anche un’alternativa che di solito costa meno.`;
  const righe = [`Ehi, guarda: ho fatto il test su skinmatch.it ed è uscito che ${unisci(uscito)}.`, `«${b.motto}»`, routine, invito];
  return { titolo: `Il mio biotipo Skinmatch: ${b.titolo}`, testo: righe.filter(Boolean).join('\n') };
}
