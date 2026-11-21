'use client';
// COME FUNZIONA, CHE SI MUOVE (21/11/2026, Federico: «anche sul come funziona, è molto statico. So che possiamo fare molto
// meglio con le attuali capacità»). Tre passaggi uniti da un filo che si disegna quando arrivano; ognuno ha la sua scena:
//   1. le risposte che si scelgono una dopo l'altra, allo specchio
//   2. il profilo che si compone: il tondo nei toni dei fototipi si riempie e compare il nome
//   3. la routine che si monta: mattina e sera, un passaggio alla volta
// Le animazioni sono CSS («.come-*» in globals.css) e partono quando la sezione entra nello schermo; senza JavaScript o con
// «riduci movimento» si vede direttamente la scena finita.
import { useEffect, useRef, useState } from 'react';

const PASSI = [
  ['Rispondi su quello che vedi', 'Com’è la fronte a metà giornata, se la pelle tira dopo averla lavata, se arrossa. Nessuna foto, nessuna email.'],
  ['Leggi la tua pelle', 'Ti diamo un profilo con un nome semplice e ti mostriamo le risposte che lo hanno deciso.'],
  ['Ricevi la routine', 'Mattina e sera, un passaggio alla volta: a cosa serve, il prodotto scelto per te e un’alternativa.'],
];

function Scena({ n }: { n: number }) {
  if (n === 0) return (
    <div className="come-scena come-domande" aria-hidden="true">
      <span className="come-domanda">A metà giornata, la fronte…</span>
      {['è opaca', 'luccica un po’', 'è lucida'].map((t, i) => <span key={t} className={`come-risposta${i === 1 ? ' scelta' : ''}`} style={{ ['--i' as string]: i }}>{t}</span>)}
    </div>
  );
  if (n === 1) return (
    <div className="come-scena come-profilo" aria-hidden="true">
      <svg viewBox="0 0 120 120" width="96" height="96"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--riga)" strokeWidth="12" />
        <circle className="come-anello" cx="60" cy="60" r="50" fill="none" stroke="url(#come-toni)" strokeWidth="12" strokeLinecap="round" transform="rotate(-90 60 60)" />
        <defs><linearGradient id="come-toni" x1="0" x2="1"><stop offset="0" stopColor="var(--f2)" /><stop offset=".5" stopColor="var(--f4)" /><stop offset="1" stopColor="var(--f6)" /></linearGradient></defs></svg>
      <span className="come-nome"><b>Mista e sensibile</b><span>tre risposte l’hanno deciso</span></span>
    </div>
  );
  return (
    <div className="come-scena come-routine" aria-hidden="true">
      {[['☀', 'Detergente delicato'], ['☀', 'Siero alla niacinamide'], ['☀', 'Protezione SPF 50'], ['☾', 'Crema barriera']].map(([s, t], i) => (
        <span key={t} className="come-passo" style={{ ['--i' as string]: i }}><i>{s}</i>{t}</span>
      ))}
    </div>
  );
}

export default function ComeFunziona() {
  const rif = useRef<HTMLOListElement>(null);
  // ⚠️ senza JavaScript (o prima che parta) la scena è già finita e si vede tutto: il JavaScript la nasconde («attesa»)
  // solo se la sezione è ancora sotto, e la fa partire («vista») quando arriva.
  const [stato, setStato] = useState<'' | 'attesa' | 'vista'>('');
  useEffect(() => {
    const el = rif.current; if (!el || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top > window.innerHeight) setStato('attesa');
    const o = new IntersectionObserver((v) => { if (v[0].isIntersecting) { setStato('vista'); o.disconnect(); } }, { threshold: 0.2 });
    o.observe(el); return () => o.disconnect();
  }, []);
  return (
    <ol ref={rif} className={`come-passi${stato ? ' ' + stato : ''}`}>
      {PASSI.map(([t, d], i) => (
        <li key={t} className="come-carta" style={{ ['--i' as string]: i }}>
          <span className="come-numero">{i + 1}</span>
          <Scena n={i} />
          <span className="titolo-3">{t}</span>
          <span className="piccolo" style={{ fontSize: 15 }}>{d}</span>
        </li>
      ))}
    </ol>
  );
}
