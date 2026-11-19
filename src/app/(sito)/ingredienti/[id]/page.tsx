import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ATTIVI, TERMINI, articoliDelTermine } from '@/lib/dati';
import { ConTermini } from '@/components/Termini';
import SchedaProdotto from '@/components/SchedaProdotto';
import { Invito } from '@/components/Inviti';
import { ingredienti, prodottiConAttivo } from '@/lib/percorsi';
import { euro } from '@/lib/catalogo';

// UN INGREDIENTE (19/11/2026, voto r-ingredienti): «niacinamide a cosa serve», «acido azelaico crema». Google dà queste
// ricerche ai blog delle marche, che mostrano solo i loro prodotti. Qui: cosa fa, per chi, a cosa fare attenzione (i testi
// di src/data/attivi.json, rivisti da Sofia) e tutti i prodotti del catalogo che lo hanno nell'INCI, di ogni marca.

export function generateStaticParams() {
  return ingredienti().map((a) => ({ id: a.id }));
}
export const dynamicParams = false;

const MOSTRA = 24;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = ATTIVI.find((x) => x.id === id);
  if (!a) return {};
  const { principali, altri } = prodottiConAttivo(a);
  return {
    title: `${a.nome}: a cosa serve, per chi è e i prodotti che lo contengono`,
    description: `${a.cosa} ${principali.length + altri.length} prodotti del catalogo con ${a.nome.toLowerCase()} nell'INCI, di tutte le marche, con il prezzo nei negozi.`.slice(0, 158),
    alternates: { canonical: `/ingredienti/${a.id}` },
  };
}

export default async function IngredientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = ATTIVI.find((x) => x.id === id);
  if (!a) notFound();
  const { principali, altri } = prodottiConAttivo(a);
  const tutti = [...principali, ...altri];
  const prezzi = tutti.map((p) => p.price).filter((n) => n > 0);
  const termine = TERMINI.find((t) => t.id === a.termine);
  const articoli = a.termine ? articoliDelTermine(a.termine).slice(0, 3) : [];
  const vicini = ingredienti().filter((x) => x.id !== a.id).slice(0, 14);
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <Link href="/ingredienti" className="piccolo">← Tutti gli ingredienti</Link>
      <header className="pila" style={{ ['--gap' as string]: '12px', maxWidth: '62ch' }}>
        <span className="etichetta">Ingrediente · {tutti.length} prodotti{prezzi.length ? ` da ${euro(Math.min(...prezzi))}` : ''}</span>
        <h1 className="sopratitolo" style={{ fontSize: 'clamp(32px, 5.4vw, 54px)' }}>{a.nome}: a cosa serve</h1>
        <p className="intro"><ConTermini testo={a.cosa} /></p>
      </header>

      <section className="griglia" style={{ ['--min' as string]: '260px' }}>
        {a.per_chi && (
          <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
            <h2 className="titolo-3">Per chi è</h2>
            <p className="testo"><ConTermini testo={a.per_chi} /></p>
          </div>
        )}
        {a.attenzione && (
          <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
            <h2 className="titolo-3">A cosa fare attenzione</h2>
            <p className="testo"><ConTermini testo={a.attenzione} /></p>
          </div>
        )}
        {termine && (
          <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
            <h2 className="titolo-3">Nel glossario</h2>
            <p className="testo"><ConTermini testo={termine.testo} /></p>
            <Link className="link piccolo" href={`/glossario#${termine.id}`}>Leggi la voce →</Link>
          </div>
        )}
      </section>

      {articoli.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Per saperne di più</h2>
          <ul className="pila" style={{ ['--gap' as string]: '6px', paddingLeft: 0, listStyle: 'none' }}>
            {articoli.map((x) => <li key={x.slug}><Link className="link" href={`/rivista/${x.slug}`}>{x.titolo}</Link></li>)}
          </ul>
        </section>
      )}

      {principali.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '16px' }}>
          <h2 className="titolo-2">Dove è l&apos;attivo principale</h2>
          <p className="piccolo">Prodotti costruiti attorno a {a.nome.toLowerCase()}: è l&apos;ingrediente che lavora di più. Prima i meno cari.</p>
          <div className="griglia" style={{ ['--min' as string]: '300px' }}>{principali.slice(0, MOSTRA).map((p) => <SchedaProdotto key={p.id} p={p} da={`ingrediente-${a.id}`} />)}</div>
        </section>
      )}
      {altri.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '16px' }}>
          <h2 className="titolo-2">{principali.length ? 'Dove c’è insieme ad altri attivi' : `I prodotti con ${a.nome.toLowerCase()}`}</h2>
          <div className="griglia" style={{ ['--min' as string]: '300px' }}>{altri.slice(0, MOSTRA).map((p) => <SchedaProdotto key={p.id} p={p} da={`ingrediente-${a.id}`} />)}</div>
          {altri.length > MOSTRA && <Link className="link" href={`/catalogo?attivo=${a.id}`}>Tutti i {tutti.length} prodotti con {a.nome.toLowerCase()} nel catalogo →</Link>}
        </section>
      )}

      <section className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <span className="titolo-3">Va bene per la tua pelle?</span>
          <span className="piccolo">Il test riconosce il tuo tipo di pelle e sceglie gli attivi giusti per ogni passaggio della routine.</span>
        </div>
        <Invito href="/test?percorso=viso">Fai il test gratis</Invito>
      </section>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-3">Altri ingredienti</h2>
        <div className="riga-chip">{vicini.map((x) => <Link key={x.id} href={`/ingredienti/${x.id}`} className="chip">{x.nome}</Link>)}</div>
      </section>
    </main>
  );
}
