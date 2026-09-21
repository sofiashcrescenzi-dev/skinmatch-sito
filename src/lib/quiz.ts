// Motore di raccomandazione del test "Trova il tuo SkinMatch".
//
// Non è un dispositivo medico né una diagnosi dermatologica: incrocia le
// risposte con i tag assegnati ai prodotti reali del catalogo (vedi
// products.ts) per suggerire una routine di partenza. In presenza di
// gravidanza/allattamento o di patologie cutanee dichiarate, applichiamo
// filtri prudenziali (pregnancySafe / sensitiveSafe) e mostriamo un invito
// a parlarne comunque con un medico o un dermatologo.

import {
  PRODUCTS,
  type Product,
  type Gender,
  type SkinType,
  type Concern,
  type HairConcern,
  type BeardConcern,
  type Tier,
} from './products';

export type SunExposure = 'bassa' | 'media' | 'alta';
export type OilySubtype = 'idratata' | 'acneica' | 'seborroica-secca';
export type DandruffSubtype = 'grassa' | 'secca';

export type QuizAnswers = {
  gender: Extract<Gender, 'donna' | 'uomo'>;
  pregnant: boolean;
  skinType: SkinType;
  sensitiveSkin: boolean;
  oilySubtype: OilySubtype | null; // solo se skinType è grassa/mista
  goal: Concern;
  pigmentedSkin: boolean; // macchie/discromie — indipendente dal biotipo di base
  conditions: string[];
  sunExposure: SunExposure;
  lifestyle: string[];
  environment: string;
  hairConcern: HairConcern;
  dandruffSubtype: DandruffSubtype | null; // solo se hairConcern è forfora
  beardConcern: BeardConcern | null;
  pricePref: Tier | 'nessuna';
};

export type BiotypeKind = 'pelle' | 'cuoio-capelluto' | 'tratto';
export type Biotype = {
  id: string;
  kind: BiotypeKind;
  title: string;
  description: string;
  characteristics: string[];
  lookFor: string[];
  avoid: string[];
  relatedConcern?: Concern;
  relatedHairConcern?: HairConcern;
};

export type QuizResult = {
  skinBiotype: Biotype;
  skinTraits: Biotype[];
  scalpBiotype: Biotype;
  routine: Product[];
  hair: Product[];
  beard: Product[];
  integratori: Product[];
  disclaimerCondizioni: boolean;
};

