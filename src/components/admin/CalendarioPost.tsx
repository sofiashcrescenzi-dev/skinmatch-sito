'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/lib/social';
import { invia } from './base';

// IL CALENDARIO DEI POST (23/11/2026, Federico: «questa sorta di calendario con i post attaccati sul giorno giusto come
// riassunto fallo pure su elea e skinmatch» e «voglio l'immagine di copertina quadrata in piccolo, un po' più carino»).
// ⚠️ 24/11/2026, Federico: «se ci clicco sopra da telefono me lo apre, non me lo fa spostare». Ora è come quello di
// Agoranomos: i post si spostano.
// - Sul computer si trascinano da un giorno all'altro.
// - Sul telefono (e anche sul computer) si tocca un post: in basso compare la sua barra, poi si tocca il giorno nuovo.
//   Dalla barra si cambiano l'ora e le reti su cui è già programmato, e si apre il post nel piano (file e didascalie).
// Il giorno di partenza è quello del piano (src/data/social-post.json); lo spostamento sta su D1 (social_calendario,
// /api/admin/social-calendario). La miniatura quadrata è public/social/*/mini.webp (scripts/miniature-social.mjs; se
// manca, la copertina). Sotto i 760 px la griglia diventa un elenco di giorni, uno per riga.

export type Cal = { giorno?: string | null; ora?: string | null; reti?: Record<string, string> };
const GIORNI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const RETI: [string, string, string][] = [['instagram', 'IG', 'Instagram'], ['tiktok', 'TT', 'TikTok'], ['youtube', 'YT', 'YouTube']];
const pad = (n: number) => String(n).padStart(2, '0');
const oggiIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const giornoLungo = (g: string) => { const [a, m, d] = g.split('-').map(Number); return `${GIORNI[(new Date(a, m - 1, d).getDay() + 6) % 7]} ${d} ${MESI[m - 1]}`; };
const STATI: Record<string, string> = { pubblicato: 'uscito', saltato: 'saltato', da_pubblicare: 'da pubblicare' };
// i video vanno su Instagram, TikTok e YouTube; i caroselli su Instagram e TikTok (19/11: niente Threads)
export const retiDi = (p: Post) => (p.tipo === 'video' ? ['instagram', 'tiktok', 'youtube'] : ['instagram', 'tiktok']);
export const quandoDi = (p: Post, c?: Cal) => {
  const giorno = c?.giorno || p.data, ora = c?.ora || p.ora;
  return { giorno, ora, spostato: giorno !== p.data || ora !== p.ora };
};

