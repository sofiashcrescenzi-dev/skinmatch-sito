import Link from 'next/link';
import { TEST, BIOTIPI, CATALOGO, ARTICOLI, TERMINI, ATTIVI, conAttivo, fotoDi, immagine } from '@/lib/dati';
import { nelGruppo, PRODOTTI } from '@/lib/catalogo';
import Foto from '@/components/Foto';
import { Invito, Stendi } from '@/components/Inviti';
import { ConTermini } from '@/components/Termini';
import RicercaCentrale from '@/components/RicercaCentrale';
import { BISOGNI } from '@/lib/integratori';

const PASSI = [
  ['Rispondi a poche domande', 'Su quello che vedi allo specchio, sulla cute e i capelli, su come dormi e mangi: domande su come sei, non su come pensi di essere.'],
  ['Scopri il tuo biotipo', 'Dai punteggi esce il tuo biotipo, con i tratti che si aggiungono e cosa evitare. Se serve un medico, te lo diciamo prima.'],
  ['Ricevi la tua giornata', 'Ogni prodotto all\'ora in cui si usa. Per ogni passaggio la scelta top e un\'alternativa che costa meno, con scritto dove la top è migliore.'],
];

// ⚠️ I QUATTRO TEST SUBITO SOTTO L'APERTURA (Federico, 30/10/2026: «sotto la hero metti i 4 test, strutturati in
// maniera differente e più bella»). Il completo in grande, gli altri tre in fila; di ognuno quanto dura, quante domande
// fa al massimo e cosa ne esce. Il tono di fondo è un fototipo diverso per test.
const ESCE: Record<string, string> = {
  completo: 'Il biotipo della pelle e della cute, la routine di tutta la giornata e, se servono, fino a tre integratori.',
  viso: 'Il biotipo della pelle e una routine da tre a cinque passaggi, mattina e sera.',
  cute: 'Il biotipo della cute, lo shampoo e il trattamento giusti.',
  integrazione: 'Fino a tre integratori, ognuno con l\'indicazione autorizzata in Europa.',
};

// La routine in ordine: a cosa serve ogni passaggio e quando si usa, con i suoi prodotti.
const ROUTINE: [string, string, string, string][] = [
  ['detergenti', 'Detersione', 'mattina e sera', 'Toglie sebo, trucco e protezione solare senza sgrassare: la base di tutto il resto.'],
  ['sieri', 'Siero', 'mattina e sera', 'Leggero e concentrato, per un obiettivo: idratazione, macchie, imperfezioni, segni del tempo.'],
  ['attivi', 'Trattamento mirato', 'la sera', 'Retinoidi e acidi esfolianti: i più forti, da introdurre piano.'],
  ['creme', 'Crema', 'mattina e sera', 'Chiude l’idratazione e protegge la barriera; la texture si sceglie sul sebo.'],
  ['solari', 'Protezione solare', 'ogni mattina, per ultima', 'Il passaggio che previene di più macchie e segni del tempo, tutto l’anno.'],
];
const ALTRO = ['shampoo', 'capelli', 'barba', 'integratori', 'cerotti'];
const IN_HOME = ['niacinamide', 'retinoidi', 'vitamina-c', 'aha-pha', 'salicilico', 'azelaico', 'ialuronico', 'ceramidi'];

