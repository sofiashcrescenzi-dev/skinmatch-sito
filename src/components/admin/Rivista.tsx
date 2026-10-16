'use client';

import { useState } from 'react';
import { PRODOTTI } from '@/lib/catalogo';
import { TERMINI } from '@/lib/dati';
import Markdown from '@/components/Markdown';
import { useApi, invia, Titolo, Vuoto, quando } from './base';

// LA RIVISTA (15/10/2026): gli articoli di Zeno, da approvare. Il PO: «qui Zeno si deve
// sbizzarrire: un lavoro ogni due giorni, e scoprire delle novità almeno una volta a
// settimana». Approvato = esce con la prossima pubblicazione (Jarvis la lancia alle 8:40 e alle
// 14:40, oppure il bottone «Pubblica» di qualsiasi scheda).
type A = { id: number; slug: string; titolo: string; sommario: string; tipo: string; testo: string; immagine: string; prodotti: string; biotipi: string; approfondisce: string | null; parole: number; stato: string; feedback: string; autore: string; creato_il: string; pubblicato_il: string };
const SCHEDE: [string, string][] = [['in_approvazione', 'Da approvare'], ['da_correggere', 'Da correggere'], ['approvato', 'Approvati, in uscita'], ['online', 'Online'], ['scartato', 'Scartati']];
const leggiJ = (s: string) => { try { return JSON.parse(s || 'null'); } catch { return null; } };

function Articolo({ a, poi }: { a: A; poi: () => void }) {
  const [apri, setApri] = useState(false);
  const [nota, setNota] = useState(a.feedback || '');
  const [err, setErr] = useState('');
  const prodotti = (leggiJ(a.prodotti) || []) as string[];
  const im = leggiJ(a.immagine) as { file?: string } | null;
  const appr = ((leggiJ(a.approfondisce || '') || []) as string[])[0] || '';
  // il termine del glossario che l'articolo spiega: lo mette sotto il termine e nelle pagine dei prodotti con quell'attivo
  const collega = async (t: string) => { setErr(''); try { await invia('/api/admin/articoli', { id: a.id, feedback: nota, campi: { approfondisce: JSON.stringify(t ? [t] : []) } }); poi(); } catch (e) { setErr((e as Error).message); } };
  const decidi = async (stato: string) => { setErr(''); try { await invia('/api/admin/articoli', { id: a.id, stato, feedback: nota }); poi(); } catch (e) { setErr((e as Error).message); } };
  return (
    <article className="carta pila" style={{ ['--gap' as string]: '10px' }}>
      <span className="piccolo">{a.tipo} · {a.parole || '?'} parole · {prodotti.length} prodotti · {a.autore} · {quando(a.creato_il)}{a.pubblicato_il ? ` · online dal ${quando(a.pubblicato_il)}` : ''}</span>
      {im?.file && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/immagini/${im.file}-800.webp`} alt="" style={{ width: '100%', maxWidth: 360, aspectRatio: '3 / 2', objectFit: 'cover', borderRadius: 10, background: 'var(--velo)' }} />
      )}
      <h2 className="titolo-3">{a.titolo}</h2>
      <p className="piccolo" style={{ fontSize: 15 }}>{a.sommario}</p>
      {a.stato === 'online' && <a className="link" href={`/rivista/${a.slug}`} target="_blank" rel="noopener">skinmatch.it/rivista/{a.slug}</a>}
      <label className="adm-campo" style={{ maxWidth: 420 }}><span className="adm-etichetta">Approfondisce (glossario)</span>
        <select className="adm-input" value={appr} onChange={(e) => collega(e.target.value)}>
          <option value="">Nessun termine: solo nella Rivista e sotto i prodotti citati</option>
          {TERMINI.slice().sort((x, y) => x.nome.localeCompare(y.nome, 'it')).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <span className="piccolo">Compare sotto il termine nel glossario e nelle pagine dei prodotti con quell&apos;attivo.</span>
      </label>
      <button type="button" className="chip" style={{ justifySelf: 'start' }} onClick={() => setApri(!apri)}>{apri ? 'Chiudi' : 'Leggi tutto'}</button>
      {apri && (
        <div className="pila" style={{ ['--gap' as string]: '12px', borderTop: '1px solid var(--riga)', paddingTop: 12 }}>
          <Markdown testo={a.testo} />
          {prodotti.length > 0 && <div className="piccolo"><b>Prodotti collegati:</b> {prodotti.map((id) => { const p = PRODOTTI.find((x) => x.id === id); return p ? `${p.brand} ${p.name}` : `${id} (non più in catalogo)`; }).join(' · ')}</div>}
        </div>
      )}
      {a.stato !== 'online' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <button type="button" className="chip" aria-pressed={a.stato === 'approvato'} onClick={() => decidi('approvato')}>Approva</button>
          <button type="button" className="chip" aria-pressed={a.stato === 'da_correggere'} onClick={() => decidi('da_correggere')}>Da correggere</button>
          <button type="button" className="chip" aria-pressed={a.stato === 'scartato'} onClick={() => decidi('scartato')}>Scarta</button>
          <input className="adm-input" style={{ flex: '1 1 220px' }} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Cosa correggere, o una nota per Zeno" />
        </div>
      )}
      {err && <span className="piccolo" style={{ color: 'var(--attenzione)' }}>{err}</span>}
    </article>
  );
}

export default function Rivista() {
  const api = useApi<{ articoli: A[] }>('/api/admin/articoli');
  const [s, setS] = useState('in_approvazione');
  const tutti = api.dati?.articoli || [];
  const qui = tutti.filter((a) => a.stato === s);
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="Zeno scrive un articolo ogni due giorni e, una volta a settimana, le novità (lanci, ingredienti, studi, regole). Ogni articolo porta al test o a prodotti del catalogo. Approvi qui; esce con la prossima pubblicazione.">La Rivista</Titolo>
      <div className="riga-chip" role="tablist">{SCHEDE.map(([k, n]) => <button key={k} type="button" role="tab" className="chip" aria-pressed={s === k} onClick={() => setS(k)}>{n} · {tutti.filter((a) => a.stato === k).length}</button>)}</div>
      {api.errore && <Vuoto>Non riesco a leggere gli articoli: {api.errore}</Vuoto>}
      {!api.caricando && !qui.length && !api.errore && <Vuoto>{s === 'in_approvazione' ? 'Niente da approvare adesso.' : 'Niente qui.'}</Vuoto>}
      {qui.map((a) => <Articolo key={a.id} a={a} poi={api.ricarica} />)}
    </div>
  );
}
