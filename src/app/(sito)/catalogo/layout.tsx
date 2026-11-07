import type { Metadata } from 'next';

export const metadata: Metadata = {
  // ⚠️ UN TITOLO CON IL SUO MODELLO (7/11/2026, Friday): un titolo semplice qui spegneva il «| Skinmatch» del layout
  // principale per tutte le pagine sotto /catalogo (categorie e prodotti). Il default è il titolo di /catalogo stessa,
  // che riceve il modello del layout principale.
  title: { default: 'Il catalogo: detergenti, sieri, creme, solari, shampoo, integratori', template: '%s | Skinmatch' },
  description: 'I prodotti che Skinmatch consiglia, per categoria e per filtro: premium, buona qualità/prezzo, K-beauty, da farmacia, per pelli sensibili, senza ingredienti di attenzione in gravidanza.',
  alternates: { canonical: '/catalogo' },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
