import Link from 'next/link';
import { TEST, BIOTIPI, CATALOGO, ARTICOLI, TERMINI, ATTIVI, conAttivo, fotoDi, immagine } from '@/lib/dati';
import { nelGruppo, PRODOTTI } from '@/lib/catalogo';
import Foto from '@/components/Foto';
import { Invito, Luna, Stendi } from '@/components/Inviti';
import { ConTermini } from '@/components/Termini';

const PASSI = [
  ['Rispondi guardandoti allo specchio', 'La fronte a metà giornata, la pelle dopo la detersione, i rossori: domande su quello che vedi, non su come pensi di essere.'],
  ['Scopri il tuo biotipo', 'Dai punteggi su sebo, idratazione e reattività esce il tuo biotipo, con i tratti che si aggiungono e cosa evitare.'],
  ['Ricevi la routine', 'Un prodotto per ogni passaggio, scelto sul biotipo, e accanto un\'alternativa che costa meno. Se serve un medico, te lo diciamo prima.'],
];

// Le famiglie della skincare (Federico e Sofia, 15/10: la home deve anche informare, non solo portare al test).
// Le marche di ogni famiglia si contano dal catalogo, non si scrivono a mano.
const FAMIGLIE: [string, string, string][] = [
  ['medicale', 'Dermocosmesi medicale', 'Marchi di ricerca che dichiarano attivi e percentuali: vitamina C stabilizzata, retinoidi, acidi, peptidi. Spesso usati negli studi di dermatologia e di medicina estetica. Costano di più: valgono quando serve un attivo preciso, a una concentrazione precisa.'],
  ['farmacia', 'Da farmacia', 'Dermocosmesi nata con i dermatologi: formule essenziali, spesso senza profumo, testate su pelli sensibili, con acne, dermatite o rossori. Il punto di partenza più sicuro quando la pelle reagisce.'],
  ['k-beauty', 'K-beauty', 'La cosmetica coreana: texture leggere, idratazione a strati, centella, niacinamide, riso e mucina di lumaca, protezioni solari piacevoli da mettere ogni giorno. Spesso molto conveniente ogni 10 ml.'],
  ['alta-cosmesi', 'Alta cosmesi', 'I marchi di profumeria: texture curate, profumo, un’esperienza d’uso. Nella scheda trovi cosa contengono davvero, per capire quanto paghi la formula e quanto il marchio.'],
  ['qualita-prezzo', 'Buona qualità/prezzo', 'Attivi riconosciuti a prezzi bassi, per una routine completa senza spendere molto. Il confronto giusto è il prezzo ogni 10 ml.'],
];

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
            <span className="etichetta">Skincare spiegata, scelta su di te</span>
            <h1 className="sopratitolo">Cosa metti sulla pelle, e perché</h1>
            <div className="scala-fototipi" role="img" aria-label="I sei fototipi della pelle"><i /><i /><i /><i /><i /><i /></div>
            <p className="intro">Ogni prodotto con la sua scheda: gli attivi e le percentuali, per quale pelle, quanto è forte, se va bene in gravidanza, quanto costa ogni 10 ml. Puoi informarti da solo, o fare il test: parte dalla tua pelle e ti propone una routine.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Invito href="/test" scuro>Fai il test</Invito>
              <Link href="/catalogo" className="bottone secondario">Esplora i prodotti</Link>
            </div>
            <span className="piccolo">{PRODOTTI.length} prodotti con la scheda. Il test è gratis, senza registrazione.</span>
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

      <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
        <div className="pila" style={{ ['--gap' as string]: '8px' }}>
          <span className="etichetta">Per orientarsi</span>
          <h2 className="titolo-2">Le famiglie della skincare</h2>
          <p className="intro">Medicale, da farmacia, coreana, di profumeria: cosa le distingue e quando sceglierle.</p>
        </div>
        <div className="griglia" style={{ ['--min' as string]: '270px' }}>
          {FAMIGLIE.map(([id, nome, testo]) => {
            const g = nelGruppo(id);
            if (!g.length) return null;
            const conta: Record<string, number> = {};
            g.forEach((p) => { conta[p.brand] = (conta[p.brand] || 0) + 1; });
            const marche = Object.entries(conta).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m]) => m);
            return (
              <article key={id} className="carta pila famiglia" style={{ ['--gap' as string]: '10px' }}>
                <h3 className="titolo-3">{nome}</h3>
                <p className="testo-carta"><ConTermini testo={testo} /></p>
                <p className="piccolo">Per esempio {marche.join(', ')}.</p>
                <Stendi href={`/catalogo/${id}`}>I {g.length} prodotti</Stendi>
              </article>
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

      <section style={{ background: 'var(--velo)' }}>
        <div className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="etichetta">Se preferisci partire dalla tua pelle</span>
            <h2 className="titolo-2">Quattro test</h2>
            <p className="intro">Domande su quello che vedi allo specchio: ne escono il tuo biotipo e una routine, con un prodotto per passaggio.</p>
          </div>
          <div className="griglia" style={{ ['--min' as string]: '240px' }}>
            {TEST.percorsi.map((p) => (
              <Link key={p.id} href={`/test?percorso=${p.id}`} className="carta-foto con-luna">
                <Foto nome={p.immagine} sizes="(max-width: 760px) 100vw, 25vw" />
                <span className="corpo">
                  <span className="titolo-3">{p.nome}</span>
                  <span className="piccolo">{p.descrizione}</span>
                  <Luna>Circa {p.minuti} minuti</Luna>
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
