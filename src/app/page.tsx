import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_LABELS, type Category } from '@/lib/products';

const QUIZ_PATHS = [
  { percorso: 'viso', title: 'Viso', description: 'Biotipo cutaneo e routine skincare: detergente, siero, crema e protezione solare.' },
  { percorso: 'capelli', title: 'Capelli e cuoio capelluto', description: 'Caduta, forfora, capelli secchi: shampoo e trattamento mirati.' },
  { percorso: 'completa', title: 'Routine completa', description: 'Viso e capelli insieme, con un integratore se pertinente.' },
];

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
      <section className="max-w-6xl mx-auto px-6 pt-4 pb-20">
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

      {/* Quiz — biotipo + routine su misura */}
      <section className="border-t" style={{ borderColor: 'var(--border)', background: 'rgba(182,130,90,0.06)' }}>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
            Non sai da dove iniziare?
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold mb-5 leading-tight">
            Scopri il tuo biotipo di pelle e cuoio capelluto
          </h2>
          <p className="opacity-70 max-w-xl mx-auto mb-10 leading-relaxed">
            Scegli da dove partire. Il test identifica il tuo biotipo — es. pelle seborroica idratata, disidratata e
            sensibile, acneica, o cuoio capelluto secco e desquamante — te lo spiega e ti propone una routine su
            misura con prodotti reali, in tutte le fasce di prezzo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10 text-left">
            {QUIZ_PATHS.map((path) => (
              <Link
                key={path.percorso}
                href={`/test?percorso=${path.percorso}`}
                className="bg-white rounded-xl p-6 border flex flex-col gap-2 hover:bg-neutral-50 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-lg font-semibold">{path.title}</span>
                <span className="text-sm opacity-70 leading-relaxed flex-1">{path.description}</span>
                <span className="text-sm font-medium mt-2" style={{ color: 'var(--accent)' }}>
                  Inizia →
                </span>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/biotipi"
              className="px-8 py-3.5 rounded-full border font-medium text-lg bg-white"
              style={{ borderColor: 'var(--border)' }}
            >
              Scopri i biotipi
            </Link>
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
