import type { Metadata } from 'next';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { BIOTIPI } from '@/lib/dati';
import PaginaRisultato from '@/components/PaginaRisultato';

// IL RISULTATO CONDIVISO, CON IL BIOTIPO NELL'INDIRIZZO (30/10/2026). La pagina è la stessa di /risultato; cambia
// l'anteprima del link: titolo, motto e la carta del biotipo (public/condividi/<biotipo>.jpg). Se la carta non c'è
// ancora (un biotipo nuovo dall'admin), resta quella generica del sito: scripts/carte_condivisione.mjs la prepara.
export const dynamicParams = false;
export function generateStaticParams() {
  return BIOTIPI.filter((b) => b.tipo === 'biotipo').map((b) => ({ biotipo: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ biotipo: string }> }): Promise<Metadata> {
  const { biotipo } = await params;
  const b = BIOTIPI.find((x) => x.id === biotipo)!;
  const io = b.area === 'integrazione' ? 'Il mio profilo' : 'Il mio biotipo';
  const titolo = `${io}: ${b.titolo}`;
  const descrizione = `«${b.motto}» E il tuo? Fai il test di Skinmatch: domande su quello che vedi allo specchio, una routine con un’alternativa che costa meno per ogni prodotto.`;
  // l'impronta del file nell'indirizzo: WhatsApp e le altre app tengono l'anteprima di un'immagine già vista, e una carta
  // rifatta (30/10/2026: il testo nel quadrato centrale) altrimenti non la vedrebbe nessuno
  const file = join(process.cwd(), 'public', 'condividi', `${b.id}.jpg`);
  const carta = existsSync(file) ? `/condividi/${b.id}.jpg?v=${createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 8)}` : null;
  return {
    title: titolo,
    description: descrizione,
    robots: { index: false, follow: true },
    alternates: { canonical: '/test' },
    openGraph: { type: 'website', locale: 'it_IT', siteName: 'Skinmatch', title: titolo, description: descrizione, ...(carta ? { images: [{ url: carta, width: 1200, height: 630, alt: `${io}: ${b.titolo}. Scopri il tuo su skinmatch.it` }] } : {}) },
    twitter: { card: 'summary_large_image', title: titolo, description: descrizione },
  };
}

export default function RisultatoBiotipo() {
  return <PaginaRisultato />;
}
