import Link from 'next/link';
import { TEST, BIOTIPI, CATALOGO, ARTICOLI, TERMINI, ATTIVI, conAttivo, fotoDi, immagine } from '@/lib/dati';
import { nelGruppo, PRODOTTI } from '@/lib/catalogo';
import Foto from '@/components/Foto';
import { Invito, Stendi } from '@/components/Inviti';
import { ConTermini } from '@/components/Termini';
import RicercaCentrale from '@/components/RicercaCentrale';
import { BISOGNI } from '@/lib/integratori';
import { domandeDi } from '@/lib/motore';
import { CHI_SIAMO } from '@/lib/dati';

// ⚠️ IL NUMERO VERO DI DOMANDE (7/11/2026, audit di Jarvis): «fino a» contava tutte le domande del percorso, anche quelle
// che nessuno riceve insieme (la barba solo agli uomini, gravidanza e menopausa solo alle donne). Ora è il massimo che
// una persona riceve davvero, provando ogni genere ed età: cambia da solo se cambiano domande o condizioni.
const massimoDomande = (p: (typeof TEST.percorsi)[number]) => {
  const d = (id: string) => TEST.domande.find((x) => x.id === id)?.opzioni.map((o) => o.id) || [undefined];
  return Math.max(...d('genere').flatMap((g) => d('eta').map((e) => domandeDi(p, { ...(g ? { genere: g } : {}), ...(e ? { eta: e } : {}) }).length)));
};

// ⚠️ LA HOME SULLA ROUTINE, NON SUL CATALOGO (7/11/2026, voto l-home; testi di Zeno, strategia/testi-lancio.md §1).
// Il PO: «manteniamo una parte abbastanza importante sul cerca prodotto, magari non subito nell'hero ma sotto».
const PASSI = [
  ['Rispondi su quello che vedi', 'Com’è la fronte a metà giornata, se la pelle tira dopo averla lavata, se arrossa. Nessuna foto, nessuna email.'],
  ['Leggi la tua pelle', 'Ti diamo un profilo con un nome semplice e ti mostriamo le risposte che lo hanno deciso.'],
  ['Ricevi la routine', 'Mattina e sera, un passaggio alla volta: a cosa serve, il prodotto scelto per te e un’alternativa.'],
];
const NEL_RISULTATO: [string, string][] = [
  ['Il tuo profilo, spiegato', 'Un nome semplice e le risposte che lo hanno deciso.'],
  ['La routine in ordine', 'Ogni passaggio all’ora in cui si usa, con il motivo per cui c’è.'],
  ['Una scelta e un’alternativa', 'Per ogni passaggio, il prodotto che risponde meglio a quello che hai indicato e un altro che fa lo stesso lavoro, di solito a un prezzo più basso.'],
  ['Le cautele', 'Cosa introdurre piano e quando chiedere al medico, prima dei prodotti.'],
];

// ⚠️ I QUATTRO TEST SUBITO SOTTO L'APERTURA (Federico, 30/10/2026: «sotto la hero metti i 4 test, strutturati in
// maniera differente e più bella»). Il completo in grande, gli altri tre in fila; di ognuno quanto dura, quante domande
// fa al massimo e cosa ne esce. Il tono di fondo è un fototipo diverso per test.
const ESCE: Record<string, string> = {
  completo: 'Tutta la giornata, dalla detersione al cuoio capelluto.',
  viso: 'Il tuo profilo e una routine da tre a cinque passaggi, mattina e sera.',
  cute: 'Il profilo della tua cute, lo shampoo e il trattamento.',
  integrazione: 'Al massimo tre integratori, ognuno con l\'indicazione autorizzata in Europa. Se non te ne serve nessuno, te lo diciamo.',
};

