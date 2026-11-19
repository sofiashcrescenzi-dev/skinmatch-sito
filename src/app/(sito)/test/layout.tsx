import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Il test della pelle, della cute e dell\'integrazione',
  description: 'Tre test, uno per interesse: la pelle del viso, la cute e i capelli, l’integrazione. Domande su quello che vedi allo specchio; ne escono il tuo profilo e una routine con prodotti veri, e puoi salvare i risultati.',
  alternates: { canonical: '/test', types: { 'text/markdown': '/md/test.md' } },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