const SKIN_BIOTYPES: Record<string, Biotype> = {
  atopica: {
    id: 'atopica',
    kind: 'pelle',
    title: 'Pelle atopica',
    description:
      'La tua pelle ha una barriera cutanea costituzionalmente più fragile, che fatica a trattenere acqua e a proteggersi dagli irritanti esterni. Tende a secchezza persistente, prurito e arrossamenti (dermatite atopica). Ha bisogno di prodotti molto delicati, senza profumo, pensati per rinforzare il film idrolipidico.',
    characteristics: [
      'Secchezza persistente, anche cronica',
      'Prurito frequente, soprattutto nelle pieghe (gomiti, ginocchia, collo)',
      'Arrossamenti e chiazze ruvide',
      'Barriera cutanea più permeabile su base costituzionale',
      'Riacutizzazioni con freddo, stress o alcuni tessuti',
    ],
    lookFor: ['Ceramidi e lipidi (colesterolo, acidi grassi)', 'Formule senza profumo', 'Emollienti ricchi (burri, oli vegetali)', 'Detergenti extra-delicati, senza tensioattivi aggressivi'],
    avoid: ['Profumi e oli essenziali', 'Alcol denaturato ad alte concentrazioni', 'Esfolianti fisici o chimici aggressivi', 'Detergenti schiumogeni con SLS'],
    relatedConcern: 'barriera-cutanea',
  },
  psoriasica: {
    id: 'psoriasica',
    kind: 'pelle',
    title: 'Pelle con psoriasi',
    description:
      'Condizione infiammatoria cronica su base autoimmune, con un ricambio cellulare accelerato che forma placche ispessite, arrossate e ricoperte da squame argentee. È diagnosticabile e va gestita con un dermatologo: la skincare può accompagnare la terapia, non sostituirla.',
    characteristics: [
      'Placche ispessite, arrossate, ben delimitate',
      'Squame argentee o biancastre in superficie',
      'Prurito, a volte bruciore o dolore',
      'Zone tipiche: gomiti, ginocchia, cuoio capelluto, ma anche viso',
      'Andamento a fasi, con remissioni e riacutizzazioni',
    ],
    lookFor: ['Emollienti ricchi, ceramidi', 'Formule senza profumo', 'Detergenti extra-delicati'],
    avoid: ['Esfolianti fisici o chimici sulle placche attive', 'Profumo e alcol', 'Interrompere la terapia dermatologica senza parlarne con lo specialista'],
    relatedConcern: 'barriera-cutanea',
  },
  'disidratata-sensibile': {
    id: 'disidratata-sensibile',
    kind: 'pelle',
    title: 'Pelle disidratata e sensibile, con barriera danneggiata',
    description:
      "Manca di acqua — non necessariamente di sebo — e la barriera che dovrebbe proteggerla è indebolita: capita con detergenti aggressivi, stress, freddo o esfolianti troppo frequenti. Si arrossa facilmente, tira, a volte brucia con prodotti nuovi. La priorità è riparare la barriera prima di tutto il resto.",
    characteristics: [
      'Sensazione di tirare, soprattutto dopo la detersione',
      'Arrossamenti reattivi a prodotti nuovi',
      'Bruciore o pizzicore occasionale',
      'Barriera cutanea indebolita (spesso da over-esfoliazione)',
      'Texture opaca, a volte desquamata a chiazze',
    ],
    lookFor: ['Ceramidi, niacinamide, pantenolo', 'Formule minimaliste, poche referenze attive alla volta', 'Texture in crema/balsamo, non gel astringenti'],
    avoid: ['Acidi esfolianti ad alta concentrazione', 'Detersione con acqua troppo calda', 'Profumo e alcol'],
    relatedConcern: 'barriera-cutanea',
  },
  acneica: {
    id: 'acneica',
    kind: 'pelle',
    title: 'Pelle acneica',
    description:
      "Produzione di sebo elevata associata a un'alterata cheratinizzazione dei follicoli: i pori si ostruiscono più facilmente, favorendo comedoni, punti neri e brufoli. Va trattata con delicatezza — detergenti troppo sgrassanti peggiorano la produzione di sebo per compenso.",
    characteristics: [
      'Punti neri e punti bianchi (comedoni)',
      'Papule e pustole infiammate',
      'Pelle spesso lucida/untuosa nella zona T',
      'Pori dilatati',
      'Possibili esiti post-infiammatori (macchie o cicatrici)',
    ],
    lookFor: ['Niacinamide', 'Acido salicilico (BHA) a basse percentuali', 'Formule oil-free, non comedogene'],
    avoid: ['Oli comedogeni pesanti', 'Detersione troppo aggressiva o frequente', 'Prodotti alcolici astringenti in eccesso'],
    relatedConcern: 'acne-sebo',
  },
  'seborroica-secca': {
    id: 'seborroica-secca',
    kind: 'pelle',
    title: 'Pelle seborroica-secca',
    description:
      'Una combinazione che confonde: le ghiandole sebacee sono iperattive in alcune zone (fronte, naso, mento) ma la superficie appare secca o desquamata, spesso per un’alterazione della barriera o una lieve dermatite seborroica del viso. Serve equilibrio: detergere senza seccare, idratare senza appesantire.',
    characteristics: [
      'Zona T lucida/grassa ma guance che tirano o desquamano',
      'Possibile prurito o arrossamento tra sopracciglia e lati del naso',
      'Texture irregolare, a chiazze',
      'Sensibilità ai detergenti sgrassanti',
    ],
    lookFor: ['Detergenti delicati non schiumogeni', 'Idratanti leggeri ma non occlusivi', 'Niacinamide, zinco PCA'],
    avoid: ['Detergenti troppo sgrassanti', 'Creme molto ricche e occlusive su tutto il viso'],
    relatedConcern: 'barriera-cutanea',
  },
  'seborroica-idratata': {
    id: 'seborroica-idratata',
    kind: 'pelle',
    title: 'Pelle seborroica idratata',
    description:
      'Sebo abbondante ma barriera cutanea integra e buona idratazione: la pelle è lucida, soprattutto nella zona T, con pori più visibili, ma raramente tira o si irrita. È il tipo di pelle grassa più semplice da gestire.',
    characteristics: ['Pelle lucida, soprattutto nella zona T', 'Pori dilatati ma texture uniforme', 'Nessuna reale secchezza o tensione', 'Rara sensibilità o irritazione'],
    lookFor: ['Formule leggere, gel-crema', 'Niacinamide per opacizzare senza seccare', 'Acidi esfolianti leggeri (PHA, mandelico) per la texture'],
    avoid: ['Creme troppo ricche o occlusive', 'Oli pesanti non necessari'],
    relatedConcern: 'pori-dilatati',
  },
  'idratata-mista': {
    id: 'idratata-mista',
    kind: 'pelle',
    title: 'Pelle idratata mista',
    description:
      'Zona T (fronte, naso, mento) più grassa, guance normali o quasi secche, ma senza reale disidratazione né irritazione. È il tipo di pelle più comune: la routine deve bilanciare le due zone senza esagerare in nessuna direzione.',
    characteristics: ['Zona T (fronte, naso, mento) più grassa', 'Guance normali o leggermente secche', 'Texture generalmente uniforme', 'Poche imperfezioni'],
    lookFor: ['Formule bilanciate, non troppo ricche né troppo leggere', 'Routine differenziata per zone, se necessario'],
    avoid: ['Prodotti pensati solo per pelli grasse (possono seccare le guance)', 'Prodotti molto ricchi pensati solo per pelli secche (appesantiscono la zona T)'],
    relatedConcern: 'idratazione',
  },
  secca: {
    id: 'secca',
    kind: 'pelle',
    title: 'Pelle secca',
    description:
      'Produzione di sebo ridotta: la pelle tende a tirare, può apparire opaca o con una texture ruvida, soprattutto in inverno o con aria secca. Ha bisogno di lipidi e umettanti per restare confortevole tutto il giorno.',
    characteristics: ['Sensazione di tensione, soprattutto dopo la detersione', 'Texture opaca o ruvida', 'Possibile desquamazione visibile', 'Pori poco visibili', 'Peggiora con freddo e aria secca'],
    lookFor: ['Acido ialuronico e glicerina (umettanti)', 'Burri e oli (emollienti)', 'Ceramidi per rinforzare la barriera'],
    avoid: ['Detergenti schiumogeni aggressivi', 'Alcol denaturato', 'Esfoliazione troppo frequente'],
    relatedConcern: 'idratazione',
  },
  normale: {
    id: 'normale',
    kind: 'pelle',
    title: 'Pelle normale-equilibrata',
    description:
      'Produzione di sebo e livello di idratazione ben bilanciati, poche imperfezioni. La routine serve soprattutto a mantenere questo equilibrio nel tempo, non a correggere un problema specifico.',
    characteristics: ['Sebo e idratazione bilanciati', 'Texture uniforme', 'Poche imperfezioni', 'Buona tolleranza a nuovi prodotti'],
    lookFor: ['Routine semplice di mantenimento: detergente delicato, siero antiossidante, crema idratante, protezione solare'],
    avoid: ['Routine eccessivamente complesse, non necessarie'],
    relatedConcern: 'idratazione',
  },
};

