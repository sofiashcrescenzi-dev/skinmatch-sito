import Header from '@/components/Header';
import Piede from '@/components/Piede';
import Guasti from '@/components/Guasti';
import { ARTICOLI, NOZIONI } from '@/lib/dati';

export default function SitoLayout({ children }: { children: React.ReactNode }) {
  const rivista = ARTICOLI.length > 0 || NOZIONI.length > 0; // la Rivista ha anche «Lo sapevi che» (23/10)
  return (
    <>
      <Header rivista={rivista} />
      {children}
      <Piede rivista={rivista} />
      <Guasti />
    </>
  );
}
