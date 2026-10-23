import type { Metadata } from 'next';
import Link from 'next/link';
import { BIOTIPI } from '@/lib/dati';
import { BISOGNI, prodottiDelBisogno } from '@/lib/integratori';
import { Invito } from '@/components/Inviti';

// GLI INTEGRATORI PER BISOGNO (23/10/2026): si entra da quello che serve, come «Scegli chi sei» su Proteo.
// Ogni bisogno porta alla sua pagina (/biotipi/<id>), dove ci sono gli attivi con le indicazioni autorizzate
// e i prodotti. Vedi lib/integratori.ts.
export const metadata: Metadata = {
  title: 'Integratori per pelle, capelli e unghie: per bisogno',
  description: 'Capelli che cadono, pelle secca, tono, sole, unghie fragili, brufoli: quali sostanze hanno un\'indicazione autorizzata in UE e quali integratori le contengono.',
  alternates: { canonical: '/integratori' },
};

export default function Integratori() {
  const vegana = BIOTIPI.find((b) => b.id === 'vegana');
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px', maxWidth: 760 }}>
        <span className="etichetta">Dall&apos;interno</span>
        <h1 className="sopratitolo" style={{ fontSize: 'clamp(32px, 5.4vw, 54px)' }}>Integratori per pelle, capelli e unghie</h1>
        <p className="intro">
          Si parte da quello che ti serve. Per ogni bisogno trovi le sostanze che hanno un&apos;indicazione autorizzata
          in UE, quelle che non ce l&apos;hanno, e gli integratori che le contengono. Un integratore aiuta se qualcosa
          manca: non sostituisce un&apos;alimentazione varia né la visita, quando serve.
        </p>
      </header>

      <section className="griglia" style={{ ['--min' as string]: '260px' }} aria-label="I bisogni">
        {BISOGNI.map((b) => {
          const bio = BIOTIPI.find((x) => x.id === b.biotipo);
          const quanti = prodottiDelBisogno(b.chiave, 99).length;
          return (
            <Link key={b.chiave} href={`/biotipi/${b.biotipo}`} className="carta pila bisogno-carta" style={{ ['--gap' as string]: '8px' }}>
              <span className="titolo-3">{b.domanda}</span>
              {bio && <span className="piccolo">{bio.motto}</span>}
              <span className="piccolo bisogno-attivi">{b.autorizzati.map((a) => a.nome.replace(/ \(.*\)/, '')).join(' · ')}</span>
              <span className="piccolo"><b>{quanti}</b> {quanti === 1 ? 'integratore' : 'integratori'} →</span>
            </Link>
          );
        })}
      </section>

      {vegana && (
        <p className="testo" style={{ maxWidth: 760 }}>
          <b>Se mangi vegano</b>: la prima cosa da controllare è la vitamina B12, che negli alimenti vegetali non c&apos;è.{' '}
          <Link href="/biotipi/vegana">Cosa sapere →</Link>
        </p>
      )}

      <section className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <span className="titolo-3">Non sai da dove partire?</span>
          <span className="piccolo">Tre domande su cosa ti serve, come mangi e se prendi farmaci.</span>
        </div>
        <Invito href="/test?percorso=integrazione">Fai il test</Invito>
      </section>
      <p className="piccolo" style={{ maxWidth: 760 }}>
        Le frasi tra virgolette nelle pagine dei bisogni sono le indicazioni del Regolamento (UE) 432/2012, le sole che
        un integratore può scrivere sulla confezione. Se prendi farmaci tutti i giorni, sei in gravidanza o allatti,
        chiedi al medico o al farmacista prima di cominciare.
      </p>
    </main>
  );
}
