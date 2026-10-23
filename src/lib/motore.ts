// IL MOTORE DEL TEST: dalle risposte ai punteggi, dai punteggi al biotipo, dal biotipo ai prodotti.
//
// Non è un dispositivo medico né una diagnosi: incrocia le risposte con le schede dei prodotti
// per suggerire una routine di partenza (vedi «Le tappe di Skinmatch», tappa 1).
//
// ⚠️ LE REGOLE STANNO NEI DATI, NON QUI (src/data/test.json, src/data/biotipi.json): domande,
// punti, soglie, limiti e passaggi si cambiano dall'admin. Qui c'è solo come si leggono:
// 1. ogni risposta dà punti a un asse (si sommano), fissa una scelta (l'ultima vince) o apre
//    un limite (prima il consulto);
// 2. il biotipo di un'area è il primo, per priorità, la cui regola vale; i tratti sono tutti
//    quelli che valgono; una regola è un elenco di gruppi in alternativa, ogni gruppo vale se
//    tutte le sue condizioni sono vere;
// 3. PRIMA I FILTRI, POI I PUNTI: in gravidanza solo i prodotti segnati sicuri; con la pelle
//    molto reattiva o un limite «solo delicati» solo quelli per pelli sensibili; poi la
//    compatibilità 0-100 (alta da 70, media da 50) decide il consigliato e l'alternativa che
//    costa meno.

import { TEST, BIOTIPI, type Area, type Biotipo, type Condizione, type Domanda, type Limite, type Passaggio, type Percorso, type Test, type Valore } from './dati';
import { PRODOTTI, rispetta, type Prodotto } from './catalogo';
import { simili, menoCaro, zonaDi, formaDi } from './simili';
import { BISOGNI } from './integratori';

// dove si mette un prodotto, per area del test (la zona la legge scripts/catalogo/traduci.py zona()): la crema per il
// pannolino finita tra i trattamenti per capelli, il contorno occhi con SPF tra i solari, il gel per le unghie tra le
// creme non vanno nella routine (Friday, 15/10). «viso e corpo» (i formati da 250 ml in su) resta nella pelle.
const ZONE: Partial<Record<Area, string[]>> = { pelle: ['viso', 'viso e corpo', 'barba'], cute: ['cute', 'capelli'] };

// I dati su cui gira il motore: quelli pubblicati, oppure (nell'admin) la bozza da provare.
let T: Test = TEST;
let BB: Biotipo[] = BIOTIPI;
export function usaDati(test: Test = TEST, biotipi: Biotipo[] = BIOTIPI) { T = test; BB = biotipi; }

export type Risposte = Record<string, string | string[]>;
export type Profilo = { punti: Record<string, number>; scelte: Record<string, Valore>; limiti: string[] };

const lista = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function profiloDi(risposte: Risposte, domande?: Domanda[]): Profilo {
  domande = domande || T.domande;
  const p: Profilo = { punti: {}, scelte: {}, limiti: [] };
  for (const d of domande) {
    for (const id of lista(risposte[d.id])) {
      const o = d.opzioni.find((x) => x.id === id);
      if (!o) continue;
      for (const [k, v] of Object.entries(o.punti || {})) p.punti[k] = (p.punti[k] || 0) + v;
      for (const [k, v] of Object.entries(o.scelte || {})) p.scelte[k] = v;
      if (o.limite && !p.limiti.includes(o.limite)) p.limiti.push(o.limite);
    }
  }
  return p;
}

export function vale(c: Condizione, p: Profilo, scelti: string[] = []): boolean {
  let ok = true;
  if (c.asse) {
    const v = p.punti[c.asse] || 0;
    ok = (c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max);
  } else if (c.scelta) {
    ok = p.scelte[c.scelta] !== undefined && (c.valori || []).includes(p.scelte[c.scelta]);
  } else if (c.limite) {
    ok = p.limiti.includes(c.limite);
  } else if (c.biotipo) {
    ok = c.biotipo.some((b) => scelti.includes(b));
  }
  return c.no ? !ok : ok;
}
const valgonoTutte = (cc: Condizione[] | undefined, p: Profilo, scelti: string[] = []) => (cc || []).every((c) => vale(c, p, scelti));
const regolaVale = (b: Biotipo, p: Profilo, scelti: string[]) => b.regole.some((g) => valgonoTutte(g, p, scelti));

