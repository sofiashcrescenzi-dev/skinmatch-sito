import type { Metadata, Viewport } from 'next';
import { Familjen_Grotesk, Inclusive_Sans } from 'next/font/google';
import './globals.css';
import { TerminiProvider } from '@/components/Termini';

export const metadata: Metadata = {
  metadataBase: new URL('https://skinmatch.it'),
  title: { default: 'Skinmatch — Il test della pelle, della cute e dell\'integrazione', template: '%s | Skinmatch' },
  description: 'Un test con domande su quello che vedi allo specchio: riconosce il tuo biotipo e ti consiglia i prodotti giusti, ognuno con un\'alternativa che costa meno.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'it_IT', siteName: 'Skinmatch' },
};

// I caratteri di Fototipi: Familjen Grotesk per i titoli (un grottesco caldo, dalle curve morbide) e
// Inclusive Sans per il testo (disegnato per essere letto da più persone possibile). Serviti dal sito.
const titoli = Familjen_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-titoli', display: 'swap' });
const sans = Inclusive_Sans({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-sans', display: 'swap' });

export const viewport: Viewport = { themeColor: '#2e1c15' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${titoli.variable} ${sans.variable}`}>
      <body>
        <TerminiProvider>{children}</TerminiProvider>
      </body>
    </html>
  );
}
