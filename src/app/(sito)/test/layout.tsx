import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Il test della pelle, della cute e dell\'integrazione',
  description: 'Quattro test con domande su quello che vedi allo specchio: viso, cute e capelli, integrazione, oppure tutto insieme. Ne escono il tuo biotipo e una routine con prodotti veri.',
  alternates: { canonical: '/test' },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
