import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { TerminiProvider } from '@/components/Termini';

export const metadata: Metadata = {
  metadataBase: new URL('https://skinmatch.it'),
  title: { default: 'Skinmatch — Il test della pelle, della cute e dell\'integrazione', template: '%s | Skinmatch' },
  description: 'Un test con domande su quello che vedi allo specchio: riconosce il tuo biotipo e ti consiglia i prodotti giusti, ognuno con un\'alternativa simile, di solito più economica.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'it_IT', siteName: 'Skinmatch' },
};

// I caratteri di Fototipi: Familjen Grotesk per i titoli (un grottesco caldo, dalle curve morbide) e
// Inclusive Sans per il testo (disegnato per essere letto da più persone possibile). Serviti dal sito.
// ⚠️ NEL REPOSITORY (17/10/2026): `next/font/google` li scaricava a ogni build e a volte falliva,
// fermando la pubblicazione (Pacemate il 17/10). Sono i file latini variabili di Google Fonts.
const titoli = localFont({ src: './fonts/familjen-grotesk-latin.woff2', weight: '400 700', variable: '--font-titoli', display: 'swap' });
const sans = localFont({
  src: [{ path: './fonts/inclusive-sans-latin.woff2', weight: '300 700', style: 'normal' }, { path: './fonts/inclusive-sans-corsivo-latin.woff2', weight: '300 700', style: 'italic' }],
  variable: '--font-sans', display: 'swap',
});

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
