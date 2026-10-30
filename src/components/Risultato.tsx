'use client';

import Link from 'next/link';
import { TEST, NOMI_AREA, type Area, fotoDi } from '@/lib/dati';
import { massimoAsse, type Risultato as R, type PassaggioScelto } from '@/lib/motore';
import { ConTermini } from '@/components/Termini';
import { Stendi } from '@/components/Inviti';
import Foto from '@/components/Foto';
import FotoProdotto, { tonoProdotto } from '@/components/FotoProdotto';
import Campione from '@/components/Campione';
import Giornata from '@/components/Giornata';
import { percheSimile } from '@/lib/simili';
import { BISOGNI } from '@/lib/integratori';
import { giornataDi, MOMENTI, type Passo } from '@/lib/giornata';
import { negozio, euro } from '@/lib/formato';
import { indirizzo, categoriaDi } from '@/lib/indirizzo';
import type { Prodotto } from '@/lib/catalogo';

const SOPRA: Record<Area, string> = { pelle: 'Il tuo biotipo', cute: 'Il biotipo della tua cute', integrazione: 'Il tuo profilo' };

// ⚠️ IL RISULTATO NON È PIÙ UNA LISTA LUNGA (Federico, 30/10/2026). In alto i biotipi; poi la giornata (Giornata.tsx);
// poi i passaggi una volta sola, raggruppati per momento, ognuno con la scelta top e l'alternativa affiancate e scritto
// dove la top è migliore (motore.ts, doveMeglio).

function Breve({ p, da }: { p: Prodotto; da: string }) {
  const href = indirizzo(p);
  const misura = p.scheda?.misura ? `${String(p.scheda.misura.valore).replace('.', ',')} ${p.scheda.misura.unita}` : null;
  const foto = <FotoProdotto src={p.image} alt={`${p.brand} ${p.name}`} variante="mini" tono={tonoProdotto(categoriaDi(p)?.id)} />;
  return (
    <div className="breve">
      {href ? <Link href={href} className="breve-foto" tabIndex={-1} aria-hidden="true">{foto}</Link> : <span className="breve-foto">{foto}</span>}
      <div className="pila" style={{ ['--gap' as string]: '3px', minWidth: 0 }}>
        <span className="marca">{p.brand}</span>
        {href ? <Link href={href} className="nome">{p.name}</Link> : <span className="nome">{p.name}</span>}
        {(p.scheda?.attivi || []).length > 0 && (
          <span className="breve-attivi">{p.scheda!.attivi.slice(0, 3).map((a) => a.nome + (a.perc ? ` ${String(a.perc).replace('.', ',')}%` : '')).join(' · ')}</span>
        )}
        <div className="riga-compra">
          <Campione href={p.affiliateUrl} prezzo={p.price} dove={negozio(p)} id={p.id} da={da} />
          {misura && <span className="piccolo">{misura}</span>}
        </div>
      </div>
    </div>
  );
}

function Coppia({ s, da }: { s: PassaggioScelto; da: string }) {
  const t = s.consigliato, a = s.alternativa;
  const risparmi = a ? t.prodotto.price - a.prodotto.price : 0;
  return (
    <div className={a ? 'coppia' : 'coppia sola'}>
      <article className="carta coppia-top">
        <div className="testa-carta"><span className="etichetta">La scelta top</span><span className={`livello ${t.livello}`}>compatibilità {t.livello}</span></div>
        <Breve p={t.prodotto} da={da} />
        {a && (
          <div className="meglio">
            <b>Dove è migliore</b>
            {s.meglio.length
              ? <ul>{s.meglio.map((m) => <li key={m}>{m[0].toUpperCase() + m.slice(1)}</li>)}</ul>
              : <p>Fa lo stesso lavoro dell’alternativa: la differenza è nella marca e nella formula, non in un attivo in più.</p>}
          </div>
        )}
        {t.perche.length > 0 && <p className="piccolo"><strong>Perché fa per te:</strong> {t.perche.join(' · ')}</p>}
      </article>
      {a ? (
        <article className="carta coppia-alt">
          <div className="testa-carta"><span className="etichetta" style={{ color: 'var(--clinico)' }}>L’alternativa</span>{risparmi > 0.5 && <span className="risparmio">{euro(risparmi)} in meno</span>}</div>
          <Breve p={a.prodotto} da={`${da}-alternativa`} />
          {percheSimile(t.prodotto, a.prodotto) && <p className="piccolo perche-simile"><strong>Perché è simile:</strong> {percheSimile(t.prodotto, a.prodotto)}</p>}
        </article>
      ) : (
        <p className="piccolo coppia-nota">Per questo passaggio non c’è un prodotto che faccia lo stesso lavoro a un prezzo più basso.</p>
      )}
    </div>
  );
}

