'use client';

// I GRAFICI DELL'ADMIN (19/11/2026, Federico: «se vado su una colonna, su un punto o un dato specifico deve comparirmi
// subito quel dato e il suo numero. Questa stessa infrastruttura va ricreata anche in Skinmatch per uniformare il
// tutto»). Gemello di Agoranomos (components/admin/grafici.jsx): stesse forme e stesse regole, coi colori di Skinmatch.
// ⚠️ IL DATO COMPARE SUBITO: un riquadro segue il puntatore appena si entra in una colonna o in una riga, al tocco sul
// telefono e col tasto Tab. ⚠️ UNA MISURA, UN ASSE: due grandezze diverse sono due grafici. ⚠️ IL COLORE NON BASTA:
// nel riquadro ogni serie ha il nome accanto al quadratino, e con due serie o più c'è la legenda.

import { useRef, useState, type ReactNode, type PointerEvent as PE, type FocusEvent as FE } from 'react';

export const numero = (x: number | null | undefined) => Number(x || 0).toLocaleString('it-IT', { useGrouping: 'always' as never, maximumFractionDigits: 1 });
export const euro = (x: number | null | undefined) => `${Number(x || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

type Ev = PE<HTMLElement> | FE<HTMLElement>;
function useRiquadro() {
  const box = useRef<HTMLDivElement>(null);
  const [r, setR] = useState<{ x: number; y: number; w: number; c: ReactNode } | null>(null);
  const mostra = (e: Ev, c: ReactNode) => {
    const b = box.current?.getBoundingClientRect();
    if (!b) return;
    const t = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = 'clientX' in e ? { x: e.clientX, y: e.clientY } : { x: t.left + t.width / 2, y: t.top };
    setR({ x: p.x - b.left, y: p.y - b.top, w: b.width, c });
  };
  const riquadro = r && (
    <div role="status" className="graf-riquadro" style={{ top: Math.max(0, r.y - 12), left: Math.min(Math.max(8, r.x), r.w - 8),
      transform: `translate(${r.x > r.w * 0.6 ? '-100%' : r.x < r.w * 0.25 ? '0' : '-50%'}, -100%)` }}>{r.c}</div>
  );
  return { box, mostra, nascondi: () => setR(null), riquadro };
}

const Quadratino = ({ colore }: { colore: string }) => <span aria-hidden="true" className="graf-q" style={{ background: colore }} />;

export type Serie = { chiave: string; nome: string; colore: string };
export type Dato = { k: string; etichetta: string; lunga?: string; [chiave: string]: string | number | undefined };

export function Legenda({ serie }: { serie: Serie[] }) {
  if (serie.length < 2) return null;
  return <div className="graf-legenda">{serie.map((s) => <span key={s.chiave}><Quadratino colore={s.colore} />{s.nome}</span>)}</div>;
}

export function Colonne({ titolo, dati, serie, formato = numero, altezza = 120, impilate = false, nota, ogni }:
  { titolo?: string; dati: Dato[]; serie: Serie[]; formato?: (x: number) => string; altezza?: number; impilate?: boolean; nota?: ReactNode; ogni?: number }) {
  const { box, mostra, nascondi, riquadro } = useRiquadro();
  if (!dati.length) return null;
  const val = (d: Dato, s: Serie) => Number(d[s.chiave]) || 0;
  const max = Math.max(0, ...dati.map((d) => (impilate ? serie.reduce((t, s) => t + val(d, s), 0) : Math.max(...serie.map((s) => val(d, s))))));
  const passo = ogni || Math.max(1, Math.ceil(dati.length / 7));
  const totali = serie.map((s) => dati.reduce((t, d) => t + val(d, s), 0));
  const contenuto = (d: Dato) => (
    <>
      <b>{d.lunga || d.etichetta}</b>
      {serie.map((s) => <div key={s.chiave}><Quadratino colore={s.colore} />{s.nome}: <b>{formato(val(d, s))}</b></div>)}
      {impilate && serie.length > 1 && <div style={{ opacity: 0.75 }}>totale: {formato(serie.reduce((t, s) => t + val(d, s), 0))}</div>}
    </>
  );
  return (
    <figure className="graf">
      {(titolo || serie.length > 1) && <figcaption>{titolo && <b>{titolo}</b>}<Legenda serie={serie} /></figcaption>}
      <div ref={box} style={{ position: 'relative' }} onPointerLeave={nascondi}>
        <span className="graf-max">{max ? `massimo ${formato(max)}` : 'ancora a zero'}</span>
        <div className="graf-colonne" role="img" style={{ height: altezza }}
          aria-label={`${titolo || 'Grafico'}: ${serie.map((s, i) => `${s.nome} ${formato(totali[i])}`).join(', ')} in ${dati.length} periodi`}>
          {dati.map((d) => (
            <div key={d.k} tabIndex={0} className={impilate ? 'impilata' : undefined}
              aria-label={`${d.lunga || d.etichetta}: ${serie.map((s) => `${s.nome} ${formato(val(d, s))}`).join(', ')}`}
              onPointerEnter={(e) => mostra(e, contenuto(d))} onPointerMove={(e) => mostra(e, contenuto(d))} onPointerDown={(e) => mostra(e, contenuto(d))}
              onFocus={(e) => mostra(e, contenuto(d))} onBlur={nascondi}>
              {serie.map((s) => {
                const v = val(d, s);
                return impilate
                  ? (v ? <i key={s.chiave} style={{ height: `${(v / (max || 1)) * 100}%`, background: s.colore }} /> : null)
                  : <i key={s.chiave} className={v ? undefined : 'zero'} style={{ height: v ? `${(v / (max || 1)) * 100}%` : undefined, background: v ? s.colore : undefined }} />;
              })}
            </div>
          ))}
        </div>
        <div className="graf-asse" aria-hidden="true">{dati.map((d, i) => <span key={d.k}>{i % passo === 0 ? d.etichetta : ''}</span>)}</div>
        {riquadro}
      </div>
      {nota && <p className="piccolo">{nota}</p>}
    </figure>
  );
}

export type Riga = { k: string; nome: string; valore: number; sotto?: string; colore?: string; testo?: string }; // testo: il numero già scritto (es. «≈ 3»)
export function Barre({ titolo, righe, formato = numero, colore = 'var(--f4)', nota, vuoto = 'Ancora niente.' }:
  { titolo?: string; righe: Riga[]; formato?: (x: number) => string; colore?: string; nota?: ReactNode; vuoto?: string }) {
  const { box, mostra, nascondi, riquadro } = useRiquadro();
  const max = Math.max(0, ...righe.map((r) => r.valore || 0));
  const tot = righe.reduce((t, r) => t + (r.valore || 0), 0);
  const contenuto = (r: Riga) => (
    <><b>{r.nome}</b><div><b>{(r.testo ?? formato(r.valore))}</b>{tot ? ` · ${Math.round(((r.valore || 0) / tot) * 100)}% del totale` : ''}</div>{r.sotto && <div style={{ opacity: 0.75 }}>{r.sotto}</div>}</>
  );
  return (
    <figure className="graf">
      {titolo && <figcaption><b>{titolo}</b></figcaption>}
      {!righe.length ? <p className="piccolo">{vuoto}</p> : (
        <div ref={box} className="graf-barre" onPointerLeave={nascondi}>
          {righe.map((r) => (
            <div key={r.k} tabIndex={0} aria-label={`${r.nome}: ${(r.testo ?? formato(r.valore))}${r.sotto ? `, ${r.sotto}` : ''}`}
              onPointerEnter={(e) => mostra(e, contenuto(r))} onPointerMove={(e) => mostra(e, contenuto(r))} onPointerDown={(e) => mostra(e, contenuto(r))}
              onFocus={(e) => mostra(e, contenuto(r))} onBlur={nascondi}>
              <i aria-hidden="true" style={{ width: `${max ? Math.max(1.5, ((r.valore || 0) / max) * 100) : 0}%`, background: r.colore || colore }} />
              <span>{r.nome}</span><b>{(r.testo ?? formato(r.valore))}</b>
            </div>
          ))}
          {riquadro}
        </div>
      )}
      {nota && <p className="piccolo">{nota}</p>}
    </figure>
  );
}
