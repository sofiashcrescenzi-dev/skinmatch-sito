import { PRODOTTI, indirizzo } from '@/lib/catalogo';
import VECCHI from '@/data/indirizzi-vecchi.json';

// Gli indirizzi di oggi dei prodotti, oggetto → /catalogo/<categoria>/<oggetto>: li legge il Worker quando
// un indirizzo non c'è più, così un prodotto spostato di categoria in admin rinvia alla sua pagina nuova.
export const dynamic = 'force-static';

export function GET() {
  const oggi = Object.fromEntries(PRODOTTI.map((p) => [p.slug, indirizzo(p)]).filter(([s, u]) => s && u));
  // i vecchi oggetti (tipo corretto dopo) portano alla pagina di oggi dello stesso prodotto
  const perId = Object.fromEntries(PRODOTTI.map((p) => [p.id, indirizzo(p)]));
  const vecchi = Object.fromEntries(Object.entries((VECCHI as { vecchi: Record<string, string> }).vecchi).map(([s, id]) => [s, perId[id]]).filter(([s, u]) => u && !oggi[s as string]));
  return Response.json({ ...vecchi, ...oggi });
}
