import type { Metadata } from 'next';

// Il risultato di qualcuno: si condivide, ma non si indicizza.
export const metadata: Metadata = {
  title: 'Il risultato del test',
  description: 'Il biotipo e la routine usciti dal test di Skinmatch. Fai il test anche tu: domande su quello che vedi allo specchio.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/test' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
