import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BIOTYPES, getBiotypeById } from '@/lib/quiz';

export function generateStaticParams() {
  return ALL_BIOTYPES.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const biotype = getBiotypeById(id);
  if (!biotype) return {};
  return {
    title: `${biotype.title} — Caratteristiche e consigli | SkinMatch`,
    description: biotype.description,
    alternates: { canonical: `/biotipi/${biotype.id}` },
  };
}

export default async function BiotypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const biotype = getBiotypeById(id);
  if (!biotype) notFound();

  const kindLabel =
    biotype.kind === 'pelle' ? 'Biotipo di pelle' : biotype.kind === 'cuoio-capelluto' ? 'Biotipo di cuoio capelluto' : 'Tratto aggiuntivo';

  return (
    <main className="max-w-2xl mx-auto px-6 pt-4 pb-24">
      <Link href="/biotipi" className="text-sm font-medium opacity-60 hover:opacity-100">
        ← Tutti i biotipi
      </Link>

      <div className="mt-6 mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
          {kindLabel}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold mb-5 leading-tight">{biotype.title}</h1>
        <p className="opacity-70 leading-relaxed">{biotype.description}</p>
        {biotype.kind === 'tratto' && (
          <p className="text-sm mt-4 opacity-60">
            Questo non è un biotipo a sé: può aggiungersi a qualsiasi tipo di pelle di base (es. pelle acneica +
            questo tratto).
          </p>
        )}
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Caratteristiche principali</h2>
        <ul className="flex flex-col gap-2.5">
          {biotype.characteristics.map((c) => (
            <li key={c} className="flex gap-3 text-sm opacity-80 leading-relaxed">
              <span style={{ color: 'var(--accent)' }}>•</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <section className="border rounded-xl p-6" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--accent)' }}>
            Cosa cercare
          </h2>
          <ul className="flex flex-col gap-2.5">
            {biotype.lookFor.map((c) => (
              <li key={c} className="text-sm opacity-80 leading-relaxed">
                {c}
              </li>
            ))}
          </ul>
        </section>
        <section className="border rounded-xl p-6" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 opacity-60">Cosa evitare</h2>
          <ul className="flex flex-col gap-2.5">
            {biotype.avoid.map((c) => (
              <li key={c} className="text-sm opacity-80 leading-relaxed">
                {c}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="border-t pt-10 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="opacity-70 mb-5">
          Vuoi sapere se questo è davvero il tuo biotipo, o scoprire una routine costruita sulle tue risposte?
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/test"
            className="px-6 py-3 rounded-full text-white font-medium"
            style={{ background: 'var(--accent)' }}
          >
            Fai il test →
          </Link>
          <Link
            href="/catalogo"
            className="px-6 py-3 rounded-full border font-medium"
            style={{ borderColor: 'var(--border)' }}
          >
            Vedi il catalogo
          </Link>
        </div>
      </div>
    </main>
  );
}