const SCALP_BIOTYPES: Record<string, Biotype> = {
  diradamento: {
    id: 'diradamento',
    kind: 'cuoio-capelluto',
    title: 'Cute con tendenza al diradamento',
    description:
      'Il cuoio capelluto può essere nella norma, ma la densità dei capelli si sta riducendo: può dipendere da fattori ormonali, stress, carenze nutrizionali o predisposizione genetica. Prodotti energizzanti aiutano, ma se il fenomeno persiste vale la pena farlo valutare da uno specialista.',
    characteristics: ['Capelli visibilmente più radi o sottili nel tempo', 'Maggiore evidenza del cuoio capelluto (vertice, attaccatura)', 'Possibile aumento della caduta quotidiana', 'Cuoio capelluto spesso nella norma'],
    lookFor: ['Aminexil, caffeina', 'Integratori con zinco/BioEquolo', 'Shampoo energizzanti, fiale anticaduta senza risciacquo'],
    avoid: ['Styling che tira il capello (trazione)', 'Aspettare troppo prima di intervenire se la caduta persiste'],
    relatedHairConcern: 'caduta',
  },
  seborroico: {
    id: 'seborroico',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto seborroico',
    description:
      'Le ghiandole sebacee del cuoio capelluto sono iperattive: i capelli si ungono in fretta e può comparire una forfora giallastra e untuosa (dermatite seborroica del cuoio capelluto). Serve un lavaggio più frequente, con prodotti che regolano il sebo senza irritare.',
    characteristics: ['Capelli che si ungono in fretta (1-2 giorni dal lavaggio)', 'Forfora giallastra, a scaglie untuose', 'Possibile prurito lieve', 'Cuoio capelluto lucido'],
    lookFor: ['Shampoo sebo-regolatori', 'Zinco piritione, acido salicilico', 'Lavaggi più frequenti con prodotti delicati'],
    avoid: ['Balsami o maschere applicati direttamente sul cuoio capelluto', 'Diradare troppo i lavaggi "per abituare" il cuoio capelluto'],
    relatedHairConcern: 'forfora',
  },
  'secco-desquamante': {
    id: 'secco-desquamante',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto secco e desquamante',
    description:
      'Il cuoio capelluto produce poco sebo e tende a seccarsi, con prurito e una forfora bianca e sottile che si stacca facilmente. Ha bisogno di lavaggi delicati e nutrienti, mai troppo sgrassanti.',
    characteristics: ['Forfora bianca, sottile, a scagliette', 'Prurito frequente', 'Cuoio capelluto che tira o è sensibile', 'Capelli spesso opachi'],
    lookFor: ['Shampoo delicati, senza solfati aggressivi', 'Piroctone olamine, oli leggeri lenitivi'],
    avoid: ['Shampoo sgrassanti/anti-grasso', 'Acqua molto calda durante il lavaggio'],
    relatedHairConcern: 'forfora',
  },
  'capelli-secchi': {
    id: 'capelli-secchi',
    kind: 'cuoio-capelluto',
    title: 'Capelli secchi e disidratati',
    description:
      'Il cuoio capelluto è spesso nella norma, ma la fibra capillare in lunghezza è disidratata, opaca o crespa (calore, colorazioni, agenti atmosferici). Serve un trattamento nutriente sulle lunghezze, non necessariamente sulla cute.',
    characteristics: ['Lunghezze opache, ruvide al tatto', 'Doppie punte, effetto crespo', 'Cuoio capelluto spesso normale', 'Capelli che si spezzano facilmente'],
    lookFor: ['Sieri e maschere nutrienti sulle lunghezze', 'Trattamenti proteici occasionali', 'Protezione dal calore'],
    avoid: ['Calore eccessivo senza protezione', 'Acqua molto calda', 'Spazzolatura aggressiva da bagnati'],
    relatedHairConcern: 'secchi-crespi',
  },
  equilibrato: {
    id: 'equilibrato',
    kind: 'cuoio-capelluto',
    title: 'Cuoio capelluto equilibrato',
    description: 'Nessuna problematica particolare: l’obiettivo è mantenere questo equilibrio con una routine di manutenzione leggera.',
    characteristics: ['Nessuna problematica evidente', 'Capelli che mantengono volume e lucentezza tra un lavaggio e l’altro', 'Cuoio capelluto confortevole, senza prurito o untuosità eccessiva'],
    lookFor: ['Routine di mantenimento leggera', 'Shampoo delicato, trattamenti mirati solo all’occorrenza'],
    avoid: ['Cambiare prodotto troppo spesso senza un vero motivo'],
    relatedHairConcern: 'mantenimento',
  },
};