// La routine in ordine: a cosa serve ogni passaggio e quando si usa, con i suoi prodotti.
const ROUTINE: [string, string, string, string][] = [
  ['detergenti', 'Detersione', 'mattina e sera', 'Toglie sebo, trucco e protezione solare senza sgrassare: la base di tutto il resto.'],
  ['sieri', 'Siero', 'mattina e sera', 'Leggero e concentrato, per un obiettivo: idratazione, macchie, imperfezioni, segni del tempo.'],
  ['attivi', 'Trattamento mirato', 'la sera', 'Retinoidi e acidi esfolianti: i più forti, da introdurre piano.'],
  ['creme', 'Crema', 'mattina e sera', 'Chiude l’idratazione e protegge la barriera; la texture si sceglie sul sebo.'],
  ['solari', 'Protezione solare', 'ogni mattina, per ultima', 'Il passaggio che previene di più macchie e segni del tempo, tutto l’anno.'],
];
const ALTRO = ['maschere', 'occhi', 'cerotti', 'shampoo', 'capelli', 'barba', 'integratori'];
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
            <h1 className="sopratitolo">La tua pelle. La tua routine.</h1>
            <div className="scala-fototipi" role="img" aria-label="I sei fototipi della pelle"><i /><i /><i /><i /><i /><i /></div>
            <p className="intro">Rispondi su quello che vedi allo specchio. Ti diciamo quali passaggi ti servono e perché, con un prodotto per ognuno e un’alternativa che fa lo stesso lavoro.</p>
            {/* ⚠️ IL TEST IN PRIMO PIANO (23/10/2026, Federico): è la porta principale del sito, prima della ricerca
                e del catalogo. Un blocco suo, con cosa si fa e cosa se ne ricava. */}
            <div className="test-primo">
              <Invito href="/test?percorso=viso" scuro>Fai il test della pelle</Invito>
              <span className="test-primo-sotto">{TEST.percorsi.find((p) => p.id === 'viso')?.minuti ?? 3} minuti · Gratis, senza registrazione · <a href="#i-test" style={{ color: 'inherit' }}>o scegli fra quattro test</a></span>
            </div>
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
            <p className="intro">Da 2 a 6 minuti. Puoi farne uno solo.</p>
          </div>
          <div className="test-griglia">
            {/* la pelle per prima e più grande: è l'azione principale (voto l-home); il completo in fondo */}
            {['viso', 'cute', 'integrazione', 'completo'].map((id) => TEST.percorsi.find((x) => x.id === id)).filter((p): p is (typeof TEST.percorsi)[number] => !!p).map((p, i) => (
              <Link key={p.id} href={`/test?percorso=${p.id}`} className={`test-carta${i === 0 ? ' test-grande' : ''}`} style={{ ['--tono' as string]: `var(--f${i + 1})` }}>
                <span className="test-foto"><Foto nome={p.immagine} sizes={i === 0 ? '(max-width: 760px) 100vw, 40vw' : '(max-width: 760px) 100vw, 25vw'} /></span>
                <span className="test-corpo">
                  <span className="test-dati"><b>{p.minuti} min</b><span>fino a {massimoDomande(p)} domande</span></span>
                  <span className="titolo-3">{p.id === 'completo' ? 'Il test completo' : p.id === 'viso' ? 'Il test della tua pelle' : p.titolo}</span>
                  {/* solo la prima frase: «Ne esce» sta sotto, e la descrizione lo ripeteva */}
                  <span className="piccolo">{p.descrizione.split(/\.\s+Ne escon?o?\b/)[0].replace(/\.?$/, '.')}</span>
                  <span className="test-esce"><b>Ne esce</b> {ESCE[p.id] || 'Il tuo biotipo e una routine.'}</span>
                  <span className="test-via">Inizia <span aria-hidden="true">→</span></span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CERCHI UN PRODOTTO PRECISO? (7/11/2026, voto l-home): grande, sotto i test, senza il numero dei prodotti */}
      <section className="fascia-cerca" aria-labelledby="cerca-titolo">
        <div className="contenitore sezione pila" style={{ ['--gap' as string]: '16px' }}>
          <span className="etichetta">Il catalogo</span>
          <h2 id="cerca-titolo" className="titolo-2">Cerchi un prodotto preciso?</h2>
          <p className="intro">Scrivi il nome, la marca o l’attivo. Per ogni prodotto trovi cosa contiene, per quale pelle è pensato, a cosa stare attento e i profili a cui lo consigliamo.</p>
          <RicercaCentrale />
          <Link href="/catalogo" className="cerca-tutto">Oppure guarda tutto il catalogo →</Link>
          <span className="piccolo">Il catalogo è piccolo di proposito: entra solo quello che sappiamo descrivere bene.</span>
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
        <h3 className="titolo-3">Cosa trovi nel risultato</h3>
        <ul className="griglia" style={{ ['--min' as string]: '240px', listStyle: 'none', padding: 0, margin: 0 }}>
          {NEL_RISULTATO.map(([t, d]) => <li key={t} className="carta pila" style={{ ['--gap' as string]: '6px' }}><b>{t}</b><span className="piccolo" style={{ fontSize: 15 }}>{d}</span></li>)}
        </ul>
        <p className="avviso" style={{ maxWidth: '72ch' }}>Il test non è una diagnosi. Se una risposta fa pensare a qualcosa da far vedere a un medico, il risultato lo dice per primo.</p>
      </section>

      <section className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(20px, 4vw, 36px)' }}>
        <div className="pila" style={{ ['--gap' as string]: '8px' }}>
          <span className="etichetta">Per orientarsi</span>
          <h2 className="titolo-2">Le famiglie della skincare</h2>
          <p className="intro">Quattro modi diversi di fare cosmetici. Nessuno è meglio degli altri: cambia quello che cerchi.</p>
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
                  <span className="stendi">Vedi la famiglia<span className="barra" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span></span>
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
            <h2 className="titolo-2">A cosa serve ogni passaggio</h2>
            <p className="intro">Pochi passaggi, nell’ordine in cui si mettono. Non servono tutti a tutti: il test ti dice quali.</p>
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
            <p className="intro">Parti da quello che senti, non da quello che si vende. Per ogni bisogno trovi le sostanze con un&apos;indicazione autorizzata in Europa e gli integratori che le contengono. Un integratore non sostituisce una dieta varia né il parere del medico.</p>
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
                {n > 0 && <Stendi href={`/catalogo?attivo=${a!.id}`}>I prodotti con {a!.nome.split(' (')[0].toLowerCase().replace(/^vitamina c$/, 'vitamina C')}</Stendi>}
              </article>
            );
          })}
        </div>
      </section>

      {/* COME SCEGLIAMO (7/11/2026, voto l-prima) e CHI C'È DIETRO: il nome di Sofia solo quando Chi siamo è pubblica */}
      <section className="contenitore sezione griglia" style={{ ['--min' as string]: '300px', gap: 'clamp(20px, 4vw, 48px)' }}>
        <div className="pila" style={{ ['--gap' as string]: '10px' }}>
          <span className="etichetta">Il metodo</span>
          <h2 className="titolo-2">Come scegliamo i prodotti</h2>
          <p className="testo">Partiamo dalla tua pelle, non dal prezzo. Fra i prodotti adatti scegliamo quello più completo, poi un’alternativa che fa lo stesso lavoro. Quello che guadagniamo quando compri non decide mai la scelta.</p>
          <Link href="/chi-siamo#come-scegliamo" className="link">Il metodo, per intero →</Link>
        </div>
        <div className="pila" style={{ ['--gap' as string]: '10px' }}>
          <span className="etichetta">Chi siamo</span>
          <h2 className="titolo-2">Chi c’è dietro</h2>
          <p className="testo">{CHI_SIAMO.pubblica
            ? 'Skinmatch nasce dall’incontro fra Sofia Crescenzi, medico estetico, e Federico, che progetta prodotti digitali. Sofia ha scritto le domande del test e rivede il metodo.'
            : 'Skinmatch nasce dall’incontro fra un medico estetico e chi progetta prodotti digitali. Il medico ha scritto le domande del test e rivede il metodo.'}</p>
          <Link href="/chi-siamo" className="link">Chi siamo →</Link>
        </div>
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
            <div className="pila" style={{ ['--gap' as string]: '8px' }}><span className="etichetta">La Rivista</span><h2 className="titolo-2">Dalla Rivista</h2><p className="intro">Guide brevi su pelle, attivi e routine.</p></div>
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
