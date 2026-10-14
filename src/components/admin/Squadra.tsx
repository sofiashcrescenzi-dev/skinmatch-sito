'use client';

import { useApi, Titolo, Vuoto, quando } from './base';
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

export default function Squadra() {
  const api = useApi<{ rapporti: R[]; pubblicazioni: P[] }>('/api/admin/squadra');
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="Chi lavora su Skinmatch, quando, e cosa ha fatto. Le pubblicazioni sono le richieste partite da «Pubblica»: il Mac le esegue dopo i controlli dei guardiani.">La squadra</Titolo>
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
