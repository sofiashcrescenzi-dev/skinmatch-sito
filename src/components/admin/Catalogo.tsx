'use client';

import { useMemo, useState } from 'react';
import { CATALOGO, type Catalogo as Doc, type Modifica } from '@/lib/dati';
import { PRODUCTS, type Product } from '@/lib/products';
import { rispetta, euro } from '@/lib/catalogo';
import { useDocumento, useApi, invia, BarraSalva, Campo, Testo, Scegli, Titolo, Vuoto, quando } from './base';

// IL CATALOGO (15/10/2026): le caratteristiche di ogni prodotto, le categorie, i filtri, e il
// sistema che lo tiene aggiornato.
// ⚠️ COME SI AGGIORNA. I prodotti arrivano dai feed dei merchant (scripts/feeds: CJ per Notino e
// Marionnaud; Adtraction e Awin quando approvano Skinmatch) con nome, prezzo, foto e link. Sopra
// ci sono le correzioni fatte qui, per id, che sopravvivono al prossimo giro dei feed. Le
// informazioni esterne (schede dei produttori, INCI) le cerca Zeno e arrivano come proposte con
// la fonte: approvate, diventano correzioni.
const PELLE = ['secca', 'grassa', 'mista', 'normale', 'sensibile'];
const BISOGNI = ['idratazione', 'anti-age', 'acne-sebo', 'macchie-luminosita', 'rossori-sensibilita', 'barriera-cutanea', 'pori-dilatati', 'protezione-solare'];
const CAPELLI = ['caduta', 'forfora', 'secchi-crespi', 'mantenimento'];
const CUTE = ['grasso', 'secco', 'normale', 'sensibile'];
const CAMPI_ARRICCHIBILI = ['skinTypes', 'concerns', 'hairConcerns', 'scalpTypes', 'pregnancySafe', 'sensitiveSafe', 'description', 'name', 'tier'];
type Arr = { id: number; prodotto: string; campo: string; valore: string; fonte: string; stato: string; chi: string; creato_il: string };

const DA_SISTEMARE: [string, string, (p: Product) => boolean][] = [
  ['senza-foto', 'Senza foto', (p) => !p.image],
  ['link-attesa', 'Link in attesa del merchant', (p) => !!p.linkPending],
  ['senza-tipi', 'Senza tipi di pelle', (p) => ['detergenti', 'sieri', 'creme', 'attivi'].includes(p.category) && !p.skinTypes?.length],
  ['gravidanza-ignota', 'Gravidanza da verificare', (p) => p.pregnancySafe === undefined],
];