// Le domande di un percorso, nell'ordine, senza quelle che non riguardano chi risponde
// (la barba solo agli uomini, la menopausa solo alle donne da 35 anni...). Le condizioni
// si leggono sulle risposte date fin lì.
export function domandeDi(percorso: Percorso, risposte: Risposte): Domanda[] {
  const tutte = percorso.domande.map((id) => T.domande.find((d) => d.id === id)).filter((d): d is Domanda => !!d);
  const out: Domanda[] = [];
  for (const d of tutte) {
    const prima = profiloDi(risposte, out);
    if (valgonoTutte(d.se, prima)) out.push(d);
  }
  return out;
}

export function biotipoDi(area: Area, p: Profilo): { biotipo: Biotipo | null; tratti: Biotipo[] } {
  const base = BB.filter((b) => b.area === area && b.tipo === 'biotipo').sort((a, b) => a.priorita - b.priorita);
  const biotipo = base.find((b) => regolaVale(b, p, [])) || null;
  const scelti = biotipo ? [biotipo.id] : [];
  const tratti = BB.filter((b) => b.area === area && b.tipo === 'tratto' && regolaVale(b, p, scelti));
  return { biotipo, tratti };
}

// Il massimo che un asse può raggiungere in un percorso: serve a disegnare le barre.
export function massimoAsse(asse: string, domande: Domanda[]): number {
  return domande.reduce((s, d) => {
    const valori = d.opzioni.map((o) => o.punti?.[asse] || 0);
    return s + (d.multipla ? valori.reduce((a, b) => a + Math.max(0, b), 0) : Math.max(0, ...valori));
  }, 0);
}

const AIUTA: Record<string, string> = {
  idratazione: 'idratare', 'acne-sebo': 'ridurre brufoli e sebo', 'pori-dilatati': 'affinare i pori',
  'macchie-luminosita': 'uniformare l\'incarnato', 'anti-age': 'trattare i segni del tempo',
  'rossori-sensibilita': 'calmare i rossori', 'barriera-cutanea': 'riparare la barriera cutanea', 'protezione-solare': 'proteggere dal sole',
  caduta: 'sostenere i capelli che cadono', forfora: 'togliere la forfora', 'secchi-crespi': 'nutrire le lunghezze', mantenimento: 'lavare senza stressare la cute',
};

const ATTIVI_CHIAVE = new Set(['retinale', 'retinolo', 'niacinamide', 'vitamina C', 'acido salicilico', 'acido glicolico', 'acido lattico', 'acido mandelico', 'acido azelaico', 'acido tranexamico', 'thiamidol', 'ceramidi', 'peptidi', 'acido ialuronico', 'centella', 'pantenolo', 'urea', 'zinco', 'PHA', 'LHA', 'arbutina', 'bakuchiol']);

const ATTIVI_PER: Record<string, string[]> = {
  'acne-sebo': ['niacinamide', 'acido salicilico', 'LHA', 'acido azelaico', 'zinco', 'retinale', 'retinolo'],
  'macchie-luminosita': ['vitamina C', 'acido tranexamico', 'arbutina', 'thiamidol', 'acido azelaico', 'niacinamide', 'acido glicolico'],
  'anti-age': ['retinolo', 'retinale', 'peptidi', 'vitamina C', 'bakuchiol'],
  idratazione: ['acido ialuronico', 'urea', 'ceramidi', 'pantenolo'],
  'rossori-sensibilita': ['centella', 'pantenolo', 'acido azelaico', 'niacinamide'],
  'barriera-cutanea': ['ceramidi', 'pantenolo', 'urea'],
  'pori-dilatati': ['niacinamide', 'acido salicilico'],
};

