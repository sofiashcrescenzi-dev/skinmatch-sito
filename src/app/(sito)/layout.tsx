import Header from '@/components/Header';
import Piede from '@/components/Piede';
import { ARTICOLI } from '@/lib/dati';

export default function SitoLayout({ children }: { children: React.ReactNode }) {
  const rivista = ARTICOLI.length > 0;
  return (
    <>
      <Header rivista={rivista} />
      {children}
      <Piede rivista={rivista} />
    </>
  );
}
