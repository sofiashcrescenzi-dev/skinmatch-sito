// IL VIDEO DELLA TUA ROUTINE (15/11/2026, proposta «Guarda la tua routine», sì di Federico). Una composizione Remotion
// che racconta la giornata del risultato in circa quindici secondi: il titolo col biotipo, la mattina col sole che sale,
// il pranzo, la sera che si fa scura con la luna, i passaggi che non sono di ogni giorno, poi i minuti e il costo.
// I dati vengono da lib/giornata.ts (datiVideo, qui sotto): gli stessi prodotti, numeri e momenti della pagina.
// Tutto dipende dal fotogramma (useCurrentFrame): niente animazioni CSS, così il player può andare avanti e indietro.
import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { ICONE } from '@/components/Icona';

export type PassoVideo = { n: number; passaggio: string; prodotto: string; marca: string; foto?: string; ogni?: string };
export type MomentoVideo = { id: string; nome: string; ora: string; passi: PassoVideo[] };
// ⚠️ 24/11/2026: in chiusura due prezzi, dalla routine consigliata all'alternativa (Federico: «non con le scelte top ma
// soltanto Skin Routine consigliata 120 €, l'alternativa 80 €, quindi dal max al min»); nome = «Skin routine» o «Routine»
export type DatiVideo = { biotipo?: string; momenti: MomentoVideo[]; settimana: PassoVideo[]; minuti: number; costo: number; alternativa?: number; nome?: string };

// la scala dei fototipi e i due toni del marchio (globals.css)
const F = ['#f6ddcc', '#ebc3a6', '#d29e78', '#a8714e', '#7b4b33', '#4a2c1f'];
const CACAO = '#2e1c15', LATTE = '#faf6f4';
const TIT = 'var(--font-titolo), system-ui, sans-serif', TESTO = 'var(--font-testo), system-ui, sans-serif';
const FONDO: Record<string, [string, string, boolean]> = { mattina: [F[0], F[1], false], pranzo: [F[1], F[2], false], sera: [F[4], F[5], true] };

const INTRO = 60, OUTRO = 96;
const lungoMomento = (m: MomentoVideo) => 44 + 28 * Math.max(1, m.passi.length);
const lungoSettimana = (s: PassoVideo[]) => (s.length ? 40 + 20 * s.length : 0);
export function scaletta(d: DatiVideo) {
  let t = INTRO;
  const momenti = d.momenti.map((m) => { const da = t; t += lungoMomento(m); return { m, da, dur: lungoMomento(m) }; });
  const settimana = { da: t, dur: lungoSettimana(d.settimana) };
  t += settimana.dur;
  return { momenti, settimana, outro: t, durata: t + OUTRO };
}
const euro = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const entra = (f: number, da: number, fps: number) => spring({ frame: f - da, fps, config: { damping: 16, mass: 0.7 } });

// il segno di Skinmatch: due mezzelune sfalsate che si avvicinano
function Segno({ apri, lato = 120 }: { apri: number; lato?: number }) {
  return (
    <svg width={lato * 1.4} height={lato} viewBox="-70 -50 140 100" aria-hidden="true">
      <path d="M0 -46 A46 46 0 0 0 0 46 Z" fill={F[1]} transform={`translate(${-6 - apri * 26} 0)`} />
      <path d="M0 -46 A46 46 0 0 1 0 46 Z" fill={F[3]} transform={`translate(${6 + apri * 26} 0)`} />
    </svg>
  );
}