const CSS = `
.cp-griglia { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.cp-intesta { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; padding: 0 4px; }
.cp-giorno { min-height: 120px; min-width: 0; background: var(--velo); border: 1px solid transparent; border-radius: var(--raggio-piccolo, 12px); padding: 7px; display: flex; flex-direction: column; gap: 6px;
  container-type: inline-size; transition: background .12s, border-color .12s; }
.cp-giorno.cp-oggi { border-color: var(--accento); background: var(--foglio); }
.cp-giorno.cp-passato { opacity: .75; }
.cp-giorno.cp-fuori { visibility: hidden; }
.cp-giorno.cp-meta { cursor: copy; }
.cp-giorno.cp-meta:hover, .cp-giorno.cp-sopra { border-color: var(--accento); background: var(--foglio); }
.cp-num { display: flex; justify-content: space-between; align-items: baseline; font-size: 11px; color: var(--muted); padding: 0 2px; }
.cp-num b { font-family: var(--font-titolo); font-size: 16px; color: var(--testo); }
.cp-num .cp-sett { display: none; }
.cp-lista { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cp-post { all: unset; box-sizing: border-box; display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 4px 8px; align-items: start; width: 100%; min-width: 0; padding: 6px;
  border-radius: 10px; background: var(--foglio); border: 1px solid var(--riga); cursor: grab; font-size: 12.5px; line-height: 1.3; color: var(--testo);
  transition: box-shadow .15s, transform .15s; -webkit-touch-callout: none; touch-action: manipulation; }
.cp-post:hover { box-shadow: 0 8px 22px -12px var(--ombra); transform: translateY(-1px); }
.cp-post:active { cursor: grabbing; }
.cp-post:focus-visible { outline: 2px solid var(--accento); outline-offset: 1px; }
.cp-post.cp-scelto { border-color: var(--accento); box-shadow: 0 0 0 2px var(--accento); }
.cp-post.cp-uscito { opacity: .62; }
.cp-mini { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; display: block; background: var(--cacao); }
.cp-testo { display: grid; gap: 2px; min-width: 0; }
.cp-riga { display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px; color: var(--muted); }
.cp-titolo { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; font-weight: 600; }
.cp-reti { grid-column: 2; display: flex; gap: 4px; flex-wrap: wrap; align-items: center; font-size: 10.5px; color: var(--muted); }
.cp-rete { padding: 1px 6px; border-radius: 999px; border: 1px solid var(--riga); }
.cp-rete.cp-si { background: var(--testo); border-color: var(--testo); color: var(--foglio); }
.cp-barra { position: sticky; bottom: calc(10px + env(safe-area-inset-bottom)); z-index: 20; display: grid; gap: 10px; background: var(--foglio); border: 1px solid var(--accento);
  border-radius: 14px; padding: 12px 14px; box-shadow: 0 14px 34px -14px var(--ombra); }
.cp-barra-titolo { font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cp-barra-aiuto { margin: 0; font-weight: 600; font-size: 14px; }
.cp-barra input[type=time] { font: inherit; font-size: 16px; min-height: 44px; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--riga); background: var(--velo); color: var(--testo); }
@container (max-width: 150px) { .cp-post { grid-template-columns: minmax(0, 1fr); } .cp-reti { grid-column: 1; } .cp-mini { width: 40px; height: 40px; } }
@media (max-width: 760px) {
  .cp-griglia { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .cp-intesta, .cp-giorno.cp-fuori { display: none; }
  .cp-giorno { min-height: 0; display: grid; grid-template-columns: 52px minmax(0, 1fr); column-gap: 8px; align-items: start; padding: 8px; }
  .cp-giorno.cp-vuoto { min-height: 44px; padding: 6px 8px; }
  .cp-num { flex-direction: column; align-items: flex-start; }
  .cp-num .cp-sett { display: inline; }
  .cp-post { grid-template-columns: 56px minmax(0, 1fr); font-size: 14px; }
  .cp-mini { width: 56px; height: 56px; }
  .cp-barra { gap: 8px; padding: 10px 12px; }
  .cp-barra-titolo { -webkit-line-clamp: 1; }
}
`;

