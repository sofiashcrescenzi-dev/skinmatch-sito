import { PRODOTTI } from '@/lib/catalogo';

// QUANTO È FRESCO IL CATALOGO (23/10/2026, la sentinella di Edith): la data della pubblicazione e quanti
// prodotti ci sono. La legge ogni mattina il controllo fuori dal Mac, come lo stats.json degli altri siti.
export const dynamic = 'force-static';

export function GET() {
  return Response.json({ aggiornato: new Date().toISOString(), prodotti: PRODOTTI.length });
}
