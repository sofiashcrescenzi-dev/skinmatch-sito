import Image from 'next/image';
import { CATEGORY_LABELS, TIER_LABELS, type Product } from '@/lib/products';

function merchantName(p: Product): string | null {
  if (p.merchant) return p.merchant;
  if (p.affiliateUrl.includes('amazon.')) return 'Amazon';
  return null;
}

function BuyLink({ product, className }: { product: Product; className?: string }) {
  if (product.affiliateUrl === '#') {
    return <span className={`text-sm opacity-50 ${className ?? ''}`}>Disponibile a breve</span>;
  }
  const merchant = merchantName(product);
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={`text-sm font-medium underline ${className ?? ''}`}
      style={{ color: 'var(--accent)' }}
    >
      {merchant ? `Vedi su ${merchant} →` : 'Vedi prodotto →'}
    </a>
  );
}

function ProductImage({ product, size }: { product: Product; size: 'card' | 'thumb' }) {
  if (!product.image) {
    // Riquadro neutro con la marca, così le schede restano allineate anche senza foto.
    return (
      <div
        className={`shrink-0 flex items-center justify-center text-center bg-neutral-50 ${size === 'card' ? 'w-full aspect-[4/3] rounded-md text-sm' : 'w-14 h-14 rounded text-[9px]'}`}
      >
        <span className="opacity-40 font-medium px-2 leading-tight">{product.brand}</span>
      </div>
    );
  }
  return (
    <div
      className={`relative shrink-0 bg-white overflow-hidden ${size === 'card' ? 'w-full aspect-[4/3] rounded-md' : 'w-14 h-14 rounded'}`}
    >
      <Image
        src={product.image}
        alt={`${product.brand} ${product.name}`}
        fill
        sizes={size === 'card' ? '(max-width: 640px) 100vw, 33vw' : '56px'}
        className="object-contain"
      />
    </div>
  );
}

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  if (compact) {
    return (
      <div className="border rounded-lg p-3 flex items-center gap-3 bg-white" style={{ borderColor: 'var(--border)' }}>
        <ProductImage product={product} size="thumb" />
        <div className="flex-1 min-w-0">
          <p className="text-xs opacity-60">
            {product.brand} · {TIER_LABELS[product.tier]}
          </p>
          <p className="text-sm font-medium leading-snug truncate">{product.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-semibold">{product.price.toFixed(2)} €</span>
          <BuyLink product={product} className="text-xs" />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-5 flex flex-col gap-2 bg-white" style={{ borderColor: 'var(--border)' }}>
      {product.isPlaceholder && (
        <span className="self-start text-[10px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
          Esempio — prodotto segnaposto
        </span>
      )}
      <ProductImage product={product} size="card" />
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="uppercase tracking-wide font-medium" style={{ color: 'var(--accent)' }}>
          {CATEGORY_LABELS[product.category]}
        </span>
        <span className="opacity-40">·</span>
        <span className="opacity-70">{TIER_LABELS[product.tier]}</span>
        {product.korean && (
          <span className="ml-auto bg-neutral-100 px-2 py-0.5 rounded text-[10px] font-medium">K-beauty</span>
        )}
      </div>
      <h3 className="font-semibold text-lg leading-snug">{product.name}</h3>
      <p className="text-sm opacity-60">{product.brand}</p>
      <p className="text-sm opacity-80 flex-1">{product.description}</p>
      <div className="flex items-center justify-between pt-2 mt-auto">
        <span className="font-semibold">{product.price.toFixed(2)} €</span>
        <BuyLink product={product} />
      </div>
    </div>
  );
}
