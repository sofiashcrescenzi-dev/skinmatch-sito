import Link from 'next/link';
import { CATEGORY_LABELS, type Category } from '@/lib/products';

const FEATURED_CATEGORIES: Category[] = ['detergenti', 'creme', 'sieri', 'shampoo', 'barba', 'capelli'];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-28 pb-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
          Skincare su misura
        </p>
        <h1 className="text-5xl font-semibold mb-6 leading-tight">SkinMatch</h1>
        <p className="text-lg opacity-70 max-w-xl mx-auto mb-10">
          Detergenti, creme, sieri, attivi, shampoo e prodotti per barba e capelli —
          per ogni tipo di pelle e ogni budget. Compresa una sezione dedicata alla skincare coreana.
        </p>
        <Link
          href="/test"
          className="inline-block px-8 py-3.5 rounded-full text-white font-medium text-lg"
          style={{ background: 'var(--accent)' }}
        >
          Trova il tuo SkinMatch →
        </Link>
      </section>

      {/* Categorie */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50 mb-6 text-center">
          Sfoglia per categoria
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {FEATURED_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/catalogo?categoria=${c}`}
              className="border rounded-lg p-6 text-center font-medium hover:bg-neutral-50 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/catalogo" className="underline font-medium" style={{ color: 'var(--accent)' }}>
            Vedi tutto il catalogo →
          </Link>
        </div>
      </section>

      {/* K-beauty */}
      <section className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold mb-3">Skincare coreana</h2>
          <p className="opacity-70 mb-6">
            Una sezione dedicata ai prodotti K-beauty più amati: essenze, mucina di lumaca,
            fermentati e le routine multi-step che hanno cambiato la skincare.
          </p>
          <Link href="/catalogo?kbeauty=1" className="underline font-medium" style={{ color: 'var(--accent)' }}>
            Scopri i prodotti coreani →
          </Link>
        </div>
      </section>
    </main>
  );
}
