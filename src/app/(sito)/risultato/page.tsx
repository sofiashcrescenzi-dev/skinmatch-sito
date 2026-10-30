import PaginaRisultato from '@/components/PaginaRisultato';

// /risultato#<codice>: i link condivisi prima del 30/10/2026 e «Rivedi il tuo ultimo risultato».
// Quelli nuovi portano anche il biotipo: /risultato/<biotipo>#<codice> (lib/condividi.ts).
export default function RisultatoPage() {
  return <PaginaRisultato />;
}
