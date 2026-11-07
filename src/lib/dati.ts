// I DATI DEL SITO: test, biotipi, glossario, catalogo, rivista, nozioni.
//
// ⚠️ Stanno in src/data/*.json e si modificano dall'admin (skinmatch.it/admin): la
// pubblicazione dell'admin (scripts/admin/pubblica.py) riscrive quei file, li prova con i
// guardiani (scripts/guardiani.mjs), fa il commit e il deploy. Chi li cambia a mano nel
// repository li vede sovrascritti alla prossima pubblicazione: si passa dall'admin.

import test from '@/data/test.json';
import biotipi from '@/data/biotipi.json';
import glossario from '@/data/glossario.json';
import catalogo from '@/data/catalogo.json';
import rivista from '@/data/rivista.json';
import attivi from '@/data/attivi.json';
import negozi from '@/data/negozi.json';
import nozioni from '@/data/nozioni.json';
import chisiamo from '@/data/chisiamo.json';
import revisioni from '@/data/revisioni.json';

export type Area = 'pelle' | 'cute' | 'integrazione';
export type AreaDomanda = Area | 'comune';
export type Valore = string | number | boolean;

// Una condizione: su un asse (min/max), su una scelta (valori), su un limite o su un biotipo già scelto.
export type Condizione = {
  asse?: string;
  min?: number;
  max?: number;
  scelta?: string;
  valori?: Valore[];
  limite?: string;
  biotipo?: string[];
  no?: boolean;
};

export type Asse = { id: string; nome: string; area: Area; termine?: string; soglie?: string };
export type Scelta = { id: string; nome: string; valori: Valore[] };
export type Opzione = {
  id: string;
  testo: string;
  punti?: Record<string, number>;
  scelte?: Record<string, Valore>;
  limite?: string;
  esclusiva?: boolean;
};
export type Domanda = {
  id: string;
  area: AreaDomanda;
  testo: string;
  aiuto?: string;
  multipla?: boolean;
  // «Salta»: solo dove la domanda non serve davvero (non decide il biotipo né la sicurezza); senza risposta vale il default del motore (Federico, 16/10)
  saltabile?: boolean;
  se?: Condizione[];
  opzioni: Opzione[];
};
export type Percorso = {
  id: string;
  nome: string;
  titolo: string;
  descrizione: string;
  immagine: string;
  aree: Area[];
  minuti: number;
  domande: string[];
};
export type Limite = { id: string; area: Area; titolo: string; testo: string; solo_delicati: boolean };
export type Passaggio = {
  id: string;
  area: Area;
  nome: string;
  quando: string;
  categoria: string;
  con_bisogno?: string;
  senza_bisogno?: string;
  minimo?: number;
  se?: Condizione[];
  // perché il passaggio è nella routine, in una frase (7/11/2026, voto l-dossier): si legge nel risultato
  perche?: string;
};
export type Persona = {
  nome: string;
  nota: string;
  percorso: string;
  risposte: Record<string, string | string[]>;
  atteso: { pelle?: string; cute?: string; integrazione?: string; tratti?: string[]; consulto?: boolean };
};
export type Test = {
  assi: Asse[];
  scelte: Scelta[];
  percorsi: Percorso[];
  domande: Domanda[];
  limiti: Limite[];
  passaggi: Passaggio[];
  persone: Persona[];
};

export type Bisogni = { pelle?: string[]; concerns?: string[]; capelli?: string[]; cute?: string[] };
export type Biotipo = {
  id: string;
  area: Area;
  tipo: 'biotipo' | 'tratto';
  titolo: string;
  motto: string;
  famiglia: string;
  tag: string[];
  priorita: number;
  descrizione: string;
  caratteristiche: string[];
  cerca: string[];
  evita: string[];
  regole: Condizione[][];
  bisogni: Bisogni;
  // il consiglio del medico per questo biotipo (7/11/2026, voto d-compat): lo scrive o lo approva Sofia; sul sito
  // compare solo con la sua revisione (revisione('consiglio:<id>'))
  consiglio_medico?: string;
};
export type TagBiotipo = { id: string; nome: string; area: Area | 'tutti' };

