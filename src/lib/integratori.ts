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
  principale?: string;      // l'indicazione che il test scrive accanto al prodotto («Perché questo»)
};

const PELLE = 'contribuisce al mantenimento di pelle normale';

const IMMUNITARIO = 'contribuisce alla normale funzione del sistema immunitario';
const STANCHEZZA = "contribuisce alla riduzione della stanchezza e dell'affaticamento";
const PSICOLOGICA = 'contribuisce alla normale funzione psicologica';

export const BISOGNI: Bisogno[] = [
  // IL GIRO INTEGRATIVO (23/10/2026): i bisogni di tutti i giorni, prima di quelli della pelle
  {
    chiave: 'sonno', biotipo: 'riposo', domanda: 'Fatico ad addormentarmi',
    principale: 'la melatonina contribuisce alla riduzione del tempo richiesto per prendere sonno (1 mg poco prima di coricarsi)',
    autorizzati: [
      { nome: 'Melatonina (1 mg poco prima di coricarsi)', indicazione: 'contribuisce alla riduzione del tempo richiesto per prendere sonno' },
      { nome: 'Melatonina (0,5 mg)', indicazione: 'contribuisce ad alleviare gli effetti soggettivi del jet lag' },
    ],
    senza: ['valeriana', 'camomilla', 'passiflora', 'griffonia (5-HTP)'],
    nota: 'In Italia gli integratori di melatonina arrivano a 1 mg. Non si prende in gravidanza; con sedativi, antidepressivi o anticoagulanti solo dopo averne parlato col medico.',
  },
  {
    chiave: 'energia', biotipo: 'energia', domanda: 'Stanchezza a metà giornata',
    principale: STANCHEZZA,
    autorizzati: [
      { nome: 'Magnesio', indicazione: STANCHEZZA },
      { nome: 'Vitamina B12', indicazione: STANCHEZZA },
      { nome: 'Vitamina B6', indicazione: STANCHEZZA },
      { nome: 'Vitamina C', indicazione: STANCHEZZA },
    ],
    senza: ['guaranà', 'ginseng', 'caffeina', 'coenzima Q10', 'shilajit'],
    nota: 'Una stanchezza che dura da settimane si fa vedere al medico: può dipendere dal ferro, dalla tiroide o da altro, e un esame del sangue lo dice meglio di un integratore.',
  },
  {
    chiave: 'stress', biotipo: 'calma', domanda: 'Periodi di pressione e nervi tesi',
    principale: PSICOLOGICA,
    autorizzati: [
      { nome: 'Magnesio', indicazione: PSICOLOGICA },
      { nome: 'Magnesio', indicazione: 'contribuisce al normale funzionamento del sistema nervoso' },
      { nome: 'Vitamina B6', indicazione: PSICOLOGICA },
      { nome: 'Vitamina B12', indicazione: PSICOLOGICA },
    ],
    senza: ['ashwagandha', 'rodiola', 'griffonia (5-HTP)', 'melissa', 'biancospino'],
    nota: 'Ansia o umore giù da settimane non sono un bisogno da integratore: se ne parla col medico.',
  },
  {
    chiave: 'difese', biotipo: 'difese', domanda: 'Raffreddori frequenti, poca frutta e verdura',
    principale: IMMUNITARIO,
    autorizzati: [
      { nome: 'Vitamina C', indicazione: IMMUNITARIO },
      { nome: 'Vitamina D', indicazione: IMMUNITARIO },
      { nome: 'Zinco', indicazione: IMMUNITARIO },
      { nome: 'Selenio', indicazione: IMMUNITARIO },
    ],
    senza: ['echinacea', 'propoli', 'uncaria', 'beta-glucani', 'fermenti lattici'],
    nota: 'Chi mangia frutta e verdura ogni giorno di solito ha già la vitamina C che serve: l\'integratore ha senso quando mancano.',
  },
  {
    chiave: 'vitamina-d', biotipo: 'vitamina-d', domanda: 'Poco sole, soprattutto d\'inverno',
    principale: 'la vitamina D contribuisce al mantenimento di ossa normali e alla normale funzione del sistema immunitario',
    autorizzati: [
      { nome: 'Vitamina D', indicazione: 'contribuisce al mantenimento di ossa normali' },
      { nome: 'Vitamina D', indicazione: 'contribuisce al mantenimento della normale funzione muscolare' },
      { nome: 'Vitamina D', indicazione: IMMUNITARIO },
    ],
    senza: ['vitamina D «alta dose» senza esami'],
    nota: 'Oltre 50 mcg (2000 UI) al giorno solo su indicazione del medico. La vitamina K2, che spesso l\'accompagna, con gli anticoagulanti va chiesta prima al medico.',
  },
  {
    chiave: 'omega-3', biotipo: 'omega-3', domanda: 'Poco pesce nel piatto',
    principale: 'EPA e DHA contribuiscono alla normale funzione cardiaca (con 250 mg al giorno)',
    autorizzati: [
      { nome: 'EPA e DHA (250 mg al giorno)', indicazione: 'contribuiscono alla normale funzione cardiaca' },
      { nome: 'DHA (250 mg al giorno)', indicazione: 'contribuisce al mantenimento della normale funzione cerebrale' },
      { nome: 'DHA (250 mg al giorno)', indicazione: 'contribuisce al mantenimento della capacità visiva normale' },
    ],
    senza: ['omega 3 per la pelle (nessuna indicazione autorizzata)', 'omega 6 e omega 9'],
    nota: 'Chi prende anticoagulanti ne parla prima col medico. Chi non mangia pesce trova gli omega-3 nell\'olio di alghe.',
  },
  {
    chiave: 'b12', biotipo: 'vegana', domanda: 'Mangio vegano',
    principale: 'la vitamina B12 contribuisce alla formazione normale dei globuli rossi',
    autorizzati: [
      { nome: 'Vitamina B12', indicazione: 'contribuisce alla formazione normale dei globuli rossi' },
      { nome: 'Vitamina B12', indicazione: IMMUNITARIO },
      { nome: 'Vitamina B12', indicazione: STANCHEZZA },
    ],
    senza: ['alghe spirulina e clorella come fonte di B12 (contengono forme che non funzionano)'],
    nota: 'Chi mangia vegano ha bisogno della B12 da un integratore o da alimenti arricchiti: le società di nutrizione lo dicono tutte.',
  },
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
