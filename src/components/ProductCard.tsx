import { CATEGORY_LABELS, TIER_LABELS, type Product } from '@/lib/products';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded-lg p-5 flex flex-col gap-2 bg-white" style={{ borderColor: 'var(--border)' }}>
      {product.isPlaceholder && (
        <span className="self-start text-[10px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
          Esempio — prodotto segnaposto
        </span>
      )}
      {product.linkPending && (
        <span className="self-start text-[10px] font-semibold tracking-wide uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
          Prodotto reale — link in arrivo
        </span>
      )}
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
        <a
          href={product.affiliateUrl}
          className="text-sm font-medium underline"
          style={{ color: 'var(--accent)' }}
        >
          Vedi prodotto →
        </a>
      </div>
    </div>
  );
}
