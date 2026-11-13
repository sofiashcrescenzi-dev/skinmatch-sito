'use client';

import { useMemo, useState } from 'react';
import { TEST, BIOTIPI } from '@/lib/dati';
import { PRODOTTI, euro } from '@/lib/catalogo';
import { useApi, Titolo, Vuoto, quando } from './base';

// TRAFFICO E TEST FATTI (15/10/2026). I numeri vengono dai conteggi del sito (worker/index.js,
// tabella eventi_giorno: niente dati personali) e dalle vendite che il Mac scarica ogni mattina
// dalle reti di affiliazione (scripts/admin/vendite.py).
type Riga = { giorno: string; tipo: string; chiave: string; n: number };
type Vendita = { id: string; rete: string; negozio: string; data: string; importo: number; commissione: number; stato: string; subid: string };
type Dati = { da: string; giorni: number; righe: Riga[]; vendite: Vendita[] };

const somma = (r: Riga[], tipo: string) => r.filter((x) => x.tipo === tipo).reduce((s, x) => s + x.n, 0);
const perChiave = (r: Riga[], tipo: string) => {
  const o: Record<string, number> = {};
  r.filter((x) => x.tipo === tipo).forEach((x) => (o[x.chiave] = (o[x.chiave] || 0) + x.n));
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
};

function Colonne({ righe, tipo, giorni, da }: { righe: Riga[]; tipo: string; giorni: number; da: string }) {
  const g = Array.from({ length: giorni }, (_, i) => new Date(new Date(da).getTime() + i * 864e5).toISOString().slice(0, 10));
  const v = g.map((d) => righe.filter((x) => x.tipo === tipo && x.giorno === d).reduce((s, x) => s + x.n, 0));
  const mx = Math.max(1, ...v);
  return (
    <div className="pila" style={{ ['--gap' as string]: '4px' }}>
      <div className="adm-colonne" role="img" aria-label={`${tipo} per giorno`}>{v.map((n, i) => <i key={i} title={`${g[i]}: ${n}`} style={{ height: `${(n / mx) * 100}%` }} />)}</div>
      <div className="piccolo" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', justifyContent: 'space-between' }}><span>{g[0]}</span><span>massimo {mx} al giorno</span><span>{g[g.length - 1]}</span></div>
    </div>
  );
}

