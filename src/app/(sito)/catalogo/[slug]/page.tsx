import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATALOGO } from '@/lib/dati';
import { nelGruppo } from '@/lib/catalogo';
import Catalogo from '@/components/Catalogo';
import Foto from '@/components/Foto';
import { Stendi } from '@/components/Inviti';

// Una categoria (/catalogo/sieri) o un filtro (/catalogo/k-beauty): lo stesso indirizzo corto,
// i guardiani controllano che una categoria e un filtro non abbiano lo stesso nome.
const gruppo = (slug: string) => {
  const c = CATALOGO.categorie.find((x) => x.id === slug);
  if (c) return { tipo: 'categoria' as const, ...c };
  const t = CATALOGO.tag.find((x) => x.id === slug);
  return t ? { tipo: 'tag' as const, ...t, immagine: t.immagine || (t.id === 'k-beauty' ? 'kbeauty' : '') } : null;
};

export function generateStaticParams() {
  return [...CATALOGO.categorie, ...CATALOGO.tag].filter((g) => nelGruppo(g.id).length).map((g) => ({ slug: g.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = gruppo(slug);
  if (!g) return {};
  return { title: g.tipo === 'categoria' ? `${g.nome}: quali scegliere per il tuo biotipo` : `${g.nome}: i prodotti scelti da Skinmatch`, description: g.descrizione, alternates: { canonical: `/catalogo/${slug}` } };
}

export default async function GruppoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = gruppo(slug);
  if (!g) notFound();
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <Link href="/catalogo" className="piccolo">← Tutto il catalogo</Link>
      <header style={{ display: 'grid', gap: 'clamp(20px, 4vw, 40px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', alignItems: 'center' }}>
        <div className="pila" style={{ ['--gap' as string]: '12px' }}>
          <span className="etichetta">{g.tipo === 'categoria' ? 'Categoria' : 'Selezione'}</span>
          <h1 className="sopratitolo" style={{ fontSize: 'clamp(32px, 5.4vw, 54px)' }}>{g.nome}</h1>
          <p className="intro">{g.descrizione}</p>
          <Stendi href="/test">Quali vanno bene per te? Fai il test</Stendi>
        </div>
        {g.immagine && <Foto nome={g.immagine} riserva={g.tipo === 'categoria' ? `/images/cat-${g.id}.jpg` : g.id === 'k-beauty' ? '/images/kbeauty-mask.jpg' : undefined} priorita style={{ aspectRatio: '3 / 2' }} sizes="(max-width: 760px) 100vw, 45vw" />}
      </header>
      <Catalogo categoria={g.tipo === 'categoria' ? g.id : ''} tag={g.tipo === 'tag' ? g.id : ''} />
    </main>
  );
}
