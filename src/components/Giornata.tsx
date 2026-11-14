'use client';

import { useEffect, useRef, useState } from 'react';
import FotoProdotto from '@/components/FotoProdotto';
import { euro } from '@/lib/formato';
import type { Giornata as G, Passo } from '@/lib/giornata';

// LA TUA GIORNATA: la fascia dall'alba alla notte con i prodotti all'ora in cui si usano, e sotto quelli che non sono
// di ogni giorno. Il fondo va dai toni chiari ai toni scuri della scala dei fototipi: la luce del giorno, col marchio.
// Ogni foto porta al suo passaggio più sotto, scorrendo (vai). Vedi lib/giornata.ts.
const ORE = [6, 9, 12, 15, 18, 21, 24];

// ⚠️ SI SCORRE, NON SI CAMBIA L'INDIRIZZO (30/10/2026, Federico: «il clic sull'immaginina porta a link errati»). Le
// risposte del risultato stanno dopo il «#» (lib/condividi.ts): un'ancora «#passo-crema» le sostituiva, la pagina
// rileggeva l'indirizzo e diceva «Questo link non contiene un risultato». Il passaggio d'arrivo si illumina un attimo.
function vai(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(`passo-${id}`);
  if (!el) return;
  e.preventDefault();
  const fermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: fermo ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
  el.classList.remove('arrivo');
  void el.offsetWidth; // fa ripartire l'animazione se si tocca due volte la stessa foto
  el.classList.add('arrivo');
}

