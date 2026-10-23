// GLI INTEGRATORI PER BISOGNO (23/10/2026, Federico: «la parte relativa all'integrazione basata sui bisogni,
// specifica sugli argomenti, in base alle necessità; un po' come Proteo ma per gli argomenti»).
//
// I bisogni sono i biotipi dell'area «integrazione» (src/data/biotipi.json), gli stessi del test: qui si aggiunge
// quello che una pagina di integratori deve dire e una scheda di biotipo non diceva.
//   - GLI ATTIVI CON UN'INDICAZIONE AUTORIZZATA IN UE. Le frasi tra virgolette sono quelle del Regolamento (UE)
//     432/2012, parola per parola: sono le sole che un integratore può scrivere sulla confezione, e le sole che
//     scriviamo noi. Niente «rinforza», «ringiovanisce», «stimola».
//   - GLI ATTIVI SENZA. Collagene, acido ialuronico, cheratina e simili sono nei prodotti ma non hanno
//     un'indicazione autorizzata: si dice, senza toni da allarme.
//   - I PRODOTTI. Quelli del catalogo col bisogno nel loro `lavoro` (lo scrive scripts/catalogo/al_sito.py), prima
//     i più completi e poi i più costosi: è la richiesta del 23/10, «i più validi e i più costosi».
import { PRODOTTI, type Prodotto } from './catalogo';

export type Attivo = { nome: string; indicazione: string };
export type Bisogno = {
  chiave: string;           // il `lavoro` dei prodotti e l'opzione di int_obiettivo nel test
  biotipo: string;          // la pagina /biotipi/<id>
  domanda: string;          // come lo dice chi lo cerca
  autorizzati: Attivo[];
  senza: string[];          // attivi frequenti senza indicazione autorizzata
  nota?: string;
};

const PELLE = 'contribuisce al mantenimento di pelle normale';

export const BISOGNI: Bisogno[] = [
  {
    chiave: 'capelli', biotipo: 'sostegno-capelli', domanda: 'Capelli che cadono o si indeboliscono',
    autorizzati: [
      { nome: 'Biotina', indicazione: 'contribuisce al mantenimento di capelli normali' },
      { nome: 'Zinco', indicazione: 'contribuisce al mantenimento di capelli normali' },
      { nome: 'Selenio', indicazione: 'contribuisce al mantenimento di capelli normali' },
      { nome: 'Rame', indicazione: 'contribuisce alla normale pigmentazione dei capelli' },
    ],
    senza: ['cistina', 'metionina', 'cheratina', 'miglio'],
    nota: 'Una caduta che dura da mesi, o a chiazze, si fa vedere a un medico prima di provare un integratore.',
  },
  {
    chiave: 'pelle-secca', biotipo: 'pelle-idratazione', domanda: 'Pelle secca o spenta',
    autorizzati: [
      { nome: 'Vitamina A', indicazione: PELLE },
      { nome: 'Biotina', indicazione: PELLE },
      { nome: 'Niacina (vitamina B3)', indicazione: PELLE },
      { nome: 'Riboflavina (vitamina B2)', indicazione: PELLE },
      { nome: 'Zinco', indicazione: PELLE },
    ],
    senza: ['acido ialuronico', 'ceramidi', 'omega 3 (le indicazioni autorizzate sono per cuore e cervello)'],
  },
  {
    chiave: 'tono', biotipo: 'tono-collagene', domanda: 'Tono ed elasticità della pelle',
    autorizzati: [
      { nome: 'Vitamina C', indicazione: 'contribuisce alla normale formazione del collagene per la normale funzione della pelle' },
    ],
    senza: ['collagene', 'acido ialuronico', 'peptidi'],
    nota: 'Il collagene che si beve si digerisce come le altre proteine: gli studi che lo legano alla pelle sono pochi e piccoli.',
  },
  {
    chiave: 'sole', biotipo: 'preparazione-sole', domanda: 'Preparare la pelle al sole',
    autorizzati: [
      { nome: 'Vitamina C', indicazione: 'contribuisce alla protezione delle cellule dallo stress ossidativo' },
      { nome: 'Vitamina E', indicazione: 'contribuisce alla protezione delle cellule dallo stress ossidativo' },
      { nome: 'Selenio', indicazione: 'contribuisce alla protezione delle cellule dallo stress ossidativo' },
      { nome: 'Rame', indicazione: 'contribuisce alla normale pigmentazione della pelle' },
    ],
    senza: ['beta-carotene', 'licopene', 'luteina', 'polypodium leucotomos'],
    nota: 'Nessun integratore sostituisce la crema solare: si aggiunge, non si scambia.',
  },
  {
    chiave: 'unghie', biotipo: 'unghie-fragili', domanda: 'Unghie fragili',
    autorizzati: [
      { nome: 'Zinco', indicazione: 'contribuisce al mantenimento di unghie normali' },
      { nome: 'Selenio', indicazione: 'contribuisce al mantenimento di unghie normali' },
    ],
    senza: ['biotina (per le unghie non ha un\'indicazione autorizzata)', 'cistina', 'silicio', 'cheratina'],
  },
  {
    chiave: 'imperfezioni', biotipo: 'imperfezioni-interno', domanda: 'Brufoli che vanno e vengono',
    autorizzati: [
      { nome: 'Zinco', indicazione: PELLE },
      { nome: 'Vitamina A', indicazione: PELLE },
      { nome: 'Niacina (vitamina B3)', indicazione: PELLE },
    ],
    senza: ['lievito di birra', 'fermenti lattici', 'bardana'],
    nota: 'Con brufoli grossi, profondi o che lasciano cicatrici serve il dermatologo: un integratore non basta.',
  },
];

export const bisognoPerBiotipo = (id: string) => BISOGNI.find((b) => b.biotipo === id);

// Prima i più completi (il «valore» della scheda: quanto sappiamo e quanto contiene), poi i più costosi.
export function prodottiDelBisogno(chiave: string, quanti = 12): Prodotto[] {
  return PRODOTTI.filter((p) => p.category === 'integratori' && (p.scheda?.lavoro || []).some((l) => l.split('+').includes(chiave)))
    .sort((a, b) => ((b.scheda?.valore ?? 0) - (a.scheda?.valore ?? 0)) || (b.price - a.price))
    .slice(0, quanti);
}
