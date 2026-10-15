// I DATI DEL SITO: test, biotipi, glossario, catalogo, rivista.
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
};
export type CategoriaCatalogo = { id: string; nome: string; regola: RegolaProdotti; immagine: string; descrizione: string };
export type TagCatalogo = { id: string; nome: string; regola: RegolaProdotti; descrizione: string };
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
  pubblicato_il: string;
  aggiornato_il?: string;
};

export const TEST = test as unknown as Test;
export const BIOTIPI = (biotipi as unknown as { biotipi: Biotipo[] }).biotipi;
export const TAG_BIOTIPI = (biotipi as unknown as { tag: TagBiotipo[] }).tag;
export const TERMINI = (glossario as unknown as { termini: Termine[] }).termini;
export const CATALOGO = catalogo as unknown as Catalogo;
export const ARTICOLI = ((rivista as unknown as { articoli: Articolo[] }).articoli || [])
  .slice()
  .sort((a, b) => b.pubblicato_il.localeCompare(a.pubblicato_il));

// Gli attivi spiegati (src/data/attivi.json): la home li racconta, il catalogo li usa come filtro.
export type Attivo = { id: string; nome: string; nomi: string[]; termine: string; cosa: string; per_chi: string; attenzione: string };
export const ATTIVI = (attivi as unknown as { attivi: Attivo[] }).attivi;
export const conAttivo = (p: { scheda?: { attivi: { nome: string }[] } }, a: Attivo) => !!p.scheda?.attivi.some((x) => a.nomi.includes(x.nome));

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