// Tratti indipendenti: possono aggiungersi a QUALSIASI biotipo di pelle di
// base (es. "pelle acneica" + "con tendenza a macchie"). Non sostituiscono
// il biotipo primario, lo completano.
const SKIN_TRAITS: Record<string, Biotype> = {
  macchie: {
    id: 'macchie',
    kind: 'tratto',
    title: 'Con tendenza a macchie e discromie',
    description:
      'Oltre alle caratteristiche del tuo biotipo, la tua pelle tende a sviluppare macchie scure, segni post-infiammatori o discromie — comuni dopo acne, esposizione solare non protetta o semplicemente con il tempo.',
    characteristics: ['Macchie scure localizzate (macchie solari, post-acne)', 'Incarnato disomogeneo', 'Le macchie si accentuano con l’esposizione solare'],
    lookFor: ['Vitamina C, niacinamide, acido azelaico', 'Protezione solare quotidiana — senza, le macchie non schiariscono', 'Esfolianti delicati per uniformare la texture'],
    avoid: ['Esposizione solare senza protezione', 'Manipolare o schiacciare le imperfezioni (peggiora le macchie post-infiammatorie)'],
    relatedConcern: 'macchie-luminosita',
  },
  rosacea: {
    id: 'rosacea',
    kind: 'tratto',
    title: 'Con tendenza a rosacea/couperose',
    description:
      'Oltre alle caratteristiche del tuo biotipo, la tua pelle mostra arrossamenti persistenti, vampate o capillari visibili, tipici della rosacea. È una condizione diagnosticabile: se non l’hai già fatto, vale la pena parlarne con un dermatologo.',
    characteristics: ['Arrossamento persistente, soprattutto su guance e naso', 'Vampate improvvise (calore, alcol, cibi piccanti, sole)', 'Capillari visibili', 'Pelle spesso reattiva a nuovi prodotti'],
    lookFor: ['Formule lenitive (centella, niacinamide, azelaico)', 'Protezione solare rigorosa — il sole è un trigger frequente', 'Prodotti senza profumo, poche referenze attive alla volta'],
    avoid: ['Sbalzi di temperatura, alcol, cibi molto speziati (trigger comuni)', 'Esfolianti fisici o chimici aggressivi', 'Alcol denaturato e oli essenziali'],
    relatedConcern: 'rossori-sensibilita',
  },
  matura: {
    id: 'matura',
    kind: 'tratto',
    title: 'Con segni di invecchiamento cutaneo',
    description:
      'Oltre alle caratteristiche del tuo biotipo, la tua pelle mostra una minore elasticità, rughe o perdita di volume — normale con il tempo, e gestibile con gli attivi giusti.',
    characteristics: ['Minore elasticità e tono', 'Rughe sottili o più marcate', 'Perdita di volume nelle guance/contorno viso'],
    lookFor: ['Retinoidi (se non in gravidanza/allattamento)', 'Peptidi, vitamina C, acido ialuronico ad alto peso molecolare', 'Protezione solare quotidiana — il fotoinvecchiamento è la causa più prevenibile'],
    avoid: ['Aspettarsi risultati immediati (gli attivi anti-age richiedono settimane/mesi)', 'Saltare la protezione solare'],
    relatedConcern: 'anti-age',
  },
};