function EditorProdotto({ p, m, cambia }: { p: Product; m: Modifica; cambia: (m: Modifica | null) => void }) {
  const v = <K extends keyof Modifica>(k: K, x: Modifica[K]) => cambia({ ...m, [k]: x });
  const tri = (x: boolean | undefined) => (x === undefined ? '' : x ? 'si' : 'no');
  return (
    <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
      <div className="adm-due">
        <Campo etichetta="Nome sul sito" aiuto={`Dal feed: ${p.name}`}><Testo valore={m.name} placeholder={p.name} cambia={(x) => v('name', x || undefined)} /></Campo>
        <Campo etichetta="Fascia"><select className="adm-input" value={m.tier || ''} onChange={(e) => v('tier', (e.target.value || undefined) as Modifica['tier'])}><option value="">dal feed ({p.tier})</option><option value="base">base</option><option value="top">top</option><option value="premium">premium</option></select></Campo>
      </div>
      <Campo etichetta="Descrizione" aiuto={`Dal feed: ${p.description}`}><Testo lungo valore={m.description} placeholder={p.description} cambia={(x) => v('description', x || undefined)} /></Campo>
      {['detergenti', 'sieri', 'creme', 'attivi', 'barba', 'integratori'].includes(p.category) && (<>
        <Campo etichetta={`Tipi di pelle${m.skinTypes ? '' : ' (dal feed)'}`}><Scegli valori={PELLE} scelti={m.skinTypes || p.skinTypes} cambia={(x) => v('skinTypes', x)} /></Campo>
        <Campo etichetta={`Per cosa lavora${m.concerns ? '' : ' (dal feed)'}`}><Scegli valori={BISOGNI} scelti={m.concerns || p.concerns} cambia={(x) => v('concerns', x)} /></Campo>
      </>)}
      {['shampoo', 'capelli', 'integratori'].includes(p.category) && (<>
        <Campo etichetta={`Capelli${m.hairConcerns ? '' : ' (dal feed)'}`}><Scegli valori={CAPELLI} scelti={m.hairConcerns || p.hairConcerns} cambia={(x) => v('hairConcerns', x)} /></Campo>
        <Campo etichetta={`Cute${m.scalpTypes ? '' : ' (dal feed)'}`}><Scegli valori={CUTE} scelti={m.scalpTypes || p.scalpTypes} cambia={(x) => v('scalpTypes', x)} /></Campo>
      </>)}
      <div className="adm-due">
        <Campo etichetta="In gravidanza" aiuto={`Dal feed: ${tri(p.pregnancySafe) || 'non detto'}`}><select className="adm-input" value={tri(m.pregnancySafe)} onChange={(e) => v('pregnancySafe', e.target.value ? e.target.value === 'si' : undefined)}><option value="">dal feed</option><option value="si">sicuro</option><option value="no">da evitare</option></select></Campo>
        <Campo etichetta="Pelli sensibili" aiuto={`Dal feed: ${tri(p.sensitiveSafe) || 'non detto'}`}><select className="adm-input" value={tri(m.sensitiveSafe)} onChange={(e) => v('sensitiveSafe', e.target.value ? e.target.value === 'si' : undefined)}><option value="">dal feed</option><option value="si">adatto</option><option value="no">non adatto</option></select></Campo>
      </div>
      <Campo etichetta="Filtri in più / in meno"><div className="pila" style={{ ['--gap' as string]: '6px' }}>
        <Scegli valori={CATALOGO.tag.map((t) => t.id)} nomi={Object.fromEntries(CATALOGO.tag.map((t) => [t.id, `+ ${t.nome}`]))} scelti={m.tag_piu} cambia={(x) => v('tag_piu', x.length ? x : undefined)} />
        <Scegli valori={CATALOGO.tag.map((t) => t.id)} nomi={Object.fromEntries(CATALOGO.tag.map((t) => [t.id, `− ${t.nome}`]))} scelti={m.tag_meno} cambia={(x) => v('tag_meno', x.length ? x : undefined)} />
      </div></Campo>
      <Campo etichetta="Nota (per noi)"><Testo valore={m.nota} cambia={(x) => v('nota', x || undefined)} /></Campo>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!m.nascosto} onChange={(e) => v('nascosto', e.target.checked || undefined)} />nascondi dal sito</label>
        <button type="button" className="chip" onClick={() => cambia(null)}>Togli tutte le correzioni</button>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const doc = useDocumento<Doc>('catalogo', CATALOGO);
  const arr = useApi<{ arricchimenti: Arr[] }>('/api/admin/arricchimenti');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [fil, setFil] = useState('');
  const [quanti, setQuanti] = useState(40);
  const d = doc.dati;
  const lista = useMemo(() => {
    if (!d) return [];
    const w = q.trim().toLowerCase();
    const c = d.categorie.find((x) => x.id === cat);
    const f = DA_SISTEMARE.find((x) => x[0] === fil);
    return PRODUCTS.filter((p) => p.affiliateUrl !== '#' && !p.isPlaceholder)
      .filter((p) => !c || rispetta(p, c.regola)).filter((p) => !f || f[2](p))
      .filter((p) => !w || `${p.id} ${p.brand} ${p.name}`.toLowerCase().includes(w));
  }, [d, q, cat, fil]);
  if (doc.errore) return <Vuoto>Non riesco a leggere il catalogo: {doc.errore}</Vuoto>;
  if (!d) return <Vuoto>Carico…</Vuoto>;
  const mettiM = (id: string, m: Modifica | null) => {
    const mm = { ...d.modifiche };
    if (m && Object.values(m).some((x) => x !== undefined)) mm[id] = Object.fromEntries(Object.entries(m).filter(([, x]) => x !== undefined)) as Modifica; else delete mm[id];
    doc.setDati({ ...d, modifiche: mm });
  };
  const negozi: Record<string, number> = {};
  PRODUCTS.forEach((p) => (negozi[p.merchant || (p.affiliateUrl.includes('amazon.') ? 'Amazon' : 'altro')] = (negozi[p.merchant || (p.affiliateUrl.includes('amazon.') ? 'Amazon' : 'altro')] || 0) + 1));
  const proposte = (arr.dati?.arricchimenti || []).filter((a) => a.stato === 'proposto');
  const approva = async (a: Arr, si: boolean) => {
    await invia('/api/admin/arricchimenti', { id: a.id, stato: si ? 'approvato' : 'scartato' });
    if (si && CAMPI_ARRICCHIBILI.includes(a.campo)) {
      let val: unknown = a.valore;
      try { val = JSON.parse(a.valore); } catch { /* testo */ }
      mettiM(a.prodotto, { ...(d.modifiche[a.prodotto] || {}), [a.campo]: val, nota: `${d.modifiche[a.prodotto]?.nota ? d.modifiche[a.prodotto].nota + ' · ' : ''}${a.campo} da ${a.fonte}` });
    }
    arr.ricarica();
  };
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="I prodotti arrivano dai feed dei merchant con nome, prezzo, foto e link; qui si correggono le caratteristiche che decidono a chi vengono consigliati. Le correzioni restano anche quando il feed si aggiorna.">Il catalogo</Titolo>
      <div className="adm-numeri">
        <div><span className="piccolo">Prodotti</span><b>{PRODUCTS.length}</b></div>
        {Object.entries(negozi).sort((a, b) => b[1] - a[1]).map(([k, n]) => <div key={k}><span className="piccolo">{k}</span><b>{n}</b></div>)}
        <div><span className="piccolo">Corretti a mano</span><b>{Object.keys(d.modifiche).length}</b></div>
      </div>
      <details className="carta">
        <summary><b>Come si aggiorna il catalogo</b></summary>
        <ol className="pila piccolo" style={{ ['--gap' as string]: '6px', paddingLeft: 20, listStyle: 'decimal', marginTop: 10, fontSize: 14.5 }}>
          <li><b>I feed dei merchant</b>: nome, prezzo, foto, disponibilità e link di affiliazione. Oggi CJ (Notino, Marionnaud) e i link Amazon; Adtraction e Awin entrano appena approvano Skinmatch. I prezzi si rinnovano a ogni giro dei feed.</li>
          <li><b>Le correzioni di qui</b>: tipi di pelle, bisogni, gravidanza, pelli sensibili, fascia, filtri, nascondi. Valgono per id, sopra al feed.</li>
          <li><b>Le informazioni esterne</b>: Zeno cerca schede dei produttori e INCI e propone i dati con la fonte (qui sotto). Approvati, diventano correzioni: poi Salva e Pubblica.</li>
          <li><b>I guardiani</b>, a ogni pubblicazione: segnalano prodotti senza foto, correzioni su prodotti spariti, categorie vuote.</li>
        </ol>
      </details>
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
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">I prodotti</h2>
        <input className="adm-input" style={{ maxWidth: 420 }} type="search" placeholder="Cerca per marca, nome o id" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="riga-chip"><button type="button" className="chip" aria-pressed={!cat} onClick={() => setCat('')}>Tutte</button>{d.categorie.map((c) => <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? '' : c.id)}>{c.nome}</button>)}</div>
        <div className="riga-chip">{DA_SISTEMARE.map(([k, n, f]) => <button key={k} type="button" className="chip" aria-pressed={fil === k} onClick={() => setFil(fil === k ? '' : k)}>{n} · {PRODUCTS.filter(f).length}</button>)}</div>
        <span className="piccolo">{lista.length} prodotti</span>
        {lista.slice(0, quanti).map((p) => {
          const m = d.modifiche[p.id] || {};
          return (
            <details key={p.id} className="carta">
              <summary style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <span><b>{p.brand}</b> · {m.name || p.name} <span className="piccolo">· {p.category} · {euro(p.price)} · {p.merchant || 'Amazon'}{p.linkPending ? ' · link in attesa' : ''}</span></span>
                <span className="piccolo">{m.nascosto ? 'nascosto' : Object.keys(m).length ? 'corretto' : ''}</span>
              </summary>
              <EditorProdotto p={p} m={m} cambia={(x) => mettiM(p.id, x)} />
            </details>
          );
        })}
        {lista.length > quanti && <button type="button" className="bottone secondario" style={{ justifySelf: 'center' }} onClick={() => setQuanti(quanti + 40)}>Mostra altri</button>}
      </section>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Categorie e filtri</h2>
        {[...d.categorie.map((c, i) => ({ c, i, t: 'categorie' as const })), ...d.tag.map((c, i) => ({ c, i, t: 'tag' as const }))].map(({ c, i, t }) => (
          <details key={`${t}-${c.id}`} className="carta">
            <summary><b>{c.nome}</b> <span className="piccolo">· {t === 'tag' ? 'filtro' : 'categoria'} · /catalogo/{c.id}</span></summary>
            <div className="pila" style={{ ['--gap' as string]: '8px', marginTop: 10 }}>
              <Campo etichetta="Nome"><Testo valore={c.nome} cambia={(v) => doc.setDati({ ...d, [t]: (d[t] as typeof c[]).map((x, j) => (j === i ? { ...c, nome: v } : x)) })} /></Campo>
              <Campo etichetta="Descrizione (anche nella pagina)"><Testo lungo valore={c.descrizione} cambia={(v) => doc.setDati({ ...d, [t]: (d[t] as typeof c[]).map((x, j) => (j === i ? { ...c, descrizione: v } : x)) })} /></Campo>
              {c.regola.marca && <Campo etichetta="Marche" aiuto="Separate da virgola"><Testo valore={c.regola.marca.join(', ')} cambia={(v) => doc.setDati({ ...d, [t]: (d[t] as typeof c[]).map((x, j) => (j === i ? { ...c, regola: { ...c.regola, marca: v.split(',').map((y) => y.trim()).filter(Boolean) } } : x)) })} /></Campo>}
            </div>
          </details>
        ))}
      </section>
      <BarraSalva doc={doc} cosa="catalogo" />
    </div>
  );
}
