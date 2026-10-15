'use client';

import { useMemo, useState } from 'react';
import { CATALOGO, CREDITI, FASCE, type Catalogo as Doc, type Modifica, type RegolaProdotti, type CategoriaCatalogo, type TagCatalogo } from '@/lib/dati';
import { PRODUCTS, type Product } from '@/lib/products';
import { rispetta, categoriaDi, applica, euro } from '@/lib/catalogo';
import { useDocumento, useApi, invia, BarraSalva, Campo, Testo, Scegli, Titolo, Vuoto, quando, nuovoId } from './base';

// IL CATALOGO (15/10/2026, rifatto con Federico la sera stessa):
// 1. in alto le categorie e i filtri, come carte affiancate: si modificano, si eliminano, si aggiungono;
// 2. i prodotti per marca (sono più di 900): si apre una marca e da lì si associano alle categorie,
//    uno per uno o insieme. La categoria scelta a mano vince sulla regola (modifiche → categoria);
// 3. le informazioni trovate da Zeno, da approvare.
// ⚠️ COME SI AGGIORNA. I prodotti arrivano dal feed di Liki24 (scripts/catalogo, ogni mattina) con nome,
// prezzo, foto, link e la scheda; le correzioni di qui valgono per id e restano anche quando il feed cambia.
const PELLE = ['secca', 'grassa', 'mista', 'normale', 'sensibile'];
const BISOGNI = ['idratazione', 'anti-age', 'acne-sebo', 'macchie-luminosita', 'rossori-sensibilita', 'barriera-cutanea', 'pori-dilatati', 'protezione-solare'];
const CAPELLI = ['caduta', 'forfora', 'secchi-crespi', 'mantenimento'];
const CUTE = ['grasso', 'secco', 'normale', 'sensibile'];
const TIPI_FEED = ['detergenti', 'sieri', 'creme', 'attivi', 'cerotti', 'shampoo', 'capelli', 'barba', 'integratori'];
// i campi che diventano correzioni del catalogo; gli altri (inci, profumo, texture, misura) li usa la
// pipeline delle schede al giro successivo (scripts/catalogo/schede.py --arricchisci)
const CAMPI_ARRICCHIBILI = ['skinTypes', 'concerns', 'hairConcerns', 'scalpTypes', 'pregnancySafe', 'sensitiveSafe', 'description', 'name', 'tier'];
type Arr = { id: number; prodotto: string; campo: string; valore: string; fonte: string; stato: string; chi: string; creato_il: string };

const DA_SISTEMARE: [string, string, (p: Product) => boolean][] = [
  ['senza-foto', 'Senza foto', (p) => !p.image],
  ['senza-tipi', 'Senza tipi di pelle', (p) => ['detergenti', 'sieri', 'creme', 'attivi'].includes(p.category) && !p.skinTypes?.length],
  ['gravidanza-ignota', 'Gravidanza da verificare', (p) => p.pregnancySafe === undefined],
  ['senza-inci', 'Senza INCI', (p) => !!p.scheda && !p.scheda.inci],
];

// La regola in parole, sulla carta
function regolaInParole(r: RegolaProdotti) {
  const p: string[] = [];
  if (r.categoria) p.push(`tipo «${r.categoria}»`);
  if (r.con_bisogno) p.push(`con «${r.con_bisogno}»`);
  if (r.senza_bisogno) p.push(`senza «${r.senza_bisogno}»`);
  if (r.segmento?.length) p.push(r.segmento.join(', '));
  if (r.categorie?.length) p.push(r.categorie.join(', '));
  if (r.fascia?.length) p.push(`fascia ${r.fascia.map((x) => FASCE[x] || x).join(', ')}`);
  if (r.marca?.length) p.push(`${r.marca.length} marche`);
  if (r.coreano !== undefined) p.push(r.coreano ? 'coreani' : 'non coreani');
  if (r.sensibili) p.push('adatti alle pelli sensibili');
  if (r.gravidanza) p.push('sicuri in gravidanza');
  if (r.genere?.length) p.push(r.genere.join(', '));
  return p.join(' · ') || 'nessuna regola: solo i prodotti messi a mano';
}

