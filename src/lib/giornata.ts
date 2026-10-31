// LA GIORNATA DEL RISULTATO (Federico, 30/10/2026: «finito un test deve esserci un bel resoconto della giornata, con un
// bel grafico che analizza gli orari della skin routine e quando va usato un determinato prodotto. Non una lista a
// discesa, per giunta molto lunga tutta staccata»).
//
// Dai passaggi scelti dal motore ai momenti della giornata (mattina, pranzo, sera), nell'ordine in cui si stendono, e
// a quello che non è di ogni giorno (le sere a settimana, lo shampoo, i cerotti al bisogno). Gli orari sono indicativi:
// servono a far vedere la giornata, non a dettarla.
// ⚠️ I passaggi si aggiungono dall'admin: quelli che non sono in ORARI si leggono dal loro «quando».
import type { Passaggio } from './dati';
import type { PassaggioScelto, Risultato } from './motore';

export type Momento = 'mattina' | 'pranzo' | 'sera';
export const MOMENTI: { id: Momento; nome: string; ora: string }[] = [
  { id: 'mattina', nome: 'La mattina', ora: '7:30' },
  { id: 'pranzo', nome: 'A pranzo', ora: '13:00' },
  { id: 'sera', nome: 'La sera', ora: '22:00' },
];

type Orario = { momenti: Momento[]; ordine: number; ogni?: string; minuti?: number };
// l'ordine è quello in cui si stende: prima il più leggero, l'SPF per ultimo la mattina
const ORARI: Record<string, Orario> = {
  detergente: { momenti: ['mattina', 'sera'], ordine: 1, minuti: 1 },
  barba: { momenti: ['mattina'], ordine: 2, minuti: 1 },
  siero: { momenti: ['mattina'], ordine: 3, minuti: 1 },
  sera: { momenti: ['sera'], ordine: 3, ogni: '2-3 sere a settimana', minuti: 1 },
  crema: { momenti: ['mattina', 'sera'], ordine: 4, minuti: 1 },
  spf: { momenti: ['mattina'], ordine: 5, minuti: 1 },
  cerotti: { momenti: [], ordine: 6, ogni: 'al bisogno, sul brufolo' },
  shampoo: { momenti: [], ordine: 1, ogni: 'a ogni lavaggio' },
  trattamento: { momenti: [], ordine: 2, ogni: 'come indica la confezione' },
  integratore: { momenti: ['mattina'], ordine: 8, ogni: 'cicli di due o tre mesi' },
  b12: { momenti: ['mattina'], ordine: 8 },
  energia: { momenti: ['mattina'], ordine: 8, ogni: 'cicli di due o tre mesi' },
  stress: { momenti: ['mattina'], ordine: 8, ogni: 'cicli di due o tre mesi' },
  difese: { momenti: ['pranzo'], ordine: 8 },
  'vitamina-d': { momenti: ['pranzo'], ordine: 8 },
  'omega-3': { momenti: ['pranzo'], ordine: 8 },
  sonno: { momenti: ['sera'], ordine: 9, ogni: 'per periodi brevi, mezz\'ora prima di dormire' },
};

export function orarioDi(ps: Passaggio): Orario {
  if (ORARI[ps.id]) return ORARI[ps.id];
  const q = (ps.quando || '').toLowerCase();
  const momenti: Momento[] = [];
  if (/mattin/.test(q)) momenti.push('mattina');
  if (/pasti|pranzo/.test(q)) momenti.push('pranzo');
  if (/sera|dormire|notte/.test(q)) momenti.push('sera');
  const ogni = /settimana|lavaggio|bisogno|indicato|ciclo/.test(q) ? ps.quando : undefined;
  return { momenti: momenti.length || ogni ? momenti : ['mattina'], ordine: ps.area === 'integrazione' ? 8 : 5, ogni, minuti: ps.area === 'integrazione' ? 0 : 1 };
}

// ⚠️ IL MOMENTO DEL PRODOTTO, NON SOLO DEL PASSAGGIO (30/10/2026). Il siero stava sempre la mattina: un siero su
// dieci era con retinoidi o acidi esfolianti (Sesderma Reti Age, Filorga Age-Purify), che vanno la sera perché rendono
// la pelle sensibile al sole. La scheda sa quando si usa (scripts/catalogo/traduci.py, «momento»: retinoidi e acidi la
// sera, vitamina C la mattina, «notte» la sera, il resto mattina e sera) e per siero e crema vale quella.
// Per la crema conta solo «sera» (da notte, con retinoidi): la scheda segna «mattina» anche le creme idratanti con un
// po' di vitamina C (Clinique Moisture Surge, Round Lab), e la sera la pelle restava senza crema.
// Gli altri passaggi hanno il loro orario fisso: la barba la mattina anche se il dopobarba si potrebbe usare di sera.
function orarioScelta(s: PassaggioScelto): Orario {
  const o = orarioDi(s.passaggio);
  const m = s.consigliato.prodotto.scheda?.momento;
  if (!m || o.ogni) return o;
  if (s.passaggio.id === 'siero') return { ...o, momenti: m === 'mattina' ? ['mattina'] : m === 'sera' ? ['sera'] : ['mattina', 'sera'] };
  if (s.passaggio.id === 'crema' && m === 'sera') return { ...o, momenti: ['sera'] };
  return o;
}

export type Passo = { scelta: PassaggioScelto; orario: Orario; n: number };
export type Giornata = {
  momenti: { id: Momento; nome: string; ora: string; passi: Passo[] }[];
  settimana: Passo[];
  passi: Passo[];
  minuti: number;
  costoTop: number;
  costoAlternative: number;
  conAlternativa: number;
};

export function giornataDi(r: Risultato): Giornata {
  const tutti = r.aree.flatMap((a) => a.passaggi);
  const ordinati = tutti.map((s, i) => ({ s, i, o: orarioScelta(s) }))
    .sort((u, v) => primo(u.o) - primo(v.o) || u.o.ordine - v.o.ordine || u.i - v.i);
  const passi: Passo[] = ordinati.map((x, k) => ({ scelta: x.s, orario: x.o, n: k + 1 }));
  const momenti = MOMENTI.map((m) => ({ ...m, passi: passi.filter((p) => p.orario.momenti.includes(m.id)).sort((u, v) => u.orario.ordine - v.orario.ordine) }));
  const minuti = momenti.reduce((t, m) => t + m.passi.reduce((s, p) => s + (p.orario.ogni ? 0 : p.orario.minuti ?? 0), 0), 0);
  const costoTop = passi.reduce((t, p) => t + p.scelta.consigliato.prodotto.price, 0);
  const costoAlternative = passi.reduce((t, p) => t + (p.scelta.alternativa?.prodotto.price ?? p.scelta.consigliato.prodotto.price), 0);
  return {
    momenti, passi, minuti, costoTop, costoAlternative,
    settimana: passi.filter((p) => !p.orario.momenti.length),
    conAlternativa: passi.filter((p) => p.scelta.alternativa).length,
  };
}

// i passi di ogni giorno vengono prima, nell'ordine della giornata; poi quelli della settimana
function primo(o: Orario): number {
  if (!o.momenti.length) return 9;
  return Math.min(...o.momenti.map((m) => MOMENTI.findIndex((x) => x.id === m)));
}
