import { PRODOTTI, indirizzo } from '@/lib/catalogo';

// Gli indirizzi di oggi dei prodotti, oggetto → /catalogo/<categoria>/<oggetto>: li legge il Worker quando
// un indirizzo non c'è più, così un prodotto spostato di categoria in admin rinvia alla sua pagina nuova.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(Object.fromEntries(PRODOTTI.map((p) => [p.slug, indirizzo(p)]).filter(([s, u]) => s && u)));
}
