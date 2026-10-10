import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trova il tuo SkinMatch — Test pelle e cuoio capelluto | SkinMatch',
  description:
    'Scegli il percorso viso, capelli o routine completa: scopri il tuo biotipo di pelle o cuoio capelluto e ricevi una routine su misura con prodotti reali.',
  alternates: { canonical: '/test' },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
