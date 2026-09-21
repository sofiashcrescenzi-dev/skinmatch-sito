import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trova il tuo SkinMatch — Test pelle e cuoio capelluto | SkinMatch',
  description:
    'Scopri il tuo biotipo di pelle e cuoio capelluto e ricevi una routine su misura: detergente, siero, crema, capelli, barba e integratore.',
  alternates: { canonical: '/test' },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
