'use client';

import { useMemo, useState } from 'react';
import { TEST, BIOTIPI } from '@/lib/dati';
import { PRODOTTI, euro } from '@/lib/catalogo';
import { useApi, Titolo, Vuoto } from './base';

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
export default function Traffico({ vista }: { vista: 'traffico' | 'test' }) {
  const [giorni, setGiorni] = useState(30);
  const api = useApi<Dati>(`/api/admin/traffico?giorni=${giorni}`);
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
        <Titolo sotto="Quanti test partono e quanti arrivano al risultato, per percorso, quanto durano e quali biotipi escono. Se il tempo medio si allontana dal «circa» del sito, si corregge in Domande › Percorsi › Minuti. Le risposte non lasciano il telefono di chi fa il test: qui ci sono solo i conteggi.">Test fatti</Titolo>
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
      </div>
    );
  }
  const reti: Record<string, { n: number; importo: number; commissione: number }> = {};
  vendite.forEach((v) => { const x = (reti[v.rete] ||= { n: 0, importo: 0, commissione: 0 }); x.n++; x.importo += v.importo || 0; x.commissione += v.commissione || 0; });
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="I clic dal sito verso i negozi (contati dal sito, senza dati personali) e le vendite che le reti di affiliazione ci attribuiscono (scaricate ogni mattina).">Traffico</Titolo>
      {scelta}
      {api.errore && <Vuoto>Non riesco a leggere i numeri: {api.errore}</Vuoto>}
      <div className="adm-numeri">
        <div><span className="piccolo">Clic verso i negozi</span><b>{somma(r, 'clic')}</b></div>
        <div><span className="piccolo">Test finiti</span><b>{somma(r, 'test_fine')}</b></div>
        <div><span className="piccolo">Vendite</span><b>{vendite.length}</b></div>
        <div><span className="piccolo">Commissioni</span><b>{euro(vendite.reduce((s, v) => s + (v.commissione || 0), 0))}</b></div>
      </div>
      <div className="carta pila"><h2 className="titolo-3">Clic per giorno</h2><Colonne righe={r} tipo="clic" giorni={giorni} da={api.dati?.da || new Date().toISOString().slice(0, 10)} /></div>
      <div className="adm-due">
        <Tabella titolo="Negozi" righe={perChiave(r, 'clic_negozio')} />
        <Tabella titolo="Pagine da cui si clicca" righe={perChiave(r, 'clic_da')} />
      </div>
      <Tabella titolo="Prodotti più cliccati" righe={perChiave(r, 'clic')} nome={nomeProdotto} />
      <div className="pila" style={{ ['--gap' as string]: '8px' }}>
        <h2 className="titolo-3">Vendite</h2>
        {!vendite.length ? <Vuoto>Nessuna vendita nel periodo. Le reti collegate: Adtraction (canale «SKINMATCH - Content IT»); CJ e Awin si aggiungono quando i programmi approvano Skinmatch.</Vuoto> : (
          <>
            <div className="adm-numeri">{Object.entries(reti).map(([k, x]) => <div key={k}><span className="piccolo">{k}</span><b>{euro(x.commissione)}</b><span className="piccolo">{x.n} vendite · {euro(x.importo)}</span></div>)}</div>
            <div className="adm-tabella"><table><thead><tr><th>Data</th><th>Rete</th><th>Negozio</th><th className="num">Ordine</th><th className="num">Commissione</th><th>Stato</th><th>Da dove</th></tr></thead>
              <tbody>{vendite.map((v) => <tr key={v.id}><td>{v.data}</td><td>{v.rete}</td><td>{v.negozio}</td><td className="num">{euro(v.importo || 0)}</td><td className="num">{euro(v.commissione || 0)}</td><td>{v.stato}</td><td className="piccolo">{v.subid || '—'}</td></tr>)}</tbody></table></div>
          </>
        )}
      </div>
    </div>
  );
}
