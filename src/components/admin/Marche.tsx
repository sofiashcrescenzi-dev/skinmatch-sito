'use client';

import { useMemo, useState } from 'react';
import { useApi, invia, Titolo, Vuoto, quando } from './base';

// LE MARCHE DA CONOSCERE (16/10/2026, Federico: «serve una parte su admin dove segnamo i brand che dobbiamo
// conoscere meglio»). Da studiare, da confrontare, da trovare in un negozio, con il contatto per scrivergli:
// l'email e la pagina ufficiale dove l'abbiamo trovata. Le aggiungono Federico e Sofia qui, Claude e Zeno con
// `scripts/admin/registro.py marca`.
type M = {
  id: number; marca: string; gruppo: string; perche: string | null; origine: string | null; sito: string | null;
  email: string | null; email_fonte: string | null; contatto_nota: string | null; stato: string; note: string | null;
  chi: string | null; creato_il: string; aggiornato_il: string | null;
  zeno_consiglio: string | null; zeno_azione: string | null; zeno_perche: string | null; zeno_fonti: string | null; zeno_il: string | null;
};

// ⚠️ IL PARERE DI ZENO HA UN POSTO SUO (25/10/2026, Federico: «il commento di Zeno mettilo meglio, non in note: voglio
// visualizzarlo bene e mi deve consigliare cosa farebbe»). Il consiglio in un'etichetta, cosa farebbe in evidenza,
// il perché e le fonti sotto. Le note restano di chi decide.
const CONSIGLI: Record<string, { nome: string; fondo: string; testo: string }> = {
  tenere: { nome: 'Tutta la marca', fondo: 'var(--bene-tenue)', testo: 'var(--bene)' },
  alcuni: { nome: 'Solo alcuni prodotti', fondo: 'var(--bene-tenue)', testo: 'var(--bene)' },
  resta: { nome: 'Resta com\'è', fondo: 'var(--velo)', testo: 'var(--testo)' },
  togli: { nome: 'Togliere una linea', fondo: 'var(--attenzione-tenue)', testo: 'var(--attenzione)' },
  dopo: { nome: 'Più avanti', fondo: 'var(--attenzione-tenue)', testo: 'var(--attenzione)' },
  fuori: { nome: 'Lasciare fuori', fondo: 'var(--attenzione-tenue)', testo: 'var(--attenzione)' },
};
function ParereZeno({ m }: { m: M }) {
  if (!m.zeno_consiglio) return null;
  const c = CONSIGLI[m.zeno_consiglio] || CONSIGLI.resta;
  let fonti: string[] = [];
  try { fonti = JSON.parse(m.zeno_fonti || '[]'); } catch { /* niente */ }
  return (
    <section className="pila" style={{ ['--gap' as string]: '8px', background: c.fondo, borderRadius: 12, padding: '12px 14px' }} aria-label={`Il parere di Zeno su ${m.marca}`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span className="adm-etichetta">Il parere di Zeno</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: c.testo, letterSpacing: '.02em' }}>{c.nome}</span>
      </div>
      {m.zeno_azione && <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>{m.zeno_azione}</p>}
      {m.zeno_perche && <p className="piccolo" style={{ color: 'var(--testo)' }}>{m.zeno_perche}</p>}
      {fonti.length > 0 && (
        <span className="piccolo">Fonti: {fonti.map((u, i) => <span key={u}>{i ? ' · ' : ''}<a className="link" href={u} target="_blank" rel="noopener nofollow">{u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a></span>)}</span>
      )}
      {m.zeno_il && <span className="piccolo">Studio del {new Date(m.zeno_il).toLocaleDateString('it-IT')}</span>}
    </section>
  );
}
const STATI: [string, string][] = [['da_studiare', 'Da studiare'], ['da_contattare', 'Da contattare'], ['contattata', 'Contattata'], ['risposto', 'Ha risposto'], ['decisa', 'Decisa']];
const nomeStato = (s: string) => STATI.find(([k]) => k === s)?.[1] || s;

