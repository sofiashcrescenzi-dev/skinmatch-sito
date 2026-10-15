// I GUARDIANI DI SKINMATCH: i controlli che non costano niente e girano prima di ogni build.
//
// ⚠️ PERCHE ESISTONO. I dati del test, dei biotipi, del glossario e del catalogo si cambiano
// dall'admin: un errore di battitura (un asse che non c'è, un biotipo senza regola di riserva,
// una persona tipo che cambia biotipo) non deve arrivare online. BLOCCA ferma la build;
// AVVISA lo scrive e basta. Le persone tipo sono le prove della tappa 1: Sofia dice quale
// biotipo deve uscire, qui si controlla che esca ancora, a ogni modifica.
//
// Uso: npx tsx scripts/guardiani.ts  (gira da solo prima di `next build`, vedi package.json)

import { TEST, BIOTIPI, TAG_BIOTIPI, TERMINI, CATALOGO, ARTICOLI, type Condizione } from '../src/lib/dati';
import { PRODOTTI, prodottoPerId, indirizzo } from '../src/lib/catalogo';
import { consiglia, profiloDi } from '../src/lib/motore';
import { PRODUCTS } from '../src/lib/products';

let fermo = false;
const regola = (nome: string, casi: string[], livello: 'BLOCCA' | 'AVVISA') => {
  if (!casi.length) return console.log(`  ✓ ${nome}`);
  console.log(`  ${livello === 'BLOCCA' ? '✗' : '!'} ${livello}  ${nome}: ${casi.length}, es. ${casi.slice(0, 4).join('; ')}`);
  if (livello === 'BLOCCA') fermo = true;
};
const doppi = (ids: string[]) => ids.filter((x, i) => ids.indexOf(x) !== i);

const ASSI = new Set(TEST.assi.map((a) => a.id));
const SCELTE = new Set(TEST.scelte.map((s) => s.id));
const LIMITI = new Set(TEST.limiti.map((l) => l.id));
const DOMANDE = new Set(TEST.domande.map((d) => d.id));
const IDS_BIOTIPI = new Set(BIOTIPI.map((b) => b.id));
const condRotta = (c: Condizione) =>
  (c.asse && !ASSI.has(c.asse)) || (c.scelta && !SCELTE.has(c.scelta)) || (c.limite && !LIMITI.has(c.limite)) ||
  (c.biotipo && c.biotipo.some((b) => !IDS_BIOTIPI.has(b)));

console.log('Il test');
regola('identificativi doppi', [...doppi(TEST.domande.map((d) => d.id)), ...doppi(TEST.percorsi.map((p) => p.id)), ...doppi(TEST.limiti.map((l) => l.id))], 'BLOCCA');
regola('percorsi con domande che non esistono', TEST.percorsi.flatMap((p) => p.domande.filter((d) => !DOMANDE.has(d)).map((d) => `${p.id}: ${d}`)), 'BLOCCA');
regola('risposte con assi, scelte o limiti che non esistono', TEST.domande.flatMap((d) => d.opzioni.flatMap((o) => [
  ...Object.keys(o.punti || {}).filter((k) => !ASSI.has(k)), ...Object.keys(o.scelte || {}).filter((k) => !SCELTE.has(k)),
  ...(o.limite && !LIMITI.has(o.limite) ? [o.limite] : []),
].map((k) => `${d.id}/${o.id}: ${k}`))), 'BLOCCA');
regola('domande con meno di due risposte', TEST.domande.filter((d) => d.opzioni.length < 2).map((d) => d.id), 'BLOCCA');
regola('risposte doppie nella stessa domanda', TEST.domande.flatMap((d) => doppi(d.opzioni.map((o) => o.id)).map((o) => `${d.id}/${o}`)), 'BLOCCA');
regola('condizioni rotte (domande e passaggi)', [...TEST.domande, ...TEST.passaggi].flatMap((x) => (x.se || []).filter(condRotta).map(() => x.id)), 'BLOCCA');
regola('domande che nessun percorso usa', TEST.domande.filter((d) => !TEST.percorsi.some((p) => p.domande.includes(d.id))).map((d) => d.id), 'AVVISA');

console.log('I biotipi');
regola('identificativi doppi', doppi(BIOTIPI.map((b) => b.id)), 'BLOCCA');
regola('regole rotte', BIOTIPI.flatMap((b) => b.regole.flat().filter(condRotta).map(() => b.id)), 'BLOCCA');
regola('aree senza un biotipo di riserva (regola vuota)', (['pelle', 'cute', 'integrazione'] as const).filter((a) => !BIOTIPI.some((b) => b.area === a && b.tipo === 'biotipo' && b.regole.some((g) => g.length === 0))), 'BLOCCA');
regola('tag che non esistono', BIOTIPI.flatMap((b) => b.tag.filter((t) => !TAG_BIOTIPI.some((x) => x.id === t)).map((t) => `${b.id}: ${t}`)), 'BLOCCA');
regola('biotipi senza titolo, motto o descrizione', BIOTIPI.filter((b) => !b.titolo || !b.motto || !b.descrizione).map((b) => b.id), 'BLOCCA');

