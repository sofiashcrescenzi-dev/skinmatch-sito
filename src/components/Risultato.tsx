'use client';

import Link from 'next/link';
import { TEST, NOMI_AREA, type Area, fotoDi } from '@/lib/dati';
import { massimoAsse, type Risultato as R } from '@/lib/motore';
import { ConTermini } from '@/components/Termini';
import SchedaProdotto from '@/components/SchedaProdotto';
import { Stendi } from '@/components/Inviti';
import Foto from '@/components/Foto';
import { percheSimile } from '@/lib/simili';
import { BISOGNI } from '@/lib/integratori';

const SOPRA: Record<Area, string> = { pelle: 'Il tuo biotipo', cute: 'Il biotipo della tua cute', integrazione: 'Il tuo profilo' };

export default function Risultato({ r, azioni, condiviso }: { r: R; azioni: React.ReactNode; condiviso?: boolean }) {
  const gravidanza = r.profilo.scelte.gravidanza === true;
  const vegano = ['vegana', 'vegetariana'].includes(String(r.profilo.scelte.dieta));
  // i bisogni del giro integrativo rimasti senza prodotto (il motore li conta nel tetto di tre)
  const vuotiGiro = (a: R['aree'][number]) => (a.area === 'integrazione' ? a.vuoti.filter((ps) => ps.con_bisogno) : []);
  let n = 0;
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
        return (
          <section key={a.area} className="pila" style={{ ['--gap' as string]: '20px' }} aria-label={NOMI_AREA[a.area]}>
            {a.biotipo && (
              <article className="carta" style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', alignItems: 'start' }}>
                <Foto nome={fotoDi(a.biotipo)} className="foto-biotipo" sizes="(max-width: 760px) 100vw, 40vw" />
                <div className="pila" style={{ ['--gap' as string]: '10px' }}>
                  <span className="etichetta">{SOPRA[a.area]}</span>
                  {/* il primo biotipo è il titolo della pagina (Friday, 16/10: il risultato non aveva un h1) */}
                  {ia === 0 ? <h1 className="titolo-2">{a.biotipo.titolo}</h1> : <h2 className="titolo-2">{a.biotipo.titolo}</h2>}
                  <span className="motto">{a.biotipo.motto}</span>
                  {/* al telefono il prodotto arriva prima: la spiegazione lunga e i punteggi si aprono a richiesta */}
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
            )}

            {(a.passaggi.length > 0 || vuotiGiro(a).length > 0) && (
              <div className="pila" style={{ ['--gap' as string]: '14px' }}>
                <h3 className="titolo-3">{a.area === 'integrazione' ? 'Il consiglio' : a.area === 'cute' ? 'La routine per la cute' : 'La tua routine'}</h3>
                {a.passaggi.map((s) => {
                  n += 1;
                  return (
                    <div key={s.passaggio.id} className="pila" style={{ ['--gap' as string]: '8px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'baseline' }}>
                        <span className="titolo-3" style={{ fontSize: 17 }}>{n} · {s.passaggio.nome}</span>
                        <span className="piccolo">{s.passaggio.quando}</span>
                      </div>
                      <div className="griglia-due">
                        <SchedaProdotto p={s.consigliato.prodotto} da={`test-${r.percorso.id}`} conTag={false}
                          sopra={<div className="testa-carta"><span className="etichetta">Consigliato</span><span className={`livello ${s.consigliato.livello}`}>compatibilità {s.consigliato.livello}</span></div>}
                          sotto={s.consigliato.perche.length > 0 && <p className="piccolo"><strong>Perché questo:</strong> {s.consigliato.perche.join(' · ')}</p>} />
                        {s.alternativa && (
                          <SchedaProdotto p={s.alternativa.prodotto} da={`test-${r.percorso.id}-alternativa`} conTag={false}
                            sopra={<div className="pila" style={{ ['--gap' as string]: '4px' }}>
                              <div className="testa-carta"><span className="etichetta" style={{ color: 'var(--clinico)' }}>Alternativa</span><span className={`livello ${s.alternativa.livello}`}>compatibilità {s.alternativa.livello}</span></div>
                              <span className="piccolo">{s.alternativa.come === 'costa meno' ? 'Solitamente un prodotto meno costoso, ma anche con una % di attivi minore.' : 'Solitamente un prodotto più ricco di attivi, e più costoso.'}</span>
                            </div>}
                            sotto={<>
                              {percheSimile(s.consigliato.prodotto, s.alternativa.prodotto) && <p className="piccolo perche-simile"><strong>Perché è simile:</strong> {percheSimile(s.consigliato.prodotto, s.alternativa.prodotto)}</p>}
                              {s.alternativa.perche.length > 0 && <p className="piccolo">{s.alternativa.perche.join(' · ')}</p>}
                            </>} />
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* ⚠️ UN BISOGNO DEL GIRO SENZA PRODOTTO (23/10/2026): il consiglio resta, con la sua indicazione. Succede a
                    chi mangia vegano quando nessun integratore è dichiarato vegano: la B12 gli serve comunque. */}
                {vuotiGiro(a).map((ps) => {
                  n += 1;
                  return (
                    <div key={ps.id} className="pila" style={{ ['--gap' as string]: '8px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'baseline' }}>
                        <span className="titolo-3" style={{ fontSize: 17 }}>{n} · {ps.nome}</span>
                        <span className="piccolo">{ps.quando}</span>
                      </div>
                      <p className="avviso">
                        {BISOGNI.find((x) => x.chiave === ps.con_bisogno)?.principale?.replace(/^./, (c) => c.toUpperCase())}.{' '}
                        {vegano ? 'Per ora nel catalogo non abbiamo un prodotto dichiarato vegano o vegetariano: chiedine uno in farmacia.' : 'Per ora nel catalogo non abbiamo un prodotto adatto alle tue risposte: chiedine uno in farmacia.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            {a.area === 'integrazione' && gravidanza && <p className="avviso">In gravidanza e in allattamento gli integratori li sceglie il medico: per questo qui non ne trovi.</p>}
            {a.area !== 'integrazione' && !a.passaggi.length && (
              <p className="avviso">{gravidanza ? 'In gravidanza ti mostriamo solo i prodotti segnati come sicuri, e per questa parte non ne abbiamo ancora: chiedi in farmacia.' : 'Per questa parte non abbiamo ancora un prodotto adatto alle tue risposte: stiamo ampliando il catalogo.'}</p>
            )}
          </section>
        );
      })}

      {azioni}
      <p className="piccolo">Alcuni link sono di affiliazione: se compri, Skinmatch riceve una piccola commissione, a te non costa nulla in più.</p>
    </div>
  );
}
