import type { Metadata, Viewport } from 'next';
import { DM_Serif_Display, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { TerminiProvider } from '@/components/Termini';

export const metadata: Metadata = {
  metadataBase: new URL('https://skinmatch.it'),
  title: { default: 'Skinmatch — Il test della pelle, della cute e dell\'integrazione', template: '%s | Skinmatch' },
  description: 'Un test con domande su quello che vedi allo specchio: riconosce il tuo biotipo e ti consiglia i prodotti giusti, ognuno con un\'alternativa che costa meno.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'it_IT', siteName: 'Skinmatch' },
};

// I caratteri del marchio (identità di Zeno, media/brand): un serif da titolo ad alto contrasto e un
// grottesco leggibile per il testo. Scaricati e serviti dal sito stesso al momento della build.
const serif = DM_Serif_Display({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });

export const viewport: Viewport = { themeColor: '#faf7f3' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <TerminiProvider>{children}</TerminiProvider>
      </body>
    </html>
  );
}