export default function CalendarioPost({ post, statoDi, cal, poi, onApri }: {
  post: Post[]; statoDi: (p: Post) => string; cal: Record<string, Cal>; poi: () => void; onApri: (id: string) => void;
}) {
  const oggi = oggiIso();
  const [locale, setLocale] = useState<Record<string, Cal>>({});   // gli spostamenti appena fatti, prima che D1 risponda
  const calVivo = useMemo(() => {
    const o: Record<string, Cal> = { ...cal };
    for (const [id, c] of Object.entries(locale)) o[id] = { ...(o[id] || {}), ...c };
    return o;
  }, [cal, locale]);
  const conData = useMemo(() => post.map((p) => ({ p, ...quandoDi(p, calVivo[p.id]) })), [post, calVivo]);
  // il mese di partenza: questo, o il primo dopo con dei post
  const [mese, setMese] = useState(() => {
    const ora = oggi.slice(0, 7);
    const dopo = post.map((p) => quandoDi(p, cal[p.id]).giorno.slice(0, 7)).filter((m) => m >= ora).sort();
    return dopo.includes(ora) || !dopo.length ? ora : dopo[0];
  });
  const [scelto, setScelto] = useState<string | null>(null);
  const [trascinato, setTrascinato] = useState<string | null>(null);
  const [sopra, setSopra] = useState<string | null>(null);
  const [errore, setErrore] = useState('');
  const [anno, m] = mese.split('-').map(Number);
  const giorni = new Date(anno, m, 0).getDate();
  const vuoti = (new Date(anno, m - 1, 1).getDay() + 6) % 7;
  const perGiorno = useMemo(() => {
    const o: Record<string, typeof conData> = {};
    for (const x of conData) if (x.giorno.startsWith(mese)) (o[x.giorno] = o[x.giorno] || []).push(x);
    for (const k in o) o[k].sort((a, b) => a.ora.localeCompare(b.ora));
    return o;
  }, [conData, mese]);
  const nelMese = Object.values(perGiorno).flat();
  const programmati = nelMese.filter((x) => retiDi(x.p).every((k) => calVivo[x.p.id]?.reti?.[k])).length;
  const cambia = (d: number) => { const t = new Date(anno, m - 1 + d, 1); setMese(`${t.getFullYear()}-${pad(t.getMonth() + 1)}`); };
  const sceltoX = conData.find((x) => x.p.id === scelto) || null;

  const salva = async (p: Post, cambi: { giorno?: string | null; ora?: string | null; reti?: Record<string, boolean> }) => {
    setErrore('');
    const prima = locale[p.id];
    const { reti: retiCambi, ...resto } = cambi;
    const reti = retiCambi ? Object.fromEntries(Object.entries({ ...(calVivo[p.id]?.reti || {}), ...Object.fromEntries(Object.entries(retiCambi).map(([k, v]) => [k, v ? new Date().toISOString() : ''])) }).filter(([, v]) => v)) : undefined;
    setLocale((l) => ({ ...l, [p.id]: { ...(l[p.id] || {}), ...resto, ...(reti ? { reti } : {}) } }));
    try { await invia('/api/admin/social-calendario', { id: p.id, ...cambi }); poi(); }
    catch (e) { setErrore((e as Error).message); setLocale((l) => ({ ...l, [p.id]: prima })); }
  };
  const sposta = (id: string, giorno: string) => {
    const x = conData.find((y) => y.p.id === id);
    if (!x || x.giorno === giorno) return;
    // tornato sul giorno del piano: niente spostamento da ricordare
    salva(x.p, { giorno: giorno === x.p.data ? null : giorno });
  };

  const celle = [];
  for (let k = 0; k < vuoti; k++) celle.push(<div key={`v${k}`} className="cp-giorno cp-fuori" aria-hidden="true" />);
  for (let g = 1; g <= giorni; g++) {
    const giorno = `${mese}-${pad(g)}`, lista = perGiorno[giorno] || [];
    const cls = ['cp-giorno', giorno < oggi && 'cp-passato', giorno === oggi && 'cp-oggi', scelto && 'cp-meta', sopra === giorno && 'cp-sopra', !lista.length && 'cp-vuoto'].filter(Boolean).join(' ');
    celle.push(
      <div key={giorno} className={cls} role={scelto ? 'button' : undefined} tabIndex={scelto ? 0 : undefined}
        aria-label={scelto ? `Sposta qui: ${giornoLungo(giorno)}` : undefined}
        onClick={() => { if (scelto) sposta(scelto, giorno); }}
        onKeyDown={(e) => { if (scelto && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sposta(scelto, giorno); } }}
        onDragOver={(e) => { if (trascinato) { e.preventDefault(); if (sopra !== giorno) setSopra(giorno); } }}
        onDragLeave={() => setSopra((s) => (s === giorno ? null : s))}
        onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || trascinato; setSopra(null); setTrascinato(null); if (id) sposta(id, giorno); }}>
        <div className="cp-num"><span><span className="cp-sett">{GIORNI[(vuoti + g - 1) % 7]} </span><b>{g}</b></span></div>
        {lista.length > 0 && (
          <div className="cp-lista">
            {lista.map((x) => {
              const { p } = x, s = statoDi(p), reti = calVivo[p.id]?.reti || {};
              return (
                <button key={p.id} type="button" draggable className={`cp-post${s === 'pubblicato' ? ' cp-uscito' : ''}${scelto === p.id ? ' cp-scelto' : ''}`} aria-pressed={scelto === p.id}
                  onClick={(e) => { e.stopPropagation(); setScelto(scelto === p.id ? null : p.id); }}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; setTrascinato(p.id); setScelto(null); }}
                  onDragEnd={() => { setTrascinato(null); setSopra(null); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="cp-mini" src={`${p.base}/mini.webp`} alt="" loading="lazy" decoding="async" draggable={false}
                    onError={(e) => { const i = e.currentTarget; if (!i.dataset.ripiego) { i.dataset.ripiego = '1'; i.src = `${p.base}/${p.copertina}`; } }} />
                  <span className="cp-testo">
                    <span className="cp-riga"><span>{x.ora}</span><span>{p.tipo === 'video' ? '▶ video' : '▦ carosello'}</span>{s !== 'da_pubblicare' && <span>{STATI[s] || s}</span>}{p.sofia && <span>Sofia</span>}</span>
                    <span className="cp-titolo">{p.titolo}</span>
                  </span>
                  <span className="cp-reti">
                    {retiDi(p).map((k) => { const r = RETI.find(([kk]) => kk === k)!; return <span key={k} className={`cp-rete${reti[k] ? ' cp-si' : ''}`} title={`${r[2]}${reti[k] ? ': programmato' : ''}`}>{r[1]}</span>; })}
                    {x.spostato && <span>spostato</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>,
    );
  }
  return (
    <section className="pila" style={{ ['--gap' as string]: '10px', minWidth: 0 }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button" className="chip" onClick={() => cambia(-1)} aria-label="Mese prima">‹</button>
          <h2 className="titolo-3" style={{ margin: 0, minWidth: '9ch', textAlign: 'center' }}>{MESI[m - 1]} {anno}</h2>
          <button type="button" className="chip" onClick={() => cambia(1)} aria-label="Mese dopo">›</button>
          {mese !== oggi.slice(0, 7) && <button type="button" className="chip" onClick={() => setMese(oggi.slice(0, 7))}>Oggi</button>}
        </div>
        <span className="piccolo">{nelMese.length} post in {MESI[m - 1]} · {programmati} programmati su tutte le reti</span>
      </div>
      <p className="piccolo">Trascina un post su un altro giorno, oppure toccalo e poi tocca il giorno. IG, TT e YT si accendono quando il post è programmato su quella rete.</p>
      {errore && <p className="piccolo" role="alert" style={{ color: 'var(--attenzione)' }}>Non ho salvato: {errore}</p>}
      <div className="cp-griglia">
        {GIORNI.map((g) => <div key={g} className="cp-intesta">{g}</div>)}
        {celle}
      </div>
      {sceltoX && <Barra key={sceltoX.p.id} x={sceltoX} stato={statoDi(sceltoX.p)} reti={calVivo[sceltoX.p.id]?.reti || {}} salva={(c) => salva(sceltoX.p, c)} chiudi={() => setScelto(null)} apri={() => onApri(sceltoX.p.id)} />}
    </section>
  );
}

// LA BARRA DEL POST SCELTO: ferma in fondo allo schermo mentre si scorre il mese (sul telefono il giorno si cerca
// scorrendo); il giorno, l'ora, le reti già programmate, il post da aprire nel piano
function Barra({ x, stato, reti, salva, chiudi, apri }: {
  x: { p: Post; giorno: string; ora: string; spostato: boolean }; stato: string; reti: Record<string, string>;
  salva: (c: { giorno?: string | null; ora?: string | null; reti?: Record<string, boolean> }) => void; chiudi: () => void; apri: () => void;
}) {
  const { p } = x;
  const [ora, setOra] = useState(x.ora);
  const tutte = retiDi(p);
  return (
    <div className="cp-barra" role="region" aria-label="Il post scelto">
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div className="piccolo">{giornoLungo(x.giorno)} · {x.ora}{stato !== 'da_pubblicare' ? ` · ${STATI[stato] || stato}` : ''}</div>
          <div className="cp-barra-titolo">{p.titolo}</div>
        </div>
        <button type="button" className="chip" onClick={chiudi}>Fatto</button>
      </div>
      <p className="cp-barra-aiuto">Tocca un altro giorno per spostarlo.</p>
      <div className="riga-chip" style={{ alignItems: 'center' }}>
        <label className="piccolo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Ora
          <input type="time" value={ora} onChange={(e) => setOra(e.target.value)} onBlur={() => ora && ora !== x.ora && salva({ ora: ora === p.ora ? null : ora })} />
        </label>
        {x.spostato && <button type="button" className="chip" onClick={() => { setOra(p.ora); salva({ giorno: null, ora: null }); }}>Rimetti {p.data.slice(8, 10)}/{p.data.slice(5, 7)} {p.ora}</button>}
      </div>
      <div className="riga-chip" style={{ alignItems: 'center' }}>
        <span className="piccolo">Programmato su</span>
        {tutte.map((k) => { const r = RETI.find(([kk]) => kk === k)!; return <button key={k} type="button" className="chip" aria-pressed={!!reti[k]} aria-label={`${r[2]}${reti[k] ? ': programmato' : ''}`} onClick={() => salva({ reti: { [k]: !reti[k] } })}>{r[1]}{reti[k] ? ' ✓' : ''}</button>; })}
        <button type="button" className="chip" onClick={apri} style={{ marginLeft: 'auto' }}>Apri nel piano →</button>
      </div>
    </div>
  );
}
