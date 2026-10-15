import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BIOTIPI, CATALOGO } from '@/lib/dati';
import { PRODOTTI, prodottoPerId, biotipiPer, categoriaDi, indirizzo, euro, negozio, type Prodotto } from '@/lib/catalogo';
import { estesa, type SchedaEstesa } from '@/lib/schede';
import { ConTermini } from '@/components/Termini';
import Campione from '@/components/Campione';
import FotoProdotto, { tonoProdotto } from '@/components/FotoProdotto';
import InfoNegozio from '@/components/InfoNegozio';
import { Invito, Stendi } from '@/components/Inviti';

// LA PAGINA DI UN PRODOTTO, /catalogo/<categoria>/<oggetto>: la scheda per esteso, come nel prototipo
// di Skinmatch (passaggio, pelle, attivi, forza, gravidanza, sole, texture, prezzo), con le misure,
// l'INCI, i biotipi a cui risponde e, se ci sono, un prodotto più ricco e uno più economico.
// I dati: src/data/prodotti.json e src/data/schede.json (scripts/catalogo/al_sito.py).
// Un prodotto che esce dal catalogo non lascia un 404: il Worker rinvia alla sua categoria.

export function generateStaticParams() {
  return PRODOTTI.filter((p) => p.slug && categoriaDi(p)).map((p) => ({ slug: categoriaDi(p)!.id, prodotto: p.slug! }));
}
export const dynamicParams = false;

const trova = (slug: string, oggetto: string) => PRODOTTI.find((p) => p.slug === oggetto && categoriaDi(p)?.id === slug);

const PASSAGGIO: Record<string, [string, string]> = {
  detergente: ['Detersione', 'sulla pelle bagnata, poi si risciacqua'],
  siero: ['Siero', 'dopo la detersione, prima della crema'],
  crema: ['Crema', 'dopo il siero'],
  spf: ['Protezione solare', 'per ultima, ogni mattina; si rimette ogni due ore se stai al sole'],
  esfoliante: ['Trattamento esfoliante', 'all’inizio due o tre volte a settimana, poi come la pelle lo tollera'],
  shampoo: ['Shampoo', 'sulla cute bagnata, massaggiando; poi si risciacqua'],
  'trattamento cute': ['Trattamento per la cute', 'sulla cute pulita, come indicato sulla confezione'],
  'balsamo e maschera capelli': ['Balsamo o maschera', 'dopo lo shampoo, sulle lunghezze'],
  barba: ['Barba', 'sulla barba e sulla pelle sotto, dopo la detersione o la rasatura'],
  integratore: ['Integratore', 'ogni giorno, come indicato sulla confezione'],
  cerotti: ['Cerotto per brufoli', 'sul brufolo pulito e asciutto, la notte o di giorno sotto il trucco'],
};
const SU_PELLE = new Set(['detergente', 'siero', 'crema', 'spf', 'esfoliante', 'barba', 'cerotti']);
const LAVORO: Record<string, string> = {
  idratazione: 'idratazione', imperfezioni: 'imperfezioni e brufoli', macchie: 'macchie e luminosità', tempo: 'segni del tempo',
  calmare: 'rossori e pelle che reagisce', barriera: 'barriera della pelle', pori: 'pori dilatati',
  caduta: 'caduta e diradamento', forfora: 'forfora', 'secchi-crespi': 'capelli secchi e crespi', mantenimento: 'uso frequente',
  capelli: 'capelli', unghie: 'unghie', tono: 'tono della pelle', sole: 'preparazione al sole', 'pelle-secca': 'pelle secca', 'imperfezioni-int': 'imperfezioni',
};
const CUTE: Record<string, string> = { normale: 'normale', grasso: 'grassa', secco: 'secca', sensibile: 'sensibile' };
const FORZA = ['', 'delicato', 'medio', 'forte'];
const FORZA_NOTA = ['', 'va bene anche se non hai mai usato prodotti con attivi', 'meglio se la pelle è già abituata a qualche attivo', 'da introdurre piano, solo se usi già attivi'];
const FASCIA: Record<string, string> = { base: 'fascia di prezzo economica', top: 'fascia di prezzo media', premium: 'fascia di prezzo alta' };

const perc = (n: number | null) => (n ? ` ${String(n).replace('.', ',')}%` : '');
const attiviTesto = (p: Prodotto) => (p.scheda?.attivi || []).map((a) => a.nome + perc(a.perc)).join(', ');
const misura = (p: Prodotto) => (p.scheda?.misura ? `${String(p.scheda.misura.valore).replace('.', ',')} ${p.scheda.misura.unita}` : null);

