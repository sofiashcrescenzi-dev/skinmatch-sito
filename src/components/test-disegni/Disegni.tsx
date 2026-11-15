// I DISEGNI ANIMATI DEL TEST (15/11/2026, Federico: «ora che siete skillati con Remotion, perché non mettete un bel disegno
// animato sopra ogni domanda del test correlato alla domanda?»). Una composizione Remotion sola, 960×400, che disegna
// la scena della domanda: la zona T che luccica, la crema che entra nella pelle, la forfora che cade, la luna del sonno…
// Tutto dipende dal fotogramma (useCurrentFrame) e gira in tondo ogni 4 secondi; i colori sono la scala dei fototipi e i
// due toni del marchio (globals.css). Pezzi comuni (Viso, Pelle, Capelli, Bottiglia) e una scena per domanda; una domanda
// che non ha la sua scena prende quella del suo argomento (SCENA_DI, in fondo).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const DURATA = 120;
export const LARGO = 960, ALTO = 400;
const F = ['#f6ddcc', '#ebc3a6', '#d29e78', '#a8714e', '#7b4b33', '#4a2c1f'];
const CACAO = '#2e1c15', LATTE = '#faf6f4', VELO = '#f1e9e4', BENE = '#3e5f3a', ROSSO = '#c8644f', LUCE = '#fffaf2', CIELO = '#cfe0ea';
const SW = 7; // il tratto, come le icone del sito (1,75 su 24) ingrandito

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const morbido = (x: number) => { const t = c01(x); return t * t * (3 - 2 * t); };
const tra = (t: number, a: number, b: number) => morbido((t - a) / (b - a));
const onda = (f: number, p = 60) => (1 - Math.cos((f / p) * Math.PI * 2)) / 2;
const tratto = { stroke: CACAO, strokeWidth: SW, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

type P = { f: number; t: number };

// ── i pezzi comuni ────────────────────────────────────────────────────────────────────────────────────────────────────
function Viso({ tz = 0, guance = 0, rossore = 0, tensione = 0, macchie = 0, brufoli = 0, pelle = 1, x = 480 }: { tz?: number; guance?: number; rossore?: number; tensione?: number; macchie?: number; brufoli?: number; pelle?: number; x?: number }) {
  return (
    <g transform={`translate(${x} 205)`}>
      <ellipse cx={0} cy={0} rx={118} ry={148} fill={F[pelle]} />
      {/* la zona T: fronte e naso che luccicano */}
      <g opacity={tz}>
        <ellipse cx={0} cy={-92} rx={58} ry={20} fill={LUCE} opacity={0.85} />
        <rect x={-13} y={-74} width={26} height={92} rx={13} fill={LUCE} opacity={0.85} />
      </g>
      <g opacity={guance}>
        <ellipse cx={-62} cy={34} rx={26} ry={18} fill={LUCE} opacity={0.85} />
        <ellipse cx={62} cy={34} rx={26} ry={18} fill={LUCE} opacity={0.85} />
      </g>
      <g opacity={rossore}>
        <ellipse cx={-62} cy={36} rx={34} ry={22} fill={ROSSO} opacity={0.55} />
        <ellipse cx={62} cy={36} rx={34} ry={22} fill={ROSSO} opacity={0.55} />
      </g>
      {[[-50, -40], [44, -52], [-30, 66], [58, 74], [-70, 6]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={7 + (i % 2) * 3} fill={F[4]} opacity={macchie * (0.35 + i * 0.1)} />)}
      {[[-46, 52], [40, -20], [-18, -104], [70, 50], [10, 92]].slice(0, Math.round(brufoli)).map(([a, b], i) => <circle key={i} cx={a} cy={b} r={7} fill={ROSSO} opacity={0.85} />)}
      {/* occhi chiusi, naso, sorriso */}
      <path d="M-58 -18 q14 10 28 0 M30 -18 q14 10 28 0" {...tratto} strokeWidth={6} />
      <path d="M-28 70 q28 18 56 0" {...tratto} strokeWidth={6} />
      {/* la pelle che tira: archetti tesi sulle guance */}
      <g opacity={tensione}>
        <path d="M-102 20 q14 -8 28 0 M-104 44 q14 -8 28 0 M74 20 q14 -8 28 0 M76 44 q14 -8 28 0" {...tratto} strokeWidth={5} />
      </g>
    </g>
  );
}

// la pelle vista da vicino: una fascia ondulata con le cellule
function Pelle({ f, y = 260, colore = F[1] }: { f: number; y?: number; colore?: string }) {
  const d = Array.from({ length: 13 }, (_, i) => { const x = 60 + i * 70; return `${i ? 'L' : 'M'}${x} ${y + Math.sin(i * 0.9 + f / 40) * 6}`; }).join(' ');
  return (
    <g>
      <path d={`${d} L900 400 L60 400 Z`} fill={colore} />
      <path d={d} {...tratto} />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${105 + i * 75} ${y + 40} q20 14 40 0`} {...tratto} strokeWidth={4} opacity={0.35} />)}
    </g>
  );
}

function Bottiglia({ x, y, alto = 150, colore = F[2], tappo = CACAO, s = 1 }: { x: number; y: number; alto?: number; colore?: string; tappo?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-34} y={-alto} width={68} height={alto} rx={18} fill={colore} stroke={CACAO} strokeWidth={SW} />
      <rect x={-18} y={-alto - 34} width={36} height={34} rx={6} fill={tappo} />
      <rect x={-22} y={-alto * 0.62} width={44} height={alto * 0.3} rx={6} fill={LATTE} opacity={0.9} />
    </g>
  );
}

function Capelli({ f, lucido = 0, n = 9, base = 330 }: { f: number; lucido?: number; n?: number; base?: number }) {
  return (
    <g>
      <path d={`M120 ${base} Q480 ${base - 70} 840 ${base} L840 400 L120 400 Z`} fill={F[1]} />
      {Array.from({ length: n }, (_, i) => {
        const x = 200 + i * (560 / (n - 1)), sw = Math.sin(f / 30 + i) * 10;
        return <path key={i} d={`M${x} ${base - 40 + Math.abs(i - (n - 1) / 2) * 6} q${sw} -90 ${sw * 2 + 6} -180`} {...tratto} stroke={F[5]} strokeWidth={9} />;
      })}
      <path d={`M190 ${base - 22} Q480 ${base - 92} 770 ${base - 22}`} stroke={LUCE} strokeWidth={14} strokeLinecap="round" fill="none" opacity={lucido} />
    </g>
  );
}

function Sole({ x, y, r = 46, f = 0 }: { x: number; y: number; r?: number; f?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${f / 2})`}>
      <circle r={r} fill="#ffd9a8" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M0 ${-r - 14} L0 ${-r - 34}`} {...tratto} stroke="#e8a75c" transform={`rotate(${i * 45})`} />)}
    </g>
  );
}
function Luna({ x, y, r = 50 }: { x: number; y: number; r?: number }) {
  return <g><circle cx={x} cy={y} r={r} fill={F[1]} /><circle cx={x + r * 0.45} cy={y - r * 0.25} r={r * 0.9} fill={VELO} /></g>;
}
const Testo = ({ x, y, t, s = 44, colore = CACAO, op = 1 }: { x: number; y: number; t: string; s?: number; colore?: string; op?: number }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="var(--font-titoli), system-ui, sans-serif" fontWeight={700} fontSize={s} fill={colore} opacity={op}>{t}</text>
);

// ── una scena per domanda ─────────────────────────────────────────────────────────────────────────────────────────────
const SCENE: Record<string, (p: P) => React.ReactNode> = {
  genere: ({ f }) => (
    <g>{[0, 1, 2].map((i) => { const su = Math.sin(f / 12 + i * 1.6) * 8; const x = 300 + i * 180; return (
      <g key={i} transform={`translate(${x} ${su})`}>
        <circle cx={0} cy={150} r={46} fill={F[1 + i]} />
        <path d="M-78 330 q0 -110 78 -110 q78 0 78 110 Z" fill={F[1 + i]} />
      </g>); })}</g>
  ),
  eta: ({ t }) => {
    const k = Math.floor(t * 5) % 5, anni = ['20', '30', '40', '50', '60'];
    return (
      <g>
        <rect x={360} y={70} width={240} height={250} rx={28} fill={LATTE} stroke={CACAO} strokeWidth={SW} />
        <rect x={360} y={70} width={240} height={64} rx={28} fill={F[3]} />
        <path d="M410 50 v40 M550 50 v40" {...tratto} />
        <Testo x={480} y={262} t={anni[k]} s={110} />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={392 + i * 44} cy={350} r={8} fill={i <= k ? CACAO : F[0]} />)}
      </g>
    );
  },
  tzona: ({ f }) => <Viso tz={0.25 + onda(f, 60) * 0.75} />,
  guance: ({ f }) => <Viso guance={0.2 + onda(f, 60) * 0.8} />,
  pori: ({ f, t }) => {
    const x = 220 + morbido(t < 0.5 ? t * 2 : 2 - t * 2) * 520;
    return (
      <g>
        <Pelle f={f} y={230} />
        {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={110 + i * 44} cy={300 + (i % 3) * 22} r={4} fill={F[4]} opacity={0.5} />)}
        <g transform={`translate(${x} 240)`}>
          <circle r={74} fill={LATTE} opacity={0.55} stroke={CACAO} strokeWidth={SW} />
          {[[-26, 10], [12, -14], [24, 26], [-6, 38]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={9} fill={F[4]} />)}
          <path d="M52 52 L104 104" {...tratto} strokeWidth={14} />
        </g>
      </g>
    );
  },
  tira: ({ f, t }) => (
    <g>
      <Viso tensione={tra(t, 0.4, 0.6) * (1 - tra(t, 0.9, 1))} />
      {[0, 1, 2].map((i) => { const k = c01(t * 2.4 - i * 0.25); return <path key={i} d={`M${380 + i * 100} ${120 + k * -60} q10 18 0 28 q-10 -10 0 -28`} fill={CIELO} opacity={(1 - k) * (t < 0.5 ? 1 : 0)} />; })}
    </g>
  ),
  spella: ({ f }) => (
    <g>
      <Pelle f={f} y={250} />
      {Array.from({ length: 6 }, (_, i) => { const k = ((f + i * 20) % 120) / 120; return (
        <path key={i} d="M-22 0 l22 -8 l20 10 l-20 8 Z" fill={F[0]} stroke={CACAO} strokeWidth={3}
          transform={`translate(${190 + i * 110 + Math.sin(k * 6) * 14} ${250 - k * 150}) rotate(${k * 200})`} opacity={1 - k} />); })}
    </g>
  ),
  crema: ({ f, t }) => {
    const cade = tra(t, 0, 0.3), entra = tra(t, 0.35, 0.8);
    return (
      <g>
        <Pelle f={f} y={250} />
        <ellipse cx={480} cy={250 - 2} rx={70 * (1 - entra) + 4} ry={18 * (1 - entra) + 2} fill={LATTE} opacity={cade >= 1 ? 1 - entra * 0.9 : 0} />
        <path d="M0 -38 C22 -6 26 10 0 22 C-26 10 -22 -6 0 -38 Z" fill={LATTE} stroke={CACAO} strokeWidth={5} transform={`translate(480 ${40 + cade * 190})`} opacity={cade < 1 ? 1 : 0} />
        {[0, 1, 2].map((i) => <path key={i} d={`M${420 + i * 60} ${300 + entra * 40} v20`} {...tratto} stroke={LUCE} opacity={entra * (1 - tra(t, 0.85, 1))} />)}
      </g>
    );
  },
  nuovo: ({ f, t }) => (
    <g>
      <Viso x={560} rossore={tra(t, 0.35, 0.55) * (1 - tra(t, 0.85, 1)) * 0.9} />
      <g transform={`translate(250 300) rotate(${-30 * tra(t, 0, 0.25) * (1 - tra(t, 0.4, 0.6))})`}><Bottiglia x={0} y={0} colore={F[0]} s={0.9} /></g>
      <circle cx={0} cy={0} r={10} fill={LATTE} stroke={CACAO} strokeWidth={4} transform={`translate(${310 + tra(t, 0.15, 0.35) * 180} ${150 + Math.sin(tra(t, 0.15, 0.35) * Math.PI) * -60})`} opacity={t > 0.15 && t < 0.36 ? 1 : 0} />
    </g>
  ),
  rossore: ({ f, t }) => {
    const caldo = t < 0.5;
    return (
      <g>
        <Viso rossore={Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.45 + 0.5} x={500} />
        {caldo ? <Sole x={210} y={120} f={f} /> : (
          <g transform="translate(210 120)">{[0, 60, 120].map((a) => <path key={a} d="M0 -50 L0 50" {...tratto} stroke="#7aa6c2" transform={`rotate(${a + f / 3})`} />)}</g>)}
      </g>
    );
  },
  brufoli: ({ f, t }) => <Viso brufoli={c01(t * 1.25) * 5} pelle={1} />,
  macchie: ({ f, t }) => (<g><Viso macchie={0.3 + onda(f, 120) * 0.7} x={540} /><Sole x={220} y={110} f={f} /></g>),
  condizioni: ({ t }) => (
    <g>
      <rect x={350} y={60} width={260} height={290} rx={24} fill={LATTE} stroke={CACAO} strokeWidth={SW} />
      <rect x={430} y={40} width={100} height={44} rx={12} fill={F[3]} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M390 ${150 + i * 64} l16 16 l30 -34`} {...tratto} stroke={BENE} strokeDasharray={80} strokeDashoffset={80 * (1 - tra(t, 0.1 + i * 0.2, 0.3 + i * 0.2))} />
          <path d={`M460 ${158 + i * 64} h110`} {...tratto} strokeWidth={6} opacity={0.4} />
        </g>
      ))}
    </g>
  ),
  gravidanza: ({ f }) => {
    const s = 1 + onda(f, 30) * 0.06;
    return (
      <g transform={`translate(480 200) scale(${s * 9})`}>
        <path d="M12 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM9.5 21v-5.5l-1.5-2 2-3.5h3.5c2.5 0 4 1.8 4 4s-1.6 3.6-3.5 3.6V21" transform="translate(-12 -12)" fill="none" stroke={CACAO} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={1.8} cy={2.3} r={2.2} fill={F[1]} opacity={0.9} />
      </g>
    );
  },
  menopausa: ({ f }) => (
    <g>
      {[0, 1, 2].map((k) => <path key={k} d={Array.from({ length: 60 }, (_, i) => `${i ? 'L' : 'M'}${120 + i * 12} ${200 + Math.sin(i / 4 + f / 15 + k) * (60 - k * 18)}`).join(' ')} {...tratto} stroke={F[2 + k]} opacity={1 - k * 0.25} />)}
    </g>
  ),
  obiettivo: ({ t }) => {
    const k = tra(t, 0.1, 0.45);
    return (
      <g>
        {[110, 76, 42].map((r, i) => <circle key={r} cx={520} cy={200} r={r} fill={[F[0], F[1], F[3]][i]} stroke={CACAO} strokeWidth={SW} />)}
        <g transform={`translate(${180 + k * 330} 200)`}><path d="M-120 0 H0 M0 0 l-24 -16 M0 0 l-24 16 M-120 0 l-18 -14 M-120 0 l-18 14" {...tratto} /></g>
        <circle cx={520} cy={200} r={10 + tra(t, 0.45, 0.6) * 30} fill="none" stroke={CACAO} strokeWidth={4} opacity={1 - tra(t, 0.6, 0.9)} />
      </g>
    );
  },
  esperienza: ({ f, t }) => (
    <g>
      <Bottiglia x={480} y={300} alto={150} colore={F[2]} />
      <path d={`M480 ${100 - tra(t, 0, 0.2) * 20} v-50`} {...tratto} strokeWidth={14} />
      <path d="M0 -24 C14 -4 16 6 0 14 C-16 6 -14 -4 0 -24 Z" fill={F[3]} transform={`translate(480 ${120 + ((f % 60) / 60) * 160})`} opacity={1 - (f % 60) / 60} />
    </g>
  ),
  barba: ({ t }) => {
    const x = 160 + tra(t, 0.1, 0.8) * 640;
    return (
      <g>
        <path d="M120 300 Q480 230 840 300 L840 400 L120 400 Z" fill={F[1]} />
        {Array.from({ length: 40 }, (_, i) => { const px = 150 + i * 17; return px > x ? <path key={i} d={`M${px} ${300 - Math.sin((px - 120) / 230) * 40} v-12`} {...tratto} strokeWidth={4} /> : null; })}
        <g transform={`translate(${x} 210)`}><rect x={-60} y={-20} width={120} height={40} rx={12} fill={F[0]} stroke={CACAO} strokeWidth={SW} /><path d="M0 -20 V-120" {...tratto} strokeWidth={16} /></g>
      </g>
    );
  },
  passi: ({ t }) => {
    const n = 3 + Math.floor(t * 3) % 3;
    return <g>{[0, 1, 2, 3, 4].map((i) => <g key={i} opacity={i < n ? 1 : 0.15}><Bottiglia x={240 + i * 120} y={330} alto={100 + (i % 2) * 40} colore={F[i]} s={0.9} /></g>)}</g>;
  },
  evitare: ({ t }) => (
    <g>
      <g transform="translate(480 200)">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-58} rx={30} ry={52} fill={F[1]} stroke={CACAO} strokeWidth={5} transform={`rotate(${a})`} />)}
        <circle r={30} fill={F[3]} />
      </g>
      <path d="M330 340 L630 60" {...tratto} stroke={ROSSO} strokeWidth={16} strokeDasharray={420} strokeDashoffset={420 * (1 - tra(t, 0.3, 0.6))} />
    </g>
  ),
  budget: ({ t }) => {
    const n = 1 + Math.floor(tra(t, 0, 0.7) * 5);   // mai vuoto: la prima moneta c'è già
    return (
      <g>{Array.from({ length: 6 }, (_, i) => (
        <g key={i} opacity={i < n ? 1 : 0}><ellipse cx={480} cy={330 - i * 34} rx={110} ry={30} fill={['#e8c46a', '#d9b24e'][i % 2]} stroke={CACAO} strokeWidth={6} /></g>))}
        <Testo x={480} y={100} t="€" s={90} op={0.25 + tra(t, 0.6, 0.8) * 0.75} />
      </g>
    );
  },
  cute_unta: ({ f, t }) => {
    const g = Math.floor(t * 3) + 1;
    return (<g><Capelli f={f} lucido={tra(t, 0.1, 0.9)} /><Testo x={480} y={70} t={`giorno ${g}`} s={40} /></g>);
  },
  cute_tira: ({ f, t }) => (
    <g>
      <Capelli f={f} />
      <g opacity={onda(f, 60)}>{[300, 480, 660].map((x) => <path key={x} d={`M${x - 30} 250 q30 -16 60 0`} {...tratto} strokeWidth={5} />)}</g>
    </g>
  ),
  forfora: ({ f }) => (
    <g>
      <path d="M120 360 Q480 290 840 360 L840 400 L120 400 Z" fill={F[3]} />
      {Array.from({ length: 14 }, (_, i) => { const k = ((f * 1.2 + i * 37) % 120) / 120; return <rect key={i} x={150 + ((i * 53) % 660)} y={20 + k * 320} width={14} height={9} rx={3} fill={LATTE} stroke={CACAO} strokeWidth={2} transform={`rotate(${k * 180 + i * 20} ${157 + ((i * 53) % 660)} ${24 + k * 320})`} />; })}
    </g>
  ),
  caduta: ({ f }) => (
    <g>
      <g transform="translate(480 120)"><rect x={-180} y={-34} width={360} height={56} rx={18} fill={F[2]} stroke={CACAO} strokeWidth={SW} />
        {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${-160 + i * 25} 22 v46`} {...tratto} strokeWidth={6} />)}</g>
      {Array.from({ length: 5 }, (_, i) => { const k = ((f + i * 24) % 120) / 120; return <path key={i} d={`M0 0 q20 30 0 60 q-20 30 0 60`} {...tratto} stroke={F[5]} strokeWidth={4} transform={`translate(${340 + i * 70} ${200 + k * 140}) rotate(${Math.sin(k * 6 + i) * 30})`} opacity={1 - k} />; })}
    </g>
  ),
  lunghezze: ({ t }) => {
    const apri = Math.sin(t * Math.PI);
    return (
      <g>
        <path d="M150 200 C300 160 460 240 640 200" {...tratto} stroke={F[5]} strokeWidth={16} />
        <path d={`M640 200 C700 190 760 ${200 - apri * 50} 820 ${200 - apri * 70}`} {...tratto} stroke={F[4]} strokeWidth={9} />
        <path d={`M640 200 C700 210 760 ${200 + apri * 50} 820 ${200 + apri * 70}`} {...tratto} stroke={F[4]} strokeWidth={9} />
        <path d="M200 182 C320 150 440 214 600 186" stroke={LUCE} strokeWidth={5} strokeLinecap="round" fill="none" opacity={1 - apri} />
      </g>
    );
  },
  trattamenti: ({ f }) => (
    <g>
      <g transform="translate(330 180)"><path d="M-110 -50 h170 a50 50 0 0 1 0 100 h-170 z" fill={F[2]} stroke={CACAO} strokeWidth={SW} /><path d="M-30 50 l-20 110" {...tratto} strokeWidth={30} /></g>
      {[0, 1, 2].map((i) => { const k = ((f + i * 40) % 120) / 120; return <path key={i} d={`M${440 + k * 300} ${150 + i * 30} q20 -16 40 0 q20 16 40 0`} {...tratto} stroke="#e8a75c" opacity={1 - k} />; })}
    </g>
  ),
  int_obiettivo: ({ f, t }) => {
    const apri = tra(t, 0.2, 0.5) * (1 - tra(t, 0.85, 1));
    return (
      <g transform="translate(480 210)">
        <g transform={`translate(${-apri * 40} 0) rotate(${-apri * 20})`}><path d="M0 -40 h-60 a40 40 0 0 0 0 80 h60 z" fill={F[3]} stroke={CACAO} strokeWidth={SW} /></g>
        <g transform={`translate(${apri * 40} 0) rotate(${apri * 20})`}><path d="M0 -40 h60 a40 40 0 0 1 0 80 h-60 z" fill={F[0]} stroke={CACAO} strokeWidth={SW} /></g>
        {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={Math.cos(i) * 120 * apri} cy={Math.sin(i * 1.7) * 90 * apri} r={8} fill={F[1]} opacity={apri} />)}
      </g>
    );
  },
  dieta: ({ t }) => (
    <g>
      <ellipse cx={480} cy={250} rx={240} ry={90} fill={LATTE} stroke={CACAO} strokeWidth={SW} />
      {[[400, 222, BENE], [480, 210, '#e8a75c'], [560, 226, ROSSO]].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={(y as number) - (1 - tra(t, i * 0.15, i * 0.15 + 0.25)) * 110} r={34} fill={c as string} stroke={CACAO} strokeWidth={5} />))}
    </g>
  ),
  farmaci: ({ f }) => (
    <g>
      <rect x={300} y={120} width={360} height={170} rx={26} fill={VELO} stroke={CACAO} strokeWidth={SW} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={340 + i * 76} y={180} width={56} height={48} rx={24} fill={i === Math.floor(f / 30) % 4 ? F[3] : LATTE} stroke={CACAO} strokeWidth={5} />)}
    </g>
  ),
  sonno: ({ f }) => (
    <g>
      <Luna x={400} y={200} r={90} />
      {[0, 1, 2].map((i) => { const k = ((f + i * 40) % 120) / 120; return <Testo key={i} x={560 + k * 120} y={200 - k * 140} t="z" s={40 + i * 10} op={1 - k} />; })}
    </g>
  ),
  stanchezza: ({ t }) => {
    const q = 1 - tra(t, 0.05, 0.85);
    return (
      <g>
        <rect x={300} y={130} width={330} height={150} rx={24} fill={LATTE} stroke={CACAO} strokeWidth={SW} />
        <rect x={630} y={180} width={24} height={50} rx={8} fill={CACAO} />
        <rect x={318} y={148} width={294 * q} height={114} rx={14} fill={q > 0.3 ? BENE : ROSSO} opacity={0.85} />
      </g>
    );
  },
  stress: ({ f, t }) => {
    const ampia = 1 - tra(t, 0.4, 0.9);
    return <path d={Array.from({ length: 70 }, (_, i) => `${i ? 'L' : 'M'}${130 + i * 10} ${200 + (i % 2 ? -1 : 1) * (10 + ampia * 70) * Math.abs(Math.sin(i / 3 + f / 8))}`).join(' ')} {...tratto} />;
  },
  raffreddori: ({ f }) => {
    const h = 0.4 + onda(f, 120) * 0.5;
    return (
      <g>
        <rect x={450} y={60} width={60} height={240} rx={30} fill={LATTE} stroke={CACAO} strokeWidth={SW} />
        <circle cx={480} cy={320} r={48} fill={ROSSO} stroke={CACAO} strokeWidth={SW} />
        <rect x={466} y={300 - 220 * h} width={28} height={220 * h} rx={14} fill={ROSSO} />
      </g>
    );
  },
  frutta: ({ t }) => {
    const n = Math.min(5, Math.floor(t * 6.5));
    return (
      <g>
        <path d="M260 250 h440 a220 110 0 0 1 -440 0 z" fill={F[2]} stroke={CACAO} strokeWidth={SW} />
        {[[360, ROSSO], [430, '#e8a75c'], [500, BENE], [570, '#e8c46a'], [640, ROSSO]].map(([x, c], i) => (
          <circle key={i} cx={(x as number) - 20} cy={i < n ? 226 : -60} r={32} fill={c as string} stroke={CACAO} strokeWidth={5} />))}
        <Testo x={480} y={80} t={`${n}`} s={70} />
      </g>
    );
  },
  aperto: ({ f, t }) => (
    <g>
      <path d="M60 330 Q300 250 520 320 T900 300 L900 400 L60 400 Z" fill={BENE} opacity={0.8} />
      <Sole x={150 + t * 660} y={300 - Math.sin(t * Math.PI) * 200} r={40} f={f} />
      <g transform="translate(470 270)"><circle cx={0} cy={-56} r={18} fill={F[2]} /><path d="M0 -36 v44 M0 8 l-18 34 M0 8 l18 34 M0 -22 l-20 18 M0 -22 l20 18" {...tratto} /></g>
    </g>
  ),
  pesce: ({ f, t }) => (
    <g>
      <path d={Array.from({ length: 30 }, (_, i) => `${i ? 'L' : 'M'}${60 + i * 30} ${300 + Math.sin(i / 2 + f / 10) * 10}`).join(' ') + ' L900 400 L60 400 Z'} fill={CIELO} />
      {[0, 1].map((i) => { const x = ((t + i * 0.5) % 1) * 1000 - 40; return (
        <g key={i} transform={`translate(${x} ${200 + i * 70 + Math.sin(f / 10 + i) * 12})`}>
          <path d="M-60 0 q60 -48 110 0 q-50 48 -110 0 z" fill={i ? F[3] : '#7aa6c2'} stroke={CACAO} strokeWidth={5} />
          <path d="M-60 0 l-34 -26 v52 z" fill={i ? F[3] : '#7aa6c2'} stroke={CACAO} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={26} cy={-6} r={5} fill={CACAO} />
        </g>); })}
    </g>
  ),
};

// le domande senza una scena tutta loro prendono quella del loro argomento
export const SCENA_DI: Record<string, string> = { condizioni_cute: 'condizioni' };
export const haDisegno = (id: string) => !!SCENE[SCENA_DI[id] || id];

export function Disegno({ nome }: { nome: string }) {
  const f = useCurrentFrame();
  const scena = SCENE[SCENA_DI[nome] || nome];
  return (
    <AbsoluteFill style={{ background: VELO }}>
      <svg viewBox={`0 0 ${LARGO} ${ALTO}`} width="100%" height="100%" aria-hidden="true">
        <circle cx={160} cy={60} r={140} fill={F[0]} opacity={0.5} />
        <circle cx={860} cy={360} r={120} fill={F[0]} opacity={0.5} />
        {scena ? scena({ f, t: (f % DURATA) / DURATA }) : null}
      </svg>
    </AbsoluteFill>
  );
}
