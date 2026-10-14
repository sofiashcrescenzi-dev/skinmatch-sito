import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Il catalogo: detergenti, sieri, creme, solari, shampoo, integratori',
  description: 'I prodotti che Skinmatch consiglia, per categoria e per filtro: premium, buona qualità/prezzo, K-beauty, da farmacia, per pelli sensibili, anche in gravidanza.',
  alternates: { canonical: '/catalogo' },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