function Carta({ m, poi }: { m: M; poi: () => void }) {
  const [stato, setStato] = useState(m.stato);
  const [note, setNote] = useState(m.note || '');
  const [email, setEmail] = useState(m.email || '');
  const [msg, setMsg] = useState('');
  const sporco = stato !== m.stato || note !== (m.note || '') || email !== (m.email || '');
  const salva = async () => {
    setMsg('Salvo…');
    try { await invia('/api/admin/marche', { id: m.id, campi: { stato, note: note || null, email: email || null } }); setMsg('Salvato.'); poi(); } catch (e) { setMsg((e as Error).message); }
  };
  const togli = async () => {
    if (msg !== 'Tocca di nuovo «Togli» per confermare.') { setMsg('Tocca di nuovo «Togli» per confermare.'); return; }
    try { await invia('/api/admin/marche', { id: m.id, togli: true }); poi(); } catch (e) { setMsg((e as Error).message); }
  };
  const copia = async () => {
    try { await navigator.clipboard.writeText(email); setMsg('Email copiata.'); } catch { setMsg('Copia non riuscita: seleziona l’indirizzo a mano.'); }
  };
  return (
    <article className="carta adm-scatola" style={{ gap: 8 }}>
      <div className="adm-scatola-testa"><b className="titolo-3" style={{ fontSize: 19 }}>{m.marca}</b><span className="piccolo">{nomeStato(m.stato)}</span></div>
      {m.origine && <span className="piccolo">{m.origine}</span>}
      {m.perche && <p style={{ fontSize: 15 }}>{m.perche}</p>}
      <ParereZeno m={m} />
      <div className="pila" style={{ ['--gap' as string]: '4px' }}>
        <span className="adm-etichetta">Contatto</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <input className="adm-input" style={{ flex: '1 1 200px' }} id={`email-${m.id}`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email da contattare" aria-label={`Email di ${m.marca}`} />
          {email && <button type="button" className="chip" onClick={copia}>Copia</button>}
        </div>
        {(m.email_fonte || m.sito) && (
          <span className="piccolo">
            {m.email_fonte && <>Trovata su <a className="link" href={m.email_fonte} target="_blank" rel="noopener">{m.email_fonte.replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}</a></>}
            {m.email_fonte && m.sito ? ' · ' : ''}
            {m.sito && <a className="link" href={m.sito} target="_blank" rel="noopener">Sito</a>}
          </span>
        )}
        {m.contatto_nota && <span className="piccolo">{m.contatto_nota}</span>}
      </div>
      <label className="adm-campo"><span className="adm-etichetta">Stato</span>
        <select className="adm-input" id={`stato-${m.id}`} value={stato} onChange={(e) => setStato(e.target.value)}>{STATI.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
      </label>
      <label className="adm-campo"><span className="adm-etichetta">Note</span>
        <textarea className="adm-input" id={`note-${m.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Le tue note: cosa abbiamo deciso, cosa ci hanno risposto" />
      </label>
      <div className="adm-scatola-azioni">
        <button type="button" className="chip" disabled={!sporco} onClick={salva}>Salva</button>
        <button type="button" className="chip" onClick={togli}>Togli</button>
        {msg && <span className="piccolo" role="status">{msg}</span>}
      </div>
      <span className="piccolo">{m.chi ? `${m.chi.split('@')[0]} · ` : ''}{quando(m.aggiornato_il || m.creato_il)}</span>
    </article>
  );
}

function Nuova({ gruppi, poi }: { gruppi: string[]; poi: () => void }) {
  const [marca, setMarca] = useState('');
  const [gruppo, setGruppo] = useState(gruppi[0] || 'Da studiare');
  const [perche, setPerche] = useState('');
  const [msg, setMsg] = useState('');
  const aggiungi = async () => {
    setMsg('Aggiungo…');
    try {
      await invia('/api/admin/marche', { campi: { marca: marca.trim(), gruppo: gruppo.trim(), perche: perche.trim() || null, origine: `Admin, ${new Date().toLocaleDateString('it-IT')}` } });
      setMarca(''); setPerche(''); setMsg('Aggiunta.'); poi();
    } catch (e) { setMsg((e as Error).message); }
  };
  return (
    <details className="carta">
      <summary style={{ cursor: 'pointer' }}><b>Aggiungi una marca</b></summary>
      <div className="adm-due" style={{ marginTop: 12 }}>
        <label className="adm-campo"><span className="adm-etichetta">Marca</span><input className="adm-input" id="nuova-marca" value={marca} onChange={(e) => setMarca(e.target.value)} /></label>
        <label className="adm-campo"><span className="adm-etichetta">Gruppo</span>
          <input className="adm-input" id="nuova-gruppo" list="gruppi-marche" value={gruppo} onChange={(e) => setGruppo(e.target.value)} />
          <datalist id="gruppi-marche">{gruppi.map((g) => <option key={g} value={g} />)}</datalist>
        </label>
      </div>
      <label className="adm-campo" style={{ marginTop: 10 }}><span className="adm-etichetta">Perché</span><textarea className="adm-input" id="nuova-perche" rows={2} value={perche} onChange={(e) => setPerche(e.target.value)} /></label>
      <div className="adm-scatola-azioni" style={{ marginTop: 10 }}>
        <button type="button" className="chip" disabled={!marca.trim() || !gruppo.trim()} onClick={aggiungi}>Aggiungi</button>
        {msg && <span className="piccolo" role="status">{msg}</span>}
      </div>
    </details>
  );
}

export default function Marche() {
  const api = useApi<{ marche: M[] }>('/api/admin/marche');
  const [filtro, setFiltro] = useState('');
  const tutte = useMemo(() => api.dati?.marche || [], [api.dati]);
  const gruppi = [...new Set(tutte.map((m) => m.gruppo))];
  const [consiglio, setConsiglio] = useState('');
  const viste = tutte.filter((m) => (!filtro || m.stato === filtro) && (!consiglio || m.zeno_consiglio === consiglio));
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="Le marche da conoscere meglio: da studiare, da confrontare, da trovare in un negozio. Per ognuna il perché, l'email da contattare con la pagina ufficiale dove l'abbiamo trovata, e a che punto siamo.">Marche da conoscere</Titolo>
      <div className="riga-chip" role="group" aria-label="Stato">
        <button type="button" className="chip" aria-pressed={!filtro} onClick={() => setFiltro('')}>Tutte · {tutte.length}</button>
        {STATI.map(([k, n]) => { const c = tutte.filter((m) => m.stato === k).length; return c ? <button key={k} type="button" className="chip" aria-pressed={filtro === k} onClick={() => setFiltro(filtro === k ? '' : k)}>{n} · {c}</button> : null; })}
      </div>
      <div className="riga-chip" role="group" aria-label="Il consiglio di Zeno">
        <span className="piccolo" style={{ alignSelf: 'center' }}>Zeno consiglia:</span>
        {Object.entries(CONSIGLI).map(([k, c]) => { const n = tutte.filter((m) => m.zeno_consiglio === k).length; return n ? <button key={k} type="button" className="chip" aria-pressed={consiglio === k} onClick={() => setConsiglio(consiglio === k ? '' : k)}>{c.nome} · {n}</button> : null; })}
      </div>
      <Nuova gruppi={gruppi} poi={api.ricarica} />
      {api.errore && <Vuoto>Non riesco a leggere le marche: {api.errore}</Vuoto>}
      {!api.caricando && !tutte.length && <Vuoto>Ancora nessuna marca.</Vuoto>}
      {gruppi.map((g) => {
        const xs = viste.filter((m) => m.gruppo === g);
        if (!xs.length) return null;
        return (
          <section key={g} className="pila" style={{ ['--gap' as string]: '10px' }}>
            <h2 className="titolo-3">{g} · {xs.length}</h2>
            <div className="adm-scatole">{xs.map((m) => <Carta key={m.id} m={m} poi={api.ricarica} />)}</div>
          </section>
        );
      })}
    </div>
  );
}
