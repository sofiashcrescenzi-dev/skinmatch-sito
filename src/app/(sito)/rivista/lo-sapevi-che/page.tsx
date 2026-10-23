import type { Metadata } from 'next';
import Link from 'next/link';
import { NOZIONI, NOMI_AREA, domandaPerId, type Area } from '@/lib/dati';
import Nozione from '@/components/Nozione';
import SchedeRivista from '@/components/SchedeRivista';

// «LO SAPEVI CHE» (23/10/2026): tutte le nozioni dei test, divise per test. Sono le stesse pause che compaiono tra
// una domanda e l'altra (src/data/nozioni.json), qui da leggere di fila, con i quiz da provare.
export const metadata: Metadata = {
  title: 'Lo sapevi che: curiosità, storie e quiz su pelle, capelli e integratori',
  description: 'Perché il sole passa dalla finestra, da dove viene la parola shampoo, chi scoprì la melatonina: le curiosità dei test di Skinmatch, ognuna con la sua fonte.',
  alternates: { canonical: '/rivista/lo-sapevi-che' },
};

const AREE: Area[] = ['pelle', 'cute', 'integrazione'];
const TITOLI: Record<Area, string> = { pelle: 'Il viso', cute: NOMI_AREA.cute, integrazione: NOMI_AREA.integrazione };

export default function LoSapeviChe() {
  const areaDi = (dopo: string) => (domandaPerId(dopo)?.area || 'pelle') as Area | 'comune';
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(32px, 5vw, 56px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px' }}>
        <span className="etichetta">La Rivista</span>
        <h1 className="sopratitolo">Lo sapevi che…</h1>
        <p className="intro">Curiosità, storie e piccoli quiz su pelle, capelli e integratori: le stesse che trovi tra una domanda e l&apos;altra del <Link className="link" href="/test">test</Link>. Ognuna ha la sua fonte.</p>
        <SchedeRivista qui="nozioni" />
      </header>
      {AREE.map((a) => {
        const qui = NOZIONI.filter((n) => areaDi(n.dopo) === a);
        if (!qui.length) return null;
        return (
          <section key={a} className="pila" style={{ ['--gap' as string]: '16px' }} aria-labelledby={`area-${a}`}>
            <h2 id={`area-${a}`} className="titolo-2">{TITOLI[a]}</h2>
            <div className="griglia" style={{ ['--min' as string]: '280px', alignItems: 'start' }}>
              {qui.map((n) => <Nozione key={n.id} n={n} livello="h3" />)}
            </div>
          </section>
        );
      })}
    </main>
  );
}
