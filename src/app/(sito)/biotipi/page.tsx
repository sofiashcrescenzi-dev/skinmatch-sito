import type { Metadata } from 'next';
import Link from 'next/link';
import { BIOTIPI, NOMI_AREA, type Area } from '@/lib/dati';
import Foto from '@/components/Foto';

export const metadata: Metadata = {
  title: 'I biotipi di pelle, cuoio capelluto e integrazione',
  description: 'Seborroica, secca, mista, disidratata, reattiva, acneica; cuoio capelluto grasso, secco, con forfora o caduta: come si riconosce ogni biotipo, cosa cercare in un prodotto e cosa evitare.',
  alternates: { canonical: '/biotipi' },
};

const INTRO: Record<Area, string> = {
  pelle: 'Quanto sebo produce la pelle, quanta acqua trattiene, quanto reagisce: dalla combinazione nasce il biotipo. I tratti si aggiungono sopra, perché una pelle seborroica può anche avere macchie, per esempio.',
  cute: 'Il cuoio capelluto è pelle, e ha i suoi biotipi: si sceglie lo shampoo su di lui, non sulle lunghezze.',
  integrazione: 'Per pelle, capelli e unghie dall\'interno: un profilo per ogni obiettivo, compreso «nessun integratore».',
};

export default function BiotipiPage() {
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(36px, 6vw, 64px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px' }}>
        <span className="etichetta">I biotipi</span>
        <h1 className="sopratitolo">Ogni pelle ha le sue regole</h1>
        <p className="intro">Come si riconosce ogni biotipo, cosa cercare in un prodotto e cosa evitare. Non sai qual è il tuo? <Link href="/test" className="link">Fai il test</Link>: sono domande su quello che vedi allo specchio.</p>
      </header>
      {(['pelle', 'cute', 'integrazione'] as Area[]).map((area) => {
        const base = BIOTIPI.filter((b) => b.area === area && b.tipo === 'biotipo');
        const tratti = BIOTIPI.filter((b) => b.area === area && b.tipo === 'tratto');
        return (
          <section key={area} className="pila" style={{ ['--gap' as string]: '18px' }} id={area}>
            <div className="pila" style={{ ['--gap' as string]: '6px' }}>
              <h2 className="titolo-2">{area === 'integrazione' ? 'Integrazione' : area === 'cute' ? 'Cuoio capelluto e capelli' : 'Pelle del viso'}</h2>
              <p className="intro" style={{ fontSize: 16 }}>{INTRO[area]}</p>
            </div>
            <div className="griglia" style={{ ['--min' as string]: '230px' }}>
              {base.map((b) => (
                <Link key={b.id} href={`/biotipi/${b.id}`} className="carta-foto" style={{ ['--rapporto' as string]: '3 / 2' }}>
                  <Foto nome={b.famiglia} sizes="(max-width: 760px) 100vw, 25vw" />
                  <span className="corpo"><span className="titolo-3">{b.titolo}</span><span className="piccolo">{b.motto}</span></span>
                </Link>
              ))}
            </div>
            {tratti.length > 0 && (
              <div className="pila" style={{ ['--gap' as string]: '8px' }}>
                <span className="piccolo">{area === 'integrazione' ? 'Da tenere presente' : 'I tratti che si aggiungono'} ({NOMI_AREA[area].toLowerCase()}):</span>
                <div className="riga-chip">{tratti.map((t) => <Link key={t.id} href={`/biotipi/${t.id}`} className="chip">{t.titolo}</Link>)}</div>
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