function pelleTesto(pe: NonNullable<SchedaEstesa['pelle']>) {
  const s = new Set(pe.sebo);
  const tipi = s.size === 3 || !s.size ? 'Tutti i tipi di pelle' : 'Pelle ' + [s.has('basso') && 'secca', s.has('medio') && 'normale', s.has('alto') && 'mista e grassa'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' e $1');
  return tipi + (pe.idr.length === 1 && pe.idr[0] === 'disidratata' ? ', pensato per quando è disidratata' : '');
}
const REATTIVA = ['Solo pelli che non reagiscono: può pizzicare', 'Anche pelli un po’ reattive', 'Anche pelli molto reattive'];

function fonteSebo(f?: string) {
  if (!f) return null;
  if (f.includes('nessuna indicazione')) return 'Il produttore non indica un tipo di pelle: va bene per tutti.';
  if (f.includes('texture leggera')) return 'Dalla texture leggera.';
  if (f.includes('texture ricca')) return 'Dalla texture ricca.';
  return null;
}

function gravidanza(g: boolean | null, f?: string) {
  if (g === true) return ['Sì', 'Nell’elenco degli ingredienti non ci sono quelli da evitare. Chiedi comunque conferma al medico.'];
  if (g === false) return ['Da evitare', f?.includes('retinoid') ? 'Contiene retinoidi.' : 'Contiene un ingrediente da evitare in gravidanza e allattamento.'];
  if (f?.includes('salicilico')) return ['Da chiedere al medico', 'Contiene acido salicilico da lasciare sulla pelle.'];
  if (f?.includes('integratore')) return ['Da chiedere al medico', 'Per un integratore in gravidanza decide il medico.'];
  return ['Da chiedere al medico', 'Non abbiamo ancora l’elenco completo degli ingredienti per escludere quelli da evitare.'];
}

function fonteInci(f?: string) {
  if (!f) return null;
  if (f.startsWith('http')) return <>Da <a className="link" href={f} target="_blank" rel="noopener">{f.includes('openbeautyfacts') ? 'Open Beauty Facts' : new URL(f).hostname.replace(/^www\./, '')}</a>.</>;
  if (f.startsWith('stesso prodotto')) return <>Dallo stesso prodotto in un altro formato.</>;
  return <>Dalla descrizione del negozio.</>;
}

const MANCA: Record<string, string> = { inci: 'l’elenco degli ingredienti', profumo: 'se c’è profumo', texture: 'la texture', attivi: 'gli attivi', bisogni: 'per cosa lavora', misura: 'il formato' };

export async function generateMetadata({ params }: { params: Promise<{ slug: string; prodotto: string }> }): Promise<Metadata> {
  const { slug, prodotto } = await params;
  const p = trova(slug, prodotto);
  if (!p) return {};
  const x = estesa(p.id);
  const pas = PASSAGGIO[p.scheda?.passaggio || '']?.[0] || categoriaDi(p)?.nome || '';
  const att = (p.scheda?.attivi || []).slice(0, 3).map((a) => a.nome + perc(a.perc)).join(', ');
  const descr = [`${pas} di ${p.brand}${att ? ` con ${att}` : ''}.`, x?.pelle ? pelleTesto(x.pelle) + '.' : '', `${euro(p.price)}.`, 'Attivi, forza, gravidanza e INCI nella scheda di Skinmatch.'].filter(Boolean).join(' ');
  return {
    title: `${p.name}, ${p.brand}: attivi e per quale pelle`,
    description: descr.slice(0, 158),
    alternates: { canonical: `/catalogo/${slug}/${prodotto}` },
    openGraph: { images: p.image ? [p.image] : undefined },
  };
}

