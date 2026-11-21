// LO SCAFFALE CHE SCORRE (21/11/2026, Federico: «nella parte del catalogo aggiungici qualcosina di estetico animata che dà
// carattere alla parte della homepage»). Una mensola di flaconi, tubetti, vasetti e contagocce nei toni dei fototipi che
// scorre piano sotto la ricerca; ognuno ondeggia col suo passo. Solo SVG e CSS (globals.css, «.scaffale-vivo»), niente
// JavaScript; con «riduci movimento» è una mensola ferma.
const PEZZI: { forma: 'flacone' | 'tubo' | 'vasetto' | 'contagocce' | 'stick' | 'spray'; tono: number; alto: number }[] = [
  { forma: 'flacone', tono: 2, alto: 1 }, { forma: 'tubo', tono: 4, alto: 0.86 }, { forma: 'vasetto', tono: 1, alto: 0.62 },
  { forma: 'contagocce', tono: 5, alto: 0.92 }, { forma: 'spray', tono: 3, alto: 1.06 }, { forma: 'stick', tono: 6, alto: 0.7 },
  { forma: 'flacone', tono: 1, alto: 0.84 }, { forma: 'vasetto', tono: 3, alto: 0.58 }, { forma: 'tubo', tono: 2, alto: 0.96 },
];
function Pezzo({ forma, tono, alto }: (typeof PEZZI)[number]) {
  const c = `var(--f${tono})`, h = Math.round(150 * alto);
  return (
    <svg viewBox={`0 0 90 ${h}`} width="90" height={h} aria-hidden="true" className="scaffale-pezzo" style={{ ['--alto' as string]: `${h}px` }}>
      {forma === 'flacone' && <><rect x="30" y="0" width="30" height="20" rx="4" fill="var(--cacao)" opacity=".85" /><rect x="14" y="18" width="62" height={h - 18} rx="16" fill={c} /><rect x="22" y={h * 0.45} width="46" height={h * 0.28} rx="6" fill="var(--latte)" opacity=".75" /></>}
      {forma === 'tubo' && <><rect x="32" y={h - 24} width="26" height="24" rx="4" fill="var(--cacao)" opacity=".85" /><path d={`M18 0 L72 0 L64 ${h - 22} L26 ${h - 22} Z`} fill={c} /><rect x="18" y="0" width="54" height="10" fill="var(--latte)" opacity=".5" /></>}
      {forma === 'vasetto' && <><rect x="10" y={h - 70} width="70" height="18" rx="6" fill="var(--cacao)" opacity=".85" /><rect x="6" y={h - 54} width="78" height="54" rx="14" fill={c} /><rect x="18" y={h - 38} width="54" height="16" rx="5" fill="var(--latte)" opacity=".7" /></>}
      {forma === 'contagocce' && <><circle cx="45" cy="12" r="12" fill="var(--cacao)" opacity=".85" /><rect x="37" y="18" width="16" height="22" fill="var(--cacao)" opacity=".7" /><rect x="20" y="38" width="50" height={h - 38} rx="10" fill={c} /><rect x="27" y={h * 0.55} width="36" height={h * 0.22} rx="5" fill="var(--latte)" opacity=".7" /></>}
      {forma === 'spray' && <><rect x="36" y="0" width="22" height="14" rx="3" fill="var(--cacao)" opacity=".85" /><rect x="58" y="4" width="14" height="6" rx="3" fill="var(--cacao)" opacity=".7" /><rect x="22" y="14" width="46" height="18" rx="4" fill="var(--cacao)" opacity=".6" /><rect x="16" y="30" width="58" height={h - 30} rx="12" fill={c} /></>}
      {forma === 'stick' && <><rect x="24" y="0" width="42" height={h * 0.3} rx="12" fill="var(--latte)" opacity=".8" /><rect x="20" y={h * 0.28} width="50" height={h * 0.72} rx="10" fill={c} /></>}
    </svg>
  );
}
export default function ScaffaleVivo() {
  const fila = PEZZI.map((p, i) => <span key={i} className="scaffale-posto" style={{ ['--i' as string]: i }}><Pezzo {...p} /></span>);
  return (
    <div className="scaffale-vivo" aria-hidden="true">
      <div className="scaffale-nastro">{fila}{fila}</div>
      <div className="scaffale-mensola" />
    </div>
  );
}
