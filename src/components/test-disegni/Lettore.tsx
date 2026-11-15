'use client';

// IL LETTORE DEI DISEGNI DEL TEST (15/11/2026): il Player di Remotion, caricato a parte (next/dynamic senza SSR) solo nella
// pagina del test, come «Guarda la tua routine». Gira in tondo, senza comandi né audio; con «riduci il movimento» resta
// fermo su un fotogramma che dice già la scena. Una domanda nuova = un disegno nuovo che riparte dall'inizio (key).
import { Player } from '@remotion/player';
import { Disegno, DURATA, LARGO, ALTO } from './Disegni';

export default function Lettore({ nome }: { nome: string }) {
  const fermo = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Player
      key={nome}
      component={Disegno}
      inputProps={{ nome }}
      durationInFrames={DURATA}
      compositionWidth={LARGO}
      compositionHeight={ALTO}
      fps={30}
      autoPlay={!fermo}
      loop
      initialFrame={fermo ? 70 : 0}
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      spaceKeyToPlayOrPause={false}
      acknowledgeRemotionLicense
      style={{ width: '100%', aspectRatio: `${LARGO} / ${ALTO}`, borderRadius: 'var(--raggio)', overflow: 'hidden' }}
    />
  );
}
