import Link from 'next/link';
import Header from '@/components/Header';
import { ARTICOLI } from '@/lib/dati';

export default function NonTrovata() {
  return (
    <>
      <Header rivista={ARTICOLI.length > 0} />
      <main className="contenitore sezione pila" style={{ ['--gap' as string]: '16px', minHeight: '60vh' }}>
        <span className="etichetta">Pagina non trovata</span>
        <h1 className="sopratitolo">Questa pagina non c&apos;è</h1>
        <p className="intro">Forse è stata spostata. Da qui si riparte bene:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/test" className="bottone">Fai il test</Link>
          <Link href="/biotipi" className="bottone secondario">I biotipi</Link>
          <Link href="/catalogo" className="bottone secondario">Il catalogo</Link>
        </div>
      </main>
    </>
  );
}
