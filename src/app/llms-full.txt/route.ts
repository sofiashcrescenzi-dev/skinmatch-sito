// /llms-full.txt: tutto il metodo di Skinmatch in un testo solo (biotipi, glossario, integratori, rivista). Vedi src/lib/ia.ts.
import { llmsFull } from '@/lib/ia';

export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsFull(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