// gli attivi che contano negli integratori, per bisogno (Friday, 16/10: per la caduta il test proponeva un collagene
// mentre il profilo dice zinco e biotina)
const ATTIVI_INTEGRAZIONE: Record<string, string[]> = {
  caduta: ['biotina', 'zinco', 'pantenolo'],
  'anti-age': ['collagene', 'acido ialuronico', 'vitamina C', 'peptidi'],
  idratazione: ['acido ialuronico', 'ceramidi'],
  'acne-sebo': ['zinco', 'niacinamide'],
  'macchie-luminosita': ['vitamina C'],
  'protezione-solare': ['vitamina C'],
  // il giro integrativo (23/10/2026): gli attivi con l'indicazione autorizzata (src/lib/integratori.ts)
  sonno: ['melatonina'],
  energia: ['magnesio', 'vitamina B12', 'vitamina B6', 'vitamina C'],
  stress: ['magnesio', 'vitamina B6', 'vitamina B12'],
  difese: ['vitamina C', 'vitamina D', 'zinco', 'selenio'],
  'vitamina-d': ['vitamina D'],
  'omega-3': ['EPA', 'DHA'],
  b12: ['vitamina B12'],
};

// ⚠️ IL GIRO INTEGRATIVO (23/10/2026, Federico: «mancanza di sonno, vitamina C, cose per cui serve un giro
// integrativo»): ogni bisogno è un passaggio dell'area «integrazione» con il suo asse (sonno, energia, difese...).
// Si consigliano al massimo MASSIMO_INTEGRATORI prodotti, prima i bisogni con più punti: tre integratori sono già
// tanti, e chi ha tutto un po' non deve tornare a casa con sette barattoli.
const MASSIMO_INTEGRATORI = 3;
// i bisogni del giro: non valgono per il passaggio di pelle, capelli e unghie (una melatonina non è per la pelle)
const GIRO = new Set(['sonno', 'energia', 'stress', 'difese', 'vitamina-d', 'omega-3', 'b12']);
// La forza di un passaggio: i punti dell'asse delle sue condizioni; quello di pelle, capelli e unghie è una scelta
// esplicita di chi risponde e vale come un bisogno forte.
const forzaDi = (ps: Passaggio, p: Profilo) => {
  const assi = (ps.se || []).filter((c) => c.asse && !c.no).map((c) => p.punti[c.asse!] || 0);
  return assi.length ? Math.max(...assi) : 3;
};

export type Scelto = { prodotto: Prodotto; compat: number; livello: 'alta' | 'media'; perche: string[] };
export type PassaggioScelto = { passaggio: Passaggio; consigliato: Scelto; alternativa: (Scelto & { come: 'costa meno' | 'premium' }) | null };
export type RisultatoArea = { area: Area; biotipo: Biotipo | null; tratti: Biotipo[]; passaggi: PassaggioScelto[]; vuoti: Passaggio[] };
export type Risultato = { percorso: Percorso; profilo: Profilo; domande: Domanda[]; aree: RisultatoArea[]; limiti: Limite[] };

type Bisogni = { pelle: Set<string>; concerns: Set<string>; capelli: Set<string>; cute: Set<string> };
function bisogniDi(biotipo: Biotipo | null, tratti: Biotipo[], p: Profilo): Bisogni {
  const b: Bisogni = { pelle: new Set(), concerns: new Set(), capelli: new Set(), cute: new Set() };
  for (const x of [biotipo, ...tratti]) {
    if (!x) continue;
    for (const k of ['pelle', 'concerns', 'capelli', 'cute'] as const) for (const v of x.bisogni[k] || []) b[k].add(v);
  }
  if (typeof p.scelte.obiettivo === 'string') b.concerns.add(p.scelte.obiettivo);
  return b;
}

const linkPronto = (x: Prodotto) => (x.linkPending ? 0 : 4);

// «C'è qualcosa che preferisci evitare?» (16/10): fuori i prodotti che lo contengono, avanti quelli che di sicuro
// non lo contengono; di quelli che non conosciamo non si dice niente
const SENSIBILI = [['profumo', 'profumo'], ['alcol', 'alcol'], ['oli_essenziali', 'oli essenziali']] as const;
const evitaDi = (p: Profilo) => SENSIBILI.filter(([k]) => p.scelte[`evita_${k}`] === true).map(([k]) => k);

