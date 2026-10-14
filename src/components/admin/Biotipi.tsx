'use client';

import { useState } from 'react';
import { BIOTIPI, TAG_BIOTIPI, TEST, CREDITI, NOMI_AREA, type Area, type Biotipo, type TagBiotipo } from '@/lib/dati';
import { useDocumento, BarraSalva, Campo, Testo, Righe, Scegli, Titolo, Vuoto, nuovoId } from './base';
import Condizioni from './Condizioni';

// I BIOTIPI (15/10/2026): modificarli, aggiungerli, toglierli, e i tag che li rappresentano.
// ⚠️ Togliere un biotipo non lascia un 404: la pubblicazione aggiunge il rinvio da
// /biotipi/<id> a /biotipi (scripts/admin/pubblica.py). La regola: gruppi «oppure», ogni gruppo
// vale se tutte le sue condizioni sono vere; il biotipo di riserva ha un gruppo vuoto.
type Doc = { tag: TagBiotipo[]; biotipi: Biotipo[] };
const PELLE = ['secca', 'grassa', 'mista', 'normale', 'sensibile'];
const BISOGNI = ['idratazione', 'anti-age', 'acne-sebo', 'macchie-luminosita', 'rossori-sensibilita', 'barriera-cutanea', 'pori-dilatati', 'protezione-solare'];
const CAPELLI = ['caduta', 'forfora', 'secchi-crespi', 'mantenimento'];
const CUTE = ['grasso', 'secco', 'normale', 'sensibile'];

function EditorBiotipo({ b, cambia, togli, doc }: { b: Biotipo; cambia: (b: Biotipo) => void; togli: () => void; doc: Doc }) {
  return (
    <div className="pila" style={{ ['--gap' as string]: '12px', marginTop: 12 }}>
      <div className="adm-due">
        <Campo etichetta="Titolo"><Testo valore={b.titolo} cambia={(v) => cambia({ ...b, titolo: v })} /></Campo>
        <Campo etichetta="Motto"><Testo valore={b.motto} cambia={(v) => cambia({ ...b, motto: v })} /></Campo>
      </div>
      <Campo etichetta="Descrizione"><Testo lungo valore={b.descrizione} cambia={(v) => cambia({ ...b, descrizione: v })} /></Campo>
      <div className="adm-due">
        <Campo etichetta="Come si riconosce (una per riga)"><Righe valore={b.caratteristiche} cambia={(v) => cambia({ ...b, caratteristiche: v })} /></Campo>
        <Campo etichetta="Cosa cercare"><Righe valore={b.cerca} cambia={(v) => cambia({ ...b, cerca: v })} /></Campo>
        <Campo etichetta="Cosa evitare"><Righe valore={b.evita} cambia={(v) => cambia({ ...b, evita: v })} /></Campo>
      </div>
      <Campo etichetta="Tag di rappresentazione"><Scegli valori={doc.tag.filter((t) => t.area === 'tutti' || t.area === b.area).map((t) => t.id)} nomi={Object.fromEntries(doc.tag.map((t) => [t.id, t.nome]))} scelti={b.tag} cambia={(v) => cambia({ ...b, tag: v })} /></Campo>
      <div className="adm-due">
        <Campo etichetta="Foto (famiglia)"><select className="adm-input" value={b.famiglia} onChange={(e) => cambia({ ...b, famiglia: e.target.value })}>{[b.famiglia, ...CREDITI.map((c) => c.nome).filter((n) => n !== b.famiglia)].map((n) => <option key={n}>{n}</option>)}</select></Campo>
        <Campo etichetta="Tipo"><select className="adm-input" value={b.tipo} onChange={(e) => cambia({ ...b, tipo: e.target.value as Biotipo['tipo'] })}><option value="biotipo">biotipo</option><option value="tratto">tratto che si aggiunge</option></select></Campo>
        {b.tipo === 'biotipo' && <Campo etichetta="Priorità" aiuto="Più bassa = si controlla prima"><input className="adm-input" type="number" value={b.priorita} onChange={(e) => cambia({ ...b, priorita: +e.target.value })} /></Campo>}
      </div>
      <Campo etichetta="Quando esce" aiuto="Basta che un gruppo sia vero. Un gruppo vuoto vale sempre (il biotipo di riserva).">
        <div className="pila" style={{ ['--gap' as string]: '8px' }}>
          {b.regole.map((g, i) => (
            <div key={i} className="carta" style={{ padding: 10, background: 'var(--fondo)' }}>
              {i > 0 && <span className="piccolo">oppure</span>}
              <Condizioni lista={g} test={TEST} biotipi={doc.biotipi} cambia={(l) => cambia({ ...b, regole: b.regole.map((x, j) => (j === i ? l : x)) })} />
              {b.regole.length > 1 && <button type="button" className="chip" onClick={() => cambia({ ...b, regole: b.regole.filter((_, j) => j !== i) })}>Togli il gruppo</button>}
            </div>
          ))}
          <button type="button" className="chip" style={{ justifySelf: 'start' }} onClick={() => cambia({ ...b, regole: [...b.regole, []] })}>+ gruppo «oppure»</button>
        </div>
      </Campo>
      <Campo etichetta="Bisogni: i prodotti che gli vanno bene">
        <div className="pila" style={{ ['--gap' as string]: '8px' }}>
          {b.area === 'pelle' && <><span className="piccolo">tipi di pelle</span><Scegli valori={PELLE} scelti={b.bisogni.pelle} cambia={(v) => cambia({ ...b, bisogni: { ...b.bisogni, pelle: v } })} /></>}
          {b.area !== 'cute' && <><span className="piccolo">per cosa lavora</span><Scegli valori={BISOGNI} scelti={b.bisogni.concerns} cambia={(v) => cambia({ ...b, bisogni: { ...b.bisogni, concerns: v } })} /></>}
          {b.area !== 'pelle' && <><span className="piccolo">capelli</span><Scegli valori={CAPELLI} scelti={b.bisogni.capelli} cambia={(v) => cambia({ ...b, bisogni: { ...b.bisogni, capelli: v } })} /></>}
          {b.area === 'cute' && <><span className="piccolo">cute</span><Scegli valori={CUTE} scelti={b.bisogni.cute} cambia={(v) => cambia({ ...b, bisogni: { ...b.bisogni, cute: v } })} /></>}
        </div>
      </Campo>
      <button type="button" className="chip" style={{ justifySelf: 'end' }} onClick={() => confirm(`Togliere «${b.titolo}»? La sua pagina rinvierà a /biotipi.`) && togli()}>Togli il biotipo</button>
    </div>
  );
}

