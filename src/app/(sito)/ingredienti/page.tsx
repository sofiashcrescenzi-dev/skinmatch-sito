import type { Metadata } from 'next';
import Link from 'next/link';
import { ingredienti, prodottiConAttivo } from '@/lib/percorsi';

// GLI INGREDIENTI (19/11/2026, voto r-ingredienti): l'indice delle pagine per attivo, con quanti prodotti lo hanno.
export const metadata: Metadata = {
  title: 'Gli ingredienti della skincare: a cosa servono e dove trovarli',
  description: 'Niacinamide, retinolo, vitamina C, acido ialuronico, acido salicilico, azelaico, ceramidi: a cosa serve ogni attivo, per chi è e i prodotti che lo contengono.',
  alternates: { canonical: '/ingredienti' },
};

export default function IngredientiPage() {
  const elenco = ingredienti().map((a) => { const { principali, altri } = prodottiConAttivo(a); return { a, n: principali.length + altri.length }; });
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px', maxWidth: '62ch' }}>
        <span className="etichetta">Gli ingredienti</span>
        <h1 className="sopratitolo">A cosa serve ogni attivo</h1>
        <p className="intro">Gli ingredienti che lavorano davvero nella skincare: cosa fanno, per chi sono e a cosa fare attenzione. Per ognuno, tutti i prodotti del catalogo che lo hanno nell&apos;INCI, di ogni marca.</p>
      </header>
      <div className="griglia" style={{ ['--min' as string]: '260px' }}>
        {elenco.map(({ a, n }) => (
          <Link key={a.id} href={`/ingredienti/${a.id}`} className="carta pila" style={{ ['--gap' as string]: '6px', textDecoration: 'none', color: 'inherit' }}>
            <span className="titolo-3">{a.nome}</span>
            <span className="piccolo">{a.cosa}</span>
            <span className="piccolo"><b>{n} prodotti</b></span>
          </Link>
        ))}
      </div>
    </main>
  );
}
