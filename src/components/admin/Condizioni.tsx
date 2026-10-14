'use client';

import type { Condizione, Test, Valore } from '@/lib/dati';

// Una condizione per riga: su un asse (da/fino a), su una scelta (uno dei valori), su un limite
// (aperto da una risposta) o su un biotipo già uscito. «non» la rovescia.
type Tipo = 'asse' | 'scelta' | 'limite' | 'biotipo';
const tipoDi = (c: Condizione): Tipo => (c.asse !== undefined ? 'asse' : c.scelta !== undefined ? 'scelta' : c.limite !== undefined ? 'limite' : 'biotipo');
const leggiValore = (s: string): Valore => (s === 'true' ? true : s === 'false' ? false : /^-?\d+$/.test(s) ? Number(s) : s);

export default function Condizioni({ lista, cambia, test, biotipi = [] }: { lista: Condizione[]; cambia: (l: Condizione[]) => void; test: Test; biotipi?: { id: string; titolo: string }[] }) {
  const metti = (i: number, c: Condizione) => cambia(lista.map((x, j) => (j === i ? c : x)));
  return (
    <div className="pila" style={{ ['--gap' as string]: '6px' }}>
      {lista.map((c, i) => {
        const t = tipoDi(c);
        const scelta = test.scelte.find((s) => s.id === c.scelta);
        return (
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <select className="adm-input" style={{ width: 'auto' }} value={t} onChange={(e) => {
              const n = e.target.value as Tipo;
              metti(i, n === 'asse' ? { asse: test.assi[0].id, min: 1 } : n === 'scelta' ? { scelta: test.scelte[0].id, valori: [] } : n === 'limite' ? { limite: test.limiti[0].id } : { biotipo: [] });
            }}>
              <option value="asse">asse</option><option value="scelta">scelta</option><option value="limite">limite</option><option value="biotipo">biotipo</option>
            </select>
            {t === 'asse' && (<>
              <select className="adm-input" style={{ width: 'auto' }} value={c.asse} onChange={(e) => metti(i, { ...c, asse: e.target.value })}>{test.assi.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}</select>
              <span className="piccolo">da</span><input className="adm-input" style={{ width: 70 }} type="number" value={c.min ?? ''} onChange={(e) => metti(i, { ...c, min: e.target.value === '' ? undefined : +e.target.value })} />
              <span className="piccolo">fino a</span><input className="adm-input" style={{ width: 70 }} type="number" value={c.max ?? ''} onChange={(e) => metti(i, { ...c, max: e.target.value === '' ? undefined : +e.target.value })} />
            </>)}
            {t === 'scelta' && (<>
              <select className="adm-input" style={{ width: 'auto' }} value={c.scelta} onChange={(e) => metti(i, { ...c, scelta: e.target.value, valori: [] })}>{test.scelte.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
              <span className="piccolo">è</span>
              <div className="riga-chip">{(scelta?.valori || []).map((v) => {
                const on = (c.valori || []).includes(v);
                return <button key={String(v)} type="button" className="chip" aria-pressed={on} onClick={() => metti(i, { ...c, valori: on ? (c.valori || []).filter((x) => x !== v) : [...(c.valori || []), leggiValore(String(v))] })}>{v === true ? 'sì' : String(v)}</button>;
              })}</div>
            </>)}
            {t === 'limite' && <select className="adm-input" style={{ width: 'auto' }} value={c.limite} onChange={(e) => metti(i, { ...c, limite: e.target.value })}>{test.limiti.map((l) => <option key={l.id} value={l.id}>{l.titolo}</option>)}</select>}
            {t === 'biotipo' && <select className="adm-input" style={{ width: 'auto' }} value={c.biotipo?.[0] || ''} onChange={(e) => metti(i, { ...c, biotipo: [e.target.value] })}><option value="">—</option>{biotipi.map((b) => <option key={b.id} value={b.id}>{b.titolo}</option>)}</select>}
            <label className="piccolo" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={!!c.no} onChange={(e) => metti(i, { ...c, no: e.target.checked || undefined })} />non</label>
            <button type="button" className="chip" onClick={() => cambia(lista.filter((_, j) => j !== i))} aria-label="Togli la condizione">×</button>
          </div>
        );
      })}
      <button type="button" className="chip" style={{ justifySelf: 'start' }} onClick={() => cambia([...lista, { asse: test.assi[0].id, min: 1 }])}>+ condizione</button>
    </div>
  );
}