export type Termine = { id: string; nome: string; categoria: string; testo: string; parole: string[]; video?: string };

export type RegolaProdotti = {
  categoria?: string;
  con_bisogno?: string;
  senza_bisogno?: string;
  fascia?: string[];
  marca?: string[];
  coreano?: boolean;
  sensibili?: boolean;
  gravidanza?: boolean;
  genere?: string[];
  segmento?: string[]; // il segmento della marca deciso nell'artifact «Le marche di Skinmatch»
  categorie?: string[]; // le categorie del catalogo (sieri, creme…): un filtro può valere solo per alcune
  // dall'INCI verificato (30/10/2026, Federico: «trova quali filtri marketing sono utilizzabili»): profumo, alcol, oli
  // essenziali che la scheda sa ASSENTI; un prodotto senza INCI non entra, perché non si sa
  senza?: string[];
  vegano?: boolean; // dichiarato vegano nella scheda
};
// la fascia di prezzo, rispetto agli altri prodotti dello stesso passaggio (scripts/catalogo/schede.py):
// il terzo più economico, la parte centrale, il 20% più caro
export const FASCE: Record<string, string> = { base: 'economica', top: 'media', premium: 'alta' };
export type CategoriaCatalogo = { id: string; nome: string; regola: RegolaProdotti; immagine: string; descrizione: string };
// un filtro: «home» lo mette tra le famiglie della homepage (in quest'ordine), «immagine» è la sua foto lì
export type TagCatalogo = { id: string; nome: string; regola: RegolaProdotti; descrizione: string; home?: boolean; immagine?: string };
// Le correzioni a mano su un prodotto, per id (dall'admin, scheda «Catalogo»).
export type Modifica = {
  nascosto?: boolean;
  tag_piu?: string[];
  tag_meno?: string[];
  name?: string;
  description?: string;
  tier?: 'base' | 'top' | 'premium';
  skinTypes?: string[];
  concerns?: string[];
  hairConcerns?: string[];
  scalpTypes?: string[];
  pregnancySafe?: boolean;
  sensitiveSafe?: boolean;
  categoria?: string; // la categoria del catalogo scelta a mano in admin: vince sulla regola
  sottotitolo?: string;
  nota?: string;
};
export type Catalogo = { categorie: CategoriaCatalogo[]; tag: TagCatalogo[]; modifiche: Record<string, Modifica> };

export type Articolo = {
  slug: string;
  titolo: string;
  sommario: string;
  tipo: string;
  testo: string;
  immagine?: { file: string; autore?: string; pagina?: string; alt?: string };
  prodotti?: string[];
  biotipi?: string[];
  termini?: string[];
  approfondisce?: string[]; // i termini del glossario che spiega: lo mostrano sotto il termine e nei prodotti
  firma?: 'redazione' | 'sofia'; // chi l'ha scritto (7/11/2026, d-nome): «sofia» solo per i pezzi scritti da lei
  pubblicato_il: string;
  aggiornato_il?: string;
};

export const TEST = test as unknown as Test;
export const BIOTIPI = (biotipi as unknown as { biotipi: Biotipo[] }).biotipi;
// LA DATA DEL METODO (7/11/2026, voto l-dossier): l'ultima volta che sono cambiate le regole del test o dei biotipi.
// La scrive la pubblicazione dall'admin (scripts/admin/pubblica.py, scrivi) nel campo _versione dei due file.
export const DATA_METODO: string | null = [(test as { _versione?: string })._versione, (biotipi as { _versione?: string })._versione]
  .filter((x): x is string => !!x).sort().pop() || null;
