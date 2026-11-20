import Header from '@/components/Header';
import Piede from '@/components/Piede';
import Guasti from '@/components/Guasti';
import Arrivi from '@/components/Arrivi';
import { ARTICOLI, NOZIONI } from '@/lib/dati';

export default function SitoLayout({ children }: { children: React.ReactNode }) {
  const rivista = ARTICOLI.length > 0 || NOZIONI.length > 0; // la Rivista ha anche «Lo sapevi che» (23/10)
  return (
    <>
      <Header rivista={rivista} />
      {/* .sito-pagine (20/11/2026): il movimento delle pagine pubbliche (globals.css, «Luccichio») non tocca l'admin, che
          usa le stesse classi. display: contents: per l'impaginazione non c'è nessuna scatola in più. */}
      <div className="sito-pagine" style={{ display: 'contents' }}>{children}</div>
      <Piede rivista={rivista} />
      <Guasti />
      <Arrivi />
    </>
  );
}
