// /md/<pagina>.md: ogni pagina del sito in markdown pulito, per gli assistenti (le pagine HTML la annunciano con
// <link rel="alternate" type="text/markdown">). Vedi src/lib/ia.ts → pagineMd.
import { pagineMd } from '@/lib/ia';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pagineMd()).map((k) => {
    const parti = k.split('/');
    parti[parti.length - 1] += '.md';
    return { pagina: parti };
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ pagina: string[] }> }) {
  const { pagina } = await params;
  const chiave = pagina.join('/').replace(/\.md$/, '');
  const testo = pagineMd()[chiave]?.();
  return testo ? new Response(testo + '\n', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }) : new Response('Not found', { status: 404 });
}
