'use client';

import { useState } from 'react';
import { useApi, Vuoto, quando } from './base';

// VISIBILITÀ SU GOOGLE (15/11/2026, Federico: «una dashboard ben fatta sull'admin, nella stessa pagina in cui adesso ci
// sono le ricerche. Visibilità 24h 7gg 30gg»). I numeri vengono da Search Console in diretta (/api/admin/google, nel
// Worker, con l'account di servizio di Skinmatch), tenuti 30 minuti in cache: «Aggiorna» li rilegge subito.
// Ogni numero ha il confronto col periodo prima, scritto a parole e con la freccia: il colore aiuta, non basta da solo.
// ⚠️ La posizione migliora quando scende (1 è il primo risultato): la freccia in su vuol dire «più in alto su Google».

type Somma = { impressioni: number; clic: number; ctr: number; posizione: number | null };
type Riga = Somma & { k: string };
type Punto = { t: string; impressioni: number; clic: number };
type Sitemap = { indirizzo: string; inviata: string | null; letta: string | null; in_attesa: boolean; errori: number; avvisi: number; indirizzi: number | null };
type Dati = {
  collegato: boolean; errore?: string; periodo?: '24h' | '7g' | '30g'; aggiornato?: string;
  totali?: Somma; prima?: Somma; serie?: Punto[]; ricerche?: Riga[]; pagine?: Riga[]; pagine_viste?: number; dispositivi?: Riga[]; sitemap?: Sitemap[];
};

const PERIODI = [['24h', '24 ore'], ['7g', '7 giorni'], ['30g', '30 giorni']] as const;
type Periodo = (typeof PERIODI)[number][0];
const PRIMA: Record<Periodo, string> = { '24h': 'sulle 24 ore prima', '7g': 'sui 7 giorni prima', '30g': 'sui 30 giorni prima' };
const NOMI_DISPOSITIVO: Record<string, string> = { MOBILE: 'Telefono', DESKTOP: 'Computer', TABLET: 'Tablet' };
const intero = (n: number) => Math.round(n).toLocaleString('it-IT');
const decimale = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 });
const percento = (x: number) => `${decimale(x * 100)}%`;
const percorso = (u: string) => u.replace(/^https?:\/\/(www\.)?skinmatch\.it/, '') || '/';

