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
  // ⚠️ LA REVISIONE SI ATTIVA DA SOLA (13/11/2026, Federico: «revisioni ok ma con attivazione automatica della revisione»).
  // Tutto quello che va letto (mai rivisto, cambiato dopo la revisione, o rimandato) sale in cima da solo, in una lista
  // unica: Sofia apre la scheda e trova solo quello. Il resto, gia approvato, sta sotto e chiuso.
  type Elemento = { chiave: string; titolo: string; contenuto: string; gruppo: string; figli?: React.ReactNode };
  const elementi: Elemento[] = [
    { chiave: 'metodo', titolo: 'Il metodo: domande, punti, soglie, limiti e regole dei biotipi', contenuto: contenutoMetodo(VERSIONI_METODO), gruppo: 'Il metodo',
      figli: <p className="testo" style={{ fontSize: 15 }}>Il test com’è online: le domande e le regole sono in admin › Domande e admin › Biotipi. Versione del test del {VERSIONI_METODO.test || '—'}, dei biotipi del {VERSIONI_METODO.biotipi || '—'}: se una delle due cambia, la revisione decade.</p> },
    ...biotipi.flatMap((b) => [
      { chiave: `biotipo:${b.id}`, titolo: b.titolo, contenuto: contenutoBiotipo(b), gruppo: `Biotipi · ${NOMI_AREA[b.area as Area] || b.area}` },
      ...(b.consiglio_medico ? [{ chiave: `consiglio:${b.id}`, titolo: `${b.titolo} · consiglio del medico`, contenuto: b.consiglio_medico, gruppo: `Biotipi · ${NOMI_AREA[b.area as Area] || b.area}` }] : []),
    ]),
    ...ARTICOLI.map((a) => ({ chiave: `articolo:${a.slug}`, titolo: a.titolo, contenuto: contenutoArticolo(a), gruppo: 'Articoli della Rivista',
      figli: <p className="piccolo">{a.sommario} · <a className="link" href={`/rivista/${a.slug}`} target="_blank" rel="noopener">leggilo sul sito</a></p> })),
  ];
  const fatto = (e: Elemento) => { const u = ultima[e.chiave]; return !!u && u.contenuto === e.contenuto && u.esito === 'approvato'; };
  const daFare = elementi.filter((e) => !fatto(e));
  const fatti = elementi.filter(fatto);
  const voce = (e: Elemento) => <Voce key={e.chiave} chiave={e.chiave} titolo={`${e.gruppo} · ${e.titolo}`} contenuto={e.contenuto} ultima={ultima[e.chiave]} poi={api.ricarica}>{e.figli}</Voce>;
  void area; void setArea;
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="Quello che va letto sale qui in cima da solo: i testi mai rivisti, quelli cambiati dopo la revisione e quelli rimandati. Un’approvazione vale per il testo che hai letto; sul sito compare con la prossima pubblicazione, e conta come revisione medica solo quella di Sofia.">Le revisioni</Titolo>
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Da rivedere ora{daFare.length ? ` · ${daFare.length}` : ''}</h2>
        {!daFare.length ? <Vuoto>Niente da rileggere: è tutto approvato.</Vuoto> : daFare.map(voce)}
      </section>
      {!!fatti.length && (
        <details>
          <summary className="piccolo" style={{ cursor: 'pointer' }}>Già approvati · {fatti.length}</summary>
          <div className="pila" style={{ ['--gap' as string]: '8px', marginTop: 10 }}>{fatti.map(voce)}</div>
        </details>
      )}
    </div>
  );
}
