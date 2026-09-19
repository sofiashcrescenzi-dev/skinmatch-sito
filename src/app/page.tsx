import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_LABELS, type Category } from '@/lib/products';

const FEATURED_CATEGORIES: { key: Category; image: string }[] = [
  { key: 'detergenti', image: '/images/cat-detergenti.jpg' },
  { key: 'creme', image: '/images/cat-creme.jpg' },
  { key: 'sieri', image: '/images/cat-sieri.jpg' },
  { key: 'shampoo', image: '/images/cat-shampoo.jpg' },
  { key: 'barba', image: '/images/cat-barba.jpg' },
  { key: 'capelli', image: '/images/cat-capelli.jpg' },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
              Skincare su misura
            </p>
            <h1 className="text-5xl font-semibold mb-6 leading-tight">SkinMatch</h1>
            <p className="text-lg opacity-70 max-w-xl mx-auto md:mx-0 mb-10">
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
          </div>
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden order-first md:order-last">
            <Image
              src="/images/hero-viso.jpg"
              alt="Pelle luminosa e curata"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Categorie */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50 mb-6 text-center">
          Sfoglia per categoria
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {FEATURED_CATEGORIES.map(({ key, image }) => (
            <Link
              key={key}
              href={`/catalogo?categoria=${key}`}
              className="group relative aspect-square rounded-lg overflow-hidden"
            >
              <Image
                src={image}
                alt={CATEGORY_LABELS[key]}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
              <span className="absolute bottom-3 left-3 text-white font-medium">
                {CATEGORY_LABELS[key]}
              </span>
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
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="/images/kbeauty-mask.jpg"
              alt="Maschera in tessuto coreana"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold mb-3">Skincare coreana</h2>
            <p className="opacity-70 mb-6">
              Una sezione dedicata ai prodotti K-beauty più amati: essenze, mucina di lumaca,
              fermentati e le routine multi-step che hanno cambiato la skincare.
            </p>
            <Link href="/catalogo?kbeauty=1" className="underline font-medium" style={{ color: 'var(--accent)' }}>
              Scopri i prodotti coreani →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
