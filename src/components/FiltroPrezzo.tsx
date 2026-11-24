'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// IL FILTRO DEL PREZZO (24/11/2026, Federico: «da aggiungere quello sul prezzo attualmente non presente»).
// I prezzi del catalogo vanno da 1,50 € a più di 500 €, ma metà dei prodotti costa meno di 22 €: su una scala dritta i
// due cursori starebbero schiacciati a sinistra. La scala è logaritmica (ogni tratto moltiplica il prezzo per lo stesso
// numero), e sopra c'è l'istogramma dei prodotti che restano con gli altri filtri, così si vede dove stanno.
// I cursori scrivono nella pagina dopo una breve pausa: trascinare non ricalcola il catalogo a ogni pixel.
export const eur = (n: number) => `${n.toLocaleString('it-IT', { maximumFractionDigits: n < 10 && n % 1 ? 2 : 0 })} €`;
const PASSI = 1000;
const BARRE = 28;
// un prezzo «tondo» per la scala: all'euro sotto i 20 €, ai 5 € sotto i 100 €, ai 10 € sopra
const tondo = (v: number) => (v < 20 ? Math.round(v) : v < 100 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10);

export default function FiltroPrezzo({ prezzi, min, max, onCambia }: {
  prezzi: number[]; min: number | null; max: number | null; onCambia: (min: number | null, max: number | null) => void;
}) {
  const validi = prezzi.filter((p) => p > 0);
  const lo = Math.max(1, Math.floor(Math.min(...(validi.length ? validi : [1]))));
  const hi = Math.max(lo + 1, Math.ceil(Math.max(...(validi.length ? validi : [lo + 1]))));
  const scala = Math.log(hi / lo);
  const pos = (v: number) => Math.round((PASSI * Math.log(Math.min(hi, Math.max(lo, v)) / lo)) / scala);
  const prezzo = (t: number) => Math.min(hi, Math.max(lo, tondo(lo * Math.exp((scala * t) / PASSI))));

  const [a, setA] = useState(pos(min ?? lo));
  const [b, setB] = useState(pos(max ?? hi));
  const [testi, setTesti] = useState<[string, string]>(['', '']);
  // quando il filtro cambia da fuori (Azzera, Togli i filtri, un'altra tipologia) i cursori lo seguono
  useEffect(() => { setA(pos(min ?? lo)); setB(pos(max ?? hi)); setTesti(['', '']); }, [min, max, lo, hi]); // eslint-disable-line react-hooks/exhaustive-deps

  const vMin = a <= 0 ? lo : prezzo(a);
  const vMax = b >= PASSI ? hi : prezzo(b);
  const attesa = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrivi = (na: number, nb: number) => {
    if (attesa.current) clearTimeout(attesa.current);
    attesa.current = setTimeout(() => onCambia(na <= 0 ? null : prezzo(na), nb >= PASSI ? null : prezzo(nb)), 180);
  };
  useEffect(() => () => { if (attesa.current) clearTimeout(attesa.current); }, []);
  const muoviA = (t: number) => { const na = Math.min(t, b - 20); setA(na); scrivi(na, b); };
  const muoviB = (t: number) => { const nb = Math.max(t, a + 20); setB(nb); scrivi(a, nb); };

  // l'istogramma: quanti prodotti per tratto della scala
  const barre = useMemo(() => {
    const n = Array<number>(BARRE).fill(0);
    for (const p of validi) n[Math.min(BARRE - 1, Math.floor((pos(p) / PASSI) * BARRE))]++;
    const alto = Math.max(1, ...n);
    return n.map((c) => (c ? 0.12 + 0.88 * Math.sqrt(c / alto) : 0));
  }, [`${validi.length}:${validi.reduce((s, p) => s + p, 0).toFixed(2)}`, lo, hi]); // eslint-disable-line react-hooks/exhaustive-deps
  const dentro = validi.filter((p) => p >= vMin && p <= vMax).length;

  // i due campi per scriverlo a mano: valgono all'invio o quando si esce dal campo
  const scriviCampo = (i: 0 | 1) => {
    const t = testi[i].replace(',', '.').replace(/[^\d.]/g, '');
    if (!t) return setTesti((x) => (i ? [x[0], ''] : ['', x[1]]));
    const v = Number(t);
    if (!Number.isFinite(v)) return;
    if (i === 0) { const na = v <= lo ? 0 : Math.min(pos(v), b - 20); setA(na); onCambia(na <= 0 ? null : Math.min(v, vMax), max); }
    else { const nb = v >= hi ? PASSI : Math.max(pos(v), a + 20); setB(nb); onCambia(min, nb >= PASSI ? null : Math.max(v, vMin)); }
    setTesti(['', '']);
  };

  return (
    <div className="filtro-prezzo">
      <p className="prezzo-dice" aria-live="polite"><b>{eur(vMin)} – {eur(vMax)}</b> <span>· {dentro} prodotti</span></p>
      <div className="prezzo-istogramma" aria-hidden="true">
        {barre.map((h, i) => {
          const centro = ((i + 0.5) / BARRE) * PASSI;
          return <i key={i} className={centro >= a && centro <= b ? 'dentro' : ''} style={{ height: `${Math.round(h * 100)}%` }} />;
        })}
      </div>
      <div className="prezzo-scala">
        <div className="prezzo-binario"><b style={{ left: `${(a / PASSI) * 100}%`, right: `${100 - (b / PASSI) * 100}%` }} /></div>
        <input type="range" min={0} max={PASSI} step={1} value={a} aria-label="Prezzo minimo" aria-valuetext={eur(vMin)}
          style={{ zIndex: a > PASSI - 60 ? 3 : 2 }} onChange={(e) => muoviA(Number(e.target.value))} />
        <input type="range" min={0} max={PASSI} step={1} value={b} aria-label="Prezzo massimo" aria-valuetext={eur(vMax)}
          style={{ zIndex: 2 }} onChange={(e) => muoviB(Number(e.target.value))} />
      </div>
      <div className="prezzo-campi">
        <label className="campo-filtro"><span>Da</span>
          <input inputMode="decimal" value={testi[0]} placeholder={eur(vMin)} aria-label="Prezzo minimo in euro"
            onChange={(e) => setTesti([e.target.value, testi[1]])} onBlur={() => scriviCampo(0)} onKeyDown={(e) => e.key === 'Enter' && scriviCampo(0)} />
        </label>
        <span className="prezzo-trattino" aria-hidden="true">–</span>
        <label className="campo-filtro"><span>A</span>
          <input inputMode="decimal" value={testi[1]} placeholder={eur(vMax)} aria-label="Prezzo massimo in euro"
            onChange={(e) => setTesti([testi[0], e.target.value])} onBlur={() => scriviCampo(1)} onKeyDown={(e) => e.key === 'Enter' && scriviCampo(1)} />
        </label>
      </div>
    </div>
  );
}
