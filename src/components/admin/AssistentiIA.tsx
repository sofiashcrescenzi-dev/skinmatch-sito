'use client';

import { useState } from 'react';
import { useApi, Vuoto } from './base';
import { Colonne, Barre, numero } from './grafici';

// GLI ASSISTENTI IA (19/11/2026, Federico: «registra l'mcp e tracciamo le chiamate e citazioni sull'admin»).
// Due fonti, tutte e due contate dal Worker in D1 (/api/admin/ia):
// · ia_visite: ogni pagina aperta da un robot delle IA, riconosciuto dallo user agent (ROBOT_IA in worker/index.js).
//   «Per una risposta» = l'assistente apre la pagina mentre risponde a una persona (ChatGPT-User, Claude-User,
//   Perplexity-User…): è il segnale più vicino a una citazione. «Per l'indice» = i robot che preparano la ricerca
//   dell'assistente (OAI-SearchBot, Claude-SearchBot, PerplexityBot…). «Per l'addestramento» = GPTBot, ClaudeBot, CCBot…
// · mcp_chiamate: le chiamate al nostro server MCP (skinmatch.it/mcp), per strumento; «initialize» è un collegamento.
// ⚠️ Il conteggio parte il 19/11/2026: prima di quel giorno è zero perché non si contava, non perché nessuno passava.

type Robot = { robot: string; tipo: 'utente' | 'ricerca' | 'addestramento'; n: number };
type Sezione = { sezione: string; citazioni: number; tutte: number };
type Giorno = { giorno: string; citazioni: number; letture: number };
type Strumento = { strumento: string; n: number };
type GiornoMcp = { giorno: string; collegamenti: number; chiamate: number };
type Dati = { giorni: number; da: string; perRobot: Robot[]; perSezione: Sezione[]; perGiorno: Giorno[]; mcpStrumenti: Strumento[]; mcpGiorni: GiornoMcp[] };

const PERIODI = [['7g', '7 giorni'], ['30g', '30 giorni'], ['90g', '90 giorni']] as const;
type Periodo = (typeof PERIODI)[number][0];
const INIZIO = '2026-11-19';

const STRUMENTI: Record<string, string> = {
  cerca_prodotti: 'Cerca prodotti', biotipo: 'Leggi un biotipo', elenca_biotipi: 'Elenca i biotipi',
  biotipi_da_segni: 'Biotipi da una descrizione', ingrediente: 'Spiega un ingrediente', articoli: 'Articoli della rivista',
  test_skinmatch: 'Il test',
};
const SEZIONI: Record<string, string> = {
  home: 'Home', 'llms.txt': 'llms.txt (la guida per le IA)', markdown: 'Pagine in testo per le IA', catalogo: 'Catalogo',
  biotipi: 'Biotipi', rivista: 'Rivista', test: 'Test', glossario: 'Glossario', nozioni: 'Nozioni', 'chi-siamo': 'Chi siamo',
  integratori: 'Integratori', 'dati-ia': 'Dati per le IA (json)', '.well-known': 'Scheda del server MCP',
};
const sezione = (s: string) => SEZIONI[s] || `/${s}`;

// tutti i giorni del periodo, anche quelli a zero, dal più vecchio a oggi
function calendario(da: string) {
  const out: string[] = [];
  for (let t = Date.parse(`${da}T12:00:00Z`), oggi = Date.now(); t <= oggi; t += 864e5) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}
