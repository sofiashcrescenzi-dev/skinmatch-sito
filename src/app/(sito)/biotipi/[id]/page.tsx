import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BIOTIPI, TAG_BIOTIPI, biotipoPerId, NOMI_AREA, fotoDi } from '@/lib/dati';
import { prodottiPer } from '@/lib/catalogo';
import { ConTermini } from '@/components/Termini';
import SchedaProdotto from '@/components/SchedaProdotto';
import Foto from '@/components/Foto';
import { Invito } from '@/components/Inviti';

export function generateStaticParams() {
  return BIOTIPI.map((b) => ({ id: b.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const b = biotipoPerId(id);
  if (!b) return {};
  return {
    title: b.area === 'integrazione' ? `${b.titolo}: ${b.motto.replace(/\.$/, '').toLowerCase()}` : `${b.titolo}: come si riconosce e cosa usare`,
    description: `${b.motto} ${b.descrizione}`.slice(0, 158),
    alternates: { canonical: `/biotipi/${b.id}` },
  };
}

const TEST_DI: Record<string, string> = { pelle: 'viso', cute: 'cute', integrazione: 'integrazione' };

export default async function BiotipoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = biotipoPerId(id);
  if (!b) notFound();
  const prodotti = prodottiPer(b);
  const vicini = BIOTIPI.filter((x) => x.id !== b.id && x.area === b.area && x.tipo === 'biotipo' && (x.famiglia === b.famiglia || x.tag.some((t) => b.tag.includes(t)))).slice(0, 4);
  const tag = b.tag.map((t) => TAG_BIOTIPI.find((x) => x.id === t)).filter(Boolean);
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(32px, 5vw, 56px)' }}>
      <Link href={`/biotipi#${b.area}`} className="piccolo">← Tutti i biotipi</Link>
      <header style={{ display: 'grid', gap: 'clamp(20px, 4vw, 48px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', alignItems: 'center' }}>
        <div className="pila" style={{ ['--gap' as string]: '12px' }}>
          <span className="etichetta">{b.tipo === 'tratto' ? 'Un tratto che si aggiunge' : 'Biotipo'} · {NOMI_AREA[b.area]}</span>
          <h1 className="sopratitolo" style={{ fontSize: 'clamp(32px, 5.4vw, 54px)' }}>{b.titolo}</h1>
          <span className="motto">{b.motto}</span>
          <p className="testo"><ConTermini testo={b.descrizione} /></p>
          {tag.length > 0 && <div className="riga-chip">{tag.map((t) => <span key={t!.id} className="chip tenue">{t!.nome}</span>)}</div>}
        </div>
        <Foto nome={fotoDi(b)} priorita style={{ aspectRatio: '4 / 5', maxHeight: 560 }} sizes="(max-width: 760px) 100vw, 45vw" credito />
      </header>

      <section className="griglia" style={{ ['--min' as string]: '260px' }}>
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Come si riconosce</h2>
          <ul className="pila" style={{ ['--gap' as string]: '6px', paddingLeft: 18, listStyle: 'disc' }}>{b.caratteristiche.map((c) => <li key={c}><ConTermini testo={c} /></li>)}</ul>
        </div>
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Cosa cercare</h2>
          <ul className="pila" style={{ ['--gap' as string]: '6px', paddingLeft: 18, listStyle: 'disc' }}>{b.cerca.map((c) => <li key={c}><ConTermini testo={c} /></li>)}</ul>
        </div>
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Cosa evitare</h2>
          <ul className="pila" style={{ ['--gap' as string]: '6px', paddingLeft: 18, listStyle: 'disc' }}>{b.evita.map((c) => <li key={c}><ConTermini testo={c} /></li>)}</ul>
        </div>
      </section>

      {b.tag.includes('da-medico') && (
        <p className="consulto"><span><b>Da seguire con il medico.</b> È una condizione che si diagnostica e si cura: i cosmetici possono accompagnare la terapia, non sostituirla.</span></p>
      )}

      {prodotti.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '16px' }}>
          <h2 className="titolo-2">Prodotti adatti</h2>
          <p className="piccolo">Scelti sui bisogni di questo biotipo. Il test li sceglie anche sulle tue risposte, con un&apos;alternativa che costa meno.</p>
          <div className="griglia" style={{ ['--min' as string]: '300px' }}>{prodotti.map((p) => <SchedaProdotto key={p.id} p={p} da={`biotipo-${b.id}`} />)}</div>
        </section>
      )}

      <section className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <span className="titolo-3">È davvero il tuo?</span>
          <span className="piccolo">Il test lo riconosce con domande su quello che vedi allo specchio.</span>
        </div>
        <Invito href={`/test?percorso=${TEST_DI[b.area]}`}>Fai il test</Invito>
      </section>

      {vicini.length > 0 && (
        <section className="pila" style={{ ['--gap' as string]: '12px' }}>
          <h2 className="titolo-3">Biotipi vicini</h2>
          <div className="riga-chip">{vicini.map((v) => <Link key={v.id} href={`/biotipi/${v.id}`} className="chip">{v.titolo}</Link>)}</div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Article', headline: b.titolo, description: b.motto,
        about: b.titolo, inLanguage: 'it', publisher: { '@type': 'Organization', name: 'Skinmatch', url: 'https://skinmatch.it' },
        mainEntityOfPage: `https://skinmatch.it/biotipi/${b.id}`,
      }).replace(/</g, '\\u003c') }} />
    </main>
  );
}