function compatibilita(x: Prodotto, area: Area, ps: Passaggio, b: Bisogni, p: Profilo, biotipo: Biotipo | null): number {
  let s = 0;
  const ob = typeof p.scelte.obiettivo === 'string' ? p.scelte.obiettivo : null;
  const re = p.punti.re || 0;
  if (ps.categoria === 'barba') {
    s = (x.beardConcerns || []).includes(p.scelte.barba as never) ? 70 : 40;
    return Math.min(100, s + linkPronto(x));
  }
  if (area === 'pelle') {
    const tipi = x.skinTypes || [];
    if (tipi.some((t) => b.pelle.has(t))) s += 30 + (biotipo?.bisogni.pelle?.[0] && tipi.includes(biotipo.bisogni.pelle[0] as never) ? 5 : 0);
    const c = x.concerns || [];
    if (ob && c.includes(ob as never)) s += 25 + (c[0] === ob ? 5 : 0);
    s += Math.min(16, c.filter((k) => k !== ob && b.concerns.has(k)).length * 8);
    if (['detergente', 'crema', 'spf'].includes(ps.id)) s += 10;
    // gli attivi giusti per l'obiettivo valgono più delle parole della descrizione
    const att = new Set((x.scheda?.attivi || []).map((a) => a.nome));
    if (ob && ATTIVI_PER[ob]) s += Math.min(16, ATTIVI_PER[ob].filter((a) => att.has(a)).length * 8);
    s += Math.min(8, [...b.concerns].filter((k) => k !== ob && ATTIVI_PER[k]?.some((a) => att.has(a))).length * 4);
    if (re >= 2 && x.sensitiveSafe) s += 6 + (tipi.includes('sensibile') ? 4 : 0);
    if (p.scelte.genere === 'uomo' && x.gender === 'uomo') s += 3;
    s += Math.min(20, evitaDi(p).filter((k) => x.scheda?.senza?.includes(k)).length * 10);
  } else if (area === 'cute') {
    const h = x.hairConcerns || [];
    if (h.some((k) => b.capelli.has(k))) s += 40 + (h[0] && b.capelli.has(h[0]) ? 5 : 0);
    else if (h.includes('mantenimento')) s += 20; // delicato, va bene a tutti
    else if (h.length) s -= 25; // un antiforfora a chi non ha forfora
    const t = x.scalpTypes || [];
    if (t.some((k) => b.cute.has(k))) s += 20;
    else if (t.some((k) => k !== 'sensibile')) s -= 10;
    if ((p.punti.sens || 0) >= 2 && t.includes('sensibile')) s += 10;
    if (ps.id === 'shampoo') s += 15;
    s += Math.min(20, evitaDi(p).filter((k) => x.scheda?.senza?.includes(k)).length * 10);
  } else {
    const c = x.concerns || [], h = x.hairConcerns || [];
    // un passaggio del giro integrativo cerca il suo bisogno (il prodotto ce l'ha: lo filtra «con_bisogno»)
    if (ps.con_bisogno) s += 60;
    else {
      if (c.some((k) => b.concerns.has(k) && !GIRO.has(k))) s += 45;
      if (h.some((k) => b.capelli.has(k))) s += 45;
    }
    const att = new Set((x.scheda?.attivi || []).map((a) => a.nome));
    const voluti = new Set((ps.con_bisogno ? [ps.con_bisogno] : [...b.capelli, ...b.concerns]).flatMap((k) => ATTIVI_INTEGRAZIONE[k] || []));
    s += Math.min(24, [...voluti].filter((a) => att.has(a)).length * 12);
    if (/\b50\+/.test(x.name) && p.scelte.menopausa !== true) s -= 25;
    s += 10;
  }
  return Math.max(0, Math.min(100, s + linkPronto(x)));
}

