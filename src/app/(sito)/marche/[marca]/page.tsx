import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BIOTIPI, CATALOGO } from '@/lib/dati';
import SchedaProdotto from '@/components/SchedaProdotto';
import { Invito } from '@/components/Inviti';
import { marche, marcaPerSlug } from '@/lib/percorsi';
import { inCategoria, biotipiPer, euro } from '@/lib/catalogo';

// UNA MARCA (19/11/2026, voto r-marche): «la roche posay», «cerave», «avene», «the ordinary» si cercano più di «pelle
// grassa». La pagina mette insieme i prodotti della marca nel catalogo, divisi per categoria, con i tipi di pelle a cui
// rispondono e il prezzo più basso fra i negozi. Solo le marche con almeno 10 prodotti (lib/percorsi.ts): sotto è una
// pagina vuota. L'indirizzo è /marche/<nome>, mai la marca nell'indirizzo di una scheda (regola dei link).

export function generateStaticParams() {
  return marche().map((m) => ({ marca: m.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ marca: string }> }): Promise<Metadata> {
  const { marca } = await params;
  const m = marcaPerSlug(marca);
  if (!m) return {};
  const prezzi = m.prodotti.map((p) => p.price).filter((n) => n > 0);
  return {
    title: `${m.nome}: i prodotti per tipo di pelle e dove costano meno`,
    description: `${m.prodotti.length} prodotti di ${m.nome} nel catalogo di Skinmatch${prezzi.length ? `, da ${euro(Math.min(...prezzi))}` : ''}: per quale pelle è ognuno, gli ingredienti (INCI) e il prezzo nei negozi.`.slice(0, 158),
    alternates: { canonical: `/marche/${m.slug}` },
  };
}

export default async function MarcaPage({ params }: { params: Promise<{ marca: string }> }) {
  const { marca } = await params;
  const m = marcaPerSlug(marca);
  if (!m) notFound();
  const gruppi = CATALOGO.categorie.map((c) => ({ c, prodotti: m.prodotti.filter((p) => inCategoria(p, c)).sort((a, b) => a.price - b.price) })).filter((g) => g.prodotti.length);
  // i tipi di pelle e di cute a cui rispondono più prodotti della marca
  const conta = new Map<string, number>();
  for (const p of m.prodotti) for (const b of biotipiPer(p, BIOTIPI.filter((x) => x.area !== 'integrazione'))) conta.set(b.id, (conta.get(b.id) || 0) + 1);
  const tipi = [...conta].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => ({ b: BIOTIPI.find((x) => x.id === id)!, n }));
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <Link href="/marche" className="piccolo">← Tutte le marche</Link>
      <header className="pila" style={{ ['--gap' as string]: '12px', maxWidth: '62ch' }}>
        <span className="etichetta">Marca · {m.prodotti.length} prodotti nel catalogo</span>
        <h1 className="sopratitolo" style={{ fontSize: 'clamp(32px, 5.4vw, 54px)' }}>{m.nome}</h1>
        <p className="intro">I prodotti di {m.nome} che abbiamo scelto, divisi per categoria e dal meno caro. Ognuno ha la sua scheda: per quale pelle è, gli attivi e l&apos;INCI, e il prezzo in ogni negozio che lo vende.</p>
      </header>

      {tipi.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Per quali pelli ha più prodotti</h2>
          <div className="riga-chip">{tipi.map(({ b, n }) => <Link key={b.id} href={`/biotipi/${b.id}`} className="chip">{b.titolo} ({n})</Link>)}</div>
        </section>
      )}

      {gruppi.map(({ c, prodotti }) => (
        <section key={c.id} className="pila" style={{ ['--gap' as string]: '16px' }} id={c.id}>
          <h2 className="titolo-2">{c.nome} <span className="piccolo">({prodotti.length})</span></h2>
          <div className="griglia" style={{ ['--min' as string]: '300px' }}>{prodotti.map((p) => <SchedaProdotto key={p.id} p={p} da={`marca-${m.slug}`} />)}</div>
        </section>
      ))}

      <section className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <span className="titolo-3">Quale fa per te?</span>
          <span className="piccolo">Il test riconosce il tuo tipo di pelle e sceglie un prodotto per ogni passaggio, di questa marca o di un&apos;altra, con un&apos;alternativa simile che di solito costa meno.</span>
        </div>
        <Invito href="/test?percorso=viso">Fai il test gratis</Invito>
      </section>
    </main>
  );
}
