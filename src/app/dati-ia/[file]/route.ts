// /dati-ia/<file>.json: i dati compatti che legge il server MCP di Skinmatch (worker/mcp.js). Vedi src/lib/ia.ts.
import { datiIa } from '@/lib/ia';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(datiIa()).map((file) => ({ file }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const f = datiIa()[file];
  return f ? Response.json(f()) : new Response('Not found', { status: 404 });
}