// ⚠️ LA GIORNATA CHE PASSA (14/11/2026, Federico: «miglioriamo la qualità dell'animazione sulla routine»). Quando la
// fascia entra nello schermo, un sole la attraversa dall'alba alla notte (e diventa luna); i prodotti di ogni momento
// entrano quando il sole arriva al loro orario, uno dopo l'altro, e i numeri sotto si contano. Una volta sola. Prima
// che il JavaScript parta e con «riduci il movimento» tutto è già al suo posto: l'animazione aggiunge, non nasconde.
const DURATA_SOLE = 2600;
function useGiornataCheParte() {
  const ref = useRef<HTMLElement>(null);
  const [fase, setFase] = useState<'ferma' | 'attesa' | 'via'>('ferma');
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    setFase('attesa');
    const io = new IntersectionObserver((xs) => { if (xs.some((x) => x.isIntersecting)) { setFase('via'); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, fase };
}
// il numero che si conta da zero al suo valore, quando la giornata parte
function Conta({ a, via, ritardo, formato }: { a: number; via: boolean; ritardo: number; formato: (n: number) => string }) {
  const [n, setN] = useState(a);
  useEffect(() => {
    if (!via) return;
    let raf = 0;
    const t0 = performance.now() + ritardo, dur = 1600;
    const passo = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      setN(a * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    setN(0);
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [via, a, ritardo]);
  return <>{formato(n)}</>;
}

function Bolla({ p, piccola, k, ritardo }: { p: Passo; piccola?: boolean; k?: number; ritardo?: number }) {
  const x = p.scelta.consigliato.prodotto;
  return (
    <a href={`#passo-${p.scelta.passaggio.id}`} onClick={(e) => vai(e, p.scelta.passaggio.id)} className={`gi-bolla${p.orario.ogni ? ' gi-ogni' : ''}${piccola ? ' gi-piccola' : ''}`}
      style={ritardo != null ? { ['--d' as string]: `${ritardo}ms` } : undefined}
      title={`${k ? `${k} · ` : ''}${p.scelta.passaggio.nome}${p.orario.ogni ? ` (${p.orario.ogni})` : ''}: ${x.brand} ${x.name}`}>
      <FotoProdotto src={x.image} alt="" variante="mini" />
      {k ? <b aria-hidden="true">{k}</b> : null}
    </a>
  );
}

export default function Giornata({ g }: { g: G }) {
  const mattina = g.momenti.find((m) => m.id === 'mattina')?.passi.length || 0;
  const sera = g.momenti.find((m) => m.id === 'sera')?.passi.length || 0;
  const risparmio = g.costoTop - g.costoAlternative;
  // ⚠️ I NUMERI NON RIPARTONO LA SERA E, SE CI SONO SOLO MATTINA E SERA, UNA ACCANTO ALL'ALTRA (Federico, 30/10/2026):
  // la mattina 1-4, la sera 5-6; senza il pranzo la fascia delle ore lasciava un pomeriggio vuoto in mezzo.
  const due = !g.momenti.some((m) => m.id === 'pranzo' && m.passi.length);
  const pelle = g.passi.some((p) => p.scelta.passaggio.area === 'pelle');
  const momenti = due ? g.momenti.filter((m) => m.id !== 'pranzo') : g.momenti;
  const inizio: Record<string, number> = {};
  momenti.reduce((n, m) => { inizio[m.id] = n; return n + m.passi.length; }, 0);
  const { ref, fase } = useGiornataCheParte();
  // il sole arriva a metà di ogni colonna: lì entrano i prodotti di quel momento
  const arrivo = (c: number) => Math.round(220 + DURATA_SOLE * ((c + 0.5) / momenti.length) * 0.92);
  const fine = arrivo(momenti.length - 1) + 600;
  return (
    <section ref={ref} className={`gi pila gi-${fase}`} aria-labelledby="gi-titolo" style={{ ['--gap' as string]: '18px', ['--sole' as string]: `${DURATA_SOLE}ms` }}>
      <div className="pila" style={{ ['--gap' as string]: '6px' }}>
        <span className="etichetta">Il resoconto</span>
        <h2 id="gi-titolo" className="titolo-2">La tua giornata</h2>
      </div>

      <div className={`gi-fascia${due ? ' gi-due' : ''}`} role="img" aria-label={g.momenti.filter((m) => m.passi.length).map((m) => `${m.nome}, verso le ${m.ora}: ${m.passi.map((p) => p.scelta.passaggio.nome.toLowerCase()).join(', ')}`).join('. ')}>
        <div className="gi-cielo" aria-hidden="true" />
        <div className="gi-sole" aria-hidden="true"><i /></div>
        {!due && <ol className="gi-ore" aria-hidden="true">{ORE.map((h) => <li key={h} style={{ left: `${((h - 6) / 18) * 100}%` }}>{h === 24 ? '0' : h}</li>)}</ol>}
        {/* con il pranzo, tre colonne fisse sulla fascia delle ore; senza, mattina e sera affiancate */}
        {momenti.map((m, c) => (
          <div key={m.id} className={`gi-momento gi-${m.id}${m.passi.length ? '' : ' gi-vuoto'}`} style={{ ['--d' as string]: `${arrivo(c) - 160}ms` }}>
            {m.passi.length > 0 && <>
              <span className="gi-quando"><b>{m.ora}</b>{m.nome.replace(/^(La|A) /, '')}</span>
              <div className="gi-pila">{m.passi.map((p, i) => <Bolla key={p.scelta.passaggio.id} p={p} k={inizio[m.id] + i + 1} ritardo={arrivo(c) + i * 90} />)}</div>
            </>}
          </div>
        ))}
      </div>
      <p className="piccolo">Gli orari sono indicativi. I numeri seguono la giornata{pelle ? ': la mattina dal prodotto più leggero alla protezione solare, poi la sera' : ''}. Tocca un prodotto per vederlo.</p>

      {g.settimana.length > 0 && (
        <div className="pila" style={{ ['--gap' as string]: '10px' }}>
          <span className="titolo-3" style={{ fontSize: 17 }}>Non tutti i giorni</span>
          <ul className="gi-settimana">
            {g.settimana.map((p, i) => (
              <li key={p.scelta.passaggio.id} style={{ ['--d' as string]: `${fine + i * 90}ms` }}><Bolla p={p} piccola /><span><b>{p.scelta.passaggio.nome}</b><small>{p.orario.ogni}</small></span></li>
            ))}
          </ul>
        </div>
      )}

      <dl className="gi-numeri">
        {mattina > 0 && <div><dt>La mattina</dt><dd>{mattina} {mattina === 1 ? 'prodotto' : 'prodotti'}</dd></div>}
        {sera > 0 && <div><dt>La sera</dt><dd>{sera} {sera === 1 ? 'prodotto' : 'prodotti'}</dd></div>}
        {g.minuti > 0 && <div><dt>Al giorno</dt><dd>circa <Conta a={g.minuti} via={fase === 'via'} ritardo={300} formato={(n) => String(Math.round(n))} /> minuti</dd></div>}
        <div><dt>Con le scelte top</dt><dd><Conta a={g.costoTop} via={fase === 'via'} ritardo={420} formato={euro} /></dd></div>
        {g.conAlternativa > 0 && risparmio > 0.5 && <div><dt>Con le alternative</dt><dd><Conta a={g.costoAlternative} via={fase === 'via'} ritardo={540} formato={euro} /></dd></div>}
      </dl>
    </section>
  );
}