export const ALL_BIOTYPES: Biotype[] = [...Object.values(SKIN_BIOTYPES), ...Object.values(SCALP_BIOTYPES), ...Object.values(SKIN_TRAITS)];

export function getBiotypeById(id: string): Biotype | undefined {
  return ALL_BIOTYPES.find((b) => b.id === id);
}

export function getSkinBiotype(a: QuizAnswers): Biotype {
  if (a.conditions.includes('dermatite')) return SKIN_BIOTYPES.atopica;
  if (a.conditions.includes('psoriasi')) return SKIN_BIOTYPES.psoriasica;
  if (a.sensitiveSkin && a.skinType === 'secca') {
    return SKIN_BIOTYPES['disidratata-sensibile'];
  }
  if (a.skinType === 'grassa' || a.skinType === 'mista') {
    if (a.oilySubtype === 'acneica') return SKIN_BIOTYPES.acneica;
    if (a.oilySubtype === 'seborroica-secca') return SKIN_BIOTYPES['seborroica-secca'];
    return a.skinType === 'mista' ? SKIN_BIOTYPES['idratata-mista'] : SKIN_BIOTYPES['seborroica-idratata'];
  }
  if (a.skinType === 'secca') return SKIN_BIOTYPES.secca;
  return SKIN_BIOTYPES.normale;
}

// Tratti indipendenti: si sommano al biotipo primario, non lo sostituiscono
// (es. "pelle acneica" + "con tendenza a macchie" sono compatibili).
export function getSkinTraits(a: QuizAnswers): Biotype[] {
  const traits: Biotype[] = [];
  if (a.conditions.includes('rosacea')) traits.push(SKIN_TRAITS.rosacea);
  if (a.pigmentedSkin) traits.push(SKIN_TRAITS.macchie);
  if (a.goal === 'anti-age') traits.push(SKIN_TRAITS.matura);
  return traits;
}

export function getScalpBiotype(a: QuizAnswers): Biotype {
  if (a.hairConcern === 'caduta') return SCALP_BIOTYPES.diradamento;
  if (a.hairConcern === 'forfora') {
    return a.dandruffSubtype === 'secca' ? SCALP_BIOTYPES['secco-desquamante'] : SCALP_BIOTYPES.seborroico;
  }
  if (a.hairConcern === 'secchi-crespi') return SCALP_BIOTYPES['capelli-secchi'];
  return SCALP_BIOTYPES.equilibrato;
}

function passesHardFilters(p: Product, a: QuizAnswers): boolean {
  if (p.gender !== 'unisex' && p.gender !== a.gender) return false;
  // La rosacea, come la pelle sensibile, richiede prudenza sugli attivi aggressivi.
  if ((a.sensitiveSkin || a.conditions.includes('rosacea')) && p.sensitiveSafe === false) return false;
  if (a.pregnant && p.pregnancySafe === false) return false;
  return true;
}