function percheDi(x: Prodotto, area: Area, b: Bisogni, p: Profilo, biotipo: Biotipo | null): string[] {
  const r: string[] = [];
  if (biotipo && area !== 'integrazione') r.push('adatto a: ' + biotipo.titolo.toLowerCase());
  // i bisogni del giro hanno già la loro indicazione autorizzata come primo «perché» (scegli)
  const aiuti = [...(x.concerns || []), ...(x.hairConcerns || [])].filter((k) => !GIRO.has(k) && (b.concerns.has(k) || b.capelli.has(k))).slice(0, 2);
  if (aiuti.length) r.push('aiuta a ' + aiuti.map((k) => AIUTA[k] || k).join(' e '));
  const att = (x.scheda?.attivi || []).filter((a) => ATTIVI_CHIAVE.has(a.nome)).slice(0, 2);
  if (att.length) r.push('con ' + att.map((a) => a.nome + (a.perc ? ` ${String(a.perc).replace('.', ',')}%` : '')).join(' e '));
  if ((p.punti.re || 0) >= 2 && x.sensitiveSafe) r.push('va bene anche per le pelli sensibili');
  const senza = SENSIBILI.filter(([k]) => x.scheda?.senza?.includes(k) && (evitaDi(p).includes(k) || (k === 'profumo' && (p.punti.re || 0) >= 2))).map(([, n]) => n);
  if (senza.length) r.push('senza ' + (senza.length > 1 ? `${senza.slice(0, -1).join(', ')} e ${senza[senza.length - 1]}` : senza[0]));
  if (x.scheda?.fotosensibilizzante) r.push('la mattina dopo, protezione solare');
  if (p.scelte.gravidanza === true && x.pregnancySafe) r.push('indicato anche in gravidanza e allattamento');
  return r;
}

function scegli(area: Area, ps: Passaggio, p: Profilo, b: Bisogni, biotipo: Biotipo | null, delicati: boolean, usati: Set<string>): PassaggioScelto | null {
  const genere = p.scelte.genere;
  const re = p.punti.re || 0;
  const pool = PRODOTTI.filter((x) => !usati.has(x.id) && rispetta(x, { categoria: ps.categoria, con_bisogno: ps.con_bisogno, senza_bisogno: ps.senza_bisogno }))
    .filter((x) => !zonaDi(x) || !ZONE[area] || ZONE[area]!.includes(zonaDi(x)!))
    // un detergente finito tra le creme o i trattamenti della sera non è una crema
    .filter((x) => !['creme', 'attivi'].includes(ps.categoria) || formaDi(x) !== 'detergente')
    .filter((x) => x.gender === 'unisex' || genere === 'altro' || genere === undefined || x.gender === genere)
    .filter((x) => p.scelte.gravidanza !== true || x.pregnancySafe === true)
    // chi mangia vegano o vegetariano: niente olio di pesce né perle di gelatina, solo quelli dichiarati (23/10/2026)
    .filter((x) => area !== 'integrazione' || !['vegana', 'vegetariana'].includes(String(p.scelte.dieta)) || x.scheda?.vegano === true)
    .filter((x) => !(delicati || (area === 'pelle' && re >= 3)) || x.sensitiveSafe === true)
    .filter((x) => !(area === 'pelle' && re >= 2) || x.sensitiveSafe !== false)
    // dalla scheda, come nel prototipo: i prodotti forti solo a chi usa già gli attivi; con un limite medico
    // solo i delicati; con la pelle molto reattiva niente profumo
    .filter((x) => !x.scheda || x.scheda.forza < 3 || Number(p.scelte.esperienza ?? 0) >= 2)
    .filter((x) => !x.scheda || !delicati || x.scheda.forza <= 1)
    .filter((x) => !x.scheda || !(area === 'pelle' && re >= 3) || x.scheda.profumo !== true)
    .filter((x) => area === 'integrazione' || !evitaDi(p).some((k) => x.scheda?.con?.includes(k) || (k === 'profumo' && x.scheda?.profumo === true)));
  const minimo = ps.minimo ?? 40;
  // l'ordine: la compatibilità, ma una scheda senza foto cede il posto a una quasi uguale che ce l'ha
  // (Friday, 15/10: tre riquadri vuoti su sei nel risultato)
  const ordine = (v: { x: Prodotto; c: number }) => v.c - (v.x.image ? 0 : 8);
  const voti = pool.map((x) => ({ x, c: compatibilita(x, area, ps, b, p, biotipo) }))
    .filter((v) => v.c >= minimo)
    .sort((u, v) => ordine(v) - ordine(u) || linkPronto(v.x) - linkPronto(u.x) || u.x.price - v.x.price);
  if (!voti.length) return null;
  let top = voti[0];
  const budget = p.scelte.budget;
  if (typeof budget === 'string' && budget !== 'nessuna') {
    const nella = voti.find((v) => v.x.tier === budget);
    if (nella && nella.c >= top.c - 10) top = nella;
  }
  const livello = (c: number): 'alta' | 'media' => (c >= 70 ? 'alta' : 'media');
  // nel giro integrativo il primo «perché» è l'indicazione autorizzata del bisogno, parola per parola (integratori.ts)
  const indicazione = area === 'integrazione' && ps.con_bisogno ? BISOGNI.find((x) => x.chiave === ps.con_bisogno)?.principale : undefined;
  const scelto = (v: { x: Prodotto; c: number }): Scelto => ({ prodotto: v.x, compat: v.c, livello: livello(v.c), perche: [...(indicazione ? [indicazione] : []), ...percheDi(v.x, area, b, p, biotipo)] });
  // l'alternativa: la più compatibile che costa almeno un quinto in meno; se il consigliato
  // è già il più economico, quella premium più compatibile
  // ⚠️ L'ALTERNATIVA FA LO STESSO LAVORO (Friday, 15/10: una crema per i brufoli proposta come
  // alternativa a una crema lenitiva su pelle secca): deve avere almeno un bisogno in comune con
  // quelli per cui il consigliato è stato scelto, e la stessa natura di prodotto (solare con solare).
  const lavoro = (x: Prodotto) => [...(x.concerns || []), ...(x.hairConcerns || [])].filter((k) => b.concerns.has(k) || b.capelli.has(k));
  const lavoroTop = lavoro(top.x);
  // e (Federico, 15/10) stessa zona, stessa forma, stesso attivo principale, formato vicino: lib/simili.ts.
  // Senza scheda non si sa se è simile: nessuna alternativa (meglio nessuna che una a caso).
  const stesso = (x: Prodotto) => (!lavoroTop.length || lavoro(x).some((k) => lavoroTop.includes(k))) && simili(top.x, x);
  const meno = voti.find((v) => v !== top && stesso(v.x) && menoCaro(v.x, top.x) && v.c >= Math.max(50, top.c - 15));
  const premium = !meno && budget !== 'base' ? voti.find((v) => v !== top && stesso(v.x) && v.x.tier === 'premium' && top.x.tier !== 'premium' && v.c >= Math.max(50, top.c - 10)) : undefined;
  const alt = meno || premium;
  usati.add(top.x.id);
  if (alt) usati.add(alt.x.id);
  return { passaggio: ps, consigliato: scelto(top), alternativa: alt ? { ...scelto(alt), come: meno ? 'costa meno' : 'premium' } : null };
}

