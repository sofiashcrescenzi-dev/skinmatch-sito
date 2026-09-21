import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogo — Detergenti, creme, sieri, K-beauty | SkinMatch',
  description:
    'Sfoglia il catalogo SkinMatch per categoria, fascia di prezzo e provenienza: detergenti, creme, sieri, shampoo, prodotti per capelli e barba, K-beauty.',
  alternates: { canonical: '/catalogo' },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
