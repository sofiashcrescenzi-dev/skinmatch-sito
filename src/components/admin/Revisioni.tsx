'use client';

import { useState } from 'react';
import { BIOTIPI, NOMI_AREA, VERSIONI_METODO, contenutoBiotipo, contenutoMetodo, type Area, type Biotipo } from '@/lib/dati';
import { invia, quando, useApi, Titolo, Vuoto } from './base';
import { Voce, type Riga } from './VoceRevisione';

// LE REVISIONI DI SOFIA (7/11/2026, voto l-revisione: «per profili, regole e articoli: chi ha rivisto, quando, cosa»).
// Ogni approvazione porta il testo letto, e la pubblicazione la mette sul sito solo se il testo online è ancora quello
// (scripts/admin/pubblica.py, esporta_revisioni). Conta come revisione medica solo quella di Sofia.
// ⚠️ RIORDINATA IL 24/11/2026 (Federico: «in revisioni c'è un po' un miscuglio di cose, bisogna un attimo rendere il tutto
// più capibile. togliamo quello rivisto. Poi gli articoli sono già in approvazione da altre parti, invece i biotipi
// analizzane bene il testo, ma sofia su alcuni ha espresso un feedback senza nessuna risposta»). Qui restano solo il metodo
// e i biotipi, cioè la revisione medica:
// - in cima le note di Sofia con la nostra risposta e le modifiche proposte (riscritture con documento «biotipi»):
//   «Approvo le modifiche» le mette nella versione dei biotipi e approva il testo nuovo in un passo solo;
// - poi quello che va letto, diviso per area; sotto, chiuso, quello già approvato.
// Tolti: il giro del 21/11 (casi, punti di Zeno, domande: tutto già rivisto da Federico) e gli articoli, che si
// controllano nella loro scheda in admin › Rivista (anche la revisione di Sofia per la firma, dal 24/11).
type Riscrittura = { id: number; documento: string; percorso: string; prima: string | null; dopo: string; motivo: string | null; stato: string };
type Documento = { id: number; dati: { biotipi: Biotipo[] } };
const CAMPI: Record<string, string> = { descrizione: 'La descrizione', caratteristiche: 'Le caratteristiche', cerca: 'Cosa cercare', evita: 'Cosa evitare', consiglio_medico: 'Il consiglio del medico', motto: 'Il motto' };
const AREE: Area[] = ['pelle', 'cute', 'integrazione'];

