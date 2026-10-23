'use client';

import { useState } from 'react';
import { NOZIONI, TEST, TIPO_NOZIONE, type Nozione } from '@/lib/dati';
import { useDocumento, BarraSalva, Campo, Testo, Titolo, Vuoto, nuovoId } from './base';

// LE NOZIONI (23/10/2026): le pause del test («Lo sapevi che…», storie, quiz) e la scheda della Rivista.
// Ognuna compare dopo una domanda e parla dello stesso tema; ognuna ha una fonte che si può aprire.
type Doc = { nozioni: Nozione[] };
const TIPI = Object.keys(TIPO_NOZIONE) as Nozione['tipo'][];

export default function Nozioni() {
  const doc = useDocumento<Doc>('nozioni', { nozioni: NOZIONI });
  const [q, setQ] = useState('');
  const g = doc.dati;
  if (doc.errore) return <Vuoto>Non riesco a leggere le nozioni: {doc.errore}</Vuoto>;
  if (!g) return <Vuoto>Carico…</Vuoto>;
  const metti = (i: number, n: Nozione) => doc.setDati({ nozioni: g.nozioni.map((x, j) => (j === i ? n : x)) });
  const cerca = q.trim().toLowerCase();
  const domanda = (id: string) => TEST.domande.find((d) => d.id === id)?.testo || id;
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="Compaiono nel test dopo la domanda scelta, se dall'ultima pausa sono passate almeno due domande, e tutte insieme in /rivista/lo-sapevi-che. Testo breve, un fatto solo, sempre con la fonte: niente marche, niente promesse.">Le nozioni ({g.nozioni.length})</Titolo>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <input className="adm-input" style={{ maxWidth: 360 }} type="search" placeholder="Cerca" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="bottone secondario" onClick={() => {
          const titolo = prompt('Il titolo della nozione nuova'); if (!titolo) return;
          doc.setDati({ nozioni: [{ id: nuovoId(titolo, g.nozioni.map((n) => n.id)), tipo: 'lo-sapevi', dopo: TEST.domande[0].id, titolo, testo: '', fonte: '', fonte_nome: '' }, ...g.nozioni] });
        }}>+ nozione</button>
      </div>
      {g.nozioni.map((n, i) => (!cerca || `${n.titolo} ${n.testo} ${n.dopo}`.toLowerCase().includes(cerca)) && (
        <details key={n.id} className="carta" open={!n.testo}>
          <summary><b>{n.titolo}</b> <span className="piccolo">· {TIPO_NOZIONE[n.tipo]} · dopo «{domanda(n.dopo)}»</span></summary>
          <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
            <div className="adm-due">
              <Campo etichetta="Tipo"><select className="adm-input" value={n.tipo} onChange={(e) => metti(i, { ...n, tipo: e.target.value as Nozione['tipo'], quiz: e.target.value === 'quiz' ? n.quiz || { domanda: '', opzioni: ['', ''], giusta: 0 } : n.quiz })}>{TIPI.map((t) => <option key={t} value={t}>{TIPO_NOZIONE[t]}</option>)}</select></Campo>
              <Campo etichetta="Dopo la domanda"><select className="adm-input" value={n.dopo} onChange={(e) => metti(i, { ...n, dopo: e.target.value })}>{TEST.domande.map((d) => <option key={d.id} value={d.id}>{d.testo}</option>)}</select></Campo>
            </div>
            <Campo etichetta="Titolo" aiuto="Al massimo 60 caratteri."><Testo valore={n.titolo} cambia={(v) => metti(i, { ...n, titolo: v })} /></Campo>
            <Campo etichetta={n.tipo === 'quiz' ? 'Spiegazione (dopo la risposta)' : 'Testo'} aiuto="Al massimo 300 caratteri."><Testo lungo valore={n.testo} cambia={(v) => metti(i, { ...n, testo: v })} /></Campo>
            {n.tipo === 'quiz' && n.quiz && (
              <div className="adm-due">
                <Campo etichetta="Domanda del quiz"><Testo valore={n.quiz.domanda} cambia={(v) => metti(i, { ...n, quiz: { ...n.quiz!, domanda: v } })} /></Campo>
                <Campo etichetta="Risposte, una per riga" aiuto="Scegli sotto quale è giusta.">
                  <Testo lungo valore={n.quiz.opzioni.join('\n')} cambia={(v) => metti(i, { ...n, quiz: { ...n.quiz!, opzioni: v.split('\n') } })} />
                  <select className="adm-input" value={n.quiz.giusta} onChange={(e) => metti(i, { ...n, quiz: { ...n.quiz!, giusta: Number(e.target.value) } })}>{n.quiz.opzioni.map((o, j) => <option key={j} value={j}>Giusta: {o || `risposta ${j + 1}`}</option>)}</select>
                </Campo>
              </div>
            )}
            <div className="adm-due">
              <Campo etichetta="Fonte (indirizzo)"><Testo valore={n.fonte} placeholder="https://…" cambia={(v) => metti(i, { ...n, fonte: v })} /></Campo>
              <Campo etichetta="Fonte (come si chiama)"><Testo valore={n.fonte_nome} placeholder="EFSA, PubMed (autore, anno)…" cambia={(v) => metti(i, { ...n, fonte_nome: v })} /></Campo>
            </div>
            <Campo etichetta="Approfondisci (facoltativo)" aiuto="Una pagina del sito: /glossario/… o /biotipi/…"><Testo valore={n.legame} cambia={(v) => metti(i, { ...n, legame: v || undefined })} /></Campo>
            <button type="button" className="chip" style={{ justifySelf: 'end' }} onClick={() => confirm(`Togliere «${n.titolo}»?`) && doc.setDati({ nozioni: g.nozioni.filter((_, j) => j !== i) })}>Togli la nozione</button>
          </div>
        </details>
      ))}
      <BarraSalva doc={doc} cosa="nozioni" />
    </div>
  );
}
