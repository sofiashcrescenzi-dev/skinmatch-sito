import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { biotipoPerId } from '@/lib/dati';
import { ConTermini } from '@/components/Termini';
import SchedaProdotto from '@/components/SchedaProdotto';
import { Invito } from '@/components/Inviti';
import { incroci, incrocio, incrociDelBiotipo, incrociDellaCategoria, PER } from '@/lib/percorsi';
import { indirizzo, euro } from '@/lib/catalogo';

// «CREMA VISO PER PELLE MISTA» (19/11/2026, voto r-incroci): una categoria per un tipo di pelle o di cute. È la ricerca
// di chi vuole comprare («crema viso pelle grassa», «shampoo capelli grassi»), che Google oggi dà ai negozi: qui ci sono i
// prodotti scelti sui bisogni di quella pelle, con il prezzo, e le regole del tipo di pelle (rivisto da Sofia) per capire
// perché. Le pagine nascono solo dove ci sono almeno 4 prodotti (lib/percorsi.ts).

export function generateStaticParams() {
  return incroci().map((x) => ({ id: x.biotipo, categoria: x.categoria }));
}
export const dynamicParams = false;

const TEST_DI: Record<string, string> = { pelle: 'viso', cute: 'cute' };

export async function generateMetadata({ params }: { params: Promise<{ id: string; categoria: string }> }): Promise<Metadata> {
  const { id, categoria } = await params;
  const x = incrocio(id, categoria);
  const b = biotipoPerId(id);
  if (!x || !b) return {};
  const prezzi = x.prodotti.map((p) => p.price).filter((n) => n > 0);
  return {
    title: `${x.titolo}: quale scegliere e dove costa meno`,
    description: `${x.prodotti.length} prodotti scelti per ${PER[id]}${prezzi.length ? `, da ${euro(Math.min(...prezzi))}` : ''}. ${b.cerca[0] ? `Cosa cercare: ${b.cerca[0].replace(/\.$/, '').toLowerCase()}.` : ''}`.slice(0, 158),
    alternates: { canonical: `/biotipi/${id}/${categoria}` },
  };
}

export default async function IncrocioPage({ params }: { params: Promise<{ id: string; categoria: string }> }) {
  const { id, categoria } = await params;
  const x = incrocio(id, categoria);
  const b = biotipoPerId(id);
  if (!x || !b) notFound();
  const altreCategorie = incrociDelBiotipo(id).filter((y) => y.categoria !== categoria);
  const altriTipi = incrociDellaCategoria(categoria).filter((y) => y.biotipo !== id).map((y) => ({ y, b: biotipoPerId(y.biotipo)! }))
    .filter(({ b: z }) => z.area === b.area);
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <Link href={`/biotipi/${b.id}`} className="piccolo">← {b.titolo}: cosa usare e cosa evitare</Link>
      <header className="pila" style={{ ['--gap' as string]: '12px', maxWidth: '62ch' }}>
        <span className="etichetta">{b.area === 'cute' ? 'Cuoio capelluto e capelli' : 'Pelle del viso'} · {x.prodotti.length} prodotti</span>
        <h1 className="sopratitolo" style={{ fontSize: 'clamp(30px, 5vw, 50px)' }}>{x.titolo}</h1>
        <p className="intro"><ConTermini testo={b.motto} /> Li abbiamo scelti sui bisogni di questa {b.area === 'cute' ? 'cute' : 'pelle'}: prima i più adatti, poi i meno cari. Ognuno ha la sua scheda con l&apos;INCI e i prezzi nei negozi.</p>
      </header>

      <section className="griglia" style={{ ['--min' as string]: '260px' }}>
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Cosa cercare</h2>
          <ul className="pila" style={{ ['--gap' as string]: '6px', paddingLeft: 18, listStyle: 'disc' }}>{b.cerca.map((c) => <li key={c}><ConTermini testo={c} /></li>)}</ul>
        </div>
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Cosa evitare</h2>
          <ul className="pila" style={{ ['--gap' as string]: '6px', paddingLeft: 18, listStyle: 'disc' }}>{b.evita.map((c) => <li key={c}><ConTermini testo={c} /></li>)}</ul>
        </div>
      </section>

      {b.tag.includes('da-medico') && (
        <p className="consulto"><span><b>Da seguire con il medico.</b> È una condizione che si diagnostica e si cura: i cosmetici possono accompagnare la terapia, non sostituirla.</span></p>
      )}

      <section className="pila" style={{ ['--gap' as string]: '16px' }}>
        <h2 className="titolo-2">I prodotti</h2>
        <div className="griglia" style={{ ['--min' as string]: '300px' }}>{x.prodotti.map((p) => <SchedaProdotto key={p.id} p={p} da={`incrocio-${b.id}-${categoria}`} />)}</div>
      </section>

      <section className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <span className="titolo-3">Non sai se è davvero {b.area === 'cute' ? 'la tua cute' : 'la tua pelle'}?</span>
          <span className="piccolo">Il test lo riconosce con domande su quello che vedi allo specchio, e sceglie un prodotto per ogni passaggio.</span>
        </div>
        <Invito href={`/test?percorso=${TEST_DI[b.area] || 'viso'}`}>Fai il test gratis</Invito>
      </section>

      {altreCategorie.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '12px' }}>
          <h2 className="titolo-3">Per {PER[id]}, anche</h2>
          <div className="riga-chip">{altreCategorie.map((y) => <Link key={y.categoria} href={`/biotipi/${id}/${y.categoria}`} className="chip">{y.titolo.replace(` per ${PER[id]}`, '')}</Link>)}</div>
        </section>
      )}
      {altriTipi.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '12px' }}>
          <h2 className="titolo-3">{x.titolo.split(' per ')[0]}, per {b.area === 'cute' ? 'un’altra cute' : 'un’altra pelle'}</h2>
          <div className="riga-chip">{altriTipi.map(({ y }) => <Link key={y.biotipo} href={`/biotipi/${y.biotipo}/${categoria}`} className="chip">{y.titolo}</Link>)}</div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'ItemList', name: x.titolo, numberOfItems: x.prodotti.length,
        itemListElement: x.prodotti.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `${p.brand} ${p.name}`, ...(indirizzo(p) ? { url: `https://skinmatch.it${indirizzo(p)}` } : {}) })),
      }).replace(/</g, '\\u003c') }} />
    </main>
  );
}
