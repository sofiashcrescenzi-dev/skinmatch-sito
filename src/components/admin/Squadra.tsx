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
type R = { id: number; agente: string; tipo: string; titolo: string; sintesi: string; corpo: string; esito: string; creato_il: string; link: string | null; visto_il: string | null };
type P = { id: number; chi: string; cosa: string; stato: string; esito: string; chiesta_il: string; fatta_il: string };
type S = { id: number; agente: string; gravita: string | null; titolo: string; dettaglio: string | null; proposta: string | null; stato: string; nota_po: string | null; chi: string | null; creato_il: string; aggiornato_il: string | null; link: string | null; solo_vista: number | null };

// Le segnalazioni (16/10/2026, come su Agoranomos): la squadra propone, Federico e Sofia scelgono.
// «Sì» la passa a Jarvis (in_lavoro), «Dopo» la parcheggia, «No» la scarta; Jarvis la chiude (fatta).
// ⚠️ 24/11/2026, Federico: «negli avvisi abbiamo due da risolvere che però non si sa dove linkano […] se poi ci sono che
// sono solo presa visione, metti un tasto che riconosce» e «tacito assenso, se non arriva un feedback in 15 giorni
// adotta la strategia consigliata». Ogni avviso ha «Vai a…» (il campo link, o la pagina indovinata dal testo); quelli da
// leggere e basta hanno «Presa visione»; le decisioni dicono fino a quando si aspetta prima di fare la proposta.
const STATO: Record<string, string> = { aperta: 'da decidere', in_lavoro: 'sì, a Jarvis', dopo: 'dopo', fatta: 'fatta', scartata: 'no', vista: 'vista' };
const SCELTE: [string, string][] = [['in_lavoro', 'Sì, fatelo'], ['dopo', 'Dopo'], ['scartata', 'No']];
const GRAVITA = ['grave', 'medio', 'piccolo'];
const GIORNI = (d: string) => (Date.now() - new Date(d.replace(' ', 'T') + (d.includes('Z') ? '' : 'Z')).getTime()) / 864e5;
const TACITO = 15;

// dove sta la cosa: il link scritto da chi ha fatto l'avviso, se no la pagina dell'admin che il testo nomina
const PAGINE: [RegExp, string, string][] = [
  [/nozion/i, '/admin/nozioni', 'Nozioni'], [/biotip|profil/i, '/admin/biotipi', 'Biotipi'], [/rivista|articol|studi citati/i, '/admin/rivista', 'Rivista'],
  [/domand|test\b|testi del test/i, '/admin/domande', 'Domande del test'], [/glossari/i, '/admin/glossario', 'Glossario'],
  [/marc(a|he)\b|marche/i, '/admin/marche', 'Marche'], [/negozi|awin|tradetracker|candid|feed|merchant/i, '/admin/negozi', 'Negozi'],
  [/scheda|schede|catalogo|prodott|siero|inci|foto|integrator/i, '/admin/catalogo', 'Catalogo'], [/google|indirizz|seo|search console|http/i, '/admin', 'Dashboard · Google'],
  [/social|video|instagram|tiktok/i, '/admin/social', 'Social'], [/revision/i, '/admin/revisioni', 'Revisione'],
];
function doveSta(link: string | null, testo: string): { href: string; nome: string } | null {
  if (link) { const p = PAGINE.find(([, h]) => link.split('?')[0] === h); return { href: link, nome: p ? p[2] : link.replace(/^https?:\/\/[^/]+/, '') }; }
  const p = PAGINE.find(([re]) => re.test(testo));
  return p ? { href: p[1], nome: p[2] } : null;
}
function VaiA({ d }: { d: { href: string; nome: string } | null }) {
  if (!d) return null;
  const fuori = /^https?:/.test(d.href) && !d.href.includes('skinmatch.it');
  return <a className="seg-vai" href={d.href} {...(fuori ? { target: '_blank', rel: 'noopener' } : {})}>Vai a: {d.nome} →</a>;
}
const giornoIt = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });

