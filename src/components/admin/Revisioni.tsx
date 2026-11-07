'use client';

import { useState } from 'react';
import { ARTICOLI, BIOTIPI, NOMI_AREA, VERSIONI_METODO, contenutoArticolo, contenutoBiotipo, contenutoMetodo, type Area, type Biotipo } from '@/lib/dati';
import { useApi, invia, Titolo, Vuoto, quando } from './base';

// IL REGISTRO DELLE REVISIONI (7/11/2026, voto l-revisione: «per profili, regole e articoli: chi ha rivisto, quando,
// cosa»). Sofia legge e approva; ogni approvazione porta il testo letto, e la pubblicazione la mette sul sito solo se il
// testo online è ancora quello (scripts/admin/pubblica.py, esporta_revisioni). «Rivisto da … il …», il consiglio del
// medico e la firma degli articoli compaiono solo così. Conta come revisione medica solo quella di Sofia.
type Riga = { id: number; chiave: string; contenuto: string; esito: 'approvato' | 'da_cambiare'; nota: string | null; chi: string; creato_il: string };

function Voce({ chiave, titolo, contenuto, ultima, poi, children }: { chiave: string; titolo: string; contenuto: string; ultima?: Riga; poi: () => void; children?: React.ReactNode }) {
  const [nota, setNota] = useState('');
  const [err, setErr] = useState('');
  const cambiato = !!ultima && ultima.contenuto !== contenuto;
  const stato = !ultima ? 'Da rivedere'
    : cambiato ? `Il testo è cambiato dopo la revisione del ${quando(ultima.creato_il)}: va riletto`
      : ultima.esito === 'approvato' ? `Approvato da ${ultima.chi.split('@')[0]} il ${quando(ultima.creato_il)}`
        : `Da cambiare (${ultima.chi.split('@')[0]}, ${quando(ultima.creato_il)})${ultima.nota ? `: ${ultima.nota}` : ''}`;
  const ok = !!ultima && !cambiato && ultima.esito === 'approvato';
  const decidi = async (esito: Riga['esito']) => {
    setErr('');
    try { await invia('/api/admin/revisioni', { chiave, contenuto, esito, nota }); setNota(''); poi(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <details className="carta">
      <summary style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <b>{titolo}</b>
        <span className="chip tenue" style={{ color: ok ? 'var(--bene)' : cambiato || ultima?.esito === 'da_cambiare' ? 'var(--attenzione)' : undefined }}>{stato}</span>
      </summary>
      <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
        {children || <p className="testo" style={{ whiteSpace: 'pre-line', fontSize: 15 }}>{contenuto}</p>}
        <input className="adm-input" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Una nota (obbligatoria se va cambiato)" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="bottone" onClick={() => decidi('approvato')}>L’ho letto: approvo</button>
          <button type="button" className="bottone secondario" disabled={!nota.trim()} onClick={() => decidi('da_cambiare')}>Va cambiato</button>
        </div>
        {err && <p className="piccolo" style={{ color: 'var(--attenzione)' }}>{err}</p>}
      </div>
    </details>
  );
}

export default function Revisioni() {
  const api = useApi<{ revisioni: Riga[] }>('/api/admin/revisioni');
  // i biotipi da rivedere sono quelli dell'ultima versione salvata (anche non ancora online): il consiglio del medico
  // si approva prima di pubblicarlo
  const bozza = useApi<{ ultimo: { dati: { biotipi: Biotipo[] } } | null }>('/api/admin/documento?tipo=biotipi');
  const [area, setArea] = useState<Area>('pelle');
  if (api.errore) return <Vuoto>Non riesco a leggere il registro: {api.errore}</Vuoto>;
  if (!api.dati || !bozza.dati) return <Vuoto>Carico…</Vuoto>;
  const ultima: Record<string, Riga> = {};
  for (const r of [...api.dati.revisioni].reverse()) ultima[r.chiave] = r;
  const biotipi = bozza.dati.ultimo?.dati.biotipi || BIOTIPI;
  const valide = Object.values(ultima).filter((r) => r.esito === 'approvato').length;
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="Sofia legge e approva. Un’approvazione vale per il testo che hai letto: se il testo cambia, decade e torna qui. Sul sito compare con la prossima pubblicazione (il bottone «Pubblica» di qualsiasi scheda), e conta come revisione medica solo quella di Sofia.">Le revisioni</Titolo>
      <p className="piccolo">{valide} approvazioni nel registro. Prima del lancio servono almeno il metodo e i profili delicati.</p>

      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Il metodo</h2>
        <Voce chiave="metodo" titolo="Domande, punti, soglie, limiti e regole dei biotipi" contenuto={contenutoMetodo(VERSIONI_METODO)} ultima={ultima.metodo} poi={api.ricarica}>
          <p className="testo" style={{ fontSize: 15 }}>Il test com’è online: le domande e le regole sono in admin › Domande e admin › Biotipi. Versione del test del {VERSIONI_METODO.test || '—'}, dei biotipi del {VERSIONI_METODO.biotipi || '—'}: se una delle due cambia, la revisione decade.</p>
        </Voce>
      </section>

      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">I biotipi e il consiglio del medico</h2>
        <div className="riga-chip">{(['pelle', 'cute', 'integrazione'] as Area[]).map((a) => <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => setArea(a)}>{NOMI_AREA[a]}</button>)}</div>
        {biotipi.filter((b) => b.area === area).map((b) => (
          <div key={b.id} className="pila" style={{ ['--gap' as string]: '6px' }}>
            <Voce chiave={`biotipo:${b.id}`} titolo={b.titolo} contenuto={contenutoBiotipo(b)} ultima={ultima[`biotipo:${b.id}`]} poi={api.ricarica} />
            {b.consiglio_medico && <Voce chiave={`consiglio:${b.id}`} titolo={`${b.titolo} · consiglio del medico`} contenuto={b.consiglio_medico} ultima={ultima[`consiglio:${b.id}`]} poi={api.ricarica} />}
          </div>
        ))}
      </section>

      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Gli articoli online</h2>
        {!ARTICOLI.length && <Vuoto>Nessun articolo online.</Vuoto>}
        {ARTICOLI.map((a) => (
          <Voce key={a.slug} chiave={`articolo:${a.slug}`} titolo={a.titolo} contenuto={contenutoArticolo(a)} ultima={ultima[`articolo:${a.slug}`]} poi={api.ricarica}>
            <p className="piccolo">{a.sommario} · <a className="link" href={`/rivista/${a.slug}`} target="_blank" rel="noopener">leggilo sul sito</a></p>
          </Voce>
        ))}
      </section>
    </div>
  );
}
