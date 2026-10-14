import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TerminiProvider } from '@/components/Termini';

export const metadata: Metadata = {
  metadataBase: new URL('https://skinmatch.it'),
  title: { default: 'Skinmatch — Il test della pelle, della cute e dell\'integrazione', template: '%s | Skinmatch' },
  description: 'Un test con domande su quello che vedi allo specchio: riconosce il tuo biotipo e ti consiglia i prodotti giusti, ognuno con un\'alternativa che costa meno.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'it_IT', siteName: 'Skinmatch' },
};

export const viewport: Viewport = { themeColor: '#fbf8f4' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        <TerminiProvider>{children}</TerminiProvider>
      </body>
    </html>
  );
}