export function consiglia(percorso: Percorso, risposte: Risposte): Risultato {
  const domande = domandeDi(percorso, risposte);
  const p = profiloDi(risposte, domande);
  const limiti = T.limiti.filter((l) => p.limiti.includes(l.id) && percorso.aree.includes(l.area));
  const usati = new Set<string>();
  const aree: RisultatoArea[] = percorso.aree.map((area) => {
    const { biotipo, tratti } = biotipoDi(area, p);
    const b = bisogniDi(biotipo, tratti, p);
    const delicati = limiti.some((l) => l.area === area && l.solo_delicati);
    const passaggi: PassaggioScelto[] = [];
    const vuoti: Passaggio[] = [];
    let da = T.passaggi.filter((x) => x.area === area && valgonoTutte(x.se, p));
    if (area === 'integrazione') da = da.map((ps, i) => ({ ps, i, f: forzaDi(ps, p) })).sort((u, v) => v.f - u.f || u.i - v.i).map((x) => x.ps);
    for (const ps of da) {
      // anche un bisogno senza prodotto conta: il consiglio si mostra lo stesso (la B12 per chi mangia vegano)
      if (area === 'integrazione' && passaggi.length + vuoti.length >= MASSIMO_INTEGRATORI) break;
      const s = scegli(area, ps, p, b, biotipo, delicati, usati);
      if (s) passaggi.push(s);
      else vuoti.push(ps);
    }
    return { area, biotipo, tratti, passaggi, vuoti };
  });
  return { percorso, profilo: p, domande, aree, limiti };
}
