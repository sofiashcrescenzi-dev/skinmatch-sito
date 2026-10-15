import Link from 'next/link';
import { TEST, BIOTIPI, CATALOGO, ARTICOLI, TERMINI, fotoDi } from '@/lib/dati';
import { nelGruppo } from '@/lib/catalogo';
import Foto from '@/components/Foto';

const PASSI = [
  ['Rispondi guardandoti allo specchio', 'La fronte a metà giornata, la pelle dopo la detersione, i rossori: domande su quello che vedi, non su come pensi di essere.'],
  ['Scopri il tuo biotipo', 'Dai punteggi su sebo, idratazione e reattività esce il tuo biotipo, con i tratti che si aggiungono e cosa evitare.'],
  ['Ricevi la routine', 'Un prodotto per ogni passaggio, scelto sul biotipo, e accanto un\'alternativa che costa meno. Se serve un medico, te lo diciamo prima.'],
];

export default function Home() {
  const pelle = BIOTIPI.filter((b) => b.area === 'pelle' && b.tipo === 'biotipo').slice(0, 6);
  return (
    <main>
      <section className="contenitore" style={{ display: 'grid', gap: 'clamp(24px, 5vw, 64px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', alignItems: 'center', paddingBlock: 'clamp(12px, 3vw, 40px) clamp(40px, 7vw, 88px)' }}>
        <div className="pila" style={{ ['--gap' as string]: '18px' }}>
          <span className="etichetta">Skincare su misura</span>
          <h1 className="sopratitolo">La pelle giusta parte dalle domande giuste</h1>
          <p className="intro">Un test con domande su quello che vedi allo specchio riconosce il tuo biotipo e ti consiglia i prodotti giusti per viso, cute e integrazione, ognuno con un&apos;alternativa che costa meno.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link href="/test" className="bottone">Fai il test</Link>
            <Link href="/biotipi" className="bottone secondario">Scopri i biotipi</Link>
          </div>
          <span className="piccolo">Gratis, senza registrazione. Le risposte restano sul tuo telefono.</span>
        </div>
        <Foto nome="home" riserva="/images/hero-viso.jpg" alt="Pelle vera, luce naturale" priorita style={{ aspectRatio: '4 / 5', maxHeight: 640 }} sizes="(max-width: 760px) 100vw, 50vw" credito />
      </section>

      <section style={{ background: 'var(--velo)' }}>
        <div className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">Quattro test</span>
            <h2 className="titolo-2">Scegli da dove partire</h2>
          </div>
          <div className="griglia" style={{ ['--min' as string]: '240px' }}>
            {TEST.percorsi.map((p) => (
              <Link key={p.id} href={`/test?percorso=${p.id}`} className="carta-foto">
                <Foto nome={p.immagine} sizes="(max-width: 760px) 100vw, 25vw" />
                <span className="corpo">
                  <span className="titolo-3">{p.nome}</span>
                  <span className="piccolo">{p.descrizione}</span>
                  <span className="piccolo" style={{ color: 'var(--terra)', fontWeight: 700 }}>Circa {p.minuti} minuti →</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
        <h2 className="titolo-2">Come funziona</h2>
        <ol className="griglia" style={{ ['--min' as string]: '240px', listStyle: 'none', padding: 0, margin: 0 }}>
          {PASSI.map(([t, d], i) => (
            <li key={t} className="pila" style={{ ['--gap' as string]: '8px' }}>
              <span className="titolo" style={{ fontSize: 44, lineHeight: 1, color: 'var(--terra)' }}>{i + 1}</span>
              <span className="titolo-3">{t}</span>
              <span className="piccolo" style={{ fontSize: 15 }}>{d}</span>
            </li>
          ))}
        </ol>
        <p className="avviso" style={{ maxWidth: '72ch' }}>Skinmatch non fa diagnosi. Se una risposta fa pensare a qualcosa da far vedere a un medico (noduli dolorosi, rossori che non passano, capelli che cadono a chiazze), il risultato lo dice per primo e ti mostra solo prodotti delicati.</p>
      </section>

      <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)', paddingTop: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', justifyContent: 'space-between' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">I biotipi</span>
            <h2 className="titolo-2">Quale pelle hai?</h2>
          </div>
          <Link href="/biotipi" className="link">Tutti i biotipi, anche di cute e integrazione</Link>
        </div>
        <div className="griglia" style={{ ['--min' as string]: '220px' }}>
          {pelle.map((b) => (
            <Link key={b.id} href={`/biotipi/${b.id}`} className="carta-foto" style={{ ['--rapporto' as string]: '3 / 2' }}>
              <Foto nome={fotoDi(b)} sizes="(max-width: 760px) 100vw, 25vw" />
              <span className="corpo"><span className="titolo-3">{b.titolo}</span><span className="piccolo">{b.motto}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--velo)' }}>
        <div className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">Il catalogo</span>
            <h2 className="titolo-2">In ogni fascia di prezzo</h2>
          </div>
          <div className="griglia" style={{ ['--min' as string]: '150px' }}>
            {CATALOGO.categorie.filter((c) => nelGruppo(c.id).length).map((c) => (
              <Link key={c.id} href={`/catalogo/${c.id}`} className="carta-foto" style={{ ['--rapporto' as string]: '1 / 1' }}>
                <Foto nome={c.immagine} riserva={`/images/cat-${c.id}.jpg`} sizes="(max-width: 760px) 50vw, 16vw" />
                <span className="corpo" style={{ padding: '10px 12px 12px' }}><span style={{ fontWeight: 700, fontSize: 15 }}>{c.nome}</span></span>
              </Link>
            ))}
          </div>
          <div className="riga-chip">
            {CATALOGO.tag.filter((t) => nelGruppo(t.id).length).map((t) => <Link key={t.id} href={`/catalogo/${t.id}`} className="chip">{t.nome}</Link>)}
          </div>
        </div>
      </section>

      {ARTICOLI.length > 0 && (
        <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', justifyContent: 'space-between' }}>
            <div className="pila" style={{ ['--gap' as string]: '8px' }}><span className="etichetta">La Rivista</span><h2 className="titolo-2">Da leggere</h2></div>
            <Link href="/rivista" className="link">Tutti gli articoli</Link>
          </div>
          <div className="griglia" style={{ ['--min' as string]: '280px' }}>
            {ARTICOLI.slice(0, 3).map((a) => (
              <Link key={a.slug} href={`/rivista/${a.slug}`} className="carta-foto" style={{ ['--rapporto' as string]: '3 / 2' }}>
                <Foto nome={a.immagine?.file || 'rivista'} sizes="(max-width: 760px) 100vw, 33vw" />
                <span className="corpo"><span className="titolo-3">{a.titolo}</span><span className="piccolo">{a.sommario}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="contenitore sezione pila" style={{ ['--gap' as string]: '16px' }}>
        <span className="etichetta">Il glossario</span>
        <h2 className="titolo-2">Le parole della pelle, spiegate</h2>
        <p className="intro">Dove trovi una parola sottolineata, toccala: si apre la spiegazione in due righe.</p>
        <div className="riga-chip">{TERMINI.slice(0, 14).map((t) => <Link key={t.id} href={`/glossario#${t.id}`} className="chip">{t.nome}</Link>)}<Link href="/glossario" className="chip attivo">Tutti i {TERMINI.length}</Link></div>
      </section>
    </main>
  );
}
