'use client';

import casiJson from '@/data/revisione-casi-20261121.json';
import zenoJson from '@/data/revisione-domande-20261121.json';
import { Voce, type Riga } from './VoceRevisione';

// IL GIRO DEL 21 NOVEMBRE (Federico, 21/11/2026: «i 13 casi mettili su admin skinmatch che rimando a Sofi e anche le
// domande»). Tre gruppi nel registro delle revisioni, con le chiavi caso:, zeno: e domanda:.
// - I 13 casi vengono dalle 156 prove del motore (~/.skinmatch-prove): oggi e col motore nuovo, che non è ancora online.
//   L'approvazione vale per la routine nuova che Sofia ha letto.
// - I 9 punti di Zeno cambiano il significato di una domanda: «Sì, si fa» oppure «No, o dopo» con la nota.
// - Le 38 domande riscritte con una voce sola: si applicano poi da admin › Domande.
// Nessuna di queste chiavi va sul sito: esporta_revisioni (scripts/admin/pubblica.py) porta online solo profili, regole
// e articoli.
type Prodotto = { marca: string; nome: string; prezzo: number; negozio: string; compat: number; lavoro: string };
type Passo = { passo: string; top: Prodotto; alt: Prodotto | null };
type Giro = { biotipo: string; tratti: string[]; passi: Passo[]; vuoti: string[] };
type Caso = { id: string; titolo: string; chi: string; prima: Giro; dopo: Giro };
type Opzione = { id: string; testo_prima?: string; testo_nuovo?: string };
type Domanda = { id: string; cambiata?: boolean; testo_prima?: string; testo_nuovo?: string; aiuto_prima?: string; aiuto_nuovo?: string; opzioni?: Opzione[]; note?: string };
type Macro = { id: string; nome: string; frase: string; domande: string[] };
type Zeno = {
  regola_voce: Record<string, string>; macro_passaggi: Record<string, Macro[]>; conto: { domande: number; cambiate: number };
  domande: Domanda[]; da_decidere: { id: string; proposta: string; perche: string }[];
};
const CASI = casiJson as Caso[];
const ZENO = zenoJson as unknown as Zeno;
const NOMI_TEST: Record<string, string> = { viso: 'Viso', cute: 'Cute e capelli', integrazione: 'Integrazione', completo: 'Completo' };
const euro = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const contenutoCaso = (c: Caso) => [`${c.titolo} · ${c.chi}`, c.dopo.biotipo,
  ...c.dopo.passi.map((p) => `${p.passo}: ${p.top.marca} ${p.top.nome}${p.alt ? ` (oppure ${p.alt.marca} ${p.alt.nome})` : ''}`),
  ...c.dopo.vuoti.map((v) => `${v}: nessun prodotto`)].join('\n');
const contenutoDomanda = (d: Domanda) => [d.testo_nuovo || d.testo_prima || '', d.aiuto_nuovo || d.aiuto_prima || '',
  ...(d.opzioni || []).map((o) => `- ${o.testo_nuovo || o.testo_prima || o.id}`)].join('\n');

function Colonna({ titolo, giro, prima }: { titolo: string; giro: Giro; prima?: Giro }) {
  const vecchi = new Map((prima?.passi || []).map((p) => [p.passo, p.top.marca + p.top.nome]));
  return (
    <div className={`giro-col${prima ? ' nuovo' : ''}`}>
      <span className="giro-etichetta">{titolo}</span>
      {giro.passi.map((p) => (
        <div key={p.passo} className={`giro-passo${prima && vecchi.get(p.passo) !== p.top.marca + p.top.nome ? ' cambiato' : ''}`}>
          <span className="giro-quale">{p.passo}</span>
          <b>{p.top.marca} {p.top.nome}</b>
          <span className="piccolo">{euro(p.top.prezzo)} · {p.top.negozio}{p.top.lavoro ? ` · lavoro: ${p.top.lavoro}` : ''}</span>
          <span className="piccolo">{p.alt ? `oppure ${p.alt.marca} ${p.alt.nome}, ${euro(p.alt.prezzo)}` : 'nessuna alternativa che costa meno'}</span>
        </div>
      ))}
      {giro.vuoti.map((v) => <div key={v} className="giro-passo"><span className="giro-quale">{v}</span><span style={{ color: 'var(--attenzione)' }}>nessun prodotto</span></div>)}
    </div>
  );
}