function skincareScore(p: Product, a: QuizAnswers): number {
  let score = 0;
  if (p.skinTypes?.includes(a.skinType)) score += 3;
  if (a.sensitiveSkin && p.skinTypes?.includes('sensibile')) score += 2;
  if (p.concerns?.includes(a.goal)) score += 3;
  // Tratti aggiuntivi (indipendenti dal biotipo primario): danno un bonus
  // ai prodotti pertinenti, senza escludere gli altri.
  if (a.conditions.includes('rosacea') && p.concerns?.includes('rossori-sensibilita')) score += 2;
  if (a.pigmentedSkin && p.concerns?.includes('macchie-luminosita')) score += 2;
  if (a.pricePref !== 'nessuna' && p.tier === a.pricePref) score += 1;
  return score;
}

function bestOf(candidates: Product[], score: (p: Product) => number, exclude: string[] = []): Product | null {
  const pool = candidates.filter((p) => !exclude.includes(p.id));
  if (pool.length === 0) return null;
  return pool.reduce<{ p: Product; s: number } | null>((best, p) => {
    const s = score(p);
    if (!best || s > best.s) return { p, s };
    return best;
  }, null)!.p;
}

export function getRecommendation(a: QuizAnswers): QuizResult {
  const safe = PRODUCTS.filter((p) => passesHardFilters(p, a));

  const usedIds: string[] = [];
  const routine: Product[] = [];

  const detergente = bestOf(safe.filter((p) => p.category === 'detergenti'), (p) => skincareScore(p, a));
  if (detergente) { routine.push(detergente); usedIds.push(detergente.id); }

  const siero = bestOf(safe.filter((p) => p.category === 'sieri'), (p) => skincareScore(p, a), usedIds);
  if (siero) { routine.push(siero); usedIds.push(siero.id); }

  const crema = bestOf(safe.filter((p) => p.category === 'creme' && !p.concerns?.includes('protezione-solare')), (p) => skincareScore(p, a), usedIds);
  if (crema) { routine.push(crema); usedIds.push(crema.id); }

  if (a.sunExposure !== 'bassa') {
    const spf = bestOf(
      safe.filter((p) => p.category === 'creme' && p.concerns?.includes('protezione-solare')),
      (p) => skincareScore(p, a),
      usedIds
    );
    if (spf) { routine.push(spf); usedIds.push(spf.id); }
  }

  // Capelli: uno shampoo + un trattamento specifico
  const hair: Product[] = [];
  const hairScore = (p: Product) => (p.hairConcerns?.includes(a.hairConcern) ? 3 : 0) + (a.pricePref !== 'nessuna' && p.tier === a.pricePref ? 1 : 0);
  const shampoo = bestOf(safe.filter((p) => p.category === 'shampoo'), hairScore);
  if (shampoo) hair.push(shampoo);
  const trattamentoCapelli = bestOf(safe.filter((p) => p.category === 'capelli'), hairScore, shampoo ? [shampoo.id] : []);
  if (trattamentoCapelli) hair.push(trattamentoCapelli);

  // Barba: solo per il ramo uomo
  const beard: Product[] = [];
  if (a.gender === 'uomo' && a.beardConcern) {
    const beardScore = (p: Product) => (p.beardConcerns?.includes(a.beardConcern!) ? 3 : 0);
    const prodottoBarba = bestOf(safe.filter((p) => p.category === 'barba'), beardScore);
    if (prodottoBarba) beard.push(prodottoBarba);
  }

  // Integratore: uno solo, il più coerente con obiettivo pelle o capelli
  const integratoriScore = (p: Product) =>
    (p.concerns?.includes(a.goal) ? 3 : 0) +
    (p.hairConcerns?.includes(a.hairConcern) ? 3 : 0) +
    (a.pricePref !== 'nessuna' && p.tier === a.pricePref ? 1 : 0);
  const integratore = bestOf(safe.filter((p) => p.category === 'integratori'), integratoriScore);
  const integratori = integratore ? [integratore] : [];

  return {
    skinBiotype: getSkinBiotype(a),
    skinTraits: getSkinTraits(a),
    scalpBiotype: getScalpBiotype(a),
    routine,
    hair,
    beard,
    integratori,
    disclaimerCondizioni: a.conditions.some((c) => c !== 'nessuna'),
  };
}