function PassoVista({ p, da }: { p: Passo; da: string }) {
  const ps = p.scelta.passaggio;
  const quando = [...p.orario.momenti.map((m) => MOMENTI.find((x) => x.id === m)!.nome.toLowerCase()), ...(p.orario.ogni ? [p.orario.ogni] : [])];
  return (
    <div id={`passo-${ps.id}`} className="passo pila" style={{ ['--gap' as string]: '10px' }}>
      <div className="passo-testa">
        <span className="titolo-3" style={{ fontSize: 18 }}>{ps.nome}</span>
        <span className="riga-chip">{quando.map((q) => <span key={q} className="chip tenue">{q}</span>)}</span>
      </div>
      <Coppia s={p.scelta} da={da} />
    </div>
  );
}

export default function Risultato({ r, azioni, condiviso }: { r: R; azioni: React.ReactNode; condiviso?: boolean }) {
  const gravidanza = r.profilo.scelte.gravidanza === true;
  const vegano = ['vegana', 'vegetariana'].includes(String(r.profilo.scelte.dieta));
  // i bisogni del giro integrativo rimasti senza prodotto (il motore li conta nel tetto di tre)
  const vuotiGiro = (a: R['aree'][number]) => (a.area === 'integrazione' ? a.vuoti.filter((ps) => ps.con_bisogno) : []);
  const g = giornataDi(r);
  const da = `test-${r.percorso.id}`;
  // i gruppi della lista: ogni passaggio una volta, nel primo momento in cui si usa; poi quelli non quotidiani
  const gruppi = [
    ...MOMENTI.map((m) => ({ id: m.id, nome: m.nome, passi: g.passi.filter((p) => p.orario.momenti[0] === m.id) })),
    { id: 'settimana', nome: 'Non tutti i giorni', passi: g.settimana },
  ].filter((x) => x.passi.length);
  return (
    <div className="pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '12px' }}>
        <span className="etichetta">{condiviso ? 'Un risultato condiviso' : 'Il tuo risultato'} · {r.percorso.titolo.toLowerCase()}</span>
        <p className="piccolo">{condiviso ? 'Qualcuno ha condiviso con te il suo risultato del test. Il tuo potrebbe essere diverso: le domande sono su quello che vedi allo specchio.' : 'Non è una diagnosi: è il punto di partenza per scegliere i prodotti. Le risposte stanno solo nel link di questa pagina: condividilo se vuoi.'}</p>
        {azioni}
      </header>

      {r.limiti.length > 0 && (
        <section className="consulto" aria-label="Prima di tutto, un consulto">
          <b className="titolo-3">Prima di tutto, un consulto con un medico</b>
          {r.limiti.map((l) => <p key={l.id} className="testo" style={{ fontSize: 15.5 }}><strong>{l.titolo}.</strong> {l.testo}</p>)}
          {r.limiti.some((l) => l.solo_delicati) && <p className="piccolo">Nel frattempo ti mostriamo solo prodotti delicati, che non peggiorano la situazione.</p>}
        </section>
      )}

      {r.aree.map((a, ia) => {
        const assi = TEST.assi.filter((x) => x.area === a.area);
        if (!a.biotipo) return null;
        return (
          <article key={a.area} className="carta" aria-label={NOMI_AREA[a.area]} style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', alignItems: 'start' }}>
            <Foto nome={fotoDi(a.biotipo)} className="foto-biotipo" sizes="(max-width: 760px) 100vw, 40vw" />
            <div className="pila" style={{ ['--gap' as string]: '10px' }}>
              <span className="etichetta">{SOPRA[a.area]}</span>
              {/* il primo biotipo è il titolo della pagina (Friday, 16/10: il risultato non aveva un h1) */}
              {ia === 0 ? <h1 className="titolo-2">{a.biotipo.titolo}</h1> : <h2 className="titolo-2">{a.biotipo.titolo}</h2>}
              <span className="motto">{a.biotipo.motto}</span>
              <details className="di-piu">
                <summary>Leggi di più sul tuo biotipo</summary>
                <p className="testo" style={{ fontSize: 15.5 }}><ConTermini testo={a.biotipo.descrizione} /></p>
                {assi.length > 0 && a.area !== 'integrazione' && (
                  <div className="pila" style={{ ['--gap' as string]: '6px' }} aria-label="I tuoi punteggi">
                    {assi.map((x, i) => {
                      const mx = massimoAsse(x.id, r.domande);
                      if (!mx) return null;
                      const v = Math.min(mx, r.profilo.punti[x.id] || 0);
                      return (
                        <div key={x.id} className="asse" style={{ ['--n' as string]: i }}>
                          <span>{x.nome}</span>
                          <span className="traccia" role="img" aria-label={`${x.nome}: ${v} su ${mx}`}><i style={{ width: `${Math.max(4, (v / mx) * 100)}%` }} /></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </details>
              {a.tratti.length > 0 && (
                <div className="pila" style={{ ['--gap' as string]: '6px' }}>
                  <span className="piccolo">In più:</span>
                  <div className="riga-chip">{a.tratti.map((t) => <Link key={t.id} href={`/biotipi/${t.id}`} className="chip">{t.titolo}</Link>)}</div>
                </div>
              )}
              <Stendi href={`/biotipi/${a.biotipo.id}`}>Tutto su questo biotipo</Stendi>
            </div>
          </article>
        );
      })}

      {g.passi.length > 0 && <Giornata g={g} />}

      {gruppi.map((gr) => (
        <section key={gr.id} className="pila" style={{ ['--gap' as string]: '22px' }} aria-labelledby={`gruppo-${gr.id}`}>
          <h2 id={`gruppo-${gr.id}`} className="titolo-3 gruppo-titolo">{gr.nome}</h2>
          {gr.passi.map((p) => <PassoVista key={p.scelta.passaggio.id} p={p} da={da} />)}
        </section>
      ))}

      {r.aree.map((a) => (
        <div key={`note-${a.area}`} className="pila" style={{ ['--gap' as string]: '10px' }}>
          {/* ⚠️ UN BISOGNO DEL GIRO SENZA PRODOTTO (23/10/2026): il consiglio resta, con la sua indicazione. Succede a
              chi mangia vegano quando nessun integratore è dichiarato vegano: la B12 gli serve comunque. */}
          {vuotiGiro(a).map((ps) => (
            <p key={ps.id} className="avviso">
              <strong>{ps.nome}.</strong> {BISOGNI.find((x) => x.chiave === ps.con_bisogno)?.principale?.replace(/^./, (c) => c.toUpperCase())}.{' '}
              {vegano ? 'Per ora nel catalogo non abbiamo un prodotto dichiarato vegano o vegetariano: chiedine uno in farmacia.' : 'Per ora nel catalogo non abbiamo un prodotto adatto alle tue risposte: chiedine uno in farmacia.'}
            </p>
          ))}
          {a.area === 'integrazione' && gravidanza && <p className="avviso">In gravidanza e in allattamento gli integratori li sceglie il medico: per questo qui non ne trovi.</p>}
          {a.area !== 'integrazione' && !a.passaggi.length && (
            <p className="avviso">{gravidanza ? `${NOMI_AREA[a.area]}: in gravidanza ti mostriamo solo i prodotti segnati come sicuri, e per questa parte non ne abbiamo ancora. Chiedi in farmacia.` : `${NOMI_AREA[a.area]}: per questa parte non abbiamo ancora un prodotto adatto alle tue risposte. Stiamo ampliando il catalogo.`}</p>
          )}
        </div>
      ))}

      {azioni}
      <p className="piccolo">Alcuni link sono di affiliazione: se compri, Skinmatch riceve una piccola commissione, a te non costa nulla in più.</p>
    </div>
  );
}
