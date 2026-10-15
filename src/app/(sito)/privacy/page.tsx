import type { Metadata } from 'next';
import PaginaLegale from '@/components/PaginaLegale';
import { PRIVACY, completo } from '@/lib/legale';

export const metadata: Metadata = {
  title: 'Informativa privacy',
  description: 'Quali dati tratta Skinmatch e perché: le risposte del test restano sul tuo telefono, niente cookie di profilazione, nessun dato venduto.',
  alternates: { canonical: '/privacy' },
  robots: completo() ? undefined : { index: false, follow: true },
};

export default function Pagina() {
  return <PaginaLegale titolo="Informativa privacy" testo={PRIVACY()} />;
}
