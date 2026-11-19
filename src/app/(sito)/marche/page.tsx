import type { Metadata } from 'next';
import Link from 'next/link';
import { marche } from '@/lib/percorsi';

// LE MARCHE (19/11/2026, voto r-marche): quelle con almeno 10 prodotti nel catalogo, ognuna con la sua pagina.
export const metadata: Metadata = {
  title: 'Le marche di skincare nel catalogo',
  description: 'La Roche-Posay, CeraVe, Avène, The Ordinary e le altre: i prodotti di ogni marca per tipo di pelle, con gli ingredienti e il prezzo più basso fra i negozi.',
  alternates: { canonical: '/marche' },
};

export default function MarchePage() {
  const elenco = marche();
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px', maxWidth: '62ch' }}>
        <span className="etichetta">Le marche</span>
        <h1 className="sopratitolo">Le marche del catalogo</h1>
        <p className="intro">Dalla farmacia alla cosmetica coreana: le marche con più prodotti nel catalogo di Skinmatch. Per ognuna, i prodotti divisi per categoria e per tipo di pelle.</p>
      </header>
      <div className="griglia" style={{ ['--min' as string]: '220px' }}>
        {elenco.map((m) => (
          <Link key={m.slug} href={`/marche/${m.slug}`} className="carta pila" style={{ ['--gap' as string]: '4px', textDecoration: 'none', color: 'inherit' }}>
            <span className="titolo-3">{m.nome}</span>
            <span className="piccolo">{m.prodotti.length} prodotti</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