export const TAG_BIOTIPI = (biotipi as unknown as { tag: TagBiotipo[] }).tag;
export const TERMINI = (glossario as unknown as { termini: Termine[] }).termini;
export const CATALOGO = catalogo as unknown as Catalogo;
export const ARTICOLI = ((rivista as unknown as { articoli: Articolo[] }).articoli || [])
  .slice()
  .sort((a, b) => b.pubblicato_il.localeCompare(a.pubblicato_il));

// Gli attivi spiegati (src/data/attivi.json): la home li racconta, il catalogo li usa come filtro.
export type Attivo = { id: string; nome: string; nomi: string[]; termine: string; cosa: string; per_chi: string; attenzione: string; peso: number };
export const ATTIVI = (attivi as unknown as { attivi: Attivo[] }).attivi;
export const conAttivo = (p: { scheda?: { attivi: { nome: string }[] } }, a: Attivo) => !!p.scheda?.attivi.some((x) => a.nomi.includes(x.nome));

// LA RIVISTA COLLEGATA AL GLOSSARIO (Federico, 16/10: «un articolo della rivista collegato al glossario, che comparirà
// sotto i prodotti che lo hanno»). L'articolo dice quale termine spiega (`approfondisce`, scelto in admin › Rivista):
// si legge sotto quel termine e nelle pagine dei prodotti con l'attivo di quel termine (attivi.json → termine) o con
// quel lavoro (caduta, forfora, macchie, pori, barriera), e in quelle dei prodotti che l'articolo cita.
export const articoliDelTermine = (id: string) => ARTICOLI.filter((a) => a.approfondisce?.includes(id));
export function articoliPerProdotto(p: { id: string; scheda?: { attivi: { nome: string }[]; principale?: { id: string } | null; lavoro?: string[] } }, quanti = 3): Articolo[] {
  const att = ATTIVI.filter((a) => conAttivo(p, a) && a.termine);
  const primo = att.find((a) => a.id === p.scheda?.principale?.id)?.termine;
  const termini = new Set([...att.map((a) => a.termine), ...(p.scheda?.lavoro || [])]);
  const peso = (x: Articolo) => (primo && x.approfondisce?.includes(primo) ? 2 : 0) + (x.approfondisce?.some((t) => termini.has(t)) ? 1 : 0);
  return ARTICOLI.filter((x) => x.prodotti?.includes(p.id) || x.approfondisce?.some((t) => termini.has(t))).sort((u, v) => peso(v) - peso(u)).slice(0, quanti);
}

// I negozi (src/data/negozi.json, admin › Negozi): commissione, spedizione, codici sconto.
export type Codice = { codice: string; descrizione: string; scade?: string };
export type Negozio = { id: string; nome: string; rete: string; commissione: number | null; attivo: boolean; spedizione: { costo: number | null; gratis_da: number | null; tempi: string; nota: string }; codici: Codice[]; nota?: string };
export type Negozi = { negozi: Negozio[] };
export const NEGOZI = negozi as unknown as Negozi;
export const negozioPerNome = (nome?: string | null) => NEGOZI.negozi.find((n) => n.nome.toLowerCase() === (nome || '').toLowerCase());

export const NOMI_AREA: Record<Area, string> = { pelle: 'Pelle', cute: 'Cute e capelli', integrazione: 'Integrazione' };

export const biotipoPerId = (id: string) => BIOTIPI.find((b) => b.id === id);
export const percorsoPerId = (id: string) => TEST.percorsi.find((p) => p.id === id);
export const domandaPerId = (id: string) => TEST.domande.find((d) => d.id === id);
export const terminePerId = (id: string) => TERMINI.find((t) => t.id === id);

// L'immagine di una famiglia o di un percorso: i file li prepara Zeno in public/immagini
// (versioni da 1600 e 800 px); se un nome manca, si torna alle immagini di prima.
import crediti from '../../public/immagini/crediti.json';
export type Credito = { nome: string; autore?: string; pagina?: string; pexels_id?: number | string; alt?: string; uso?: string[] | string; fuoco?: string };
export const CREDITI = (Array.isArray(crediti) ? crediti : []) as Credito[];
export function immagine(nome: string): { src: string; piccola: string; alt: string; autore?: string; pagina?: string; fuoco?: string } | null {
  const c = CREDITI.find((x) => x.nome === nome);
  if (!c) return null;
  return { src: `/immagini/${nome}-1600.webp`, piccola: `/immagini/${nome}-800.webp`, alt: c.alt || '', autore: c.autore, pagina: c.pagina, fuoco: c.fuoco };
}

