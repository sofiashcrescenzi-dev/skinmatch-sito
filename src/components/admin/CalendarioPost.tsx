'use client';

import { useMemo, useState } from 'react';
import type { Post } from '@/lib/social';

// IL CALENDARIO DEI POST (23/11/2026, Federico: «questa sorta di calendario con i post attaccati sul giorno giusto come
// riassunto fallo pure su elea e skinmatch» e «voglio l'immagine di copertina quadrata in piccolo, un po' più carino»).
// Il mese con ogni post sul giorno in cui esce (data e ora del piano), la miniatura quadrata (public/social/*/mini.webp,
// da scripts/miniature-social.mjs; se manca la copertina), lo stato. Un tocco sul post lo apre nel piano.
// Sotto i 760 px la griglia diventa un elenco di giorni, uno per riga.

const GIORNI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const pad = (n: number) => String(n).padStart(2, '0');
const oggiIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const STATI: Record<string, string> = { pubblicato: 'uscito', saltato: 'saltato', da_pubblicare: 'da pubblicare' };

const CSS = `
.cp-griglia { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.cp-intesta { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; padding: 0 4px; }
.cp-giorno { min-height: 120px; min-width: 0; background: var(--velo); border: 1px solid transparent; border-radius: var(--raggio-piccolo, 12px); padding: 7px; display: flex; flex-direction: column; gap: 6px; container-type: inline-size; }
.cp-giorno.cp-oggi { border-color: var(--accento); background: var(--foglio); }
.cp-giorno.cp-passato { opacity: .75; }
.cp-giorno.cp-fuori { visibility: hidden; }
.cp-num { display: flex; justify-content: space-between; align-items: baseline; font-size: 11px; color: var(--muted); padding: 0 2px; }
.cp-num b { font-family: var(--font-titolo); font-size: 16px; color: var(--testo); }
.cp-num .cp-sett { display: none; }
.cp-lista { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cp-post { all: unset; box-sizing: border-box; display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 4px 8px; align-items: start; width: 100%; min-width: 0; padding: 6px;
  border-radius: 10px; background: var(--foglio); border: 1px solid var(--riga); cursor: pointer; font-size: 12.5px; line-height: 1.3; color: var(--testo); transition: box-shadow .15s, transform .15s; }
.cp-post:hover { box-shadow: 0 8px 22px -12px var(--ombra); transform: translateY(-1px); }
.cp-post:focus-visible { outline: 2px solid var(--accento); outline-offset: 1px; }
.cp-post.cp-uscito { opacity: .62; }
.cp-mini { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; display: block; background: var(--cacao); }
.cp-testo { display: grid; gap: 2px; min-width: 0; }
.cp-riga { display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px; color: var(--muted); }
.cp-titolo { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; font-weight: 600; }
@container (max-width: 150px) { .cp-post { grid-template-columns: minmax(0, 1fr); } .cp-mini { width: 40px; height: 40px; } }
@media (max-width: 760px) {
  .cp-griglia { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .cp-intesta, .cp-giorno.cp-fuori { display: none; }
  .cp-giorno { min-height: 0; display: grid; grid-template-columns: 52px minmax(0, 1fr); column-gap: 8px; align-items: start; padding: 8px; }
  .cp-num { flex-direction: column; align-items: flex-start; }
  .cp-num .cp-sett { display: inline; }
  .cp-post { grid-template-columns: 56px minmax(0, 1fr); font-size: 14px; }
  .cp-mini { width: 56px; height: 56px; }
}
`;

export default function CalendarioPost({ post, statoDi, onApri }: { post: Post[]; statoDi: (p: Post) => string; onApri: (id: string) => void }) {
  const oggi = oggiIso();
  const [mese, setMese] = useState(() => {
    const ora = oggi.slice(0, 7);
    const dopo = post.map((p) => p.data.slice(0, 7)).filter((m) => m >= ora).sort();
    return dopo.includes(ora) || !dopo.length ? ora : dopo[0];
  });
  const [anno, m] = mese.split('-').map(Number);
  const giorni = new Date(anno, m, 0).getDate();
  const vuoti = (new Date(anno, m - 1, 1).getDay() + 6) % 7;
  const perGiorno = useMemo(() => {
    const o: Record<string, Post[]> = {};
    for (const p of post) if (p.data.startsWith(mese)) (o[p.data] = o[p.data] || []).push(p);
    for (const k in o) o[k].sort((a, b) => a.ora.localeCompare(b.ora));
    return o;
  }, [post, mese]);
  const n = Object.values(perGiorno).flat().length;
  const cambia = (d: number) => { const t = new Date(anno, m - 1 + d, 1); setMese(`${t.getFullYear()}-${pad(t.getMonth() + 1)}`); };
  const celle = [];
  for (let k = 0; k < vuoti; k++) celle.push(<div key={`v${k}`} className="cp-giorno cp-fuori" aria-hidden="true" />);
  for (let g = 1; g <= giorni; g++) {
    const giorno = `${mese}-${pad(g)}`, lista = perGiorno[giorno] || [];
    celle.push(
      <div key={giorno} className={['cp-giorno', giorno < oggi && 'cp-passato', giorno === oggi && 'cp-oggi'].filter(Boolean).join(' ')}>
        <div className="cp-num"><span><span className="cp-sett">{GIORNI[(vuoti + g - 1) % 7]} </span><b>{g}</b></span></div>
        {lista.length > 0 && (
          <div className="cp-lista">
            {lista.map((p) => {
              const s = statoDi(p);
              return (
                <button key={p.id} type="button" className={`cp-post${s === 'pubblicato' ? ' cp-uscito' : ''}`} onClick={() => onApri(p.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="cp-mini" src={`${p.base}/mini.webp`} alt="" loading="lazy" decoding="async"
                    onError={(e) => { const i = e.currentTarget; if (!i.dataset.ripiego) { i.dataset.ripiego = '1'; i.src = `${p.base}/${p.copertina}`; } }} />
                  <span className="cp-testo">
                    <span className="cp-riga"><span>{p.ora}</span><span>{p.tipo === 'video' ? '▶ video' : '▦ carosello'}</span><span>{STATI[s] || s}</span>{p.sofia && <span>Sofia</span>}</span>
                    <span className="cp-titolo">{p.titolo}</span>
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
    <section className="pila" style={{ ['--gap' as string]: '10px' }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button" className="chip" onClick={() => cambia(-1)} aria-label="Mese prima">‹</button>
          <h2 className="titolo-3" style={{ margin: 0, minWidth: '9ch', textAlign: 'center' }}>{MESI[m - 1]} {anno}</h2>
          <button type="button" className="chip" onClick={() => cambia(1)} aria-label="Mese dopo">›</button>
          {mese !== oggi.slice(0, 7) && <button type="button" className="chip" onClick={() => setMese(oggi.slice(0, 7))}>Oggi</button>}
        </div>
        <span className="piccolo">{n} post in {MESI[m - 1]}</span>
      </div>
      <p className="piccolo">Ogni post sul giorno in cui esce. Toccalo per aprirlo nel piano, coi file e le didascalie.</p>
      <div className="cp-griglia">
        {GIORNI.map((g) => <div key={g} className="cp-intesta">{g}</div>)}
        {celle}
      </div>
    </section>
  );
}