console.log('Il glossario');
regola('identificativi doppi', doppi(TERMINI.map((t) => t.id)), 'BLOCCA');
regola('parole usate da due termini', doppi(TERMINI.flatMap((t) => [...new Set([t.nome, ...t.parole].map((p) => p.toLowerCase()))])), 'AVVISA');
regola('termini senza testo', TERMINI.filter((t) => !t.testo || t.testo.length < 40).map((t) => t.id), 'BLOCCA');

console.log('Il catalogo');
const slug = [...CATALOGO.categorie.map((c) => c.id), ...CATALOGO.tag.map((t) => t.id)];
regola('categorie e filtri con lo stesso indirizzo', doppi(slug), 'BLOCCA');
regola('correzioni su prodotti che non ci sono più', Object.keys(CATALOGO.modifiche).filter((id) => !PRODUCTS.some((p) => p.id === id)), 'AVVISA');
regola('categorie vuote', CATALOGO.categorie.filter((c) => !PRODOTTI.some((p) => p.category === c.regola.categoria)).map((c) => c.id), 'AVVISA');
regola('prodotti senza immagine', PRODOTTI.filter((p) => !p.image).map((p) => p.id), 'AVVISA');
// le pagine prodotto: ognuno ha il suo indirizzo, e due prodotti non hanno mai lo stesso
regola('prodotti senza pagina (manca l\'indirizzo o la categoria)', PRODOTTI.filter((p) => !indirizzo(p)).map((p) => p.id), 'BLOCCA');
regola('due prodotti con lo stesso indirizzo', Object.entries(PRODOTTI.reduce((m, p) => { const u = indirizzo(p); if (u) m[u] = (m[u] || 0) + 1; return m; }, {} as Record<string, number>)).filter(([, n]) => n > 1).map(([u]) => u), 'BLOCCA');

console.log('La rivista');
regola('articoli con indirizzi doppi', doppi(ARTICOLI.map((a) => a.slug)), 'BLOCCA');
regola('articoli che citano prodotti che non ci sono', ARTICOLI.flatMap((a) => (a.prodotti || []).filter((id) => !prodottoPerId(id)).map((id) => `${a.slug}: ${id}`)), 'AVVISA');

console.log('Le persone tipo');
const sbagliate: string[] = [];
const pericoli: string[] = [];
for (const per of TEST.persone) {
  const percorso = TEST.percorsi.find((p) => p.id === per.percorso);
  if (!percorso) { sbagliate.push(`${per.nome}: percorso ${per.percorso}`); continue; }
  const r = consiglia(percorso, per.risposte);
  for (const area of ['pelle', 'cute', 'integrazione'] as const) {
    const atteso = per.atteso[area];
    const a = r.aree.find((x) => x.area === area);
    if (atteso && a?.biotipo?.id !== atteso) sbagliate.push(`${per.nome}: ${area} ${a?.biotipo?.id} invece di ${atteso}`);
  }
  const tratti = r.aree.flatMap((a) => a.tratti.map((t) => t.id));
  for (const t of per.atteso.tratti || []) if (!tratti.includes(t)) sbagliate.push(`${per.nome}: manca il tratto ${t}`);
  if (per.atteso.consulto !== undefined && per.atteso.consulto !== r.limiti.length > 0) sbagliate.push(`${per.nome}: consulto ${r.limiti.length > 0}`);
  // la sicurezza: in gravidanza solo prodotti segnati sicuri; con un limite «solo delicati» solo prodotti per pelli sensibili
  const p = profiloDi(per.risposte);
  for (const a of r.aree) for (const ps of a.passaggi) for (const s of [ps.consigliato, ps.alternativa].filter(Boolean)) {
    if (p.scelte.gravidanza === true && s!.prodotto.pregnancySafe !== true) pericoli.push(`${per.nome}: ${s!.prodotto.id} in gravidanza`);
    if (r.limiti.some((l) => l.area === a.area && l.solo_delicati) && s!.prodotto.sensitiveSafe !== true) pericoli.push(`${per.nome}: ${s!.prodotto.id} non delicato`);
  }
}
regola('persone tipo con un risultato diverso da quello atteso', sbagliate, 'BLOCCA');
regola('prodotti non sicuri consigliati', pericoli, 'BLOCCA');

// ogni percorso deve dare almeno un prodotto per area, rispondendo sempre la prima risposta
const vuoti: string[] = [];
for (const per of TEST.percorsi) {
  const risposte = Object.fromEntries(TEST.domande.map((d) => [d.id, d.multipla ? [d.opzioni[0].id] : d.opzioni[0].id]));
  const r = consiglia(per, risposte);
  for (const a of r.aree) if (!a.passaggi.length && !(a.area === 'integrazione')) vuoti.push(`${per.id}/${a.area}`);
}
regola('percorsi che non consigliano niente', vuoti, 'AVVISA');

if (fermo) {
  console.log('::error::I guardiani hanno fermato la build: correggi i dati dall\'admin e ripubblica.');
  process.exit(1);
}
