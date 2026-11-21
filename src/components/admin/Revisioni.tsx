'use client';

import { useState } from 'react';
import { ARTICOLI, BIOTIPI, NOMI_AREA, VERSIONI_METODO, contenutoArticolo, contenutoBiotipo, contenutoMetodo, type Area, type Biotipo } from '@/lib/dati';
import { useApi, Titolo, Vuoto } from './base';
import Giro2111 from './Giro2111';
import { Voce, type Riga } from './VoceRevisione';

// IL REGISTRO DELLE REVISIONI (7/11/2026, voto l-revisione: «per profili, regole e articoli: chi ha rivisto, quando,
// cosa»). Sofia legge e approva; ogni approvazione porta il testo letto, e la pubblicazione la mette sul sito solo se il
// testo online è ancora quello (scripts/admin/pubblica.py, esporta_revisioni). «Rivisto da … il …», il consiglio del
// medico e la firma degli articoli compaiono solo così. Conta come revisione medica solo quella di Sofia.

export default function Revisioni() {
  const api = useApi<{ revisioni: Riga[] }>('/api/admin/revisioni');
  // le proposte di glossario e nozioni (13/11/2026): si approvano nelle loro schede, qui si contano
  const glo = useApi<{ ultimo: { dati: { termini: { bozza?: boolean }[] } } | null }>('/api/admin/documento?tipo=glossario');
  const noz = useApi<{ ultimo: { dati: { nozioni: { bozza?: boolean }[] } } | null }>('/api/admin/documento?tipo=nozioni');
  const bozzeGlo = glo.dati?.ultimo?.dati.termini.filter((t) => t.bozza).length || 0;
  const bozzeNoz = noz.dati?.ultimo?.dati.nozioni.filter((n) => n.bozza).length || 0;
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
      <Giro2111 ultima={ultima} poi={api.ricarica} />
      <section className="pila" style={{ ['--gap' as string]: '10px' }}>
        <h2 className="titolo-3">Profili, regole e articoli da rivedere{daFare.length ? ` · ${daFare.length}` : ''}</h2>
        {(bozzeGlo > 0 || bozzeNoz > 0) && (
          <div className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <span style={{ flex: '1 1 240px' }}>Proposte nuove, non ancora online: {bozzeGlo > 0 && <><b>{bozzeGlo}</b> voci del glossario</>}{bozzeGlo > 0 && bozzeNoz > 0 ? ' e ' : ''}{bozzeNoz > 0 && <><b>{bozzeNoz}</b> nozioni</>}.</span>
            {bozzeGlo > 0 && <a className="chip" href="/admin/glossario">Apri il glossario</a>}
            {bozzeNoz > 0 && <a className="chip" href="/admin/nozioni">Apri le nozioni</a>}
          </div>
        )}
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