function EditorRegola({ r, cambia, categoria, categorie, marchePer, segmenti }: { r: RegolaProdotti; cambia: (r: RegolaProdotti) => void; categoria: boolean; categorie: CategoriaCatalogo[]; marchePer: (r: RegolaProdotti) => string[]; segmenti: string[] }) {
  const v = <K extends keyof RegolaProdotti>(k: K, x: RegolaProdotti[K]) => {
    const n = { ...r, [k]: x };
    if (x === undefined || (Array.isArray(x) && !x.length) || x === '') delete n[k];
    cambia(n);
  };
  if (categoria) return (
    <div className="adm-due">
      <Campo etichetta="Tipo di prodotto (dal feed)" aiuto="Chi ha questo tipo entra da solo; gli altri li associ a mano dalla marca."><select className="adm-input" value={r.categoria || ''} onChange={(e) => v('categoria', e.target.value || undefined)}><option value="">nessuno</option>{TIPI_FEED.map((x) => <option key={x}>{x}</option>)}</select></Campo>
      <Campo etichetta="Solo con / senza il bisogno"><div className="adm-due">
        <select className="adm-input" value={r.con_bisogno || ''} onChange={(e) => v('con_bisogno', e.target.value || undefined)}><option value="">con: qualsiasi</option>{BISOGNI.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="adm-input" value={r.senza_bisogno || ''} onChange={(e) => v('senza_bisogno', e.target.value || undefined)}><option value="">senza: nessuno</option>{BISOGNI.map((x) => <option key={x}>{x}</option>)}</select>
      </div></Campo>
    </div>
  );
  // le marche: solo quelle con prodotti che passano gli altri criteri, più quelle già scelte
  const adatte = marchePer({ ...r, marca: undefined });
  const marche = [...new Set([...(r.marca || []), ...adatte])].sort((a, b) => a.localeCompare(b, 'it'));
  const genere = r.genere?.length === 1 ? r.genere[0] : '';
  return (
    <div className="pila" style={{ ['--gap' as string]: '12px' }}>
      <Campo etichetta="Tipologia di prodotto" aiuto="Nessuna scelta = tutte."><Scegli valori={categorie.map((c) => c.id)} nomi={Object.fromEntries(categorie.map((c) => [c.id, c.nome]))} scelti={r.categorie} cambia={(x) => v('categorie', x)} /></Campo>
      <Campo etichetta="Famiglia della marca" aiuto="Come deciso nelle «Marche di Skinmatch». Nessuna scelta = tutte."><Scegli valori={segmenti} scelti={r.segmento} cambia={(x) => v('segmento', x)} /></Campo>
      <Campo etichetta="Fascia di prezzo" aiuto="Rispetto agli altri prodotti dello stesso tipo: economica è il terzo che costa meno, alta il 20% che costa di più, media il resto."><Scegli valori={['base', 'top', 'premium']} nomi={FASCE} scelti={r.fascia} cambia={(x) => v('fascia', x)} /></Campo>
      <div className="adm-due">
        <Campo etichetta="Per chi"><select className="adm-input" value={genere} onChange={(e) => v('genere', e.target.value ? [e.target.value] : undefined)}><option value="">tutti (anche unisex)</option><option value="uomo">solo per uomo</option><option value="donna">solo per donna</option></select></Campo>
        <Campo etichetta="Sicurezza"><div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!r.sensibili} onChange={(e) => v('sensibili', e.target.checked || undefined)} />solo adatti alle pelli sensibili</label>
          <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!r.gravidanza} onChange={(e) => v('gravidanza', e.target.checked || undefined)} />solo sicuri in gravidanza</label>
        </div></Campo>
      </div>
      <Campo etichetta={`Marche (${adatte.length} con questi criteri)`} aiuto="Nessuna scelta = tutte quelle qui sotto.">
        {marche.length ? <Scegli valori={marche} scelti={r.marca} cambia={(x) => v('marca', x)} /> : <span className="piccolo">Nessuna marca con questi criteri.</span>}
      </Campo>
    </div>
  );
}