export default function Giro2111({ ultima, poi }: { ultima: Record<string, Riga>; poi: () => void }) {
  const fatto = (chiave: string, contenuto: string) => { const u = ultima[chiave]; return !!u && u.contenuto === contenuto; };
  const casi = CASI.map((c) => ({ c, chiave: `caso:${c.id}`, contenuto: contenutoCaso(c) }));
  const decisioni = ZENO.da_decidere.map((d) => ({ d, chiave: `zeno:${d.id}`, contenuto: d.proposta }));
  const domande = ZENO.domande.map((d) => ({ d, chiave: `domanda:${d.id}`, contenuto: contenutoDomanda(d) }));
  const conta = (xs: { chiave: string; contenuto: string }[]) => xs.filter((x) => fatto(x.chiave, x.contenuto)).length;
  // in quali passaggi del test sta ogni domanda (la proposta di Zeno)
  const doveSta: Record<string, string[]> = {};
  for (const [test, passi] of Object.entries(ZENO.macro_passaggi)) for (const m of passi) for (const id of m.domande) (doveSta[id] ||= []).push(`${NOMI_TEST[test] || test} › ${m.nome}`);
  const testoDi = Object.fromEntries(ZENO.domande.map((d) => [d.id, d.testo_prima || d.id]));

  return (
    <section className="carta pila giro" style={{ ['--gap' as string]: '18px' }}>
      <div className="pila" style={{ ['--gap' as string]: '8px' }}>
        <span className="etichetta">Il giro del 21 novembre</span>
        <h2 className="titolo-3">Risultati del test e domande, da rivedere</h2>
        <p className="testo" style={{ fontSize: 15 }}>
          Sofia, abbiamo provato il test con 156 persone inventate e corretto il modo in cui sceglie i prodotti; Zeno ha riscritto
          tutte le domande con una voce sola. Qui trovi 13 casi (oggi e col motore nuovo), i 9 punti che cambiano il significato di una
          domanda e le 38 domande prima e dopo. Approva quello che va bene; dove no, scrivi nella nota cosa cambieresti. Niente
          di questo è ancora online.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span className="chip tenue">Casi · {conta(casi)} di {casi.length}</span>
          <span className="chip tenue">Punti di Zeno · {conta(decisioni)} di {decisioni.length}</span>
          <span className="chip tenue">Domande · {conta(domande)} di {domande.length}</span>
        </div>
      </div>

      <details open className="pila giro-gruppo">
        <summary>I 13 casi, oggi e col motore nuovo</summary>
        <p className="piccolo">Un caso per tipo di pelle. A sinistra cosa esce oggi, a destra col motore nuovo; la riga verde è un prodotto cambiato. Il «lavoro» è quello che il prodotto fa secondo i suoi ingredienti.</p>
        {casi.map(({ c, chiave, contenuto }) => (
          <Voce key={chiave} chiave={chiave} titolo={`${c.titolo} · ${c.dopo.biotipo}`} contenuto={contenuto} ultima={ultima[chiave]} poi={poi}
            etichette={['La routine nuova va bene', 'Va cambiata']}>
            <p className="piccolo">{c.chi}{c.dopo.tratti.length ? ` · ${c.dopo.tratti.join(' · ')}` : ''}</p>
            <div className="giro-confronto">
              <Colonna titolo="Oggi" giro={c.prima} />
              <Colonna titolo="Col motore nuovo" giro={c.dopo} prima={c.prima} />
            </div>
          </Voce>
        ))}
      </details>

      <details className="pila giro-gruppo">
        <summary>I 9 punti di Zeno che cambiano il significato</summary>
        {decisioni.map(({ d, chiave, contenuto }) => (
          <Voce key={chiave} chiave={chiave} titolo={testoDi[d.id] || d.id} contenuto={contenuto} ultima={ultima[chiave]} poi={poi} etichette={['Sì, si fa', 'No, o dopo']}>
            <p className="testo" style={{ fontSize: 15 }}><b>{d.proposta}</b></p>
            <p className="piccolo">{d.perche}</p>
          </Voce>
        ))}
      </details>

      <details className="pila giro-gruppo">
        <summary>Le 38 domande, prima e dopo</summary>
        <div className="giro-regola pila" style={{ ['--gap' as string]: '6px' }}>
          <b>La regola della voce</b>
          <p className="piccolo">{ZENO.regola_voce.in_breve}</p>
          {['domande', 'risposte', 'aiuti'].map((k) => ZENO.regola_voce[k] && <p key={k} className="piccolo"><b>{{ domande: 'Le domande', risposte: 'Le risposte', aiuti: 'Gli aiuti' }[k]}:</b> {ZENO.regola_voce[k]}</p>)}
          <b style={{ marginTop: 6 }}>I passaggi del test</b>
          {Object.entries(ZENO.macro_passaggi).map(([test, passi]) => (
            <p key={test} className="piccolo"><b>{NOMI_TEST[test] || test}:</b> {passi.map((m) => `${m.nome} (${m.domande.length})`).join(' → ')}</p>
          ))}
        </div>
        {domande.map(({ d, chiave, contenuto }) => {
          const nuova = d.testo_nuovo || d.testo_prima || d.id;
          return (
            <Voce key={chiave} chiave={chiave} titolo={nuova} contenuto={contenuto} ultima={ultima[chiave]} poi={poi}>
              {d.testo_nuovo && d.testo_prima && d.testo_nuovo !== d.testo_prima && <p className="piccolo">Prima: {d.testo_prima}</p>}
              {doveSta[d.id] && <p className="piccolo">Nel passaggio: {doveSta[d.id].join(' · ')}</p>}
              {(d.aiuto_nuovo || d.aiuto_prima) && (
                <div className="pila" style={{ ['--gap' as string]: '4px' }}>
                  <span className="giro-quale">Aiuto</span>
                  <p className="testo" style={{ fontSize: 15 }}>{d.aiuto_nuovo || d.aiuto_prima}</p>
                  {d.aiuto_prima && d.aiuto_nuovo && d.aiuto_prima !== d.aiuto_nuovo && <p className="piccolo">Prima: {d.aiuto_prima}</p>}
                </div>
              )}
              {!!d.opzioni?.length && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="giro-opzioni">
                    <thead><tr><th>Prima</th><th>Dopo</th></tr></thead>
                    <tbody>{d.opzioni.map((o) => <tr key={o.id}><td>{o.testo_prima || ''}</td><td>{o.testo_nuovo || o.testo_prima || ''}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {d.note && <p className="piccolo giro-nota">Zeno: {d.note}</p>}
            </Voce>
          );
        })}
      </details>
    </section>
  );
}