function Risposte({ b, righe, nota, doc, poi }: { b: Biotipo; righe: Riscrittura[]; nota?: Riga; doc: Documento; poi: () => void }) {
  const [testo, setTesto] = useState('');
  const [err, setErr] = useState('');
  const [lavoro, setLavoro] = useState(false);
  const valore = (campo: string) => { const v = (b as unknown as Record<string, unknown>)[campo]; return Array.isArray(v) ? v.join('\n') : String(v ?? ''); };
  const cambiati = righe.filter((r) => r.prima != null && valore(r.percorso.split('/')[2]) !== r.prima);
  const approva = async () => {
    setErr(''); setLavoro(true);
    try {
      const dati = JSON.parse(JSON.stringify(doc.dati)) as Documento['dati'];
      const nuovo = dati.biotipi.find((x) => x.id === b.id)!;
      const n = nuovo as unknown as Record<string, unknown>;
      for (const r of righe) { const campo = r.percorso.split('/')[2]; n[campo] = Array.isArray(n[campo]) ? r.dopo.split('\n').map((s) => s.trim()).filter(Boolean) : r.dopo; }
      await invia('/api/admin/documento', { tipo: 'biotipi', dati, base: doc.id, nota: `Le modifiche proposte su «${b.titolo}», approvate dalle revisioni` });
      for (const r of righe) await invia('/api/admin/riscritture', { id: r.id, stato: 'approvata' });
      await invia('/api/admin/revisioni', { chiave: `biotipo:${b.id}`, contenuto: contenutoBiotipo(nuovo), esito: 'approvato', nota: 'Approvate le modifiche proposte in risposta alla nota' });
      if (nuovo.consiglio_medico) await invia('/api/admin/revisioni', { chiave: `consiglio:${b.id}`, contenuto: nuovo.consiglio_medico, esito: 'approvato', nota: 'Approvate le modifiche proposte in risposta alla nota' });
      poi();
    } catch (e) { setErr((e as Error).message); }
    setLavoro(false);
  };
  const ancora = async () => {
    setErr('');
    try {
      await invia('/api/admin/revisioni', { chiave: `biotipo:${b.id}`, contenuto: contenutoBiotipo(b), esito: 'da_cambiare', nota: testo });
      for (const r of righe) await invia('/api/admin/riscritture', { id: r.id, stato: 'scartata', nota: testo });
      setTesto(''); poi();
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <article className="carta pila" style={{ ['--gap' as string]: '12px' }}>
      <span className="piccolo">{NOMI_AREA[b.area as Area] || b.area}</span>
      <h3 className="titolo-3" style={{ margin: 0 }}>{b.titolo}</h3>
      {nota && <p className="testo" style={{ fontSize: 15, borderLeft: '3px solid var(--attenzione)', paddingLeft: 12 }}>La nota di {nota.chi.split('@')[0].replace(/shcrescenzi$/, '')} del {quando(nota.creato_il)}: «{nota.nota}»</p>}
      {righe[0]?.motivo && <p className="piccolo"><b>La risposta:</b> {righe[0].motivo}</p>}
      {righe.map((r) => (
        <div key={r.id} className="pila" style={{ ['--gap' as string]: '6px', borderTop: '1px solid var(--riga)', paddingTop: 10 }}>
          <b style={{ fontSize: 14 }}>{CAMPI[r.percorso.split('/')[2]] || r.percorso}</b>
          {r.prima && <p className="piccolo" style={{ whiteSpace: 'pre-line', textDecoration: 'line-through', opacity: 0.7 }}>{r.prima}</p>}
          <p className="testo" style={{ whiteSpace: 'pre-line', fontSize: 15 }}>{r.dopo}</p>
        </div>
      ))}
      {cambiati.length > 0 && <p className="piccolo" style={{ color: 'var(--attenzione)' }}>Attenzione: nel frattempo il testo di adesso è cambiato in {cambiati.length} punti; approvando si usa la versione proposta qui.</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="bottone" disabled={lavoro} onClick={approva}>{lavoro ? 'Salvo…' : 'Approvo le modifiche'}</button>
      </div>
      <input className="adm-input" value={testo} onChange={(e) => setTesto(e.target.value)} placeholder="Se va ancora cambiato, scrivi cosa (la risposta arriva qui)" />
      <button type="button" className="bottone secondario" style={{ justifySelf: 'start' }} disabled={!testo.trim()} onClick={ancora}>Va ancora cambiato</button>
      {err && <p className="piccolo" style={{ color: 'var(--attenzione)' }}>{err}</p>}
    </article>
  );
}

export default function Revisioni() {
  const api = useApi<{ revisioni: Riga[] }>('/api/admin/revisioni');
  const ris = useApi<{ riscritture: Riscrittura[] }>('/api/admin/riscritture');
  // i biotipi da rivedere sono quelli dell'ultima versione salvata (anche non ancora online)
  const bozza = useApi<{ ultimo: Documento | null }>('/api/admin/documento?tipo=biotipi');
  if (api.errore) return <Vuoto>Non riesco a leggere il registro: {api.errore}</Vuoto>;
  if (!api.dati || !bozza.dati || !ris.dati) return <Vuoto>Carico…</Vuoto>;
  const ricarica = () => { api.ricarica(); bozza.ricarica(); ris.ricarica(); };
  const ultima: Record<string, Riga> = {};
  for (const r of [...api.dati.revisioni].reverse()) ultima[r.chiave] = r;
  const doc = bozza.dati.ultimo;
  const biotipi = doc?.dati.biotipi || BIOTIPI;
  // le modifiche proposte, per biotipo, e l'ultima nota «da cambiare» del biotipo o del suo consiglio
  const proposte: Record<string, Riscrittura[]> = {};
  for (const r of ris.dati.riscritture.filter((x) => x.documento === 'biotipi' && x.stato === 'proposta')) (proposte[r.percorso.split('/')[1]] ||= []).push(r);
  const notaDi = (id: string) => [ultima[`biotipo:${id}`], ultima[`consiglio:${id}`]].filter((u) => u?.esito === 'da_cambiare' && u.nota).sort((a, b) => b!.creato_il.localeCompare(a!.creato_il))[0];
  const conRisposta = biotipi.filter((b) => proposte[b.id]?.length);

  type Elemento = { chiave: string; titolo: string; contenuto: string; area?: Area; figli?: React.ReactNode };
  const elementi: Elemento[] = [
    { chiave: 'metodo', titolo: 'Il metodo: domande, punti, soglie, limiti e regole dei biotipi', contenuto: contenutoMetodo(VERSIONI_METODO),
      figli: <p className="testo" style={{ fontSize: 15 }}>Il test com’è online: le domande e le regole sono in admin › Domande e admin › Biotipi. Versione del test del {VERSIONI_METODO.test || '—'}, dei biotipi del {VERSIONI_METODO.biotipi || '—'}: se una delle due cambia, la revisione decade.</p> },
    ...biotipi.filter((b) => !proposte[b.id]?.length).flatMap((b) => [
      { chiave: `biotipo:${b.id}`, titolo: b.titolo, contenuto: contenutoBiotipo(b), area: b.area as Area },
      ...(b.consiglio_medico ? [{ chiave: `consiglio:${b.id}`, titolo: `${b.titolo} · consiglio del medico`, contenuto: b.consiglio_medico, area: b.area as Area }] : []),
    ]),
  ];
  const fatto = (e: Elemento) => { const u = ultima[e.chiave]; return !!u && u.contenuto === e.contenuto && u.esito === 'approvato'; };
  const daFare = elementi.filter((e) => !fatto(e));
  const fatti = elementi.filter(fatto);
  const voce = (e: Elemento) => <Voce key={e.chiave} chiave={e.chiave} titolo={e.titolo} contenuto={e.contenuto} ultima={ultima[e.chiave]} poi={ricarica}>{e.figli}</Voce>;
  const perArea = (lista: Elemento[]) => [
    ...lista.filter((e) => !e.area).map(voce),
    ...AREE.map((a) => { const qui = lista.filter((e) => e.area === a); return qui.length ? (
      <div key={a} className="pila" style={{ ['--gap' as string]: '8px' }}><h3 className="piccolo" style={{ margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{NOMI_AREA[a]} · {qui.length}</h3>{qui.map(voce)}</div>
    ) : null; }),
  ];
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="La revisione medica: il metodo e i biotipi, coi loro consigli. In cima le tue note con la nostra risposta; poi quello che va letto, area per area. Un’approvazione vale per il testo che hai letto e conta come revisione medica solo quella di Sofia. Gli articoli si controllano nella loro scheda, in admin › Rivista.">Le revisioni</Titolo>
      {conRisposta.length > 0 && doc && (
        <section className="pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">Le tue note e le nostre risposte · {conRisposta.length}</h2>
          {conRisposta.map((b) => <Risposte key={b.id} b={b} righe={proposte[b.id]} nota={notaDi(b.id)} doc={doc} poi={ricarica} />)}
        </section>
      )}
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Da leggere{daFare.length ? ` · ${daFare.length}` : ''}</h2>
        {!daFare.length ? <Vuoto>Niente da rileggere: è tutto approvato.</Vuoto> : perArea(daFare)}
      </section>
      {!!fatti.length && (
        <details>
          <summary className="piccolo" style={{ cursor: 'pointer' }}>Già approvati · {fatti.length}</summary>
          <div className="pila" style={{ ['--gap' as string]: '8px', marginTop: 10 }}>{perArea(fatti)}</div>
        </details>
      )}
    </div>
  );
}