function etichetta(t: string, periodo: Periodo, lunga = false) {
  if (periodo === '24h') {
    const d = new Date(t);
    const ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
    return lunga ? `${d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', timeZone: 'Europe/Rome' })}, ${ora}` : ora.slice(0, 2);
  }
  const d = new Date(`${t}T12:00:00Z`);
  if (lunga) return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  // sull'asse: giorno della settimana sopra e numero sotto (7 giorni), o «17 ott» ogni settimana (30 giorni)
  return periodo === '7g' ? `${d.toLocaleDateString('it-IT', { weekday: 'short' })}\n${d.getUTCDate()}` : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function Confronto({ ora, prima, tipo, periodo }: { ora: number | null; prima: number | null; tipo: 'numero' | 'ctr' | 'posizione'; periodo: Periodo }) {
  const dopo = <span className="vis-prima">{PRIMA[periodo]}</span>;
  if (ora == null || prima == null) return <span className="vis-delta">— {dopo}</span>;
  if (tipo === 'posizione') {
    const d = prima - ora;
    if (Math.abs(d) < 0.05) return <span className="vis-delta">= stessa posizione {dopo}</span>;
    return <span className={`vis-delta ${d > 0 ? 'vis-meglio' : 'vis-peggio'}`}>{d > 0 ? '▲' : '▼'} {decimale(Math.abs(d))} {d > 0 ? 'più in alto' : 'più in basso'} {dopo}</span>;
  }
  if (tipo === 'ctr') {
    const d = (ora - prima) * 100;
    if (Math.abs(d) < 0.05) return <span className="vis-delta">= uguale {dopo}</span>;
    return <span className={`vis-delta ${d > 0 ? 'vis-meglio' : 'vis-peggio'}`}>{d > 0 ? '▲' : '▼'} {decimale(Math.abs(d))} punti {dopo}</span>;
  }
  if (ora === prima) return <span className="vis-delta">= uguale {dopo}</span>;
  if (!prima) return <span className="vis-delta vis-meglio">▲ da zero {dopo}</span>;
  const d = (ora - prima) / prima;
  return <span className={`vis-delta ${d > 0 ? 'vis-meglio' : 'vis-peggio'}`}>{d > 0 ? '▲' : '▼'} {intero(Math.abs(d) * 100)}% {dopo}</span>;
}

// Un grafico a colonne per una misura sola (impressioni o clic): due misure con scale diverse non stanno su un asse.
function Colonne({ serie, chiave, titolo, periodo, tono }: { serie: Punto[]; chiave: 'impressioni' | 'clic'; titolo: string; periodo: Periodo; tono: string }) {
  const [su, setSu] = useState<number | null>(null);
  const v = serie.map((p) => p[chiave]);
  const max = Math.max(...v, 0);
  const ogni = periodo === '24h' ? 6 : periodo === '7g' ? 1 : 7;
  return (
    <figure className="carta vis-grafico" style={{ ['--tono' as string]: tono }}>
      <figcaption>
        <b>{titolo}</b>
        <span className="piccolo" aria-live="polite">{su != null ? `${etichetta(serie[su].t, periodo, true)}: ${intero(v[su])}` : max ? `massimo ${intero(max)} ${periodo === '24h' ? 'in un’ora' : 'in un giorno'}` : 'ancora a zero'}</span>
      </figcaption>
      <div className="vis-barre" role="img" aria-label={`${titolo}, ${periodo === '24h' ? 'ora per ora' : 'giorno per giorno'}: totale ${intero(v.reduce((a, b) => a + b, 0))}`} onMouseLeave={() => setSu(null)}>
        {serie.map((p, i) => (
          <span key={p.t} className={su === i ? 'su' : undefined} onMouseEnter={() => setSu(i)} onFocus={() => setSu(i)} onBlur={() => setSu(null)} tabIndex={0}
            aria-label={`${etichetta(p.t, periodo, true)}: ${intero(v[i])}`}>
            <i style={{ height: max ? `${(v[i] / max) * 100}%` : 0 }} className={v[i] ? undefined : 'zero'} />
          </span>
        ))}
      </div>
      <div className="vis-assi" aria-hidden="true">
        {serie.map((p, i) => <span key={p.t}>{i % ogni === 0 ? etichetta(p.t, periodo) : ''}</span>)}
      </div>
    </figure>
  );
}

function Tabella({ titolo, righe, prima, pagina }: { titolo: string; righe: Riga[]; prima: string; pagina?: boolean }) {
  return (
    <div className="pila" style={{ ['--gap' as string]: '8px', minWidth: 0 }}>
      <h3 className="titolo-3">{titolo}</h3>
      {!righe.length ? <Vuoto>Ancora nessuna, in questo periodo.</Vuoto> : (
        <div className="adm-tabella vis-tab"><table>
          <thead><tr><th>{prima}</th><th className="num">Impressioni</th><th className="num">Clic</th><th className="num">CTR</th><th className="num">Posizione</th></tr></thead>
          <tbody>{righe.slice(0, 15).map((r) => (
            <tr key={r.k}>
              <td className={pagina ? 'vis-testo vis-url' : 'vis-testo'}>{pagina ? <a className="link" href={r.k} target="_blank" rel="noopener">{percorso(r.k)}</a> : r.k}</td>
              <td className="num" data-l="Impressioni">{intero(r.impressioni)}</td><td className="num" data-l="Clic">{intero(r.clic)}</td>
              <td className="num" data-l="CTR">{percento(r.ctr)}</td><td className="num" data-l="Posizione">{r.posizione == null ? '—' : decimale(r.posizione)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

export default function Visibilita() {
  const [periodo, setPeriodo] = useState<Periodo>('7g');
  const [forza, setForza] = useState(0);
  const api = useApi<Dati>(`/api/admin/google?periodo=${periodo}${forza ? `&aggiorna=1&n=${forza}` : ''}`);
  const d = api.dati?.periodo === periodo ? api.dati : null;
  const t = d?.totali, p = d?.prima;
  const sm = d?.sitemap?.[0];
  const dispositivi = (d?.dispositivi || []).filter((x) => x.impressioni);
  const totDisp = dispositivi.reduce((a, x) => a + x.impressioni, 0);

  return (
    <section className="pila vis" style={{ ['--gap' as string]: '14px' }}>
      <div className="vis-testa">
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <h2 className="titolo-2">Visibilità su Google</h2>
          <p className="piccolo">Quante volte Skinmatch compare nelle ricerche di Google, quante volte ci cliccano e a che posizione. Da Search Console, in diretta.</p>
        </div>
        <div className="riga-chip" role="group" aria-label="Periodo">
          {PERIODI.map(([k, nome]) => <button key={k} type="button" className="chip" aria-pressed={periodo === k} onClick={() => { setPeriodo(k); setForza(0); }}>{nome}</button>)}
          <button type="button" className="chip tenue-azione" onClick={() => setForza((x) => x + 1)} disabled={api.caricando}>Aggiorna</button>
        </div>
      </div>

      {api.dati && !api.dati.collegato && <Vuoto>Search Console non è collegata al sito: manca la chiave dell’account di servizio nel Worker (segreto GSC_CHIAVE).</Vuoto>}
      {(api.errore || api.dati?.errore) && <Vuoto>Non riesco a leggere Search Console: {api.errore || api.dati?.errore}</Vuoto>}
      {!d && !api.errore && !api.dati?.errore && api.dati?.collegato !== false && <div className="adm-numeri vis-attesa" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i}><span className="piccolo">&nbsp;</span><b>&nbsp;</b></div>)}</div>}

      {d && t && p && (
        <>
          <div className="adm-numeri vis-numeri">
            <div><span className="piccolo">Impressioni</span><b>{intero(t.impressioni)}</b><Confronto ora={t.impressioni} prima={p.impressioni} tipo="numero" periodo={periodo} /></div>
            <div><span className="piccolo">Clic</span><b>{intero(t.clic)}</b><Confronto ora={t.clic} prima={p.clic} tipo="numero" periodo={periodo} /></div>
            <div><span className="piccolo">CTR</span><b>{t.impressioni ? percento(t.ctr) : '—'}</b><Confronto ora={t.impressioni ? t.ctr : null} prima={p.impressioni ? p.ctr : null} tipo="ctr" periodo={periodo} /></div>
            <div><span className="piccolo">Posizione media</span><b>{t.posizione == null ? '—' : decimale(t.posizione)}</b><Confronto ora={t.posizione} prima={p.posizione} tipo="posizione" periodo={periodo} /></div>
            <div><span className="piccolo">Pagine viste da Google</span><b>{intero(d.pagine_viste || 0)}</b><span className="vis-delta"><span className="vis-prima">con almeno un’impressione</span></span></div>
          </div>

          {!t.impressioni && !p.impressioni ? (
            <div className="carta vis-avviso pila" style={{ ['--gap' as string]: '6px' }}>
              <b>Google non mostra ancora Skinmatch nelle ricerche.</b>
              <p className="piccolo">Il 15 novembre Search Console non conosceva nessuna pagina di skinmatch.it: non era mai stata inviata una sitemap. Adesso è inviata e Google l’ha già letta{sm?.letta ? ` (${quando(sm.letta)})` : ''}. Le pagine entrano nell’indice un po’ alla volta: di solito le prime impressioni arrivano nel giro di qualche giorno, poi qui si vedono anche ora per ora.</p>
            </div>
          ) : (
            <>
              <div className="adm-due">
                <Colonne serie={d.serie || []} chiave="impressioni" titolo="Impressioni" periodo={periodo} tono="var(--f4)" />
                <Colonne serie={d.serie || []} chiave="clic" titolo="Clic" periodo={periodo} tono="var(--cacao)" />
              </div>
              {periodo === '24h' && <p className="piccolo">Search Console arriva con qualche ora di ritardo: le ultime ore si riempiono dopo.</p>}
              <div className="adm-due vis-tabelle">
                <Tabella titolo="Ricerche" righe={d.ricerche || []} prima="Ricerca" />
                <Tabella titolo="Pagine" righe={d.pagine || []} prima="Pagina" pagina />
              </div>
              {!!totDisp && (
                <div className="carta pila" style={{ ['--gap' as string]: '8px' }}>
                  <h3 className="titolo-3">Da quale dispositivo</h3>
                  <div className="vis-quote" aria-hidden="true">{dispositivi.map((x, i) => <i key={x.k} style={{ flexGrow: x.impressioni, background: ['var(--f5)', 'var(--f3)', 'var(--f2)'][i] || 'var(--f1)' }} />)}</div>
                  <p className="piccolo">{dispositivi.map((x) => `${NOMI_DISPOSITIVO[x.k] || x.k} ${percento(x.impressioni / totDisp)}`).join(' · ')}</p>
                </div>
              )}
            </>
          )}

          {sm && (
            <p className="piccolo vis-sitemap">
              Sitemap <a className="link" href={sm.indirizzo} target="_blank" rel="noopener">{percorso(sm.indirizzo)}</a>: inviata {quando(sm.inviata)}, letta da Google {sm.letta ? quando(sm.letta) : 'non ancora'}
              {sm.errori || sm.avvisi ? <> · <b>{sm.errori} errori, {sm.avvisi} avvisi</b></> : ' · nessun errore'}
              {d.aggiornato && <> · numeri letti {quando(d.aggiornato)}</>}
            </p>
          )}
        </>
      )}
    </section>
  );
}