// La foto di un biotipo: la sua (biotipo-<id>, una per biotipo, così le pagine non ripetono la
// stessa immagine — il PO, 15/10/2026), altrimenti quella della sua famiglia.
export const fotoDi = (b: { id: string; famiglia: string }) => (CREDITI.some((c) => c.nome === `biotipo-${b.id}`) ? `biotipo-${b.id}` : b.famiglia);

// LE NOZIONI (23/10/2026, Federico: «i funnel più interattivi: ogni 4-5 domande un "lo sapevi che…", una nozione
// storica, tutte correlate»). Le scrive Zeno, con una fonte ciascuna; compaiono nel test dopo la domanda `dopo` e
// tutte insieme nella Rivista, scheda «Lo sapevi che» (/rivista/lo-sapevi-che).
export type Nozione = {
  id: string;
  tipo: 'lo-sapevi' | 'storia';
  dopo: string;
  titolo: string;
  testo: string;
  fonte: string;
  fonte_nome: string;
  legame?: string;
};
export const NOZIONI = (nozioni as unknown as { nozioni: Nozione[] }).nozioni;
// ⚠️ SOLO DA LEGGERE (25/10/2026, Federico: «non devono essere altre scelte multiple o altri lavori da fare»): i quiz sono
// diventati nozioni, e il tipo «quiz» non c'e piu.
export const TIPO_NOZIONE: Record<Nozione['tipo'], string> = { 'lo-sapevi': 'Lo sapevi che…', storia: 'Un po\' di storia' };

// CHI SIAMO (7/11/2026, voto d-nome): le persone, modificabili da admin › Chi siamo. Finché «pubblica» è false le schede
// si vedono solo in anteprima (/chi-siamo#anteprima).
export type Membro = { id: string; nome: string; ruolo: string; testo: string[]; foto: string; link: { testo: string; url: string } };
export const CHI_SIAMO = chisiamo as unknown as { pubblica: boolean; persone: Membro[] };

// IL REGISTRO DELLE REVISIONI (7/11/2026, voto l-revisione): le approvazioni di Sofia ancora valide, per chiave
// («metodo», «biotipo:<id>», «consiglio:<id>», «articolo:<slug>»). Le scrive la pubblicazione dall'admin; qui c'è solo
// quello che si può dire sul sito: «rivisto da … il …» compare solo dove la revisione c'è davvero.
export type Revisione = { chi: string; data: string };
export const REVISIONI = (revisioni as unknown as { revisioni: Record<string, Revisione> }).revisioni;
export const revisione = (chiave: string): Revisione | null => REVISIONI[chiave] || null;
export const dataLunga = (d: string) => new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

// IL CONTENUTO CHE SI APPROVA (7/11/2026): il testo che Sofia ha letto. Lo stesso calcolo è in scripts/admin/pubblica.py
// (contenuti): se cambia uno, cambiare anche l'altro.
export const VERSIONI_METODO = { test: (test as { _versione?: string })._versione || '', biotipi: (biotipi as { _versione?: string })._versione || '' };
export const contenutoMetodo = (v = VERSIONI_METODO) => `test ${v.test} · biotipi ${v.biotipi}`;
export const contenutoBiotipo = (b: Biotipo) => [b.titolo, b.motto, b.descrizione, ...(b.caratteristiche || []), ...(b.cerca || []), ...(b.evita || [])].join('\n');
export const contenutoArticolo = (a: { titolo: string; sommario: string; testo: string }) => [a.titolo, a.sommario, a.testo].join('\n');