function Tabella({ titolo, righe, nome, colonna = 'Clic' }: { titolo: string; righe: [string, number][]; nome?: (k: string) => string; colonna?: string }) {
  return (
    <div className="pila" style={{ ['--gap' as string]: '8px' }}>
      <h2 className="titolo-3">{titolo}</h2>
      {!righe.length ? <Vuoto>Ancora niente.</Vuoto> : (
        <div className="adm-tabella"><table><thead><tr><th>{titolo.split(' ')[0]}</th><th className="num">{colonna}</th></tr></thead>
          <tbody>{righe.slice(0, 15).map(([k, n]) => <tr key={k}><td>{nome ? nome(k) : k}</td><td className="num">{n}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

const GIORNI = [7, 30, 90];
// le famiglie delle fonti (src/components/Arrivi.tsx, worker FONTI)
const IA = new Set(['chatgpt', 'perplexity', 'gemini', 'claude', 'copilot', 'altra_ia']);
const MOTORI = new Set(['google', 'bing', 'altro_motore']);
const SOCIAL = new Set(['instagram', 'tiktok', 'facebook', 'youtube', 'threads', 'pinterest', 'link_in_bio']);
const NOMI_FONTE: Record<string, string> = { chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', claude: 'Claude', copilot: 'Copilot', altra_ia: 'Altre IA', google: 'Google', bing: 'Bing', altro_motore: 'Altri motori', instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube', threads: 'Threads', pinterest: 'Pinterest', link_in_bio: 'Link in bio', altro_sito: 'Altri siti', diretto: 'Diretto o app' };
// il documento «cruscotto» (D1, documenti): lo scrive ogni mattina lo script di Skinmatch quando Search Console e PostHog
// sono collegati con account di Skinmatch. Finché non c'è, la Dashboard dice cosa manca.
type Cruscotto = { aggiornato?: string; search_console?: { clic: number; impressioni: number; posizione: number; indicizzate?: number; ricerche?: [string, number][]; pagine?: [string, number][] }; posthog?: { visitatori: number; pagine_viste: number; tempo_medio?: string } };
export default function Traffico({ vista }: { vista: 'traffico' | 'test' }) {
  const [giorni, setGiorni] = useState(30);
  const api = useApi<Dati>(`/api/admin/traffico?giorni=${giorni}`);
  const cruscotto = useApi<{ ultimo: { dati: Cruscotto } | null }>(vista === 'traffico' ? '/api/admin/documento?tipo=cruscotto' : null);
  const r = api.dati?.righe || [];
  const vendite = api.dati?.vendite || [];
  const nomeProdotto = useMemo(() => (id: string) => { const p = PRODOTTI.find((x) => x.id === id); return p ? `${p.brand} · ${p.name}` : id; }, []);
  const scelta = (
    <div className="riga-chip">{GIORNI.map((g) => <button key={g} type="button" className="chip" aria-pressed={giorni === g} onClick={() => setGiorni(g)}>Ultimi {g} giorni</button>)}</div>
  );
  if (vista === 'test') {
    const iniziati = perChiave(r, 'test_inizio'), finiti = Object.fromEntries(perChiave(r, 'test_fine'));
    // il tempo medio misurato (la mediana, a mezzi minuti): il «circa N minuti» della scelta si corregge in admin › Domande
    const tempo = (id: string) => {
      const v = r.filter((x) => x.tipo === 'durata' && x.chiave.startsWith(id + ':')).flatMap((x) => Array(x.n).fill(+x.chiave.split(':')[1]) as number[]).sort((u, w) => u - w);
      return v.length ? `${(v[Math.floor(v.length / 2)] / 60).toLocaleString('it-IT', { maximumFractionDigits: 1 })} min (${v.length})` : '—';
    };
    return (
      <div className="pila" style={{ ['--gap' as string]: '24px' }}>
        <Titolo sotto="Quanti test partono e quanti arrivano al risultato, per percorso, quanto durano e quali biotipi escono, e gli errori che qualcuno ha visto sulle pagine. Se il tempo medio si allontana dal «circa» del sito, si corregge in Domande › Percorsi › Minuti. Le risposte non lasciano il telefono di chi fa il test: qui ci sono solo i conteggi.">Test fatti</Titolo>
        {scelta}
        {api.errore && <Vuoto>Non riesco a leggere i numeri: {api.errore}</Vuoto>}
        <div className="adm-numeri">
          <div><span className="piccolo">Test iniziati</span><b>{somma(r, 'test_inizio')}</b></div>
          <div><span className="piccolo">Arrivati al risultato</span><b>{somma(r, 'test_fine')}</b></div>
          <div><span className="piccolo">Completati</span><b>{somma(r, 'test_inizio') ? Math.round((somma(r, 'test_fine') / somma(r, 'test_inizio')) * 100) : 0}%</b></div>
        </div>
        <div className="carta pila"><h2 className="titolo-3">Risultati per giorno</h2><Colonne righe={r} tipo="test_fine" giorni={giorni} da={api.dati?.da || new Date().toISOString().slice(0, 10)} /></div>
        <div className="adm-tabella"><table><thead><tr><th>Percorso</th><th className="num">Iniziati</th><th className="num">Finiti</th><th className="num">Completati</th><th className="num">Tempo medio</th><th className="num">Sul sito</th></tr></thead>
          <tbody>{TEST.percorsi.map((p) => { const i = iniziati.find(([k]) => k === p.id)?.[1] || 0, f = finiti[p.id] || 0; return <tr key={p.id}><td>{p.nome}</td><td className="num">{i}</td><td className="num">{f}</td><td className="num">{i ? Math.round((f / i) * 100) : 0}%</td><td className="num">{tempo(p.id)}</td><td className="num">circa {p.minuti} min</td></tr>; })}</tbody></table></div>
        <Tabella titolo="Biotipi usciti" righe={perChiave(r, 'biotipo')} nome={(k) => BIOTIPI.find((b) => b.id === k)?.titolo || k} colonna="Volte" />
        {/* gli errori delle pagine, dal 30/10/2026 (src/lib/guasti.ts): pagina · messaggio, senza dati di chi li ha visti */}
        <Tabella titolo="Guasti nelle pagine" righe={perChiave(r, 'guasto')} colonna="Volte" />
      </div>
    );
  }
  const reti: Record<string, { n: number; importo: number; commissione: number }> = {};
  vendite.forEach((v) => { const x = (reti[v.rete] ||= { n: 0, importo: 0, commissione: 0 }); x.n++; x.importo += v.importo || 0; x.commissione += v.commissione || 0; });
  const stati: Record<string, { n: number; c: number }> = {};
  vendite.forEach((v) => { const k = /approv|confirm|accett|paid|pagat/i.test(v.stato) ? 'confermate' : /rifiut|declin|reject|annull|cancel/i.test(v.stato) ? 'rifiutate' : 'in attesa'; const x = (stati[k] ||= { n: 0, c: 0 }); x.n++; x.c += v.commissione || 0; });
  const arrivi = somma(r, 'arrivo'), clic = somma(r, 'clic');
  const fonti = perChiave(r, 'arrivo');
  const daIa = fonti.filter(([k]) => IA.has(k)).reduce((t, [, n]) => t + n, 0);
  const daMotori = fonti.filter(([k]) => MOTORI.has(k)).reduce((t, [, n]) => t + n, 0);
  const daSocial = fonti.filter(([k]) => SOCIAL.has(k)).reduce((t, [, n]) => t + n, 0);
  const commissioni = vendite.reduce((t, v) => t + (v.commissione || 0), 0);
  const pagineIa = perChiave(r.filter((x) => x.tipo === 'arrivo_pagina' && IA.has(x.chiave.split(':')[0])).map((x) => ({ ...x, chiave: `${NOMI_FONTE[x.chiave.split(':')[0]]} → ${x.chiave.split(':')[1]}` })), 'arrivo_pagina');
  const pc = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '—');
  const sc = cruscotto.dati?.ultimo?.dati?.search_console, ph = cruscotto.dati?.ultimo?.dati?.posthog, agg = cruscotto.dati?.ultimo?.dati?.aggiornato;
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="Chi arriva e da dove (anche dalle IA), cosa clicca verso i negozi e quanto rendono le vendite. I conteggi li fa il sito, senza dati personali; le vendite arrivano ogni mattina dalle reti di affiliazione; Google e PostHog si aggiungono quando sono collegati.">Dashboard</Titolo>
      {scelta}
      {api.errore && <Vuoto>Non riesco a leggere i numeri: {api.errore}</Vuoto>}
      <div className="adm-numeri">
        <div><span className="piccolo">Visite</span><b>{arrivi}</b><span className="piccolo">contate dal 13/11</span></div>
        <div><span className="piccolo">Dalle IA</span><b>{daIa}</b><span className="piccolo">{pc(daIa, arrivi)} delle visite</span></div>
        <div><span className="piccolo">Dai motori</span><b>{daMotori}</b><span className="piccolo">{pc(daMotori, arrivi)}</span></div>
        <div><span className="piccolo">Dai social</span><b>{daSocial}</b><span className="piccolo">{pc(daSocial, arrivi)}</span></div>
        <div><span className="piccolo">Test finiti</span><b>{somma(r, 'test_fine')}</b><span className="piccolo">{pc(somma(r, 'test_fine'), arrivi)} delle visite</span></div>
        <div><span className="piccolo">Clic verso i negozi</span><b>{clic}</b><span className="piccolo">{pc(clic, arrivi)} delle visite</span></div>
        <div><span className="piccolo">Vendite</span><b>{vendite.length}</b><span className="piccolo">{pc(vendite.length, clic)} dei clic</span></div>
        <div><span className="piccolo">Commissioni</span><b>{euro(commissioni)}</b><span className="piccolo">{clic ? `${euro(commissioni / clic)} per clic` : '—'}</span></div>
      </div>

      <div className="adm-due">
        <div className="carta pila"><h2 className="titolo-3">Visite per giorno</h2><Colonne righe={r} tipo="arrivo" giorni={giorni} da={api.dati?.da || new Date().toISOString().slice(0, 10)} /></div>
        <div className="carta pila"><h2 className="titolo-3">Clic per giorno</h2><Colonne righe={r} tipo="clic" giorni={giorni} da={api.dati?.da || new Date().toISOString().slice(0, 10)} /></div>
      </div>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-2">Da dove arrivano</h2>
        <div className="adm-due">
          <Tabella titolo="Fonti" righe={fonti} nome={(k) => `${NOMI_FONTE[k] || k}${IA.has(k) ? ' · IA' : ''}`} colonna="Visite" />
          <Tabella titolo="Pagine d’arrivo dalle IA" righe={pagineIa} colonna="Visite" />
        </div>
      </section>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-2">Google e IA</h2>
        {sc ? (
          <>
            <div className="adm-numeri">
              <div><span className="piccolo">Clic da Google</span><b>{sc.clic}</b></div>
              <div><span className="piccolo">Impressioni</span><b>{sc.impressioni}</b></div>
              <div><span className="piccolo">Posizione media</span><b>{(sc.posizione || 0).toLocaleString('it-IT', { maximumFractionDigits: 1 })}</b></div>
              <div><span className="piccolo">Pagine indicizzate</span><b>{sc.indicizzate ?? '—'}</b></div>
            </div>
            <div className="adm-due">
              <Tabella titolo="Ricerche" righe={(sc.ricerche || []).map((x: [string, number]) => [x[0], x[1]])} colonna="Clic" />
              <Tabella titolo="Pagine" righe={(sc.pagine || []).map((x: [string, number]) => [x[0], x[1]])} colonna="Clic" />
            </div>
            <p className="piccolo">Aggiornato {quando(agg)}.</p>
          </>
        ) : <Vuoto>Search Console non è ancora collegata a Skinmatch: va verificato skinmatch.it su Search Console con un account di Skinmatch e dato l’accesso in lettura, poi i numeri (clic, impressioni, ricerche, pagine indicizzate) arrivano qui ogni mattina. Le visite dalle IA invece si contano già, qui sopra.</Vuoto>}
        {ph ? (
          <div className="adm-numeri">
            <div><span className="piccolo">Visitatori (PostHog)</span><b>{ph.visitatori}</b></div>
            <div><span className="piccolo">Pagine viste</span><b>{ph.pagine_viste}</b></div>
            <div><span className="piccolo">Tempo medio</span><b>{ph.tempo_medio || '—'}</b></div>
          </div>
        ) : <Vuoto>PostHog non è ancora attivo: quando c’è la chiave del progetto (e il banner dei cookie la consente) qui compaiono visitatori, percorsi e abbandoni del test. Il posto è già pronto.</Vuoto>}
      </section>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-2">Negozi e prodotti</h2>
        <div className="adm-due">
          <Tabella titolo="Negozi" righe={perChiave(r, 'clic_negozio')} />
          <Tabella titolo="Pagine da cui si clicca" righe={perChiave(r, 'clic_da')} />
        </div>
        <Tabella titolo="Prodotti più cliccati" righe={perChiave(r, 'clic')} nome={nomeProdotto} />
      </section>

      <section className="pila" style={{ ['--gap' as string]: '12px' }}>
        <h2 className="titolo-2">Vendite e commissioni</h2>
        {!vendite.length ? <Vuoto>Nessuna vendita nel periodo. Le reti collegate: Adtraction (canale «SKINMATCH - Content IT»); CJ e Awin si aggiungono quando i programmi approvano Skinmatch.</Vuoto> : (
          <>
            <div className="adm-numeri">{['confermate', 'in attesa', 'rifiutate'].filter((k) => stati[k]).map((k) => <div key={k}><span className="piccolo">Commissioni {k}</span><b>{euro(stati[k].c)}</b><span className="piccolo">{stati[k].n} vendite</span></div>)}</div>
            <div className="adm-numeri">{Object.entries(reti).map(([k, x]) => <div key={k}><span className="piccolo">{k}</span><b>{euro(x.commissione)}</b><span className="piccolo">{x.n} vendite · {euro(x.importo)}</span></div>)}</div>
            <div className="adm-tabella"><table><thead><tr><th>Data</th><th>Rete</th><th>Negozio</th><th className="num">Ordine</th><th className="num">Commissione</th><th>Stato</th><th>Da dove</th></tr></thead>
              <tbody>{vendite.map((v) => <tr key={v.id}><td>{v.data}</td><td>{v.rete}</td><td>{v.negozio}</td><td className="num">{euro(v.importo || 0)}</td><td className="num">{euro(v.commissione || 0)}</td><td>{v.stato}</td><td className="piccolo">{v.subid || '—'}</td></tr>)}</tbody></table></div>
          </>
        )}
      </section>
    </div>
  );
}
