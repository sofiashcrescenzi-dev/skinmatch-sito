// Un file dell'indice di /sitemap.xml: pagine, catalogo, schede, rivista. Vedi src/lib/sitemap.ts.
import { FILE, urlset, xml } from '@/lib/sitemap';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(FILE).map((file) => ({ file }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const voci = FILE[file];
  return voci ? xml(urlset(voci())) : new Response('Not found', { status: 404 });
}