function Segnalazione({ s, poi }: { s: S; poi: () => void }) {
  const [nota, setNota] = useState(s.nota_po || '');
  const [msg, setMsg] = useState('');
  const decidi = async (stato: string) => {
    setMsg('Salvo…');
    try { await invia('/api/admin/squadra', { id: s.id, stato, nota }); setMsg('Salvato.'); poi(); } catch (e) { setMsg((e as Error).message); }
  };
  const grav = (s.gravita || '').toLowerCase();
  const scadenza = new Date(new Date(s.creato_il.replace(' ', 'T') + 'Z').getTime() + TACITO * 864e5);
  return (
    <article className="carta seg">
      <div className="seg-testa">
        {grav && <span className={`seg-grav seg-grav--${GRAVITA.includes(grav) ? grav : 'medio'}`}>{grav}</span>}
        <span className="piccolo">{s.agente} · {quando(s.creato_il)}</span>
        {s.stato !== 'aperta' && <span className={`seg-stato seg-stato--${s.stato}`}>{STATO[s.stato] || s.stato}{s.chi ? ` · ${s.chi.split('@')[0]}` : ''}</span>}
      </div>
      <h3 className="seg-tit">{s.titolo}</h3>
      {s.proposta && <p className="seg-prop"><span className="seg-etichetta">{s.solo_vista ? 'Cosa sapere' : 'Cosa propone'}</span>{s.proposta}</p>}
      <VaiA d={doveSta(s.link, `${s.titolo} ${s.proposta || ''}`)} />
      {s.dettaglio && (
        <details className="seg-perche">
          <summary>Perché</summary>
          <div className="seg-perche-testo"><Markdown testo={s.dettaglio} /></div>
        </details>
      )}
      {s.stato === 'fatta' || s.stato === 'vista' ? (s.nota_po && <p className="piccolo seg-nota-fatta">Nota: {s.nota_po}</p>) : s.solo_vista ? (
        <div className="seg-decidi">
          <div className="seg-bottoni"><button type="button" className="seg-bottone seg-bottone--in_lavoro" onClick={() => decidi('vista')}>Presa visione</button></div>
          {msg && <span className="piccolo" role="status">{msg}</span>}
        </div>
      ) : (
        <div className="seg-decidi">
          <div className="seg-bottoni" role="group" aria-label={`Decisione su «${s.titolo}»`}>
            {SCELTE.map(([k, l]) => (
              <button key={k} type="button" className={`seg-bottone seg-bottone--${k}`} aria-pressed={s.stato === k} onClick={() => decidi(k)}>{l}</button>
            ))}
          </div>
          <textarea className="adm-input seg-nota" rows={1} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota, se serve: si salva con la scelta" aria-label={`Nota su «${s.titolo}»`} />
          {s.stato === 'aperta' && <span className="piccolo">{scadenza.getTime() > Date.now()
            ? `Senza una risposta entro il ${giornoIt(scadenza)}, si fa la proposta (tacito assenso).`
            : `Tacito assenso dal ${giornoIt(scadenza)}: si procede con la proposta.`}</span>}
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
// Agoranomos, vanno segnalate le risoluzioni»). Dal 24/11: in alto quello che aspetta una vostra risposta (le
// segnalazioni aperte), poi i problemi (rapporti con «attenzione» o «problema» non ancora visti, pubblicazioni fallite e
// non superate da una riuscita dopo); quello che avete già deciso sta chiuso più sotto; in fondo le risoluzioni.
export default function Squadra() {
  const api = useApi<{ rapporti: R[]; pubblicazioni: P[]; segnalazioni: S[] }>('/api/admin/squadra');
  const [esito, setEsito] = useState('');
  const seg = api.dati?.segnalazioni || [];
  const daDecidere = ordina(seg.filter((s) => s.stato === 'aperta'));
  const inLavoro = ordina(seg.filter((s) => s.stato === 'in_lavoro'));
  const rapportiStorti = (api.dati?.rapporti || []).filter((r) => r.esito && r.esito !== 'ok' && !r.visto_il && GIORNI(r.creato_il) <= 14);
  const pub = api.dati?.pubblicazioni || [];
  const ultimaRiuscita = Math.max(0, ...pub.filter((p) => p.stato === 'fatta').map((p) => p.id));
  const fallite = pub.filter((p) => /error|fall|ko/i.test(p.stato || '') && p.id > ultimaRiuscita && GIORNI(p.chiesta_il) <= 14);
  const risolte = seg.filter((s) => (s.stato === 'fatta' || s.stato === 'vista') && GIORNI(s.aggiornato_il || s.creato_il) <= 30)
    .sort((a, b) => (b.aggiornato_il || b.creato_il).localeCompare(a.aggiornato_il || a.creato_il));
  const nProblemi = rapportiStorti.length + fallite.length;
  const visto = async (id: number) => {
    setEsito('Salvo…');
    try { await invia('/api/admin/squadra', { rapporto: id }); setEsito(''); api.ricarica(); } catch (e) { setEsito((e as Error).message); }
  };
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="Quello che aspetta una vostra risposta e i problemi aperti, ognuno con il link a dove sta. Se è tutto a posto, qui non c'è niente da fare.">Avvisi</Titolo>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Da decidere{daDecidere.length ? ` · ${daDecidere.length}` : ''}</h2>
        {api.errore && <Vuoto>Non riesco a leggere gli avvisi: {api.errore}</Vuoto>}
        {!api.caricando && !daDecidere.length && <Vuoto>Niente da decidere.</Vuoto>}
        <div className="seg-lista">{daDecidere.map((s) => <Segnalazione key={s.id} s={s} poi={api.ricarica} />)}</div>
      </section>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Problemi{nProblemi ? ` · ${nProblemi}` : ''}</h2>
        {!api.caricando && !nProblemi && <Vuoto>Nessun problema aperto.</Vuoto>}
        {rapportiStorti.map((r) => (
          <div key={`r${r.id}`} className="carta pila" style={{ ['--gap' as string]: '8px' }}>
            <b>{r.titolo}</b>
            <span className="piccolo">{r.agente} · {quando(r.creato_il)} · {r.esito}</span>
            {r.sintesi && <p className="piccolo" style={{ margin: 0 }}>{r.sintesi}</p>}
            <VaiA d={doveSta(r.link, `${r.titolo} ${r.tipo} ${r.sintesi || ''}`)} />
            {r.corpo && <details><summary className="piccolo">Il rapporto intero</summary><div style={{ marginTop: 10 }}><Markdown testo={r.corpo} /></div></details>}
            <div className="seg-bottoni"><button type="button" className="seg-bottone seg-bottone--in_lavoro" onClick={() => visto(r.id)}>Presa visione</button></div>
          </div>
        ))}
        {fallite.map((p) => (
          <div key={`p${p.id}`} className="carta pila" style={{ ['--gap' as string]: '4px' }}>
            <b>Pubblicazione non riuscita: {p.cosa}</b><span className="piccolo">{quando(p.chiesta_il)} · {p.chi} · {p.esito || p.stato}</span>
            <span className="piccolo">Sparisce da qui appena una pubblicazione dopo questa va a buon fine.</span>
          </div>
        ))}
        {esito && <span className="piccolo" role="status">{esito}</span>}
      </section>
      {!!inLavoro.length && (
        <details className="carta">
          <summary><b>Già decise, in lavoro · {inLavoro.length}</b> <span className="piccolo">· le avete approvate: le porta avanti la squadra</span></summary>
          <ul className="seg-in-lavoro">{inLavoro.map((s) => {
            const d = doveSta(s.link, `${s.titolo} ${s.proposta || ''}`);
            return <li key={s.id}><span>{s.titolo}</span><span className="piccolo">{s.agente} · {quando(s.creato_il)}{d ? <> · <a href={d.href}>{d.nome}</a></> : null}</span></li>;
          })}</ul>
        </details>
      )}
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Risolti negli ultimi 30 giorni{risolte.length ? ` · ${risolte.length}` : ''}</h2>
        {!api.caricando && !risolte.length && <Vuoto>Niente di risolto di recente.</Vuoto>}
        {!!risolte.length && (
          <div className="adm-tabella"><table><thead><tr><th>Quando</th><th>Problema</th><th>Come è stato risolto</th></tr></thead>
            <tbody>{risolte.map((s) => <tr key={s.id}><td className="piccolo">{quando(s.aggiornato_il || s.creato_il)}</td><td>{s.titolo}</td><td className="piccolo">{s.nota_po || (s.stato === 'vista' ? 'presa visione' : '—')}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
