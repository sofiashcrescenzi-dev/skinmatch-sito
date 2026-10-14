import Link from 'next/link';
import { CATALOGO } from '@/lib/dati';
import { nelGruppo } from '@/lib/catalogo';
import Catalogo from '@/components/Catalogo';
import Foto from '@/components/Foto';

export default function CatalogoPage() {
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px' }}>
        <span className="etichetta">Il catalogo</span>
        <h1 className="sopratitolo">I prodotti che consigliamo</h1>
        <p className="intro">Scelti per biotipo e per passaggio della routine, in ogni fascia di prezzo. Per sapere quali vanno bene per te, <Link href="/test" className="link">fai il test</Link>.</p>
      </header>
      <nav className="griglia" style={{ ['--min' as string]: '160px' }} aria-label="Le categorie">
        {CATALOGO.categorie.filter((c) => nelGruppo(c.id).length).map((c) => (
          <Link key={c.id} href={`/catalogo/${c.id}`} className="carta-foto" style={{ ['--rapporto' as string]: '1 / 1' }}>
            <Foto nome={c.immagine} riserva={`/images/cat-${c.id}.jpg`} sizes="(max-width: 760px) 50vw, 16vw" />
            <span className="corpo" style={{ padding: '10px 12px 12px' }}><span style={{ fontWeight: 700, fontSize: 15 }}>{c.nome}</span></span>
          </Link>
        ))}
      </nav>
      <Catalogo />
    </main>
  );
}
