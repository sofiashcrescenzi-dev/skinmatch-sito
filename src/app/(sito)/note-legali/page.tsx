import type { Metadata } from 'next';
import PaginaLegale from '@/components/PaginaLegale';
import { NOTE, completo } from '@/lib/legale';

export const metadata: Metadata = {
  title: 'Note legali',
  description: 'Chi pubblica Skinmatch, i limiti del test, i link di affiliazione, i diritti su testi e immagini.',
  alternates: { canonical: '/note-legali' },
  robots: completo() ? undefined : { index: false, follow: true },
};

export default function Pagina() {
  return <PaginaLegale titolo="Note legali" testo={NOTE()} />;
}
