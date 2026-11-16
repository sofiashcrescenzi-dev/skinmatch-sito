import type { Metadata } from 'next';
import PaginaLegale from '@/components/PaginaLegale';
import { COOKIE, completo } from '@/lib/legale';
import { DatiSuQuestoTelefono } from '@/components/RisultatiSalvati';

export const metadata: Metadata = {
  title: 'Cookie',
  description: 'Skinmatch non usa cookie di profilazione né di statistica: cosa salva il sito sul tuo telefono, perché, e come cancellarlo con un tasto.',
  alternates: { canonical: '/cookie' },
  robots: completo() ? undefined : { index: false, follow: true },
};

export default function Pagina() {
  return <PaginaLegale titolo="Cookie e dati salvati" testo={COOKIE()}><DatiSuQuestoTelefono /></PaginaLegale>;
}