type Gruppo = CategoriaCatalogo | TagCatalogo;
function Gruppi({ d, set, tipo, conta, marchePer, segmenti }: { d: Doc; set: (d: Doc) => void; tipo: 'categorie' | 'tag'; conta: (g: Gruppo) => number; marchePer: (r: RegolaProdotti) => string[]; segmenti: string[] }) {
  const [aperto, setAperto] = useState('');
  const [nuovo, setNuovo] = useState('');
  const lista = d[tipo] as Gruppo[];
  const online = new Set((CATALOGO[tipo] as Gruppo[]).map((x) => x.id));
  const metti = (l: Gruppo[]) => set({ ...d, [tipo]: l });
  const cambia = (i: number, g: Gruppo) => metti(lista.map((x, j) => (j === i ? g : x)));
  const sposta = (i: number, di: number) => { const l = [...lista]; const [x] = l.splice(i, 1); l.splice(i + di, 0, x); metti(l); };
  const elimina = (i: number) => {
    const g = lista[i], n = conta(g);
    const usato = Object.values(d.modifiche).filter((m) => m.categoria === g.id || m.tag_piu?.includes(g.id)).length;
    if (tipo === 'categorie' && n > 0) { alert(`«${g.nome}» ha ${n} prodotti: prima associali a un'altra categoria (dalla marca), poi la elimini. Così nessun prodotto resta senza pagina.`); return; }
    if (!confirm(`Elimino «${g.nome}»?${usato ? ` È scelta a mano su ${usato} prodotti.` : ''} La pagina /catalogo/${g.id} rinvierà al catalogo.`)) return;
    metti(lista.filter((_, j) => j !== i));
    if (usato) set({ ...d, [tipo]: lista.filter((_, j) => j !== i), modifiche: Object.fromEntries(Object.entries(d.modifiche).map(([id, m]) => [id, { ...m, categoria: m.categoria === g.id ? undefined : m.categoria, tag_piu: m.tag_piu?.filter((t) => t !== g.id), tag_meno: m.tag_meno?.filter((t) => t !== g.id) }])) });
  };
  const aggiungi = () => {
    const nome = nuovo.trim();
    if (!nome) return;
    const id = nuovoId(nome, [...d.categorie, ...d.tag].map((x) => x.id));
    const g = tipo === 'categorie' ? { id, nome, regola: {}, immagine: '', descrizione: '' } : { id, nome, regola: {}, descrizione: '' };
    metti([...lista, g as Gruppo]);
    setNuovo('');
    setAperto(id);
  };
  return (
    <div className="adm-scatole">
      {lista.map((g, i) => {
        const su = aperto === g.id;
        return (
          <article key={g.id} className={`carta adm-scatola${su ? ' aperta' : ''}`}>
            <div className="adm-scatola-testa">
              <b>{g.nome}</b>
              <span className="piccolo">{conta(g)} prodotti</span>
            </div>
            <span className="piccolo">/catalogo/{g.id}{online.has(g.id) ? '' : ' · nuova, non ancora online'}{(g as TagCatalogo).home ? ' · in homepage' : ''}</span>
            {!su && <span className="piccolo adm-regola">{regolaInParole(g.regola)}</span>}
            {su && (
              <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 6 }}>
                <div className="adm-due">
                  <Campo etichetta="Nome"><Testo valore={g.nome} cambia={(x) => cambia(i, { ...g, nome: x })} /></Campo>
                  <Campo etichetta="Indirizzo" aiuto={online.has(g.id) ? 'È online: per non rompere i link non si cambia.' : 'Si sceglie una volta, prima di pubblicare.'}>
                    <input className="adm-input" value={g.id} disabled={online.has(g.id)} onChange={(e) => cambia(i, { ...g, id: nuovoId(e.target.value, lista.filter((_, j) => j !== i).map((x) => x.id)) })} />
                  </Campo>
                </div>
                <Campo etichetta="Descrizione (anche nella pagina)"><Testo lungo valore={g.descrizione} cambia={(x) => cambia(i, { ...g, descrizione: x })} /></Campo>
                <div className="adm-due">
                  <Campo etichetta="Foto" aiuto={tipo === 'tag' ? 'Nella homepage e in cima alla pagina del filtro.' : 'In cima alla pagina della categoria.'}>
                    <select className="adm-input" value={g.immagine || ''} onChange={(e) => cambia(i, { ...g, immagine: e.target.value } as Gruppo)}><option value="">nessuna</option>{CREDITI.map((c) => c.nome).sort().map((n) => <option key={n}>{n}</option>)}</select>
                  </Campo>
                  {tipo === 'tag' && <Campo etichetta="Homepage" aiuto="Le famiglie «Per orientarsi» della home sono i filtri spuntati qui, nell'ordine delle carte."><label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', minHeight: 40 }}><input type="checkbox" checked={!!(g as TagCatalogo).home} onChange={(e) => cambia(i, { ...(g as TagCatalogo), home: e.target.checked || undefined })} />mostra in homepage</label></Campo>}
                </div>
                <Campo etichetta={tipo === 'tag' ? 'Quali prodotti ha' : 'Chi entra da solo'}><EditorRegola r={g.regola} cambia={(r) => cambia(i, { ...g, regola: r })} categoria={tipo === 'categorie'} categorie={d.categorie} marchePer={marchePer} segmenti={segmenti} /></Campo>
              </div>
            )}
            <div className="adm-scatola-azioni">
              <button type="button" className="chip" onClick={() => setAperto(su ? '' : g.id)}>{su ? 'Chiudi' : 'Modifica'}</button>
              <button type="button" className="chip" disabled={i === 0} onClick={() => sposta(i, -1)} aria-label="Sposta prima">◀</button>
              <button type="button" className="chip" disabled={i === lista.length - 1} onClick={() => sposta(i, 1)} aria-label="Sposta dopo">▶</button>
              <button type="button" className="chip" onClick={() => elimina(i)}>Elimina</button>
            </div>
          </article>
        );
      })}
      <article className="carta adm-scatola nuova">
        <b>{tipo === 'categorie' ? 'Nuova categoria' : 'Nuovo filtro'}</b>
        <input className="adm-input" placeholder={tipo === 'categorie' ? 'es. Contorno occhi' : 'es. Senza profumo'} value={nuovo} onChange={(e) => setNuovo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && aggiungi()} />
        <button type="button" className="chip" disabled={!nuovo.trim()} onClick={aggiungi}>Aggiungi</button>
      </article>
    </div>
  );
}

