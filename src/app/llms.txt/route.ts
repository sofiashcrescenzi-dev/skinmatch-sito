// /llms.txt (llmstxt.org): l'indice di Skinmatch per gli assistenti. Vedi src/lib/ia.ts.
import { llmsTxt } from '@/lib/ia';

export const dynamic = 'force-static';

export function GET() {
  return new Response(llmsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
