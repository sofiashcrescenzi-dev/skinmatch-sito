'use client';

import { useMemo, useState } from 'react';
import { TEST, BIOTIPI, CREDITI, type Test, type Domanda, type Opzione, type Percorso } from '@/lib/dati';
import { consiglia, usaDati } from '@/lib/motore';
import { useDocumento, BarraSalva, Campo, Testo, Titolo, Vuoto, nuovoId } from './base';
import Condizioni from './Condizioni';

// L'ARCHITETTURA DEL TEST (15/10/2026): percorsi, domande e risposte con i loro effetti,
// limiti da consulto, passaggi della routine. In fondo le persone tipo: girano sulla bozza,
// così si vede subito se una modifica cambia un risultato (sono anche i guardiani della build).
const AREE = ['comune', 'pelle', 'cute', 'integrazione'];
const sposta = <T,>(l: T[], i: number, d: number) => { const c = [...l]; const j = i + d; if (j < 0 || j >= c.length) return c; [c[i], c[j]] = [c[j], c[i]]; return c; };

function EditorOpzione({ o, cambia, togli, su, giu, test, area }: { o: Opzione; cambia: (o: Opzione) => void; togli: () => void; su: () => void; giu: () => void; test: Test; area: string }) {
  const assi = test.assi.filter((a) => area === 'comune' || a.area === area || o.punti?.[a.id] !== undefined);
  const [chiave, setChiave] = useState('');
  return (
    <div className="carta pila" style={{ ['--gap' as string]: '8px', padding: 12, background: 'var(--fondo)' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input className="adm-input" value={o.testo} onChange={(e) => cambia({ ...o, testo: e.target.value })} aria-label="Testo della risposta" />
        <button type="button" className="chip" onClick={su} aria-label="Su">↑</button><button type="button" className="chip" onClick={giu} aria-label="Giù">↓</button>
        <button type="button" className="chip" onClick={togli} aria-label="Togli la risposta">×</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center' }}>
        <span className="piccolo">punti:</span>
        {assi.map((a) => (
          <label key={a.id} className="piccolo" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{a.nome}
            <input className="adm-input" style={{ width: 58, padding: '5px 8px' }} type="number" value={o.punti?.[a.id] ?? ''} onChange={(e) => {
              const p = { ...(o.punti || {}) }; if (e.target.value === '') delete p[a.id]; else p[a.id] = +e.target.value;
              cambia({ ...o, punti: Object.keys(p).length ? p : undefined });
            }} />
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center' }}>
        <span className="piccolo">scelte:</span>
        {Object.entries(o.scelte || {}).map(([k, v]) => {
          const s = test.scelte.find((x) => x.id === k);
          return (
            <span key={k} className="chip tenue">{s?.nome || k} =
              <select value={String(v)} style={{ border: 0, background: 'transparent', font: 'inherit' }} onChange={(e) => { const sv = s?.valori.find((x) => String(x) === e.target.value); cambia({ ...o, scelte: { ...o.scelte, [k]: sv ?? e.target.value } }); }}>
                {(s?.valori || [v]).map((x) => <option key={String(x)} value={String(x)}>{x === true ? 'sì' : String(x)}</option>)}
              </select>
              <button type="button" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => { const c = { ...o.scelte }; delete c[k]; cambia({ ...o, scelte: Object.keys(c).length ? c : undefined }); }} aria-label="Togli">×</button>
            </span>
          );
        })}
        <select className="adm-input" style={{ width: 'auto', padding: '5px 8px' }} value={chiave} onChange={(e) => { const s = test.scelte.find((x) => x.id === e.target.value); if (s) cambia({ ...o, scelte: { ...(o.scelte || {}), [s.id]: s.valori[0] } }); setChiave(''); }}>
          <option value="">+ scelta</option>{test.scelte.filter((s) => !(s.id in (o.scelte || {}))).map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center' }}>
        <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>apre il consulto:
          <select className="adm-input" style={{ width: 'auto', padding: '5px 8px' }} value={o.limite || ''} onChange={(e) => cambia({ ...o, limite: e.target.value || undefined })}>
            <option value="">no</option>{test.limiti.map((l) => <option key={l.id} value={l.id}>{l.titolo}</option>)}
          </select>
        </label>
        <label className="piccolo" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={!!o.esclusiva} onChange={(e) => cambia({ ...o, esclusiva: e.target.checked || undefined })} />esclude le altre (es. «nessuna»)</label>
        <span className="piccolo">id: {o.id}</span>
      </div>
    </div>
  );
}

function EditorDomanda({ d, cambia, togli, test }: { d: Domanda; cambia: (d: Domanda) => void; togli: () => void; test: Test }) {
  const usata = test.percorsi.filter((p) => p.domande.includes(d.id)).map((p) => p.nome);
  return (
    <details className="carta">
      <summary style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span><b>{d.testo}</b> <span className="piccolo">· {d.area} · {d.opzioni.length} risposte{d.multipla ? ' · più scelte' : ''}{d.saltabile ? ' · saltabile' : ''}</span></span>
        <span className="piccolo">{usata.length ? usata.join(', ') : 'in nessun percorso'}</span>
      </summary>
      <div className="pila" style={{ ['--gap' as string]: '12px', marginTop: 12 }}>
        <div className="adm-due">
          <Campo etichetta="Domanda"><Testo valore={d.testo} cambia={(v) => cambia({ ...d, testo: v })} /></Campo>
          <Campo etichetta="Aiuto sotto la domanda"><Testo valore={d.aiuto} cambia={(v) => cambia({ ...d, aiuto: v || undefined })} /></Campo>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>Area
            <select className="adm-input" style={{ width: 'auto' }} value={d.area} onChange={(e) => cambia({ ...d, area: e.target.value as Domanda['area'] })}>{AREE.map((a) => <option key={a}>{a}</option>)}</select>
          </label>
          <label className="piccolo" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={!!d.multipla} onChange={(e) => cambia({ ...d, multipla: e.target.checked || undefined })} />più risposte insieme</label>
          <label className="piccolo" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }} title="Solo dove la domanda non serve davvero: non decide il biotipo né la sicurezza. Senza risposta vale il default."><input type="checkbox" checked={!!d.saltabile} onChange={(e) => cambia({ ...d, saltabile: e.target.checked || undefined })} />si può saltare</label>
          <span className="piccolo">id: {d.id}</span>
        </div>
        <Campo etichetta="Si fa solo se" aiuto="Vuoto = sempre. Es. la barba solo se «Per chi» è uomo.">
          <Condizioni lista={d.se || []} cambia={(l) => cambia({ ...d, se: l.length ? l : undefined })} test={test} />
        </Campo>
        <span className="adm-etichetta">Risposte</span>
        {d.opzioni.map((o, i) => (
          <EditorOpzione key={o.id} o={o} test={test} area={d.area}
            cambia={(x) => cambia({ ...d, opzioni: d.opzioni.map((y, j) => (j === i ? x : y)) })}
            togli={() => cambia({ ...d, opzioni: d.opzioni.filter((_, j) => j !== i) })}
            su={() => cambia({ ...d, opzioni: sposta(d.opzioni, i, -1) })} giu={() => cambia({ ...d, opzioni: sposta(d.opzioni, i, 1) })} />
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="chip" onClick={() => cambia({ ...d, opzioni: [...d.opzioni, { id: nuovoId('risposta', d.opzioni.map((o) => o.id)), testo: 'Nuova risposta' }] })}>+ risposta</button>
          <button type="button" className="chip" style={{ marginLeft: 'auto' }} onClick={() => { if (confirm(`Togliere la domanda «${d.testo}» da tutto il test?`)) togli(); }}>Togli la domanda</button>
        </div>
      </div>
    </details>
  );
}

function EditorPercorso({ p, cambia, test }: { p: Percorso; cambia: (p: Percorso) => void; test: Test }) {
  const [agg, setAgg] = useState('');
  return (
    <details className="carta">
      <summary><b>{p.nome}</b> <span className="piccolo">· {p.domande.length} domande · aree: {p.aree.join(', ')}</span></summary>
      <div className="pila" style={{ ['--gap' as string]: '12px', marginTop: 12 }}>
        <div className="adm-due">
          <Campo etichetta="Nome"><Testo valore={p.nome} cambia={(v) => cambia({ ...p, nome: v })} /></Campo>
          <Campo etichetta="Titolo"><Testo valore={p.titolo} cambia={(v) => cambia({ ...p, titolo: v })} /></Campo>
          <Campo etichetta="Minuti"><input className="adm-input" type="number" value={p.minuti} onChange={(e) => cambia({ ...p, minuti: +e.target.value })} /></Campo>
          <Campo etichetta="Foto"><select className="adm-input" value={p.immagine} onChange={(e) => cambia({ ...p, immagine: e.target.value })}>{[p.immagine, ...CREDITI.map((c) => c.nome).filter((n) => n !== p.immagine)].map((n) => <option key={n}>{n}</option>)}</select></Campo>
        </div>
        <Campo etichetta="Descrizione"><Testo lungo valore={p.descrizione} cambia={(v) => cambia({ ...p, descrizione: v })} /></Campo>
        <span className="adm-etichetta">Domande, in ordine</span>
        <ol className="pila" style={{ ['--gap' as string]: '4px', paddingLeft: 22, listStyle: 'decimal' }}>
          {p.domande.map((id, i) => {
            const d = test.domande.find((x) => x.id === id);
            return (
              <li key={id}><span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ flex: '1 1 200px' }}>{d?.testo || id} <span className="piccolo">({d?.area})</span></span>
                <button type="button" className="chip" onClick={() => cambia({ ...p, domande: sposta(p.domande, i, -1) })} aria-label="Su">↑</button>
                <button type="button" className="chip" onClick={() => cambia({ ...p, domande: sposta(p.domande, i, 1) })} aria-label="Giù">↓</button>
                <button type="button" className="chip" onClick={() => cambia({ ...p, domande: p.domande.filter((x) => x !== id) })} aria-label="Togli">×</button>
              </span></li>
            );
          })}
        </ol>
        <select className="adm-input" style={{ maxWidth: 420 }} value={agg} onChange={(e) => { if (e.target.value) cambia({ ...p, domande: [...p.domande, e.target.value] }); setAgg(''); }}>
          <option value="">+ aggiungi una domanda</option>{test.domande.filter((d) => !p.domande.includes(d.id)).map((d) => <option key={d.id} value={d.id}>{d.testo} ({d.area})</option>)}
        </select>
      </div>
    </details>
  );
}

function Persone({ test }: { test: Test }) {
  const righe = useMemo(() => {
    usaDati(test, BIOTIPI);
    try {
      return test.persone.map((per) => {
        const percorso = test.percorsi.find((p) => p.id === per.percorso);
        if (!percorso) return { per, esito: 'percorso mancante', ok: false };
        const r = consiglia(percorso, per.risposte);
        const usciti = r.aree.map((a) => `${a.biotipo?.titolo || '—'}${a.tratti.length ? ' + ' + a.tratti.map((t) => t.titolo.toLowerCase()).join(', ') : ''}`).join(' · ');
        const ok = (['pelle', 'cute', 'integrazione'] as const).every((k) => !per.atteso[k] || r.aree.find((a) => a.area === k)?.biotipo?.id === per.atteso[k])
          && (per.atteso.tratti || []).every((t) => r.aree.some((a) => a.tratti.some((x) => x.id === t)))
          && (per.atteso.consulto === undefined || per.atteso.consulto === r.limiti.length > 0);
        return { per, esito: usciti + (r.limiti.length ? ' · consulto' : ''), ok };
      });
    } finally { usaDati(); }
  }, [test]);
  return (
    <div className="adm-tabella"><table><thead><tr><th>Persona tipo</th><th>Esce, con questa bozza</th><th>Atteso</th></tr></thead>
      <tbody>{righe.map(({ per, esito, ok }) => (
        <tr key={per.nome}><td><b>{per.nome}</b><br /><span className="piccolo">{per.nota}</span></td><td>{esito}</td>
          <td style={{ color: ok ? 'var(--bene)' : 'var(--attenzione)', fontWeight: 700 }}>{ok ? 'giusto' : `diverso: ${[per.atteso.pelle, per.atteso.cute, per.atteso.integrazione, ...(per.atteso.tratti || [])].filter(Boolean).join(', ')}`}</td></tr>
      ))}</tbody></table></div>
  );
}

export default function Domande() {
  const doc = useDocumento<Test>('test', TEST);
  const [area, setArea] = useState('tutte');
  const t = doc.dati;
  if (doc.errore) return <Vuoto>Non riesco a leggere il test: {doc.errore}</Vuoto>;
  if (!t) return <Vuoto>Carico…</Vuoto>;
  const metti = (x: Partial<Test>) => doc.setDati({ ...t, ...x });
  return (
    <div className="pila" style={{ ['--gap' as string]: '28px' }}>
      <Titolo sotto="I quattro percorsi, le domande e cosa fa ogni risposta: punti su un asse, una scelta, oppure il consulto. Le persone tipo in fondo girano su questa bozza: se una diventa «diversa», la modifica ha cambiato un risultato. Salva, poi Pubblica.">Le domande del test</Titolo>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">I percorsi</h2>
        {t.percorsi.map((p, i) => <EditorPercorso key={p.id} p={p} test={t} cambia={(x) => metti({ percorsi: t.percorsi.map((y, j) => (j === i ? x : y)) })} />)}
      </section>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="titolo-3">Le domande ({t.domande.length})</h2>
          <div className="riga-chip">{['tutte', ...AREE].map((a) => <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => setArea(a)}>{a}</button>)}</div>
        </div>
        {t.domande.map((d, i) => (area === 'tutte' || d.area === area) && (
          <EditorDomanda key={d.id} d={d} test={t}
            cambia={(x) => metti({ domande: t.domande.map((y, j) => (j === i ? x : y)) })}
            togli={() => metti({ domande: t.domande.filter((_, j) => j !== i), percorsi: t.percorsi.map((p) => ({ ...p, domande: p.domande.filter((x) => x !== d.id) })) })} />
        ))}
        <button type="button" className="chip" style={{ justifySelf: 'start' }} onClick={() => {
          const testo = prompt('Il testo della domanda nuova'); if (!testo) return;
          metti({ domande: [...t.domande, { id: nuovoId(testo, t.domande.map((d) => d.id)), area: area === 'tutte' ? 'pelle' : (area as Domanda['area']), testo, opzioni: [{ id: 'si', testo: 'Sì' }, { id: 'no', testo: 'No' }] }] });
        }}>+ domanda</button>
      </section>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">I limiti: prima il consulto</h2>
        <p className="piccolo">Quando una risposta apre un limite, il risultato comincia con il consulto. «Solo prodotti delicati» lascia solo quelli segnati per pelli sensibili.</p>
        {t.limiti.map((l, i) => (
          <details key={l.id} className="carta"><summary><b>{l.titolo}</b> <span className="piccolo">· {l.area}{l.solo_delicati ? ' · solo prodotti delicati' : ''}</span></summary>
            <div className="pila" style={{ ['--gap' as string]: '8px', marginTop: 10 }}>
              <Campo etichetta="Titolo"><Testo valore={l.titolo} cambia={(v) => metti({ limiti: t.limiti.map((y, j) => (j === i ? { ...l, titolo: v } : y)) })} /></Campo>
              <Campo etichetta="Cosa dice"><Testo lungo valore={l.testo} cambia={(v) => metti({ limiti: t.limiti.map((y, j) => (j === i ? { ...l, testo: v } : y)) })} /></Campo>
              <label className="piccolo" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={l.solo_delicati} onChange={(e) => metti({ limiti: t.limiti.map((y, j) => (j === i ? { ...l, solo_delicati: e.target.checked } : y)) })} />solo prodotti delicati</label>
            </div>
          </details>
        ))}
      </section>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">I passaggi della routine</h2>
        {t.passaggi.map((ps, i) => (
          <details key={ps.id} className="carta"><summary><b>{ps.nome}</b> <span className="piccolo">· {ps.area} · categoria {ps.categoria}{ps.se?.length ? ' · con condizioni' : ''}</span></summary>
            <div className="pila" style={{ ['--gap' as string]: '8px', marginTop: 10 }}>
              <div className="adm-due">
                <Campo etichetta="Nome"><Testo valore={ps.nome} cambia={(v) => metti({ passaggi: t.passaggi.map((y, j) => (j === i ? { ...ps, nome: v } : y)) })} /></Campo>
                <Campo etichetta="Quando"><Testo valore={ps.quando} cambia={(v) => metti({ passaggi: t.passaggi.map((y, j) => (j === i ? { ...ps, quando: v } : y)) })} /></Campo>
              </div>
              <Campo etichetta="Si mostra solo se"><Condizioni lista={ps.se || []} test={t} cambia={(l) => metti({ passaggi: t.passaggi.map((y, j) => (j === i ? { ...ps, se: l.length ? l : undefined } : y)) })} /></Campo>
            </div>
          </details>
        ))}
      </section>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Le persone tipo, sulla bozza</h2>
        <Persone test={t} />
      </section>
      <BarraSalva doc={doc} cosa="test" />
    </div>
  );
}
