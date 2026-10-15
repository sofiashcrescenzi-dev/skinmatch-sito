// LE ICONE DI SKINMATCH (Federico, 15/10/2026: «una lista di icone standard da usare qui e là, in ottica
// mobile first»). Un solo disegno: griglia 24, tratto 1,75 con estremi tondi, colore del testo
// (currentColor). Niente file da scaricare: sono qui dentro, e pesano solo quelle usate nella pagina.
// Uso: <Icona nome="spedizione" /> · dimensione con `size` (18 nel testo, 22-24 nei bottoni);
// nei bottoni con solo l'icona serve `etichetta` (il nome letto dal lettore di schermo).
// Il catalogo con tutti i nomi si vede in /admin/icone.

type Disegno = { d: string; pieno?: boolean };
export const ICONE = {
  // interfaccia
  menu: { d: 'M4 7h16M4 12h16M4 17h16' },
  chiudi: { d: 'M6 6l12 12M18 6L6 18' },
  cerca: { d: 'M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM16 16l4 4' },
  filtri: { d: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  ordina: { d: 'M8 5v14M5 16l3 3 3-3M16 19V5M13 8l3-3 3 3' },
  indietro: { d: 'M15 5l-7 7 7 7' },
  avanti: { d: 'M9 5l7 7-7 7' },
  su: { d: 'M5 15l7-7 7 7' },
  giu: { d: 'M5 9l7 7 7-7' },
  piu: { d: 'M12 5v14M5 12h14' },
  meno: { d: 'M5 12h14' },
  spunta: { d: 'M5 12.5l4.5 4.5L19 7' },
  info: { d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01' },
  aiuto: { d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01' },
  attenzione: { d: 'M12 4l9 16H3zM12 10v4M12 17h.01' },
  condividi: { d: 'M18 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4' },
  esterno: { d: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' },
  copia: { d: 'M10 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM5 15V5a1 1 0 0 1 1-1h10' },
  scarica: { d: 'M12 4v11M7 10l5 5 5-5M5 20h14' },
  aggiorna: { d: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7' },
  modifica: { d: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4' },
  elimina: { d: 'M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13' },
  occhio: { d: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  lucchetto: { d: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3' },
  campanella: { d: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0' },
  casa: { d: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
  utente: { d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6' },
  cuore: { d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' },
  stella: { d: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z' },
  orologio: { d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' },
  calendario: { d: 'M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M9 3v4M15 3v4' },
  posta: { d: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 7l9 6 9-6' },
  telefono: { d: 'M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2' },
  messaggio: { d: 'M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z' },
  confronta: { d: 'M8 4v16M16 4v16M4 8l4-4 4 4M12 16l4 4 4-4' },
  // negozio
  carrello: { d: 'M3 4h2l2.4 11h10.2l2-8H6.2M9 21a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 9 21zM17 21a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z' },
  borsa: { d: 'M5 8h14l-1 12H6zM9 8V7a3 3 0 0 1 6 0v1' },
  spedizione: { d: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z' },
  codice: { d: 'M3 12V4h8l9 9-8 8zM7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
  regalo: { d: 'M4 9h16v3H4zM5 12v8h14v-8M12 9v11M12 9c-1.5-3-5-3.5-5-1.5S10 9 12 9c2 0 5 .5 5-1.5S13.5 6 12 9z' },
  negozio: { d: 'M4 9l1.5-5h13L20 9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 11v9h14v-9M10 20v-5h4v5' },
  euro: { d: 'M17.5 7a6 6 0 1 0 0 10M5 10.5h8M5 13.5h8' },
  percentuale: { d: 'M19 5L5 19M7 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
  // pelle, routine, prodotti
  goccia: { d: 'M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z' },
  sole: { d: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4' },
  luna: { d: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z' },
  gravidanza: { d: 'M12 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.5 21v-6.5C9.5 11 10.5 9 12 9c2.8 0 5.5 2.3 5.5 5.5 0 2.4-1.8 3.5-4.5 3.5M12.5 18v3' },
  sensibile: { d: 'M3 10c2.2-2 3.8-2 6 0s3.8 2 6 0 3.8-2 6 0M3 15c2.2-2 3.8-2 6 0s3.8 2 6 0 3.8-2 6 0' },
  barriera: { d: 'M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z' },
  luminosita: { d: 'M12 3l1.8 5.4L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.6zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z' },
  imperfezioni: { d: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01' },
  foglia: { d: 'M5 19C5 11 10 5 20 5c0 9-5 14-13 14H5zM5 19l8-8' },
  siero: { d: 'M10 3h4v4h-4zM9 7h6M10 7v3l-2 3v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7l-2-3V7' },
  crema: { d: 'M6 10h12a2 2 0 0 1 2 2v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a2 2 0 0 1 2-2zM5 10V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2M8 15h8' },
  tubo: { d: 'M9 3h6v3H9zM7 6h10l-1.5 15h-7z' },
  flacone: { d: 'M10 3h5M12.5 3v4M9 7h7v3l1.5 2v8a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8L9 10z' },
  capsula: { d: 'M4.9 19.1a4 4 0 0 1 0-5.7l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.5 8.5a4 4 0 0 1-5.7 0zM9.2 9.2l5.6 5.6' },
  cerotto: { d: 'M5.6 18.4a3 3 0 0 1 0-4.2l8.6-8.6a3 3 0 0 1 4.2 4.2l-8.6 8.6a3 3 0 0 1-4.2 0zM11 11h.01M13 13h.01M11 13h.01M13 11h.01' },
  capelli: { d: 'M6 21c0-6 1-12 6-15 5 3 6 9 6 15M9.5 21c0-4.5 1-7.5 2.5-9.5 1.5 2 2.5 5 2.5 9.5' },
  barba: { d: 'M5 9v2a7 7 0 0 0 14 0V9M9 15c1 .7 2 1 3 1s2-.3 3-1' },
  specchio: { d: 'M12 17c3.3 0 6-3.1 6-7s-2.7-7-6-7-6 3.1-6 7 2.7 7 6 7zM12 17v4M8 21h8' },
  ingredienti: { d: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01' },
  laboratorio: { d: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 14h9' },
  scala: { d: 'M3 9h18v6H3zM6 9v6M9 9v6M12 9v6M15 9v6M18 9v6' },
  // il segno di Skinmatch: due mezze lune che si incontrano (pieno, non a tratto)
  segno: { d: 'M11 4a8 8 0 0 0 0 16zM13 5.5a8 8 0 0 1 0 16z', pieno: true },
} satisfies Record<string, Disegno>;

export type NomeIcona = keyof typeof ICONE;

export default function Icona({ nome, size = 20, etichetta, spessore = 1.75, className }: { nome: NomeIcona; size?: number; etichetta?: string; spessore?: number; className?: string }) {
  const i: Disegno = ICONE[nome];
  return (
    <svg className={`icona${className ? ` ${className}` : ''}`} width={size} height={size} viewBox="0 0 24 24" fill={i.pieno ? 'currentColor' : 'none'} stroke={i.pieno ? 'none' : 'currentColor'}
      strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round" role={etichetta ? 'img' : undefined} aria-label={etichetta} aria-hidden={etichetta ? undefined : true} focusable="false">
      <path d={i.d} />
    </svg>
  );
}
