import type { Metadata } from 'next';
import Link from 'next/link';
import { TERMINI, articoliDelTermine } from '@/lib/dati';
import { ConTermini } from '@/components/Termini';
import Foto from '@/components/Foto';
import Cerca from './Cerca';

export const metadata: Metadata = {
  title: 'Il glossario della pelle: ingredienti, biotipi, condizioni',
  description: 'Barriera cutanea, sebo, niacinamide, retinoidi, acido salicilico, SPF, forfora, biotina: le parole della skincare spiegate in due righe, senza promesse.',
  alternates: { canonical: '/glossario' },
};

const GRUPPI: [string, string][] = [
  ['pelle', 'La pelle'], ['ingredienti', 'Gli ingredienti'], ['prodotti', 'I prodotti'],
  ['capelli', 'Cute e capelli'], ['integrazione', 'L\'integrazione'], ['condizioni', 'Da vedere con il medico'],
];

export default function GlossarioPage() {
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(32px, 5vw, 56px)' }}>
      <header style={{ display: 'grid', gap: 'clamp(20px, 4vw, 48px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', alignItems: 'center' }}>
        <div className="pila" style={{ ['--gap' as string]: '12px' }}>
          <span className="etichetta">Il glossario</span>
          <h1 className="sopratitolo">Le parole della pelle, in due righe</h1>
          <p className="intro">Ogni termine che trovi sottolineato sul sito, con la sua piccola «i», si spiega qui. Toccalo dove lo incontri, o cercalo.</p>
        </div>
        <Foto nome="glossario" priorita style={{ aspectRatio: '3 / 2' }} sizes="(max-width: 760px) 100vw, 45vw" credito />
      </header>
      <Cerca termini={TERMINI.map((t) => ({ id: t.id, nome: t.nome, parole: t.parole }))} />
      {GRUPPI.map(([k, nome]) => {
        const tt = TERMINI.filter((t) => t.categoria === k);
        if (!tt.length) return null;
        return (
          <section key={k} className="pila" style={{ ['--gap' as string]: '14px' }}>
            <h2 className="titolo-2">{nome}</h2>
            <div className="griglia" style={{ ['--min' as string]: '300px' }}>
              {tt.map((t) => (
                <article key={t.id} id={t.id} className="carta pila" style={{ ['--gap' as string]: '6px', scrollMarginTop: 96 }}>
                  <h3 className="titolo-3">{t.nome}</h3>
                  <p className="testo" style={{ fontSize: 15.5 }}><ConTermini testo={t.testo} salta={t.id} /></p>
                  {t.video && <a className="link piccolo" href={t.video} target="_blank" rel="noopener">Guarda la spiegazione in video</a>}
                  {articoliDelTermine(t.id).slice(0, 2).map((x) => <Link key={x.slug} className="link piccolo" href={`/rivista/${x.slug}`}>Approfondisci: {x.titolo}</Link>)}
                </article>
              ))}
            </div>
          </section>
        );
      })}
      <p className="piccolo">Manca una parola? Il glossario cresce con la <Link className="link" href="/biotipi">guida ai biotipi</Link> e con il test.</p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Il glossario di Skinmatch', inLanguage: 'it', url: 'https://skinmatch.it/glossario',
        hasDefinedTerm: TERMINI.map((t) => ({ '@type': 'DefinedTerm', name: t.nome, description: t.testo, url: `https://skinmatch.it/glossario#${t.id}` })),
      }).replace(/</g, '\\u003c') }} />
    </main>
  );
}
