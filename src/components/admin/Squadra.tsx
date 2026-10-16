'use client';

import { useState } from 'react';
import { useApi, invia, Titolo, Vuoto, quando } from './base';
import Markdown from '@/components/Markdown';

// LA SQUADRA DI SKINMATCH (15/10/2026). ⚠️ Gli orari sono gli stessi di launchd
// (~/Library/LaunchAgents/com.agoranomos.squadra.*) e del calendario Google: si cambiano insieme.
const PERSONE = [
  { chi: 'Sofia', ruolo: 'Medico estetico. Decide cosa è giusto per la pelle: domande del test, biotipi, prodotti, testi. Approva in admin.' },
  { chi: 'Federico', ruolo: 'Decide e approva: prodotto, catalogo, merchant, Rivista.' },
  { chi: 'Jarvis', ruolo: 'Lead product (Claude): sito, dati, catalogo e feed, admin. Pubblica quello che approvate.', turni: 'ogni giorno alle 8:40 controlla, alle 8:40 e alle 14:40 pubblica' },
  { chi: 'Friday', ruolo: 'Test e ricerca organica (Claude): prova il sito come un utente e come Google, legge Search Console, segnala.', turni: 'giro SEO ogni 3 giorni alle 7:30' },
  { chi: 'Zeno', ruolo: 'Strategist, copywriter e designer (Claude): identità del marchio, foto, Rivista, arricchimento delle schede.', turni: 'un articolo ogni due giorni alle 10:40, le novità il lunedì alle 11:00' },
];
type R = { id: number; agente: string; tipo: string; titolo: string; sintesi: string; corpo: string; esito: string; creato_il: string };
type P = { id: number; chi: string; cosa: string; stato: string; esito: string; chiesta_il: string; fatta_il: string };
type S = { id: number; agente: string; gravita: string | null; titolo: string; dettaglio: string | null; proposta: string | null; stato: string; nota_po: string | null; chi: string | null; creato_il: string; aggiornato_il: string | null };

// Le segnalazioni (16/10/2026, come su Agoranomos): la squadra propone, Federico e Sofia scelgono.
// «Sì» la passa a Jarvis (in_lavoro), «Dopo» la parcheggia, «No» la scarta; Jarvis la chiude (fatta).
const STATO: Record<string, string> = { aperta: 'da decidere', in_lavoro: 'sì, a Jarvis', dopo: 'dopo', fatta: 'fatta', scartata: 'no' };

function Segnalazione({ s, poi }: { s: S; poi: () => void }) {
  const [nota, setNota] = useState(s.nota_po || '');
  const [msg, setMsg] = useState('');
  const decidi = async (stato: string) => {
    setMsg('Salvo…');
    try { await invia('/api/admin/squadra', { id: s.id, stato, nota }); setMsg(''); poi(); } catch (e) { setMsg((e as Error).message); }
  };
  return (
    <div className="carta pila" style={{ ['--gap' as string]: '8px' }}>
      <div className="piccolo">{s.agente}{s.gravita ? ` · ${s.gravita}` : ''} · {quando(s.creato_il)}{s.stato !== 'aperta' ? ` · ${STATO[s.stato] || s.stato}${s.chi ? ` (${s.chi.split('@')[0]})` : ''}` : ''}</div>
      <b className="titolo-3" style={{ fontSize: 18 }}>{s.titolo}</b>
      {s.dettaglio && <div style={{ fontSize: 15 }}><Markdown testo={s.dettaglio} /></div>}
      {s.proposta && <div style={{ fontSize: 15 }}><b>Proposta: </b>{s.proposta}</div>}
      {s.stato === 'fatta' ? (s.nota_po && <div className="piccolo">Nota: {s.nota_po}</div>) : (
        <>
          <div className="adm-scatola-azioni">
            <button type="button" className="chip" aria-pressed={s.stato === 'in_lavoro'} onClick={() => decidi('in_lavoro')}>Sì, fatelo</button>
            <button type="button" className="chip" aria-pressed={s.stato === 'dopo'} onClick={() => decidi('dopo')}>Dopo</button>
            <button type="button" className="chip" aria-pressed={s.stato === 'scartata'} onClick={() => decidi('scartata')}>No</button>
          </div>
          <textarea className="adm-input" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Una nota, se serve (si salva con la scelta)" aria-label={`Nota su «${s.titolo}»`} />
          {msg && <span className="piccolo">{msg}</span>}
        </>
      )}
    </div>
  );
}