export default function Biotipi() {
  const doc = useDocumento<Doc>('biotipi', { tag: TAG_BIOTIPI, biotipi: BIOTIPI });
  const [area, setArea] = useState<Area>('pelle');
  const d = doc.dati;
  if (doc.errore) return <Vuoto>Non riesco a leggere i biotipi: {doc.errore}</Vuoto>;
  if (!d) return <Vuoto>Carico…</Vuoto>;
  const mettiB = (id: string, b: Biotipo | null) => doc.setDati({ ...d, biotipi: b ? d.biotipi.map((x) => (x.id === id ? b : x)) : d.biotipi.filter((x) => x.id !== id) });
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="Ogni biotipo ha la sua pagina (skinmatch.it/biotipi/…), le sue regole per uscire dal test e i bisogni con cui si scelgono i prodotti. I tag lo rappresentano sul sito e nei filtri.">I biotipi</Titolo>
      <div className="riga-chip">{(['pelle', 'cute', 'integrazione'] as Area[]).map((a) => <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => setArea(a)}>{NOMI_AREA[a]} · {d.biotipi.filter((b) => b.area === a).length}</button>)}</div>
      {d.biotipi.filter((b) => b.area === area).sort((a, b) => Number(a.tipo !== 'biotipo') - Number(b.tipo !== 'biotipo') || a.priorita - b.priorita).map((b) => (
        <details key={b.id} className="carta">
          <summary style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <span><b>{b.titolo}</b> <span className="piccolo">· {b.tipo === 'tratto' ? 'tratto' : `priorità ${b.priorita}`} · {b.id}</span></span>
            <span className="riga-chip">{b.tag.map((t) => <span key={t} className="chip tenue">{d.tag.find((x) => x.id === t)?.nome || t}</span>)}</span>
          </summary>
          <EditorBiotipo b={b} doc={d} cambia={(x) => mettiB(b.id, x)} togli={() => mettiB(b.id, null)} />
        </details>
      ))}
      <button type="button" className="bottone secondario" style={{ justifySelf: 'start' }} onClick={() => {
        const titolo = prompt('Il titolo del biotipo nuovo'); if (!titolo) return;
        doc.setDati({ ...d, biotipi: [...d.biotipi, { id: nuovoId(titolo, d.biotipi.map((b) => b.id)), area, tipo: 'biotipo', titolo, motto: '', famiglia: area === 'cute' ? 'cute-equilibrata' : 'pelle-normale', tag: [], priorita: 500, descrizione: '', caratteristiche: [], cerca: [], evita: [], regole: [[]], bisogni: {} }] });
      }}>+ biotipo in «{NOMI_AREA[area]}»</button>
      <section className="carta pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">I tag di rappresentazione</h2>
        <div className="pila" style={{ ['--gap' as string]: '6px' }}>
          {d.tag.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="adm-input" style={{ flex: '1 1 180px' }} value={t.nome} onChange={(e) => doc.setDati({ ...d, tag: d.tag.map((x, j) => (j === i ? { ...t, nome: e.target.value } : x)) })} />
              <select className="adm-input" style={{ width: 'auto' }} value={t.area} onChange={(e) => doc.setDati({ ...d, tag: d.tag.map((x, j) => (j === i ? { ...t, area: e.target.value as TagBiotipo['area'] } : x)) })}>{['tutti', 'pelle', 'cute', 'integrazione'].map((a) => <option key={a}>{a}</option>)}</select>
              <span className="piccolo">{d.biotipi.filter((b) => b.tag.includes(t.id)).length} biotipi</span>
              <button type="button" className="chip" onClick={() => doc.setDati({ tag: d.tag.filter((_, j) => j !== i), biotipi: d.biotipi.map((b) => ({ ...b, tag: b.tag.filter((x) => x !== t.id) })) })} aria-label="Togli il tag">×</button>
            </div>
          ))}
        </div>
        <button type="button" className="chip" style={{ justifySelf: 'start' }} onClick={() => { const nome = prompt('Il nome del tag'); if (nome) doc.setDati({ ...d, tag: [...d.tag, { id: nuovoId(nome, d.tag.map((t) => t.id)), nome, area: 'tutti' }] }); }}>+ tag</button>
      </section>
      <BarraSalva doc={doc} cosa="biotipi" />
    </div>
  );
}