function etichetta(g: string, giorni: number, lunga = false) {
  const d = new Date(`${g}T12:00:00Z`);
  if (lunga) return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return giorni <= 7 ? `${d.toLocaleDateString('it-IT', { weekday: 'short', timeZone: 'UTC' })}\n${d.getUTCDate()}` : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function AssistentiIA() {
  const [periodo, setPeriodo] = useState<Periodo>('30g');
  const api = useApi<Dati>(`/api/admin/ia?periodo=${periodo}`);
  // al cambio di periodo, i numeri vecchi spariscono finché non arrivano i nuovi
  const d = api.dati?.giorni === { '7g': 7, '30g': 30, '90g': 90 }[periodo] ? api.dati : null;

  const somma = (tipo: Robot['tipo']) => (d?.perRobot || []).filter((r) => r.tipo === tipo).reduce((t, r) => t + r.n, 0);
  const risposte = somma('utente'), indice = somma('ricerca'), addestramento = somma('addestramento');
  const chiamate = (d?.mcpStrumenti || []).reduce((t, r) => t + r.n, 0);
  const collegamenti = (d?.mcpGiorni || []).reduce((t, r) => t + r.collegamenti, 0);

  // un assistente per riga, coi tre tipi di visita nel dettaglio; prima chi ci apre per rispondere
  const assistenti = Object.values((d?.perRobot || []).reduce<Record<string, { nome: string; utente: number; ricerca: number; addestramento: number }>>((acc, r) => {
    const a = (acc[r.robot] ||= { nome: r.robot, utente: 0, ricerca: 0, addestramento: 0 });
    a[r.tipo] += r.n;
    return acc;
  }, {})).sort((a, b) => b.utente - a.utente || (b.utente + b.ricerca + b.addestramento) - (a.utente + a.ricerca + a.addestramento));

  const giorni = d ? calendario(d.da > INIZIO ? d.da : INIZIO) : [];
  const perGiorno = new Map((d?.perGiorno || []).map((g) => [g.giorno, g]));
  const mcpGiorno = new Map((d?.mcpGiorni || []).map((g) => [g.giorno, g]));
  const ogni = d && d.giorni <= 7 ? 1 : 7;

  return (
    <section className="pila vis" style={{ ['--gap' as string]: '14px' }}>
      <div className="vis-testa">
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <h2 className="titolo-2">Assistenti IA</h2>
          <p className="piccolo">Quando ChatGPT, Claude, Perplexity e gli altri aprono Skinmatch, e quando usano gli strumenti del nostro server MCP. Una visita «per una risposta» vuol dire che l’assistente ha letto la pagina mentre rispondeva a qualcuno: è il segnale più vicino a una citazione.</p>
        </div>
        <div className="riga-chip" role="group" aria-label="Periodo">
          {PERIODI.map(([k, nome]) => <button key={k} type="button" className="chip" aria-pressed={periodo === k} onClick={() => setPeriodo(k)}>{nome}</button>)}
        </div>
      </div>

      {api.errore && <Vuoto>Non riesco a leggere i numeri degli assistenti: {api.errore}</Vuoto>}
      {!d && !api.errore && <div className="adm-numeri vis-attesa" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i}><span className="piccolo">&nbsp;</span><b>&nbsp;</b></div>)}</div>}

      {d && (
        <>
          <div className="adm-numeri vis-numeri">
            <div><span className="piccolo">Per una risposta</span><b>{numero(risposte)}</b><span className="vis-delta"><span className="vis-prima">pagine aperte mentre l’assistente rispondeva</span></span></div>
            <div><span className="piccolo">Per l’indice</span><b>{numero(indice)}</b><span className="vis-delta"><span className="vis-prima">letture che preparano le ricerche degli assistenti</span></span></div>
            <div><span className="piccolo">Per l’addestramento</span><b>{numero(addestramento)}</b><span className="vis-delta"><span className="vis-prima">letture per allenare i modelli</span></span></div>
            <div><span className="piccolo">Chiamate MCP</span><b>{numero(chiamate)}</b><span className="vis-delta"><span className="vis-prima">{numero(collegamenti)} {collegamenti === 1 ? 'collegamento' : 'collegamenti'} al server</span></span></div>
          </div>

          {!risposte && !indice && !addestramento && !chiamate ? (
            <div className="carta vis-avviso pila" style={{ ['--gap' as string]: '6px' }}>
              <b>Ancora nessun assistente, in questo periodo.</b>
              <p className="piccolo">Il conteggio è partito il 19 novembre, quando sono andati online la guida per le IA (skinmatch.it/llms.txt), le pagine in testo e il server MCP. Il server è anche nel registro ufficiale dei server MCP, dove lo trovano le app che cercano strumenti: le prime visite di solito arrivano nel giro di qualche giorno.</p>
            </div>
          ) : (
            <>
              <div className="adm-due">
                <div className="carta">
                  <Colonne titolo="Visite degli assistenti, giorno per giorno" impilate ogni={ogni}
                    dati={giorni.map((g) => ({ k: g, etichetta: etichetta(g, d.giorni), lunga: etichetta(g, d.giorni, true), citazioni: perGiorno.get(g)?.citazioni || 0, letture: perGiorno.get(g)?.letture || 0 }))}
                    serie={[{ chiave: 'citazioni', nome: 'per una risposta', colore: 'var(--f5)' }, { chiave: 'letture', nome: 'letture (indice e addestramento)', colore: 'var(--f2)' }]} />
                </div>
                <div className="carta">
                  <Colonne titolo="Chiamate al server MCP" ogni={ogni}
                    dati={giorni.map((g) => ({ k: g, etichetta: etichetta(g, d.giorni), lunga: etichetta(g, d.giorni, true), chiamate: mcpGiorno.get(g)?.chiamate || 0 }))}
                    serie={[{ chiave: 'chiamate', nome: 'chiamate', colore: 'var(--cacao)' }]} />
                </div>
              </div>
              <div className="adm-due">
                <div className="carta">
                  <Barre titolo="Quale assistente" vuoto="Ancora nessuno."
                    righe={assistenti.map((a) => ({ k: a.nome, nome: a.nome, valore: a.utente + a.ricerca + a.addestramento,
                      sotto: [a.utente && `${numero(a.utente)} per una risposta`, a.ricerca && `${numero(a.ricerca)} per l’indice`, a.addestramento && `${numero(a.addestramento)} per l’addestramento`].filter(Boolean).join(' · ') }))} />
                </div>
                <div className="carta">
                  <Barre titolo="Quali pagine leggono" vuoto="Ancora nessuna." colore="var(--f4)"
                    righe={(d.perSezione || []).slice(0, 12).map((s) => ({ k: s.sezione, nome: sezione(s.sezione), valore: s.tutte, sotto: s.citazioni ? `${numero(s.citazioni)} per una risposta` : 'nessuna per una risposta' }))} />
                </div>
              </div>
              <div className="carta">
                <Barre titolo="Gli strumenti MCP più usati" vuoto="Nessuna chiamata agli strumenti, in questo periodo." colore="var(--cacao)"
                  righe={(d.mcpStrumenti || []).map((s) => ({ k: s.strumento, nome: STRUMENTI[s.strumento] || s.strumento, valore: s.n }))} />
              </div>
            </>
          )}
          <p className="piccolo vis-sitemap">Server MCP: <a className="link" href="/.well-known/mcp.json" target="_blank" rel="noopener">skinmatch.it/mcp</a> · guida per le IA: <a className="link" href="/llms.txt" target="_blank" rel="noopener">/llms.txt</a> · conteggio dal 19 novembre 2026</p>
        </>
      )}
    </section>
  );
}