export default async function ProdottoPage({ params }: { params: Promise<{ slug: string; prodotto: string }> }) {
  const { slug, prodotto } = await params;
  const p = trova(slug, prodotto);
  if (!p) notFound();
  const x = estesa(p.id);
  const s = p.scheda;
  const cat = CATALOGO.categorie.find((c) => c.id === slug)!;
  const dove = negozio(p);
  const pas = PASSAGGIO[s?.passaggio || ''];
  const minimo = x?.formati.length ? Math.min(...x.formati.map((f) => f.prezzo)) : p.price;
  const biotipi = biotipiPer(p, BIOTIPI);
  const ricco = x?.confronto.ricco ? prodottoPerId(x.confronto.ricco) : undefined;
  const economico = x?.confronto.economico ? prodottoPerId(x.confronto.economico) : undefined;
  const lavori = [...(x?.bisogni || []), ...(x?.capelli?.bisogni || []), ...(x?.integrazione || [])].map((b) => LAVORO[b] || b);
  const [gSi, gNota] = gravidanza(x?.gravidanza ?? null, x?.fonti.gravidanza);
  const url = `https://skinmatch.it/catalogo/${slug}/${prodotto}`;

  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(36px, 6vw, 64px)' }}>
      <nav className="piccolo briciole" aria-label="Dove sei">
        <Link href="/catalogo">Catalogo</Link><span aria-hidden="true">/</span><Link href={`/catalogo/${cat.id}`}>{cat.nome}</Link>
      </nav>

      <header className="p-testa">
        <div className="p-foto"><FotoProdotto src={p.image} alt={`${p.brand} ${p.name}`} variante="pagina" tono={tonoProdotto(cat.id)} priorita /></div>
        <div className="pila" style={{ ['--gap' as string]: '14px' }}>
          <span className="etichetta">{p.brand}{pas ? ` · ${pas[0]}` : ''}</span>
          <h1 className="titolo-2" style={{ fontSize: 'clamp(28px, 4.4vw, 44px)' }}>{p.name}</h1>
          {s?.attivi.length ? (
            <div className="riga-chip">{s.attivi.slice(0, 6).map((a) => <span key={a.nome} className="chip tenue">{a.nome}{a.perc ? <b>{perc(a.perc)}</b> : null}</span>)}</div>
          ) : null}
          <div><Campione href={p.affiliateUrl} prezzo={minimo} da_prezzo={!!x?.formati.length} dove={dove} id={p.id} da={`prodotto-${p.slug}`} /></div>
          <InfoNegozio negozio={dove} prezzo={minimo} />
          <p className="p-prezzo">
            {misura(p) ? <span>{x?.formati.length ? `${x.formati.length} misure` : misura(p)}</span> : null}
            <span>{FASCIA[p.tier]}</span>
          </p>
          <p className="piccolo" style={{ maxWidth: '52ch' }}>{dove ? `Si compra su ${dove}. ` : ''}Il link è di affiliazione: se compri, Skinmatch riceve una piccola commissione. Il prezzo per te non cambia e non decide cosa consigliamo.</p>
        </div>
      </header>

      <section className="pila p-sez" aria-labelledby="scheda">
        <h2 id="scheda" className="titolo-3">La scheda</h2>
        <dl className="voci">
          {pas && <div><dt>Passaggio · quando</dt><dd>{pas[0]}{s?.momento && SU_PELLE.has(s.passaggio) && s.passaggio !== 'cerotti' ? ` · ${s.momento}` : ''}<span className="piccolo">{pas[1][0].toUpperCase() + pas[1].slice(1)}.</span></dd></div>}
          {x?.pelle && SU_PELLE.has(s?.passaggio || '') && s?.passaggio !== 'cerotti' && (
            <div><dt>Per quale pelle</dt><dd>{pelleTesto(x.pelle)}{fonteSebo(x.fonti.sebo) && <span className="piccolo">{fonteSebo(x.fonti.sebo)}</span>}</dd></div>
          )}
          {x?.pelle && SU_PELLE.has(s?.passaggio || '') && (
            <div><dt><ConTermini testo="Pelle reattiva" /></dt><dd>{REATTIVA[x.pelle.reattiva]}</dd></div>
          )}
          {x?.capelli && (
            <div><dt>Per quale cute</dt><dd>{x.capelli.cute.map((c) => CUTE[c] || c).join(', ').replace(/^./, (c) => c.toUpperCase())}</dd></div>
          )}
          <div><dt>Attivi principali</dt><dd>{s?.attivi.length ? <ConTermini testo={attiviTesto(p)} /> : 'Non ancora riconosciuti'}<span className="piccolo">{s?.inci ? 'Letti dall’elenco degli ingredienti.' : 'Dal nome e dalla descrizione del prodotto: l’elenco degli ingredienti non c’è ancora.'}</span></dd></div>
          {lavori.length > 0 && <div><dt>Per cosa lavora</dt><dd>{lavori.join(', ').replace(/^./, (c) => c.toUpperCase())}</dd></div>}
          {s && SU_PELLE.has(s.passaggio) && (
            <div><dt>Forza</dt><dd><span className="pallini" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} className={i <= s.forza ? 'on' : ''} />)}</span>{FORZA[s.forza]}<span className="piccolo">{FORZA_NOTA[s.forza][0].toUpperCase() + FORZA_NOTA[s.forza].slice(1)}.</span></dd></div>
          )}
          <div><dt>Gravidanza e allattamento</dt><dd>{gSi}<span className="piccolo">{gNota}</span></dd></div>
          {s && SU_PELLE.has(s.passaggio) && s.passaggio !== 'spf' && (
            <div><dt><ConTermini testo="Fotosensibilizzante" /></dt><dd>{s.fotosensibilizzante ? 'Sì: il giorno dopo serve la protezione solare' : 'No'}</dd></div>
          )}
          {s?.spf ? <div><dt>Protezione</dt><dd>SPF {s.spf}</dd></div> : null}
          {s && s.passaggio !== 'integratore' && (
            <div><dt>Texture e profumo</dt><dd>
              {[s.texture ? s.texture[0].toUpperCase() + s.texture.slice(1) : null, s.profumo === true ? 'con profumo' : s.profumo === false ? 'senza profumo' : 'profumo non dichiarato', x?.inci && x.alcol ? 'con alcol' : null, x?.inci && x.oli_essenziali ? 'con oli essenziali' : null].filter(Boolean).join(' · ')}
            </dd></div>
          )}
          <div><dt>Prezzo</dt><dd>{euro(p.price)}{misura(p) ? ` per ${misura(p)}` : ''}<span className="piccolo">{FASCIA[p.tier][0].toUpperCase() + FASCIA[p.tier].slice(1)}, rispetto agli altri prodotti dello stesso passaggio. Prezzo del negozio all’ultimo aggiornamento.</span></dd></div>
        </dl>
      </section>

      {x && x.formati.length > 1 && (
        <section className="pila p-sez" aria-labelledby="misure">
          <h2 id="misure" className="titolo-3">Misure disponibili</h2>
          <div className="misure">
            {x.formati.map((f) => (
              <div key={f.misura}>
                <span><b>{f.misura}</b></span>
                <Campione href={f.link} prezzo={f.prezzo} dove={dove} id={p.id} da={`prodotto-${p.slug}-misura`} />
              </div>
            ))}
          </div>
          <p className="piccolo">La misura si sceglie sul sito del negozio.</p>
        </section>
      )}

      {(ricco || economico) && (
        <section className="pila p-sez" aria-labelledby="confronto">
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <h2 id="confronto" className="titolo-3">A confronto</h2>
            <p className="piccolo" style={{ maxWidth: '62ch' }}>Prodotti simili: stesso passaggio, stesso attivo principale, formato vicino. {ricco && economico ? 'Uno più ricco di attivi e uno meno ricco che costa meno.' : ricco ? 'Uno più ricco di attivi.' : 'Uno meno ricco che costa meno.'}</p>
          </div>
          <div className="confronto">
            <Confronto p={p} etichetta="Questo" questo />
            {ricco && <Confronto p={ricco} etichetta="Più ricco" rispetto={p} />}
            {economico && <Confronto p={economico} etichetta="Più economico" rispetto={p} />}
          </div>
        </section>
      )}

      <section className="pila p-sez" aria-labelledby="inci">
        <h2 id="inci" className="titolo-3">Gli ingredienti</h2>
        {x?.inci ? (
          <details className="apri">
            <summary>L’elenco completo (INCI), {x.inci.length} ingredienti</summary>
            <p className="inci">{x.inci.map((i) => i[0] + i.slice(1).toLowerCase()).join(', ')}.</p>
            <p className="piccolo">{fonteInci(x.fonti.inci)} Dal più abbondante al meno abbondante; sotto l’1% l’ordine è libero.</p>
          </details>
        ) : (
          <p className="piccolo" style={{ maxWidth: '62ch' }}>L’elenco degli ingredienti non è ancora nella scheda: lo cerchiamo dalle fonti ufficiali del produttore. Finché manca, gravidanza e profumo restano da verificare.</p>
        )}
      </section>

      {biotipi.length > 0 && (
        <section className="pila p-sez" aria-labelledby="biotipi">
          <h2 id="biotipi" className="titolo-3">I biotipi a cui risponde</h2>
          <div className="riga-chip">{biotipi.slice(0, 8).map((b) => <Link key={b.id} href={`/biotipi/${b.id}`} className="chip">{b.titolo}</Link>)}</div>
          {biotipi.length > 8 && <p className="piccolo">E altri {biotipi.length - 8}: il test dice quale è il tuo.</p>}
        </section>
      )}

      <section className="pila p-sez" aria-labelledby="fonti" style={{ ['--gap' as string]: '10px' }}>
        <h2 id="fonti" className="titolo-3">Come è fatta questa scheda</h2>
        <p className="piccolo" style={{ maxWidth: '68ch' }}>
          La scheda la compiliamo noi, dal nome, dalla descrizione e dall’elenco degli ingredienti del prodotto, con regole uguali per tutti i prodotti: la forza dagli attivi e dalle loro percentuali, la gravidanza dagli ingredienti da evitare, la pelle dalle indicazioni del produttore e dalla texture.
          {x?.mancano.length ? ` Ancora da verificare: ${x.mancano.map((m) => MANCA[m] || m).join(', ')}.` : ''}
        </p>
        <p className="piccolo">Non sostituisce il parere del medico o del farmacista. <Link className="link" href="/chi-siamo">Chi siamo</Link></p>
      </section>

      <section className="carta pila p-fine" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-3">Va bene per la tua pelle?</h2>
        <p className="piccolo" style={{ maxWidth: '52ch' }}>Il test parte da quello che vedi allo specchio e ti dà il biotipo e una routine, con i prodotti adatti.</p>
        <div className="riga-inviti"><Invito href="/test">Fai il test</Invito><Stendi href={`/catalogo/${cat.id}`}>Gli altri della categoria</Stendi></div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([{
        '@context': 'https://schema.org', '@type': 'Product', name: p.name, brand: { '@type': 'Brand', name: p.brand }, url,
        ...(p.image ? { image: p.image } : {}), description: p.description,
        offers: { '@type': 'Offer', price: minimo.toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url },
      }, {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Catalogo', item: 'https://skinmatch.it/catalogo' },
          { '@type': 'ListItem', position: 2, name: cat.nome, item: `https://skinmatch.it/catalogo/${cat.id}` },
          { '@type': 'ListItem', position: 3, name: p.name, item: url },
        ],
      }]) }} />
    </main>
  );
}

