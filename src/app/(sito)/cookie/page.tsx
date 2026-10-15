import type { Metadata } from 'next';
import PaginaLegale from '@/components/PaginaLegale';
import { COOKIE, completo } from '@/lib/legale';

export const metadata: Metadata = {
  title: 'Cookie',
  description: 'Skinmatch non usa cookie di profilazione né di statistica: cosa usa il sito e come gestirlo.',
  alternates: { canonical: '/cookie' },
  robots: completo() ? undefined : { index: false, follow: true },
};

export default function Pagina() {
  return <PaginaLegale titolo="Cookie" testo={COOKIE()} />;
}
