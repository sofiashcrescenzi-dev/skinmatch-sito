// L'indice delle sitemap: un file per sezione. Vedi src/lib/sitemap.ts.
import { indice, xml } from '@/lib/sitemap';

export const dynamic = 'force-static';

export function GET() {
  return xml(indice());
}