export default function Home() {
  const pelle = BIOTIPI.filter((b) => b.area === 'pelle' && b.tipo === 'biotipo').slice(0, 6);
  return (
    <main>
      {/* L'apertura di Fototipi: fondo cacao, la foto tagliata nelle due mezzelune del segno, la scala dei fototipi */}
      <section className="apertura-scura" style={{ marginTop: -84, paddingTop: 84 }}>
        <div className="contenitore" style={{ display: 'grid', gap: 'clamp(28px, 5vw, 64px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', alignItems: 'center', paddingBlock: 'clamp(28px, 5vw, 64px) clamp(40px, 6vw, 80px)' }}>
          <div className="pila" style={{ ['--gap' as string]: '18px' }}>
            {/* ⚠️ PIÙ GENERICA DELLA PELLE (Federico, 30/10/2026: «sull'home page io andrei più generico, non solo
                pelle, ma fai test per la tua routine»): pelle, capelli e integratori sono tutti e tre nel test */}
            <span className="etichetta">Pelle, capelli, integratori</span>
            <h1 className="sopratitolo">La tua routine, scelta su di te</h1>
            <div className="scala-fototipi" role="img" aria-label="I sei fototipi della pelle"><i /><i /><i /><i /><i /><i /></div>
            <p className="intro">Rispondi a poche domande e ricevi la tua giornata: ogni prodotto all’ora in cui si usa, la scelta top e un’alternativa che costa meno. Ogni prodotto ha la sua scheda, con gli attivi e per chi è.</p>
            {/* ⚠️ IL TEST IN PRIMO PIANO (23/10/2026, Federico): è la porta principale del sito, prima della ricerca
                e del catalogo. Un blocco suo, con cosa si fa e cosa se ne ricava. */}
            <div className="test-primo">
              <Invito href="#i-test" scuro>Fai il test per la tua routine</Invito>
              <span className="test-primo-sotto">Quattro test, da 2 a 6 minuti. Gratis, senza registrazione.</span>
            </div>
            <RicercaCentrale quanti={PRODOTTI.length} />
            <Link href="/catalogo" className="piccolo" style={{ color: 'var(--latte)' }}>Oppure esplora tutti i {PRODOTTI.length} prodotti →</Link>
          </div>
          <div className="mezze" role="img" aria-label="Pelle vera, luce naturale, nelle due mezzelune del segno di Skinmatch">
            {/* una vera immagine, ad alta priorità: il browser la scopre subito (è il contenuto principale) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span><img src="/immagini/home-800.webp" srcSet="/immagini/home-800.webp 800w, /immagini/home-1600.webp 1600w" sizes="(max-width: 760px) 90vw, 520px" alt="" fetchPriority="high" decoding="async" /></span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span><img src="/immagini/home-800.webp" srcSet="/immagini/home-800.webp 800w, /immagini/home-1600.webp 1600w" sizes="(max-width: 760px) 90vw, 520px" alt="" fetchPriority="high" decoding="async" /></span>
            {immagine('home')?.autore && <small className="credito" style={{ gridColumn: "1 / -1", textAlign: "right", marginTop: "18%" }}>Foto di {immagine("home")!.autore} su Pexels</small>}
          </div>
        </div>
      </section>

      <section id="i-test" className="test-scaffale" aria-labelledby="test-titolo">
        <div className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 32px)' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">Da dove partire</span>
            <h2 id="test-titolo" className="titolo-2">Quattro test, una routine</h2>
          </div>
          <div className="test-griglia">
            {['completo', 'viso', 'cute', 'integrazione'].map((id) => TEST.percorsi.find((x) => x.id === id)).filter((p): p is (typeof TEST.percorsi)[number] => !!p).map((p, i) => (
              <Link key={p.id} href={`/test?percorso=${p.id}`} className={`test-carta${i === 0 ? ' test-grande' : ''}`} style={{ ['--tono' as string]: `var(--f${i + 1})` }}>
                <span className="test-foto"><Foto nome={p.immagine} sizes={i === 0 ? '(max-width: 760px) 100vw, 40vw' : '(max-width: 760px) 100vw, 25vw'} /></span>
                <span className="test-corpo">
                  <span className="test-dati"><b>{p.minuti} min</b><span>fino a {p.domande.length} domande</span></span>
                  <span className="titolo-3">{p.nome === 'Test Completo' ? 'Il test completo' : p.titolo}</span>
                  <span className="piccolo">{p.descrizione}</span>
                  <span className="test-esce"><b>Ne esce</b> {ESCE[p.id] || 'Il tuo biotipo e una routine.'}</span>
                  <span className="test-via">Inizia <span aria-hidden="true">→</span></span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
        <div className="pila" style={{ ['--gap' as string]: '8px' }}>
          <span className="etichetta">Per orientarsi</span>
          <h2 className="titolo-2">Le famiglie della skincare</h2>
          <p className="intro">Cosa distingue le grandi famiglie della skincare, e i prodotti di ognuna.</p>
        </div>
        {/* le famiglie sono i filtri segnati «in homepage» nell'admin (Federico, 15/10), nel loro ordine */}
        <div className="griglia" style={{ ['--min' as string]: '260px' }}>
          {CATALOGO.tag.filter((x) => x.home).map((x) => {
            const g = nelGruppo(x.id);
            if (!g.length) return null;
            const conta: Record<string, number> = {};
            g.forEach((p) => { conta[p.brand] = (conta[p.brand] || 0) + 1; });
            const marche = Object.entries(conta).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m]) => m);
            return (
              <Link key={x.id} href={`/catalogo/${x.id}`} className="carta-foto famiglia-foto" style={{ ['--rapporto' as string]: '3 / 2' }}>
                <Foto nome={x.immagine || 'glossario'} sizes="(max-width: 760px) 100vw, 25vw" />
                <span className="corpo">
                  <span className="titolo-3">{x.nome}</span>
                  <span className="testo-carta">{x.descrizione}</span>
                  <span className="piccolo">Per esempio {marche.join(', ')}.</span>
                  <span className="stendi">I {g.length} prodotti<span className="barra" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span></span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section style={{ background: 'var(--velo)' }}>
        <div className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">La routine, in ordine</span>
            <h2 className="titolo-2">A cosa serve ogni prodotto</h2>
            <p className="intro">Pochi passaggi, nell’ordine in cui si mettono. Ognuno porta ai suoi prodotti.</p>
          </div>
          <ol className="griglia routine" style={{ ['--min' as string]: '200px' }}>
            {ROUTINE.map(([id, nome, quando, testo], i) => {
              const c = CATALOGO.categorie.find((x) => x.id === id);
              if (!c || !nelGruppo(id).length) return null;
              return (
                <li key={id}>
                  <Link href={`/catalogo/${id}`} className="carta-foto" style={{ ['--rapporto' as string]: '3 / 2' }}>
                    <Foto nome={c.immagine} riserva={`/images/cat-${c.id}.jpg`} sizes="(max-width: 760px) 100vw, 20vw" />
                    <span className="corpo">
                      <span className="etichetta">{i + 1} · {quando}</span>
                      <span className="titolo-3">{nome}</span>
                      <span className="piccolo">{testo}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="riga-chip" aria-label="Le altre categorie">
            <span className="piccolo" style={{ alignSelf: 'center', marginRight: 4 }}>E poi:</span>
            {ALTRO.map((id) => CATALOGO.categorie.find((x) => x.id === id)).filter((c) => c && nelGruppo(c.id).length).map((c) => <Link key={c!.id} href={`/catalogo/${c!.id}`} className="chip">{c!.nome}</Link>)}
          </div>
        </div>
      </section>

      {/* DALL'INTERNO (23/10/2026): gli integratori per bisogno, come «Scegli chi sei» su Proteo. Vedi /integratori. */}
      <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', justifyContent: 'space-between' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">Dall&apos;interno</span>
            <h2 className="titolo-2">Integratori, per bisogno</h2>
            <p className="intro">Da quello che ti serve alle sostanze con un&apos;indicazione autorizzata, e agli integratori che le contengono.</p>
          </div>
          <Stendi href="/integratori">Tutti i bisogni</Stendi>
        </div>
        <div className="riga-chip">
          {BISOGNI.map((b) => <Link key={b.chiave} href={`/biotipi/${b.biotipo}`} className="chip">{b.domanda}</Link>)}
        </div>
      </section>

      <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', justifyContent: 'space-between' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">I principi attivi</span>
            <h2 className="titolo-2">Gli attivi, spiegati</h2>
            <p className="intro">Cosa fanno, per chi sono e a cosa stare attenti. Da ognuno, i prodotti che lo contengono.</p>
          </div>
          <Stendi href="/glossario">Tutte le parole della pelle</Stendi>
        </div>
        <div className="griglia" style={{ ['--min' as string]: '260px' }}>
          {IN_HOME.map((id) => ATTIVI.find((a) => a.id === id)).filter(Boolean).map((a) => {
            const n = PRODOTTI.filter((p) => conAttivo(p, a!)).length;
            return (
              <article key={a!.id} className="carta pila attivo-carta" style={{ ['--gap' as string]: '8px' }}>
                <h3 className="titolo-3">{a!.nome}</h3>
                <p className="testo-carta">{a!.cosa}</p>
                <p className="piccolo"><b>Per chi.</b> {a!.per_chi}</p>
                <p className="piccolo"><b>Attenzione.</b> {a!.attenzione}</p>
                {n > 0 && <Stendi href={`/catalogo?attivo=${a!.id}`}>{n} prodotti con {a!.nome.split(' (')[0].toLowerCase().replace(/^vitamina c$/, 'vitamina C')}</Stendi>}
              </article>
            );
          })}
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
