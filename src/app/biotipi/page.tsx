import type { Metadata } from 'next';
import Link from 'next/link';
import { ALL_BIOTYPES } from '@/lib/quiz';

export const metadata: Metadata = {
  title: 'Biotipi di pelle e cuoio capelluto — SkinMatch',
  description:
    'Scopri le caratteristiche dei principali biotipi di pelle (seborroica, secca, sensibile, acneica, atopica...) e di cuoio capelluto (seborroico, secco, con diradamento...).',
  alternates: { canonical: '/biotipi' },
};

const skinBiotypes = ALL_BIOTYPES.filter((b) => b.kind === 'pelle');
const scalpBiotypes = ALL_BIOTYPES.filter((b) => b.kind === 'cuoio-capelluto');

export default function BiotipiPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-4 pb-24">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
          Biotipi
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold mb-5 leading-tight">Biotipi di pelle e cuoio capelluto</h1>
        <p className="opacity-70 max-w-xl mx-auto leading-relaxed">
          Non tutte le pelli — e non tutti i cuoi capelluti — sono uguali. Esplora i biotipi più comuni per capire
          quali caratteristiche hanno, cosa cercare in un prodotto e cosa evitare. Non sai qual è il tuo?{' '}
          <Link href="/test" className="underline font-medium" style={{ color: 'var(--accent)' }}>
            Fai il test →
          </Link>
        </p>
      </div>

      <section className="mb-14">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50 mb-6">Biotipi di pelle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {skinBiotypes.map((b) => (
            <Link
              key={b.id}
              href={`/biotipi/${b.id}`}
              className="border rounded-xl p-6 hover:bg-neutral-50 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed line-clamp-3">{b.description}</p>
              <span className="inline-block mt-4 text-sm font-medium underline" style={{ color: 'var(--accent)' }}>
                Scopri di più →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50 mb-6">Biotipi di cuoio capelluto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {scalpBiotypes.map((b) => (
            <Link
              key={b.id}
              href={`/biotipi/${b.id}`}
              className="border rounded-xl p-6 hover:bg-neutral-50 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed line-clamp-3">{b.description}</p>
              <span className="inline-block mt-4 text-sm font-medium underline" style={{ color: 'var(--accent)' }}>
                Scopri di più →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
