import type { Metadata } from 'next';

// dal 19/11/2026 (voto r-test) il titolo usa le parole di chi lo cerca: «test pelle viso», «che tipo di pelle ho», «gratis»
export const metadata: Metadata = {
  title: 'Test della pelle del viso gratis: che tipo di pelle hai e cosa usare',
  description: 'Il test gratis per capire che tipo di pelle hai: domande su quello che vedi allo specchio, poi una routine con prodotti di tutte le marche e un’alternativa che di solito costa meno. Anche per cute, capelli e integratori.',
  alternates: { canonical: '/test', types: { 'text/markdown': '/md/test.md' } },
};

// LE DOMANDE DI CHI CERCA UN TEST (19/11/2026, voto r-test): quelle che Google mostra sotto «che tipo di pelle ho test».
// Il testo è in components/DomandeTest.tsx (lo mostra la pagina del test); qui solo i dati strutturati per Google.
import { DOMANDE_TEST } from '@/components/DomandeTest';

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: DOMANDE_TEST.map((d) => ({ '@type': 'Question', name: d.domanda, acceptedAnswer: { '@type': 'Answer', text: d.risposta } })),
      }).replace(/</g, '\\u003c') }} />
    </>
  );
}
