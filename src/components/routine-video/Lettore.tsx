'use client';

// IL LETTORE DEL VIDEO DELLA ROUTINE (15/11/2026): il Player di Remotion, caricato solo quando si tocca «Guarda la tua
// routine» (GuardaRoutine.tsx, next/dynamic senza SSR). Con «riduci il movimento» non parte da solo e si apre sul
// riepilogo finale; i comandi restano per guardarlo tutto.
import { Player } from '@remotion/player';
import { Routine, scaletta, type DatiVideo } from './Routine';

export default function Lettore({ dati }: { dati: DatiVideo }) {
  const fermo = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { durata, outro } = scaletta(dati);
  return (
    <Player
      component={Routine}
      inputProps={{ dati }}
      durationInFrames={durata}
      compositionWidth={1080}
      compositionHeight={1920}
      fps={30}
      controls
      autoPlay={!fermo}
      initialFrame={fermo ? Math.min(durata - 1, outro + 60) : 0}
      clickToPlay
      moveToBeginningWhenEnded={false}
      acknowledgeRemotionLicense
      style={{ width: '100%', aspectRatio: '9 / 16', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 50px rgba(46,28,21,0.18)' }}
    />
  );
}