// il sole che attraversa il cielo (0 = alba, 1 = notte); dopo i tre quarti diventa luna
function Astro({ t }: { t: number }) {
  const x = 140 + t * 800, y = 330 - Math.sin(Math.PI * Math.min(1, t)) * 170;
  const luna = interpolate(t, [0.66, 0.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <svg width={1080} height={560} style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true">
      <circle cx={x} cy={y} r={58} fill={luna > 0.5 ? LATTE : '#ffd9a8'} opacity={0.95} />
      {luna > 0 && <circle cx={x + 26} cy={y - 14} r={52} fill={F[5]} opacity={luna} />}
    </svg>
  );
}

// ⚠️ IL CIELO DELLA GIORNATA (24/11/2026, Federico: «animazione tra giorno e sera»). Prima ogni momento aveva il suo
// sfondo e si passava dalla mattina alla sera con un taglio. Ora il cielo è uno per tutto il video: un'ora del giorno
// t (0 alba, 1 notte) che scorre coi momenti, e fra un momento e l'altro scivola invece di saltare; fra il pranzo e la
// sera c'è il tramonto (arancio e terra), poi la notte con le stelle. Il sole e la luna seguono la stessa t.
const ORA: Record<string, [number, number]> = { mattina: [0.18, 0.32], pranzo: [0.45, 0.55], sera: [0.74, 0.92] };
function oraDelGiorno(f: number, s: ReturnType<typeof scaletta>): number {
  const punti: [number, number][] = [[0, 0.02], [INTRO, 0.15]];
  let prima = 0.15;
  for (const { m, da, dur } of s.momenti) {
    const [a, b] = ORA[m.id] || ORA.mattina;
    const passa = m.id === 'sera' ? 40 : 24;              // il tramonto dura di più
    punti.push([da, prima], [da + passa, a], [da + dur, b]);
    prima = b;
  }
  const xs = punti.map((p) => p[0]), ys = punti.map((p) => p[1]);
  for (let i = 1; i < xs.length; i++) if (xs[i] <= xs[i - 1]) xs[i] = xs[i - 1] + 0.001;
  return interpolate(f, xs, ys, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin) });
}
const T_CIELO = [0, 0.3, 0.52, 0.64, 0.76, 1];
const ALTO = [F[0], F[0], F[1], '#eaa27e', F[4], '#24150f'];
const BASSO = [F[1], F[1], F[2], '#a95c3c', F[5], F[5]];
function Cielo({ t }: { t: number }) {
  const a = interpolateColors(t, T_CIELO, ALTO), b = interpolateColors(t, T_CIELO, BASSO);
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${a} 0%, ${b} 100%)` }} />;
}
// le stelle della sera: si accendono dopo il tramonto e brillano piano, ognuna col suo ritmo
const STELLE = Array.from({ length: 26 }, (_, i) => ({ x: (i * 397) % 1040 + 20, y: (i * 211) % 600 + 40, r: 2 + (i % 3), v: 0.05 + (i % 5) * 0.012, fase: i * 1.7 }));
function Stelle({ t, f }: { t: number; f: number }) {
  const o = interpolate(t, [0.7, 0.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (o <= 0) return null;
  return (
    <svg width={1080} height={700} style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true">
      {STELLE.map((x, i) => <circle key={i} cx={x.x} cy={x.y} r={x.r} fill={LATTE} opacity={o * (0.45 + 0.55 * Math.abs(Math.sin(f * x.v + x.fase)))} />)}
    </svg>
  );
}
// ⚠️ LE ICONE DIETRO (24/11/2026, Federico: «qualche iconcina dietro»): le icone di Skinmatch (components/Icona.tsx), al
// tratto, grandi e tenui, che salgono piano e girano un poco. Di giorno gocce, foglie, flaconi e la luce; di sera la luna
// e le stelle prendono il loro posto, e il colore passa dal terra al latte.
const GIORNO: (keyof typeof ICONE)[] = ['goccia', 'foglia', 'siero', 'crema', 'luminosita', 'flacone', 'goccia', 'tubo'];
const NOTTE: (keyof typeof ICONE)[] = ['stella', 'luna', 'goccia', 'stella', 'crema', 'stella', 'siero', 'luna'];
const POSTI = Array.from({ length: 8 }, (_, i) => ({ x: 60 + ((i * 263) % 900), y: (i * 487) % 1920, lato: 70 + (i % 3) * 26, v: 0.55 + (i % 4) * 0.18, giro: (i % 2 ? 1 : -1) * (6 + i) }));
function IconeDietro({ t, f }: { t: number; f: number }) {
  const sera = interpolate(t, [0.66, 0.78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const colore = interpolateColors(sera, [0, 1], [F[3], LATTE]);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {POSTI.map((p, i) => {
        const y = ((p.y - f * p.v) % 2100 + 2100) % 2100 - 120;
        const nome = sera > 0.5 ? NOTTE[i] : GIORNO[i];
        const d = (ICONE[nome] as { d: string; pieno?: boolean });
        return (
          <svg key={i} width={p.lato} height={p.lato} viewBox="0 0 24 24" aria-hidden="true"
            style={{ position: 'absolute', left: p.x, top: y, opacity: sera > 0.35 && sera < 0.65 ? 0.05 : 0.16, transform: `rotate(${Math.sin(f / 40 + i) * p.giro}deg)` }}>
            <path d={d.d} fill={d.pieno ? colore : 'none'} stroke={colore} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
}

function Carta({ p, f, da, alto, scuro }: { p: PassoVideo; f: number; da: number; alto: number; scuro: boolean }) {
  const { fps } = useVideoConfig();
  const e = entra(f, da, fps);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, height: alto, padding: '0 30px', boxSizing: 'border-box', borderRadius: 36,
      background: scuro ? 'rgba(250,246,244,0.1)' : '#ffffff', boxShadow: scuro ? 'none' : '0 18px 40px rgba(46,28,21,0.12)',
      opacity: e, transform: `translateX(${(1 - e) * 160}px)` }}>
      <span style={{ flex: 'none', width: 68, height: 68, borderRadius: '50%', background: scuro ? LATTE : CACAO, color: scuro ? CACAO : LATTE, display: 'grid', placeItems: 'center',
        fontFamily: TIT, fontWeight: 700, fontSize: 36 }}>{p.n}</span>
      <div style={{ flex: 'none', width: alto - 36, height: alto - 36, borderRadius: 24, background: '#ffffff', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
        {p.foto ? <Img src={p.foto} style={{ width: '88%', height: '88%', objectFit: 'contain' }} /> : <Segno apri={0} lato={60} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 46, lineHeight: 1.05, color: scuro ? LATTE : CACAO }}>{p.passaggio}</div>
        <div style={{ fontFamily: TESTO, fontSize: 30, lineHeight: 1.2, marginTop: 8, color: scuro ? F[1] : F[4], display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {p.marca} {p.prodotto}
        </div>
        {p.ogni && <div style={{ fontFamily: TESTO, fontWeight: 700, fontSize: 26, marginTop: 8, color: scuro ? F[0] : F[3] }}>{p.ogni}</div>}
      </div>
    </div>
  );
}

function Momento({ m, dur }: { m: MomentoVideo; dur: number }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const [, , scuro] = FONDO[m.id] || FONDO.mattina;
  const e = entra(f, 0, fps);
  const n = m.passi.length, alto = n <= 4 ? 210 : n === 5 ? 180 : 150;
  return (
    <AbsoluteFill style={{ opacity: interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) * interpolate(f, [dur, dur + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', left: 90, top: 330, opacity: e, transform: `translateY(${(1 - e) * 40}px)` }}>
        <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 150, lineHeight: 0.9, letterSpacing: '-0.03em', color: scuro ? LATTE : CACAO }}>{m.ora}</div>
        <div style={{ fontFamily: TESTO, fontWeight: 700, fontSize: 52, marginTop: 14, color: scuro ? F[1] : F[4] }}>{m.nome}</div>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 640, display: 'grid', gap: 22 }}>
        {m.passi.map((p, i) => <Carta key={p.n} p={p} f={f} da={30 + i * 28} alto={alto} scuro={scuro} />)}
      </div>
    </AbsoluteFill>
  );
}

function Settimana({ passi }: { passi: PassoVideo[] }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: F[0], opacity: interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 330 }}>
        <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 96, lineHeight: 1, color: CACAO, opacity: entra(f, 0, fps) }}>Non tutti i giorni</div>
        <div style={{ display: 'grid', gap: 22, marginTop: 60 }}>
          {passi.map((p, i) => <Carta key={p.n} p={p} f={f} da={20 + i * 20} alto={180} scuro={false} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Intro({ biotipo }: { biotipo?: string }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const e = entra(f, 4, fps), s = entra(f, 14, fps);
  return (
    <AbsoluteFill style={{ opacity: interpolate(f, [INTRO, INTRO + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 760 }}>
        <div style={{ fontFamily: TESTO, fontWeight: 700, fontSize: 36, letterSpacing: '0.12em', textTransform: 'uppercase', color: F[4], opacity: e }}>La tua giornata</div>
        <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 130, lineHeight: 0.95, letterSpacing: '-0.03em', color: CACAO, marginTop: 20, opacity: e, transform: `translateY(${(1 - e) * 50}px)` }}>La tua routine</div>
        {biotipo && <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 60, lineHeight: 1.1, color: F[4], marginTop: 30, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>{biotipo}</div>}
      </div>
    </AbsoluteFill>
  );
}

function Fine({ minuti, costo, alternativa, nome = 'Routine' }: { minuti: number; costo: number; alternativa?: number; nome?: string }) {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const conta = interpolate(f, [8, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const e = entra(f, 0, fps), s = entra(f, 30, fps), segno = entra(f, 44, fps);
  return (
    <AbsoluteFill style={{ background: CACAO, opacity: interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 520, color: LATTE }}>
        {minuti > 0 && <>
          <div style={{ fontFamily: TESTO, fontWeight: 700, fontSize: 40, color: F[1], opacity: e }}>Al giorno, circa</div>
          <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 210, lineHeight: 0.9, letterSpacing: '-0.04em', opacity: e }}>{Math.round(minuti * conta)} min</div>
        </>}
        <div style={{ fontFamily: TESTO, fontWeight: 700, fontSize: 40, color: F[1], marginTop: 60, opacity: s }}>{nome} consigliata</div>
        <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 110, lineHeight: 1, opacity: s }}>{euro(costo)}</div>
        {alternativa != null && alternativa < costo - 0.5 && <>
          <div style={{ fontFamily: TESTO, fontWeight: 700, fontSize: 40, color: F[1], marginTop: 34, opacity: entra(f, 40, fps) }}>L’alternativa</div>
          <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 84, lineHeight: 1, opacity: entra(f, 40, fps) }}>{euro(alternativa)}</div>
        </>}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 300, display: 'grid', justifyItems: 'center', gap: 20, opacity: segno }}>
        <Segno apri={1 - segno} />
        <div style={{ fontFamily: TIT, fontWeight: 700, fontSize: 48, color: LATTE }}>skinmatch.it</div>
      </div>
    </AbsoluteFill>
  );
}

function Sfondo({ s }: { s: ReturnType<typeof scaletta> }) {
  const f = useCurrentFrame();
  const t = oraDelGiorno(f, s);
  return (
    <>
      <Cielo t={t} />
      <Stelle t={t} f={f} />
      <IconeDietro t={t} f={f} />
      <Astro t={t} />
    </>
  );
}

export function Routine({ dati }: { dati: DatiVideo }) {
  const s = scaletta(dati);
  return (
    <AbsoluteFill style={{ background: F[0] }}>
      <Sfondo s={s} />
      <Sequence durationInFrames={INTRO + 8}><Intro biotipo={dati.biotipo} /></Sequence>
      {s.momenti.map(({ m, da, dur }) => <Sequence key={m.id} from={da} durationInFrames={dur + 8}><Momento m={m} dur={dur} /></Sequence>)}
      {s.settimana.dur > 0 && <Sequence from={s.settimana.da} durationInFrames={s.settimana.dur + 8}><Settimana passi={dati.settimana} /></Sequence>}
      <Sequence from={s.outro}><Fine minuti={dati.minuti} costo={dati.costo} alternativa={dati.alternativa} nome={dati.nome} /></Sequence>
    </AbsoluteFill>
  );
}
