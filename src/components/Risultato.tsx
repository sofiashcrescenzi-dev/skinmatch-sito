'use client';

import Link from 'next/link';
import { TEST, NOMI_AREA, type Area, fotoDi } from '@/lib/dati';
import { massimoAsse, type Risultato as R } from '@/lib/motore';
import { ConTermini } from '@/components/Termini';
import SchedaProdotto from '@/components/SchedaProdotto';
import Foto from '@/components/Foto';

const SOPRA: Record<Area, string> = { pelle: 'Il tuo biotipo', cute: 'Il biotipo della tua cute', integrazione: 'Il tuo profilo' };

export default function Risultato({ r, rifai, cambia }: { r: R; rifai: () => void; cambia: () => void }) {
  const gravidanza = r.profilo.scelte.gravidanza === true;
  let n = 0;
  return (
    <div className="pila" style={{ ['--gap' as string]: 'clamp(28px, 5vw, 48px)' }}>
      <header className="pila" style={{ ['--gap' as string]: '10px' }}>
        <span className="etichetta">Il tuo risultato · {r.percorso.titolo.toLowerCase()}</span>
        <p className="piccolo">Non è una diagnosi: è il punto di partenza per scegliere i prodotti. Le tue risposte restano su questo telefono.</p>
      </header>

      {r.limiti.length > 0 && (
        <section className="consulto" aria-label="Prima di tutto, un consulto">
          <b className="titolo-3">Prima di tutto, un consulto con un medico</b>
          {r.limiti.map((l) => <p key={l.id} className="testo" style={{ fontSize: 15.5 }}><strong>{l.titolo}.</strong> {l.testo}</p>)}
          {r.limiti.some((l) => l.solo_delicati) && <p className="piccolo">Nel frattempo ti mostriamo solo prodotti delicati, che non peggiorano la situazione.</p>}
        </section>
      )}

      {r.aree.map((a) => {
        const assi = TEST.assi.filter((x) => x.area === a.area);
        return (
          <section key={a.area} className="pila" style={{ ['--gap' as string]: '20px' }} aria-label={NOMI_AREA[a.area]}>
            {a.biotipo && (
              <article className="carta" style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', alignItems: 'start' }}>
                <Foto nome={fotoDi(a.biotipo)} style={{ aspectRatio: '4 / 3' }} sizes="(max-width: 760px) 100vw, 40vw" />
                <div className="pila" style={{ ['--gap' as string]: '10px' }}>
                  <span className="etichetta">{SOPRA[a.area]}</span>
                  <h2 className="titolo-2">{a.biotipo.titolo}</h2>
                  <span className="motto">{a.biotipo.motto}</span>
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
                  {a.tratti.length > 0 && (
                    <div className="pila" style={{ ['--gap' as string]: '6px' }}>
                      <span className="piccolo">In più:</span>
                      <div className="riga-chip">{a.tratti.map((t) => <Link key={t.id} href={`/biotipi/${t.id}`} className="chip">{t.titolo}</Link>)}</div>
                    </div>
                  )}
                  <Link href={`/biotipi/${a.biotipo.id}`} className="link">Tutto su questo biotipo</Link>
                </div>
              </article>
            )}

            {a.passaggi.length > 0 && (
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
                      <div className="griglia" style={{ ['--min' as string]: '300px' }}>
                        <SchedaProdotto p={s.consigliato.prodotto} da={`test-${r.percorso.id}`} conTag={false}
                          sopra={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="etichetta">Consigliato</span><span className={`livello ${s.consigliato.livello}`}>compatibilità {s.consigliato.livello}</span></div>}
                          sotto={s.consigliato.perche.length > 0 && <p className="piccolo"><strong>Perché questo:</strong> {s.consigliato.perche.join(' · ')}</p>} />
                        {s.alternativa && (
                          <SchedaProdotto p={s.alternativa.prodotto} da={`test-${r.percorso.id}-alternativa`} conTag={false}
                            sopra={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="etichetta" style={{ color: 'var(--clinico)' }}>{s.alternativa.come === 'costa meno' ? 'Se vuoi spendere meno' : 'Se vuoi il top'}</span><span className={`livello ${s.alternativa.livello}`}>compatibilità {s.alternativa.livello}</span></div>}
                            sotto={s.alternativa.perche.length > 0 && <p className="piccolo">{s.alternativa.perche.join(' · ')}</p>} />
                        )}
                      </div>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="bottone secondario" onClick={rifai}>Rifai il test</button>
        <button type="button" className="bottone secondario" onClick={cambia}>Prova un altro test</button>
        <Link href="/catalogo" className="bottone secondario">Sfoglia il catalogo</Link>
      </div>
      <p className="piccolo">Alcuni link sono di affiliazione: se compri, Skinmatch riceve una piccola commissione, a te non costa nulla in più.</p>
    </div>
  );
}
