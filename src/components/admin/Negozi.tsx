'use client';

import { useState } from 'react';
import { NEGOZI, type Negozi as Doc, type Negozio, type Codice } from '@/lib/dati';
import { PRODUCTS } from '@/lib/products';
import { useDocumento, BarraSalva, Campo, Testo, Titolo, Vuoto, nuovoId } from './base';

// I NEGOZI (Federico, 15/10/2026): per ognuno la commissione, la spedizione e i codici sconto.
// - La commissione decide il link quando lo stesso prodotto è in più negozi a prezzo simile
//   (scripts/catalogo/offerte.py): vince chi paga di più.
// - Spedizione e codici si vedono nella scheda prodotto, vicino a «Compra qui»; un codice scaduto sparisce da solo.
// - «Attivo» no: il negozio resta fuori dal sito (per esempio finché non approva Skinmatch).
const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

export default function Negozi() {
  const doc = useDocumento<Doc>('negozi', NEGOZI);
  const [aperto, setAperto] = useState('');
  const [nuovo, setNuovo] = useState('');
  const d = doc.dati;
  if (doc.errore) return <Vuoto>Non riesco a leggere i negozi: {doc.errore}</Vuoto>;
  if (!d) return <Vuoto>Carico…</Vuoto>;
  const cambia = (i: number, n: Negozio) => doc.setDati({ ...d, negozi: d.negozi.map((x, j) => (j === i ? n : x)) });
  const quanti = (n: Negozio) => PRODUCTS.filter((p) => (p.merchant || '').toLowerCase() === n.nome.toLowerCase()).length;
  const oggi = new Date().toISOString().slice(0, 10);
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <Titolo sotto="La commissione sceglie il link quando un prodotto è in più negozi a prezzo simile; spedizione e codici sconto si vedono nelle schede, vicino a «Compra qui». Poi Salva e Pubblica.">I negozi</Titolo>
      <div className="adm-scatole">
        {d.negozi.map((n, i) => {
          const su = aperto === n.id;
          const validi = n.codici.filter((c) => !c.scade || c.scade >= oggi);
          return (
            <article key={n.id} className={`carta adm-scatola${su ? ' aperta' : ''}`}>
              <div className="adm-scatola-testa"><b>{n.nome}</b><span className="piccolo">{quanti(n)} prodotti</span></div>
              <span className="piccolo">{n.rete} · {n.commissione != null ? `${String(n.commissione).replace('.', ',')}%` : 'commissione da inserire'} · {n.attivo ? 'attivo' : 'non attivo'}</span>
              {!su && <span className="piccolo adm-regola">Spedizione {n.spedizione.costo != null ? `${n.spedizione.costo.toFixed(2).replace('.', ',')} €` : '—'}{n.spedizione.gratis_da != null ? `, gratis da ${n.spedizione.gratis_da.toFixed(2).replace('.', ',')} €` : ''} · {validi.length ? `${validi.length} codici attivi` : 'nessun codice'}</span>}
              {su && (
                <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 6 }}>
                  <div className="adm-due">
                    <Campo etichetta="Nome (come nel catalogo)"><Testo valore={n.nome} cambia={(x) => cambia(i, { ...n, nome: x })} /></Campo>
                    <Campo etichetta="Rete di affiliazione"><Testo valore={n.rete} cambia={(x) => cambia(i, { ...n, rete: x })} /></Campo>
                  </div>
                  <div className="adm-due">
                    <Campo etichetta="Commissione %" aiuto="Quella sulle vendite, dalla rete."><input className="adm-input" inputMode="decimal" value={n.commissione ?? ''} onChange={(e) => cambia(i, { ...n, commissione: num(e.target.value) })} /></Campo>
                    <Campo etichetta="Sul sito"><label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', minHeight: 40 }}><input type="checkbox" checked={n.attivo} onChange={(e) => cambia(i, { ...n, attivo: e.target.checked })} />attivo</label></Campo>
                  </div>
                  <div className="adm-due">
                    <Campo etichetta="Spedizione, €"><input className="adm-input" inputMode="decimal" value={n.spedizione.costo ?? ''} onChange={(e) => cambia(i, { ...n, spedizione: { ...n.spedizione, costo: num(e.target.value) } })} /></Campo>
                    <Campo etichetta="Gratis da, €" aiuto="Vuoto se non c'è o non è confermato."><input className="adm-input" inputMode="decimal" value={n.spedizione.gratis_da ?? ''} onChange={(e) => cambia(i, { ...n, spedizione: { ...n.spedizione, gratis_da: num(e.target.value) } })} /></Campo>
                  </div>
                  <div className="adm-due">
                    <Campo etichetta="Tempi di consegna"><Testo valore={n.spedizione.tempi} placeholder="es. 2-5 giorni lavorativi" cambia={(x) => cambia(i, { ...n, spedizione: { ...n.spedizione, tempi: x } })} /></Campo>
                    <Campo etichetta="Nota sulla spedizione (si vede)"><Testo valore={n.spedizione.nota} placeholder="es. ritiro in farmacia gratis" cambia={(x) => cambia(i, { ...n, spedizione: { ...n.spedizione, nota: x } })} /></Campo>
                  </div>
                  <Campo etichetta="Codici sconto" aiuto="Si vedono nelle schede finché non scadono.">
                    <div className="pila" style={{ ['--gap' as string]: '8px' }}>
                      {n.codici.map((c, k) => {
                        const metti = (x: Codice) => cambia(i, { ...n, codici: n.codici.map((y, j) => (j === k ? x : y)) });
                        return (
                          <div key={k} className="adm-codice">
                            <input className="adm-input" placeholder="CODICE" value={c.codice} onChange={(e) => metti({ ...c, codice: e.target.value.toUpperCase() })} />
                            <input className="adm-input" placeholder="es. 10% su tutto da 39 €" value={c.descrizione} onChange={(e) => metti({ ...c, descrizione: e.target.value })} />
                            <input className="adm-input" type="date" value={c.scade || ''} onChange={(e) => metti({ ...c, scade: e.target.value || undefined })} aria-label="Scade il" />
                            <button type="button" className="chip" onClick={() => cambia(i, { ...n, codici: n.codici.filter((_, j) => j !== k) })}>Togli</button>
                          </div>
                        );
                      })}
                      <button type="button" className="chip" style={{ justifySelf: 'start' }} onClick={() => cambia(i, { ...n, codici: [...n.codici, { codice: '', descrizione: '' }] })}>+ Aggiungi un codice</button>
                    </div>
                  </Campo>
                  <Campo etichetta="Nota (per noi)"><Testo lungo valore={n.nota} cambia={(x) => cambia(i, { ...n, nota: x })} /></Campo>
                </div>
              )}
              <div className="adm-scatola-azioni">
                <button type="button" className="chip" onClick={() => setAperto(su ? '' : n.id)}>{su ? 'Chiudi' : 'Modifica'}</button>
                <button type="button" className="chip" onClick={() => { if (!quanti(n) && confirm(`Tolgo ${n.nome}?`)) doc.setDati({ ...d, negozi: d.negozi.filter((_, j) => j !== i) }); else if (quanti(n)) alert(`${n.nome} ha ancora ${quanti(n)} prodotti nel catalogo: prima va tolto dal feed.`); }}>Elimina</button>
              </div>
            </article>
          );
        })}
        <article className="carta adm-scatola nuova">
          <b>Nuovo negozio</b>
          <input className="adm-input" placeholder="es. Farmaself" value={nuovo} onChange={(e) => setNuovo(e.target.value)} />
          <button type="button" className="chip" disabled={!nuovo.trim()} onClick={() => {
            const id = nuovoId(nuovo, d.negozi.map((x) => x.id));
            doc.setDati({ ...d, negozi: [...d.negozi, { id, nome: nuovo.trim(), rete: '', commissione: null, attivo: false, spedizione: { costo: null, gratis_da: null, tempi: '', nota: '' }, codici: [] }] });
            setNuovo(''); setAperto(id);
          }}>Aggiungi</button>
        </article>
      </div>
      <BarraSalva doc={doc} cosa="negozi" />
    </div>
  );
}
