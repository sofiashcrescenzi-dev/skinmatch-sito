import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ARTICOLI, biotipoPerId } from '@/lib/dati';
import { prodottoPerId } from '@/lib/catalogo';
import Markdown from '@/components/Markdown';
import SchedaProdotto from '@/components/SchedaProdotto';
import Foto from '@/components/Foto';

export function generateStaticParams() {
  // con la Rivista vuota serve comunque un indirizzo, o l'export statico si ferma
  return ARTICOLI.length ? ARTICOLI.map((a) => ({ slug: a.slug })) : [{ slug: 'in-arrivo' }];
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICOLI.find((x) => x.slug === slug);
  if (!a) return { robots: { index: false } };
  return { title: a.titolo, description: a.sommario, alternates: { canonical: `/rivista/${a.slug}` }, openGraph: { type: 'article', title: a.titolo, description: a.sommario, images: a.immagine?.file ? [`/immagini/${a.immagine.file}-1600.webp`] : undefined } };
}

export default async function ArticoloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = ARTICOLI.find((x) => x.slug === slug);
  if (!a) notFound();
  const prodotti = (a.prodotti || []).map(prodottoPerId).filter((p): p is NonNullable<typeof p> => !!p);
  const biotipi = (a.biotipi || []).map(biotipoPerId).filter((b): b is NonNullable<typeof b> => !!b);
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <Link href="/rivista" className="piccolo">← La Rivista</Link>
      <header className="pila stretto" style={{ ['--gap' as string]: '14px' }}>
        <span className="etichetta">{a.tipo}</span>
        <h1 className="sopratitolo" style={{ fontSize: 'clamp(30px, 5vw, 50px)' }}>{a.titolo}</h1>
        <p className="intro">{a.sommario}</p>
        <span className="piccolo">Redazione Skinmatch · {new Date(a.pubblicato_il).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </header>
      {a.immagine?.file && <Foto nome={a.immagine.file} priorita style={{ aspectRatio: '16 / 9' }} sizes="(max-width: 1180px) 100vw, 1180px" credito />}
      <div className="stretto"><Markdown testo={a.testo} /></div>
      {prodotti.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '14px' }}>
          <h2 className="titolo-2">I prodotti dell&apos;articolo</h2>
          <div className="griglia" style={{ ['--min' as string]: '300px' }}>{prodotti.map((p) => <SchedaProdotto key={p.id} p={p} da={`rivista-${a.slug}`} />)}</div>
        </section>
      )}
      <section className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pila" style={{ ['--gap' as string]: '6px' }}>
          <span className="titolo-3">Quali vanno bene per te?</span>
          {biotipi.length > 0 && <div className="riga-chip">{biotipi.map((b) => <Link key={b.id} href={`/biotipi/${b.id}`} className="chip">{b.titolo}</Link>)}</div>}
        </div>
        <Link href="/test" className="bottone">Fai il test</Link>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Article', headline: a.titolo, description: a.sommario, datePublished: a.pubblicato_il, dateModified: a.aggiornato_il || a.pubblicato_il,
        author: { '@type': 'Organization', name: 'Redazione Skinmatch' }, publisher: { '@type': 'Organization', name: 'Skinmatch', url: 'https://skinmatch.it' }, inLanguage: 'it',
        image: a.immagine?.file ? `https://skinmatch.it/immagini/${a.immagine.file}-1600.webp` : undefined, mainEntityOfPage: `https://skinmatch.it/rivista/${a.slug}`,
      }).replace(/</g, '\\u003c') }} />
    </main>
  );
}
