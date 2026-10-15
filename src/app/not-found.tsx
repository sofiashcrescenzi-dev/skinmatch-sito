import Link from 'next/link';
import Header from '@/components/Header';
import Piede from '@/components/Piede';
import { ARTICOLI, CATALOGO, ATTIVI } from '@/lib/dati';
import { Invito, Stendi } from '@/components/Inviti';

// LA PAGINA CHE NON C'È (404), nello stile dell'apertura della home: fondo cacao, e lo zero fatto con
// le due mezze lune del segno che si cercano senza chiudersi. Sotto, le strade per ripartire.
// ⚠️ I prodotti tolti o spostati non arrivano qui: il Worker li rinvia (worker/index.js).
export default function NonTrovata() {
  const rivista = ARTICOLI.length > 0;
  return (
    <>
      <Header rivista={rivista} />
      <main>
        <section className="apertura-scura p404" style={{ marginTop: -84, paddingTop: 84 }}>
          <div className="contenitore p404-corpo">
            <p className="p404-numero" aria-label="Errore 404">
              <span aria-hidden="true">4</span>
              <span className="p404-zero" aria-hidden="true"><i /><i /></span>
              <span aria-hidden="true">4</span>
            </p>
            <div className="pila" style={{ ['--gap' as string]: '16px' }}>
              <span className="etichetta">Pagina non trovata</span>
              <h1 className="sopratitolo" style={{ fontSize: 'clamp(30px, 5vw, 52px)' }}>Le due metà non si incontrano</h1>
              <p className="intro">La pagina che cerchi non c&apos;è più, o l&apos;indirizzo ha una lettera fuori posto. Da qui si riparte bene.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Invito href="/test" scuro>Fai il test</Invito>
                <Link href="/catalogo" className="bottone secondario">Esplora i prodotti</Link>
              </div>
            </div>
          </div>
        </section>
        <section className="contenitore sezione p404-strade">
          <div className="pila" style={{ ['--gap' as string]: '12px' }}>
            <h2 className="titolo-3">I prodotti, per tipo</h2>
            <div className="riga-chip">{CATALOGO.categorie.map((c) => <Link key={c.id} href={`/catalogo/${c.id}`} className="chip">{c.nome}</Link>)}</div>
          </div>
          <div className="pila" style={{ ['--gap' as string]: '12px' }}>
            <h2 className="titolo-3">Gli attivi</h2>
            <div className="riga-chip">{ATTIVI.slice(0, 8).map((a) => <Link key={a.id} href={`/catalogo?attivo=${a.id}`} className="chip">{a.nome.split(' (')[0]}</Link>)}</div>
          </div>
          <div className="pila" style={{ ['--gap' as string]: '10px' }}>
            <h2 className="titolo-3">Per capire</h2>
            <Stendi href="/biotipi">I biotipi della pelle e della cute</Stendi>
            <Stendi href="/glossario">Le parole della pelle, spiegate</Stendi>
            {rivista && <Stendi href="/rivista">La Rivista</Stendi>}
          </div>
        </section>
      </main>
      <Piede rivista={rivista} />
    </>
  );
}
