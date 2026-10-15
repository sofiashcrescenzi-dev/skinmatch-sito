import Link from 'next/link';
import Catalogo from '@/components/Catalogo';

export default function CatalogoPage() {
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px' }}>
        <span className="etichetta">Il catalogo</span>
        <h1 className="sopratitolo">I prodotti, con la loro scheda</h1>
        <p className="intro">Per ognuno gli attivi e le percentuali, per quale pelle, quanto è forte e quanto costa. Filtra per categoria, famiglia, attivo o tipo di pelle; se preferisci partire dalla tua pelle, <Link href="/test" className="link">fai il test</Link>.</p>
      </header>
      <Catalogo />
    </main>
  );
}