function EditorProdotto({ p, m, cambia }: { p: Product; m: Modifica; cambia: (m: Modifica | null) => void }) {
  const v = <K extends keyof Modifica>(k: K, x: Modifica[K]) => cambia({ ...m, [k]: x });
  const tri = (x: boolean | undefined) => (x === undefined ? '' : x ? 'si' : 'no');
  return (
    <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
      <div className="adm-due">
        <Campo etichetta="Nome sul sito" aiuto={`Dal feed: ${p.name}`}><Testo valore={m.name} placeholder={p.name} cambia={(x) => v('name', x || undefined)} /></Campo>
        <Campo etichetta="Fascia"><select className="adm-input" value={m.tier || ''} onChange={(e) => v('tier', (e.target.value || undefined) as Modifica['tier'])}><option value="">dalla scheda ({FASCE[p.tier]})</option><option value="base">economica</option><option value="top">media</option><option value="premium">alta</option></select></Campo>
      </div>
      <Campo etichetta="Descrizione" aiuto={`Dal feed: ${p.description}`}><Testo lungo valore={m.description} placeholder={p.description} cambia={(x) => v('description', x || undefined)} /></Campo>
      {['detergenti', 'sieri', 'creme', 'attivi', 'barba', 'integratori', 'cerotti'].includes(p.category) && (<>
        <Campo etichetta={`Tipi di pelle${m.skinTypes ? '' : ' (dal feed)'}`}><Scegli valori={PELLE} scelti={m.skinTypes || p.skinTypes} cambia={(x) => v('skinTypes', x)} /></Campo>
        <Campo etichetta={`Per cosa lavora${m.concerns ? '' : ' (dal feed)'}`}><Scegli valori={BISOGNI} scelti={m.concerns || p.concerns} cambia={(x) => v('concerns', x)} /></Campo>
      </>)}
      {['shampoo', 'capelli', 'integratori'].includes(p.category) && (<>
        <Campo etichetta={`Capelli${m.hairConcerns ? '' : ' (dal feed)'}`}><Scegli valori={CAPELLI} scelti={m.hairConcerns || p.hairConcerns} cambia={(x) => v('hairConcerns', x)} /></Campo>
        <Campo etichetta={`Cute${m.scalpTypes ? '' : ' (dal feed)'}`}><Scegli valori={CUTE} scelti={m.scalpTypes || p.scalpTypes} cambia={(x) => v('scalpTypes', x)} /></Campo>
      </>)}
      <div className="adm-due">
        <Campo etichetta="In gravidanza" aiuto={`Dalla scheda: ${tri(p.pregnancySafe) || 'non detto'}`}><select className="adm-input" value={tri(m.pregnancySafe)} onChange={(e) => v('pregnancySafe', e.target.value ? e.target.value === 'si' : undefined)}><option value="">dalla scheda</option><option value="si">sicuro</option><option value="no">da evitare</option></select></Campo>
        <Campo etichetta="Pelli sensibili" aiuto={`Dalla scheda: ${tri(p.sensitiveSafe) || 'non detto'}`}><select className="adm-input" value={tri(m.sensitiveSafe)} onChange={(e) => v('sensitiveSafe', e.target.value ? e.target.value === 'si' : undefined)}><option value="">dalla scheda</option><option value="si">adatto</option><option value="no">non adatto</option></select></Campo>
      </div>
      <Campo etichetta="Filtri in più / in meno"><div className="pila" style={{ ['--gap' as string]: '6px' }}>
        <Scegli valori={CATALOGO.tag.map((t) => t.id)} nomi={Object.fromEntries(CATALOGO.tag.map((t) => [t.id, `+ ${t.nome}`]))} scelti={m.tag_piu} cambia={(x) => v('tag_piu', x.length ? x : undefined)} />
        <Scegli valori={CATALOGO.tag.map((t) => t.id)} nomi={Object.fromEntries(CATALOGO.tag.map((t) => [t.id, `− ${t.nome}`]))} scelti={m.tag_meno} cambia={(x) => v('tag_meno', x.length ? x : undefined)} />
      </div></Campo>
      <Campo etichetta="Nota (per noi)"><Testo valore={m.nota} cambia={(x) => v('nota', x || undefined)} /></Campo>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button type="button" className="chip" onClick={() => cambia(null)}>Togli tutte le correzioni</button>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const doc = useDocumento<Doc>('catalogo', CATALOGO);
  const arr = useApi<{ arricchimenti: Arr[] }>('/api/admin/arricchimenti');
  const [q, setQ] = useState('');
  const [fil, setFil] = useState('');
  const [marca, setMarca] = useState('');
  const [scelti, setScelti] = useState<string[]>([]);
  const [verso, setVerso] = useState('');
  const [dettagli, setDettagli] = useState('');
  const d = doc.dati;
  const tutti = useMemo(() => PRODUCTS.filter((p) => p.affiliateUrl !== '#' && !p.isPlaceholder), []);
  // ogni prodotto con le correzioni di adesso (non salvate comprese) e la sua categoria
  const vivi = useMemo(() => (d ? tutti.map((p) => { const q2 = applica(p, d.modifiche[p.id]); return { p, q: q2, cat: categoriaDi(q2, d.categorie), m: d.modifiche[p.id] || {} }; }) : []), [d, tutti]);
  if (doc.errore) return <Vuoto>Non riesco a leggere il catalogo: {doc.errore}</Vuoto>;
  if (!d) return <Vuoto>Carico…</Vuoto>;

  const mettiM = (id: string, m: Modifica | null, base = d) => {
    const mm = { ...base.modifiche };
    if (m && Object.values(m).some((x) => x !== undefined)) mm[id] = Object.fromEntries(Object.entries(m).filter(([, x]) => x !== undefined)) as Modifica; else delete mm[id];
    return { ...base, modifiche: mm };
  };
  const associa = (ids: string[], cat: string) => {
    let n = d;
    ids.forEach((id) => { n = mettiM(id, { ...(n.modifiche[id] || {}), categoria: cat || undefined }, n); });
    doc.setDati(n);
  };
  const f = DA_SISTEMARE.find((x) => x[0] === fil);
  const w = q.trim().toLowerCase();
  const visibili = vivi.filter((x) => (!f || f[2](x.q)) && (!w || `${x.p.id} ${x.p.brand} ${x.q.name}`.toLowerCase().includes(w)));
  const perMarca: Record<string, typeof vivi> = {};
  visibili.forEach((x) => { (perMarca[x.p.brand] ||= []).push(x); });
  const marche = [...new Set(tutti.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'it'));
  const segmenti = [...new Set(tutti.map((p) => p.segment).filter(Boolean) as string[])].sort();
  const marchePer = (r: RegolaProdotti) => [...new Set(vivi.filter((x) => !x.m.nascosto && rispetta(x.q, r, d.categorie)).map((x) => x.p.brand))];
  const contaGruppo = (g: Gruppo) => ('immagine' in g ? vivi.filter((x) => x.cat?.id === g.id && !x.m.nascosto).length : vivi.filter((x) => !x.m.nascosto && ((rispetta(x.q, g.regola, d.categorie) && Object.keys(g.regola).length > 0) || x.m.tag_piu?.includes(g.id)) && !x.m.tag_meno?.includes(g.id)).length);
  const proposte = (arr.dati?.arricchimenti || []).filter((a) => a.stato === 'proposto');
  const approva = async (a: Arr, si: boolean) => {
    await invia('/api/admin/arricchimenti', { id: a.id, stato: si ? 'approvato' : 'scartato' });
    if (si && CAMPI_ARRICCHIBILI.includes(a.campo)) {
      let val: unknown = a.valore;
      try { val = JSON.parse(a.valore); } catch { /* testo */ }
      doc.setDati(mettiM(a.prodotto, { ...(d.modifiche[a.prodotto] || {}), [a.campo]: val, nota: `${d.modifiche[a.prodotto]?.nota ? d.modifiche[a.prodotto].nota + ' · ' : ''}${a.campo} da ${a.fonte}` }));
    }
    arr.ricarica();
  };
  const della = marca ? (perMarca[marca] || []) : [];

  return (
    <div className="pila" style={{ ['--gap' as string]: '28px' }}>
      <Titolo sotto="In alto categorie e filtri del sito; sotto i prodotti, divisi per marca: apri una marca e associa i suoi prodotti alle categorie. Le correzioni restano anche quando il feed si aggiorna. Alla fine: Salva e Pubblica.">Il catalogo</Titolo>
      <div className="adm-numeri">
        <div><span className="piccolo">Prodotti</span><b>{tutti.length}</b></div>
        <div><span className="piccolo">Marche</span><b>{marche.length}</b></div>
        <div><span className="piccolo">Categorie</span><b>{d.categorie.length}</b></div>
        <div><span className="piccolo">Filtri</span><b>{d.tag.length}</b></div>
        <div><span className="piccolo">Corretti a mano</span><b>{Object.keys(d.modifiche).length}</b></div>
        <div><span className="piccolo">Senza categoria</span><b>{vivi.filter((x) => !x.cat && !x.m.nascosto).length}</b></div>
      </div>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-3">Le categorie</h2>
        <p className="piccolo">Una per tipo di prodotto: ognuna è una pagina (/catalogo/sieri) e ogni prodotto sta in una sola. Chi entra da solo lo decide la regola; gli altri li associ dalla marca.</p>
        <Gruppi d={d} set={doc.setDati} tipo="categorie" conta={contaGruppo} marchePer={marchePer} segmenti={segmenti} />
      </section>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-3">I filtri</h2>
        <p className="piccolo">Le selezioni che attraversano le categorie (K-beauty, Da farmacia, Anche in gravidanza…): ognuno è una pagina e un bottone del catalogo. Un prodotto può averne tanti.</p>
        <Gruppi d={d} set={doc.setDati} tipo="tag" conta={contaGruppo} marchePer={marchePer} segmenti={segmenti} />
      </section>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-3">I prodotti, per marca</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input className="adm-input" style={{ maxWidth: 380 }} type="search" placeholder="Cerca una marca o un prodotto" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="riga-chip">{DA_SISTEMARE.map(([k, n, fn]) => <button key={k} type="button" className="chip" aria-pressed={fil === k} onClick={() => setFil(fil === k ? '' : k)}>{n} · {vivi.filter((x) => fn(x.q)).length}</button>)}</div>
        </div>
        {!marca ? (
          <div className="adm-scatole">
            {Object.entries(perMarca).sort((a, b) => a[0].localeCompare(b[0], 'it')).map(([m, xs]) => {
              const cats: Record<string, number> = {};
              xs.forEach((x) => { const k = x.cat?.nome || 'senza categoria'; cats[k] = (cats[k] || 0) + 1; });
              return (
                <button key={m} type="button" className="carta adm-scatola adm-marca" onClick={() => { setMarca(m); setScelti([]); setDettagli(''); }}>
                  <span className="adm-scatola-testa"><b>{m}</b><span className="piccolo">{xs.length}</span></span>
                  <span className="piccolo">{xs[0].p.segment || '—'}</span>
                  <span className="piccolo adm-regola">{Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}</span>
                  {xs.some((x) => Object.keys(x.m).length) && <span className="piccolo" style={{ color: 'var(--terra)', fontWeight: 700 }}>{xs.filter((x) => Object.keys(x.m).length).length} corretti a mano</span>}
                </button>
              );
            })}
            {!Object.keys(perMarca).length && <Vuoto>Nessuna marca con questi filtri.</Vuoto>}
          </div>
        ) : (
          <div className="pila" style={{ ['--gap' as string]: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="button" className="chip" onClick={() => setMarca('')}>← Tutte le marche</button>
              <b style={{ fontSize: 20 }}>{marca} <span className="piccolo">· {della.length} prodotti{della[0]?.p.segment ? ` · ${della[0].p.segment}` : ''}</span></b>
            </div>
            <div className="carta adm-insieme">
              <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={!!della.length && scelti.length === della.length} onChange={(e) => setScelti(e.target.checked ? della.map((x) => x.p.id) : [])} />tutti
              </label>
              <span className="piccolo">{scelti.length} scelti</span>
              <select className="adm-input" style={{ maxWidth: 260 }} value={verso} onChange={(e) => setVerso(e.target.value)}>
                <option value="">associa a…</option>
                <option value="*">la categoria automatica</option>
                {d.categorie.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <button type="button" className="chip" disabled={!scelti.length || !verso} onClick={() => { associa(scelti, verso === '*' ? '' : verso); setScelti([]); setVerso(''); }}>Associa</button>
            </div>
            {della.map(({ p, q: x, cat, m }) => {
              const auto = categoriaDi(applica(p, { ...m, categoria: undefined }), d.categorie);
              return (
                <div key={p.id} className="carta adm-riga-prodotto">
                  <input type="checkbox" aria-label={`Scegli ${x.name}`} checked={scelti.includes(p.id)} onChange={(e) => setScelti(e.target.checked ? [...scelti, p.id] : scelti.filter((y) => y !== p.id))} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image ? <img src={p.image} alt="" width={48} height={48} loading="lazy" /> : <span className="adm-senza-foto" />}
                  <span className="adm-riga-nome">
                    <b>{x.name}</b>
                    <span className="piccolo">{p.scheda?.passaggio || p.category} · {euro(p.price)}{p.scheda?.attivi.length ? ` · ${p.scheda.attivi.slice(0, 3).map((a) => a.nome).join(', ')}` : ''}{m.nascosto ? ' · nascosto' : ''}</span>
                  </span>
                  <select className="adm-input adm-riga-cat" value={m.categoria || ''} onChange={(e) => associa([p.id], e.target.value)} aria-label="Categoria">
                    <option value="">{auto ? `automatica: ${auto.nome}` : 'automatica: nessuna'}</option>
                    {d.categorie.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <span className="adm-riga-azioni">
                    {!cat && !m.nascosto && <span className="piccolo" style={{ color: 'var(--attenzione)', fontWeight: 700 }}>senza categoria</span>}
                    <label className="piccolo" style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><input type="checkbox" checked={!!m.nascosto} onChange={(e) => doc.setDati(mettiM(p.id, { ...m, nascosto: e.target.checked || undefined }))} />nascondi</label>
                    <button type="button" className="chip" onClick={() => setDettagli(dettagli === p.id ? '' : p.id)}>{dettagli === p.id ? 'Chiudi' : 'Dettagli'}</button>
                  </span>
                  {dettagli === p.id && <div className="adm-riga-dettagli"><EditorProdotto p={p} m={m} cambia={(z) => doc.setDati(mettiM(p.id, z))} /></div>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="pila" style={{ ['--gap' as string]: '8px' }}>
        <h2 className="titolo-3">Informazioni da approvare ({proposte.length})</h2>
        {!proposte.length ? <Vuoto>Nessuna proposta di arricchimento in attesa.</Vuoto> : proposte.map((a) => {
          const p = PRODUCTS.find((x) => x.id === a.prodotto);
          return (
            <div key={a.id} className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <span style={{ flex: '1 1 260px' }}><b>{p ? `${p.brand} · ${p.name}` : a.prodotto}</b><br /><span className="piccolo">{a.campo} = {a.valore} · fonte: {a.fonte ? <a className="link" href={a.fonte} target="_blank" rel="noopener">{a.fonte.slice(0, 60)}</a> : '—'} · {a.chi} · {quando(a.creato_il)}</span></span>
              <button type="button" className="chip" onClick={() => approva(a, true)}>Approva</button>
              <button type="button" className="chip" onClick={() => approva(a, false)}>Scarta</button>
            </div>
          );
        })}
      </section>

      <details className="carta">
        <summary><b>Come si aggiorna il catalogo</b></summary>
        <ol className="pila piccolo" style={{ ['--gap' as string]: '6px', paddingLeft: 20, listStyle: 'decimal', marginTop: 10, fontSize: 14.5 }}>
          <li><b>I feed dei negozi</b>: nome, prezzo, foto, disponibilità e link di affiliazione. Oggi Liki24 su Adtraction, tradotto in schede da scripts/catalogo (ogni mattina); gli altri negozi approvati entrano uno alla volta. I prezzi e i link si rinnovano a ogni giro.</li>
          <li><b>Le correzioni di qui</b>: categoria, tipi di pelle, bisogni, gravidanza, pelli sensibili, fascia, filtri, nascondi. Valgono per id, sopra al feed.</li>
          <li><b>Le informazioni esterne</b>: Zeno cerca schede dei produttori e INCI e propone i dati con la fonte. Approvati, diventano correzioni: poi Salva e Pubblica.</li>
          <li><b>I guardiani</b>, a ogni pubblicazione: fermano se un prodotto resta senza pagina o due hanno lo stesso indirizzo; segnalano prodotti senza foto e categorie vuote.</li>
        </ol>
      </details>
      <BarraSalva doc={doc} cosa="catalogo" />
    </div>
  );
}
