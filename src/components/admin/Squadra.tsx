'use client';

import { useState } from 'react';
import { useApi, invia, Titolo, Vuoto, quando } from './base';
import Markdown from '@/components/Markdown';

// LA SQUADRA DI SKINMATCH (15/10/2026). ⚠️ Gli orari sono gli stessi di launchd
// (~/Library/LaunchAgents/com.agoranomos.squadra.*) e del calendario Google: si cambiano insieme.
/* le persone della squadra non si mostrano piu (13/11/2026) */
const _PERSONE = [
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
// ⚠️ PIU PULITA (17/10/2026, Federico: «non si capisce bene e le CTA si stretchano»). Prima le carte
// stavano in due colonne: quando una era piu lunga dell'altra, la riga si allungava e i bottoni con
// lei. Ora una colonna sola; in testa gravita, chi e quando; poi il titolo e la proposta, cioe la cosa
// da decidere; il perche si apre a richiesta; sotto tre bottoni di misura fissa e la nota.
const STATO: Record<string, string> = { aperta: 'da decidere', in_lavoro: 'sì, a Jarvis', dopo: 'dopo', fatta: 'fatta', scartata: 'no' };
const SCELTE: [string, string][] = [['in_lavoro', 'Sì, fatelo'], ['dopo', 'Dopo'], ['scartata', 'No']];
const GRAVITA = ['grave', 'medio', 'piccolo'];

function Segnalazione({ s, poi }: { s: S; poi: () => void }) {
  const [nota, setNota] = useState(s.nota_po || '');
  const [msg, setMsg] = useState('');
  const decidi = async (stato: string) => {
    setMsg('Salvo…');
    try { await invia('/api/admin/squadra', { id: s.id, stato, nota }); setMsg('Salvato.'); poi(); } catch (e) { setMsg((e as Error).message); }
  };
  const grav = (s.gravita || '').toLowerCase();
  return (
    <article className="carta seg">
      <div className="seg-testa">
        {grav && <span className={`seg-grav seg-grav--${GRAVITA.includes(grav) ? grav : 'medio'}`}>{grav}</span>}
        <span className="piccolo">{s.agente} · {quando(s.creato_il)}</span>
        {s.stato !== 'aperta' && <span className={`seg-stato seg-stato--${s.stato}`}>{STATO[s.stato] || s.stato}{s.chi ? ` · ${s.chi.split('@')[0]}` : ''}</span>}
      </div>
      <h3 className="seg-tit">{s.titolo}</h3>
      {s.proposta && <p className="seg-prop"><span className="seg-etichetta">Cosa propone</span>{s.proposta}</p>}
      {s.dettaglio && (
        <details className="seg-perche">
          <summary>Perché</summary>
          <div className="seg-perche-testo"><Markdown testo={s.dettaglio} /></div>
        </details>
      )}
      {s.stato === 'fatta' ? (s.nota_po && <p className="piccolo seg-nota-fatta">Nota: {s.nota_po}</p>) : (
        <div className="seg-decidi">
          <div className="seg-bottoni" role="group" aria-label={`Decisione su «${s.titolo}»`}>
            {SCELTE.map(([k, l]) => (
              <button key={k} type="button" className={`seg-bottone seg-bottone--${k}`} aria-pressed={s.stato === k} onClick={() => decidi(k)}>{l}</button>
            ))}
          </div>
          <textarea className="adm-input seg-nota" rows={1} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota, se serve: si salva con la scelta" aria-label={`Nota su «${s.titolo}»`} />
          {msg && <span className="piccolo" role="status">{msg}</span>}
        </div>
      )}
    </article>
  );
}

// prima le gravi, poi le medie, poi le piccole; a parita le piu recenti
const ordina = (xs: S[]) => [...xs].sort((a, b) => {
  const g = (x: S) => { const i = GRAVITA.indexOf((x.gravita || 'medio').toLowerCase()); return i < 0 ? 1 : i; };
  return g(a) - g(b) || b.creato_il.localeCompare(a.creato_il);
});

// ⚠️ GLI AVVISI (13/11/2026, Federico: «Squadra non mi serve; chiama alerts solo quando ci sono problematiche e, come su
// Agoranomos, vanno segnalate le risoluzioni»). Qui solo due cose: i problemi aperti (le segnalazioni gravi e medie
// non ancora chiuse, i rapporti con un esito diverso da «ok», le pubblicazioni fallite) e le risoluzioni degli ultimi
// 30 giorni, con la nota di chi ha risolto. Le proposte di contenuto non passano piu di qui.
const GIORNI = (d: string) => (Date.now() - new Date(d).getTime()) / 864e5;
export default function Squadra() {
  const api = useApi<{ rapporti: R[]; pubblicazioni: P[]; segnalazioni: S[] }>('/api/admin/squadra');
  const seg = api.dati?.segnalazioni || [];
  const problemi = ordina(seg.filter((s) => ['aperta', 'in_lavoro'].includes(s.stato) && ['grave', 'medio'].includes((s.gravita || 'medio').toLowerCase())));
  const rapportiStorti = (api.dati?.rapporti || []).filter((r) => r.esito && r.esito !== 'ok' && GIORNI(r.creato_il) <= 14);
  const fallite = (api.dati?.pubblicazioni || []).filter((p) => /error|fall|ko/i.test(p.stato || '') && GIORNI(p.chiesta_il) <= 14);
  const risolte = seg.filter((s) => s.stato === 'fatta' && GIORNI(s.aggiornato_il || s.creato_il) <= 30)
    .sort((a, b) => (b.aggiornato_il || b.creato_il).localeCompare(a.aggiornato_il || a.creato_il));
  const nProblemi = problemi.length + rapportiStorti.length + fallite.length;
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="Solo quando qualcosa non va: i problemi aperti, poi come sono stati risolti. Se è tutto a posto, qui non c'è niente da fare.">Avvisi</Titolo>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Da risolvere{nProblemi ? ` · ${nProblemi}` : ''}</h2>
        {!api.caricando && !nProblemi && <Vuoto>Nessun problema aperto.</Vuoto>}
        {api.errore && <Vuoto>Non riesco a leggere gli avvisi: {api.errore}</Vuoto>}
        <div className="seg-lista">{problemi.map((s) => <Segnalazione key={s.id} s={s} poi={api.ricarica} />)}</div>
        {rapportiStorti.map((r) => (
          <details key={`r${r.id}`} className="carta">
            <summary><b>{r.titolo}</b> <span className="piccolo">· {r.agente} · {quando(r.creato_il)} · {r.esito}</span><br /><span className="piccolo">{r.sintesi}</span></summary>
            {r.corpo && <div style={{ marginTop: 10 }}><Markdown testo={r.corpo} /></div>}
          </details>
        ))}
        {fallite.map((p) => (
          <div key={`p${p.id}`} className="carta pila" style={{ ['--gap' as string]: '4px' }}>
            <b>Pubblicazione non riuscita: {p.cosa}</b><span className="piccolo">{quando(p.chiesta_il)} · {p.chi} · {p.esito || p.stato}</span>
          </div>
        ))}
      </section>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Risolti negli ultimi 30 giorni{risolte.length ? ` · ${risolte.length}` : ''}</h2>
        {!api.caricando && !risolte.length && <Vuoto>Niente di risolto di recente.</Vuoto>}
        {!!risolte.length && (
          <div className="adm-tabella"><table><thead><tr><th>Quando</th><th>Problema</th><th>Come è stato risolto</th></tr></thead>
            <tbody>{risolte.map((s) => <tr key={s.id}><td className="piccolo">{quando(s.aggiornato_il || s.creato_il)}</td><td>{s.titolo}</td><td className="piccolo">{s.nota_po || '—'}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