export default function Squadra() {
  const api = useApi<{ rapporti: R[]; pubblicazioni: P[]; segnalazioni: S[] }>('/api/admin/squadra');
  const seg = api.dati?.segnalazioni || [];
  const aperte = seg.filter((s) => s.stato === 'aperta');
  const decise = seg.filter((s) => s.stato !== 'aperta');
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="Le proposte della squadra da scegliere, chi lavora su Skinmatch, quando, e cosa ha fatto. Le pubblicazioni sono le richieste partite da «Pubblica»: il Mac le esegue dopo i controlli dei guardiani.">La squadra</Titolo>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Da decidere{aperte.length ? ` · ${aperte.length}` : ''}</h2>
        {!api.caricando && !aperte.length && <Vuoto>Niente da decidere: le proposte nuove di Zeno e Friday arrivano qui.</Vuoto>}
        <div className="adm-due">{aperte.map((s) => <Segnalazione key={s.id} s={s} poi={api.ricarica} />)}</div>
        {!!decise.length && (
          <details>
            <summary className="piccolo" style={{ cursor: 'pointer' }}>Già decise · {decise.length} (si possono cambiare)</summary>
            <div className="adm-due" style={{ marginTop: 10 }}>{decise.map((s) => <Segnalazione key={s.id} s={s} poi={api.ricarica} />)}</div>
          </details>
        )}
      </section>
      <div className="adm-due">
        {PERSONE.map((p) => (
          <div key={p.chi} className="carta pila" style={{ ['--gap' as string]: '6px' }}>
            <b className="titolo-3">{p.chi}</b><span className="piccolo" style={{ fontSize: 14.5 }}>{p.ruolo}</span>{p.turni && <span className="piccolo">⏱ {p.turni}</span>}
          </div>
        ))}
      </div>
      <section className="pila" style={{ ['--gap' as string]: '8px' }}>
        <h2 className="titolo-3">Le pubblicazioni</h2>
        {!(api.dati?.pubblicazioni || []).length ? <Vuoto>Nessuna pubblicazione chiesta dall&apos;admin.</Vuoto> : (
          <div className="adm-tabella"><table><thead><tr><th>Chiesta</th><th>Da</th><th>Cosa</th><th>Stato</th><th>Esito</th></tr></thead>
            <tbody>{api.dati!.pubblicazioni.map((p) => <tr key={p.id}><td>{quando(p.chiesta_il)}</td><td>{p.chi}</td><td>{p.cosa}</td><td>{p.stato}{p.fatta_il ? ` · ${quando(p.fatta_il)}` : ''}</td><td className="piccolo">{p.esito || '—'}</td></tr>)}</tbody></table></div>
        )}
      </section>
      <section className="pila" style={{ ['--gap' as string]: '8px' }}>
        <h2 className="titolo-3">I rapporti</h2>
        {api.errore && <Vuoto>Non riesco a leggere i rapporti: {api.errore}</Vuoto>}
        {!api.caricando && !(api.dati?.rapporti || []).length && <Vuoto>Ancora nessun rapporto su Skinmatch.</Vuoto>}
        {(api.dati?.rapporti || []).map((r) => (
          <details key={r.id} className="carta">
            <summary><b>{r.titolo}</b> <span className="piccolo">· {r.agente} · {r.tipo} · {quando(r.creato_il)}{r.esito && r.esito !== 'ok' ? ` · ${r.esito}` : ''}</span><br /><span className="piccolo">{r.sintesi}</span></summary>
            {r.corpo && <div style={{ marginTop: 10 }}><Markdown testo={r.corpo} /></div>}
          </details>
        ))}
      </section>
    </div>
  );
}
