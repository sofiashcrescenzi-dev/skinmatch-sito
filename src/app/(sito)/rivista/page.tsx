import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICOLI } from '@/lib/dati';
import Foto from '@/components/Foto';

export const metadata: Metadata = {
  title: 'La Rivista: guide, novità e confronti sulla skincare',
  description: 'Gli articoli di Skinmatch: come riconoscere la propria pelle, come scegliere un prodotto, cosa c\'è di nuovo tra ingredienti e lanci. Sempre con i prodotti giusti.',
  alternates: { canonical: '/rivista' },
  robots: ARTICOLI.length ? undefined : { index: false, follow: true },
};

const data = (s: string) => new Date(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export default function RivistaPage() {
  const [primo, ...altri] = ARTICOLI;
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(32px, 5vw, 56px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px' }}>
        <span className="etichetta">La Rivista</span>
        <h1 className="sopratitolo">Capire la pelle, scegliere meglio</h1>
        <p className="intro">Guide, confronti e novità: ogni articolo finisce con i prodotti giusti, o con il test per trovarli.</p>
      </header>
      {!primo && <p className="avviso">Il primo articolo arriva a giorni. Intanto, <Link className="link" href="/test">fai il test</Link> o sfoglia il <Link className="link" href="/glossario">glossario</Link>.</p>}
      {primo && (
        <Link href={`/rivista/${primo.slug}`} className="carta-foto" style={{ ['--rapporto' as string]: '16 / 9' }}>
          <Foto nome={primo.immagine?.file || 'rivista'} priorita sizes="(max-width: 1180px) 100vw, 1180px" />
          <span className="corpo"><span className="piccolo">{data(primo.pubblicato_il)}</span><span className="titolo-2">{primo.titolo}</span><span className="intro" style={{ fontSize: 16 }}>{primo.sommario}</span></span>
        </Link>
      )}
      {altri.length > 0 && (
        <div className="griglia" style={{ ['--min' as string]: '280px' }}>
          {altri.map((a) => (
            <Link key={a.slug} href={`/rivista/${a.slug}`} className="carta-foto" style={{ ['--rapporto' as string]: '3 / 2' }}>
              <Foto nome={a.immagine?.file || 'rivista'} sizes="(max-width: 760px) 100vw, 33vw" />
              <span className="corpo"><span className="piccolo">{data(a.pubblicato_il)}</span><span className="titolo-3">{a.titolo}</span><span className="piccolo">{a.sommario}</span></span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
