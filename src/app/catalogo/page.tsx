'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import {
  PRODUCTS,
  GENDER_LABELS,
  CATEGORY_LABELS,
  TIER_LABELS,
  type Gender,
  type Category,
  type Tier,
} from '@/lib/products';

type GenderFilter = Gender | 'tutti';
type CategoryFilter = Category | 'tutti';
type TierFilter = Tier | 'tutti';

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as Category[];

export default function CatalogoPage() {
  const [gender, setGender] = useState<GenderFilter>('tutti');
  const [category, setCategory] = useState<CategoryFilter>('tutti');
  const [tier, setTier] = useState<TierFilter>('tutti');
  const [koreanOnly, setKoreanOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get('categoria');
    if (initialCategory && CATEGORY_KEYS.includes(initialCategory as Category)) {
      setCategory(initialCategory as Category);
    }
    if (params.get('kbeauty') === '1') {
      setKoreanOnly(true);
    }
  }, []);

  const results = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (gender !== 'tutti' && p.gender !== gender && p.gender !== 'unisex') return false;
      if (category !== 'tutti' && p.category !== category) return false;
      if (tier !== 'tutti' && p.tier !== tier) return false;
      if (koreanOnly && !p.korean) return false;
      return true;
    });
  }, [gender, category, tier, koreanOnly]);

  return (
    <main className="max-w-6xl mx-auto px-6 pt-4 pb-16">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold mb-2">Catalogo</h1>
        <p className="opacity-70 max-w-xl">
          Sfoglia per categoria, fascia e provenienza. Non sai da dove iniziare?{' '}
          <Link href="/test" className="underline font-medium" style={{ color: 'var(--accent)' }}>
            Trova il tuo SkinMatch →
          </Link>
        </p>
        <p className="mt-4 text-xs bg-sky-50 border border-sky-200 text-sky-800 px-3 py-2 rounded inline-block">
          Prodotti reali — i link di affiliazione sono in fase di attivazione.
        </p>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-6 mb-10 text-sm">
        <FilterGroup label="Genere">
          {(['tutti', 'donna', 'uomo'] as GenderFilter[]).map((g) => (
            <FilterChip key={g} active={gender === g} onClick={() => setGender(g)}>
              {g === 'tutti' ? 'Tutti' : GENDER_LABELS[g as Gender]}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Categoria">
          <FilterChip active={category === 'tutti'} onClick={() => setCategory('tutti')}>
            Tutte
          </FilterChip>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Fascia">
          <FilterChip active={tier === 'tutti'} onClick={() => setTier('tutti')}>
            Tutte
          </FilterChip>
          {(Object.keys(TIER_LABELS) as Tier[]).map((t) => (
            <FilterChip key={t} active={tier === t} onClick={() => setTier(t)}>
              {TIER_LABELS[t]}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Provenienza">
          <FilterChip active={!koreanOnly} onClick={() => setKoreanOnly(false)}>
            Tutti
          </FilterChip>
          <FilterChip active={koreanOnly} onClick={() => setKoreanOnly(true)}>
            Solo K-beauty
          </FilterChip>
        </FilterGroup>
      </div>

      {results.length === 0 ? (
        <p className="opacity-60">Nessun prodotto corrisponde a questi filtri.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide opacity-50">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
        active ? 'text-white' : 'bg-white'
      }`}
      style={{
        borderColor: 'var(--border)',
        background: active ? 'var(--accent)' : undefined,
      }}
    >
      {children}
    </button>
  );
}