// Una colonna del confronto: cosa ha in più o in meno e quanto costa rispetto a questo (formati vicini: lib/simili.ts).
function Confronto({ p, etichetta, questo, rispetto }: { p: Prodotto; etichetta: string; questo?: boolean; rispetto?: Prodotto }) {
  const s = p.scheda!;
  const href = indirizzo(p);
  const nomi = (q?: Prodotto) => new Set((q?.scheda?.attivi || []).map((a) => a.nome));
  const inPiu = rispetto ? [...nomi(p)].filter((n) => !nomi(rispetto).has(n)) : [];
  const inMeno = rispetto ? [...nomi(rispetto)].filter((n) => !nomi(p).has(n)) : [];
  const diff = rispetto ? Math.round((1 - p.price / rispetto.price) * 100) : 0;
  return (
    <div className={`carta pila${questo ? ' questo' : ''}`} style={{ ['--gap' as string]: '10px' }}>
      <span className="etichetta">{etichetta}</span>
      <div className="prodotto">
        <div className="foto-carta"><FotoProdotto src={p.image} alt="" variante="mini" tono={tonoProdotto(categoriaDi(p)?.id)} /></div>
        <div className="pila" style={{ ['--gap' as string]: '4px', minWidth: 0 }}>
          <span className="marca">{p.brand}</span>
          {questo || !href ? <span className="nome">{p.name}</span> : <Link className="nome" href={href}>{p.name}</Link>}
          {!questo && href && <Link className="piccolo link-scheda" href={href}>Vai alla scheda</Link>}
        </div>
      </div>
      <dl className="voci stretta">
        <div><dt>Attivi</dt><dd>{s.attivi.length ? s.attivi.slice(0, 5).map((a) => a.nome + perc(a.perc)).join(', ') : 'non riconosciuti'}</dd></div>
        <div><dt>Forza</dt><dd><span className="pallini" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} className={i <= s.forza ? 'on' : ''} />)}</span>{FORZA[s.forza]}</dd></div>
        <div><dt>INCI</dt><dd>{s.inci ? 'completo' : 'non ancora'}</dd></div>
        <div><dt>Prezzo</dt><dd><b>{euro(p.price)}</b>{misura(p) ? ` · ${misura(p)}` : ''}</dd></div>
      </dl>
      {rispetto && (
        <p className="piccolo">
          {etichetta === 'Più ricco'
            ? <>{inPiu.length ? `In più: ${inPiu.slice(0, 4).join(', ')}. ` : 'Più attivi con la percentuale dichiarata. '}{diff > 0 ? `E costa il ${diff}% in meno.` : diff < 0 ? `Costa il ${-diff}% in più.` : ''}</>
            : <>{`Costa il ${diff}% in meno.`}{inMeno.length ? ` In meno: ${inMeno.slice(0, 4).join(', ')}.` : ''}</>}
        </p>
      )}
    </div>
  );
}
