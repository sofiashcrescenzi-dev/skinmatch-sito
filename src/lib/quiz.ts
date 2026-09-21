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
  conditions: string[];
  sunExposure: SunExposure;
  lifestyle: string[];
  environment: string;
  hairConcern: HairConcern;
  dandruffSubtype: DandruffSubtype | null; // solo se hairConcern è forfora
  beardConcern: BeardConcern | null;
  pricePref: Tier | 'nessuna';
};

export type Biotype = { id: string; title: string; description: string };

export type QuizResult = {
  skinBiotype: Biotype;
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
    title: 'Pelle atopica',
    description:
      'La tua pelle ha una barriera cutanea costituzionalmente più fragile, che fatica a trattenere acqua e a proteggersi dagli irritanti esterni. Tende a secchezza persistente, prurito e arrossamenti (dermatite atopica). Ha bisogno di prodotti molto delicati, senza profumo, pensati per rinforzare il film idrolipidico.',
  },
  'disidratata-sensibile': {
    id: 'disidratata-sensibile',
    title: 'Pelle disidratata e sensibile, con barriera danneggiata',
    description:
      "Manca di acqua — non necessariamente di sebo — e la barriera che dovrebbe proteggerla è indebolita: capita con detergenti aggressivi, stress, freddo o esfolianti troppo frequenti. Si arrossa facilmente, tira, a volte brucia con prodotti nuovi. La priorità è riparare la barriera prima di tutto il resto.",
  },
  acneica: {
    id: 'acneica',
    title: 'Pelle acneica',
    description:
      "Produzione di sebo elevata associata a un'alterata cheratinizzazione dei follicoli: i pori si ostruiscono più facilmente, favorendo comedoni, punti neri e brufoli. Va trattata con delicatezza — detergenti troppo sgrassanti peggiorano la produzione di sebo per compenso.",
  },
  'seborroica-secca': {
    id: 'seborroica-secca',
    title: 'Pelle seborroica-secca',
    description:
      'Una combinazione che confonde: le ghiandole sebacee sono iperattive in alcune zone (fronte, naso, mento) ma la superficie appare secca o desquamata, spesso per un’alterazione della barriera o una lieve dermatite seborroica del viso. Serve equilibrio: detergere senza seccare, idratare senza appesantire.',
  },
  'seborroica-idratata': {
    id: 'seborroica-idratata',
    title: 'Pelle seborroica idratata',
    description:
      'Sebo abbondante ma barriera cutanea integra e buona idratazione: la pelle è lucida, soprattutto nella zona T, con pori più visibili, ma raramente tira o si irrita. È il tipo di pelle grassa più semplice da gestire.',
  },
  'idratata-mista': {
    id: 'idratata-mista',
    title: 'Pelle idratata mista',
    description:
      'Zona T (fronte, naso, mento) più grassa, guance normali o quasi secche, ma senza reale disidratazione né irritazione. È il tipo di pelle più comune: la routine deve bilanciare le due zone senza esagerare in nessuna direzione.',
  },
  secca: {
    id: 'secca',
    title: 'Pelle secca',
    description:
      'Produzione di sebo ridotta: la pelle tende a tirare, può apparire opaca o con una texture ruvida, soprattutto in inverno o con aria secca. Ha bisogno di lipidi e umettanti per restare confortevole tutto il giorno.',
  },
  normale: {
    id: 'normale',
    title: 'Pelle normale-equilibrata',
    description:
      'Produzione di sebo e livello di idratazione ben bilanciati, poche imperfezioni. La routine serve soprattutto a mantenere questo equilibrio nel tempo, non a correggere un problema specifico.',
  },
};

const SCALP_BIOTYPES: Record<string, Biotype> = {
  diradamento: {
    id: 'diradamento',
    title: 'Cute con tendenza al diradamento',
    description:
      'Il cuoio capelluto può essere nella norma, ma la densità dei capelli si sta riducendo: può dipendere da fattori ormonali, stress, carenze nutrizionali o predisposizione genetica. Prodotti energizzanti aiutano, ma se il fenomeno persiste vale la pena farlo valutare da uno specialista.',
  },
  seborroico: {
    id: 'seborroico',
    title: 'Cuoio capelluto seborroico',
    description:
      'Le ghiandole sebacee del cuoio capelluto sono iperattive: i capelli si ungono in fretta e può comparire una forfora giallastra e untuosa (dermatite seborroica del cuoio capelluto). Serve un lavaggio più frequente, con prodotti che regolano il sebo senza irritare.',
  },
  'secco-desquamante': {
    id: 'secco-desquamante',
    title: 'Cuoio capelluto secco e desquamante',
    description:
      'Il cuoio capelluto produce poco sebo e tende a seccarsi, con prurito e una forfora bianca e sottile che si stacca facilmente. Ha bisogno di lavaggi delicati e nutrienti, mai troppo sgrassanti.',
  },
  'capelli-secchi': {
    id: 'capelli-secchi',
    title: 'Capelli secchi e disidratati',
    description:
      'Il cuoio capelluto è spesso nella norma, ma la fibra capillare in lunghezza è disidratata, opaca o crespa (calore, colorazioni, agenti atmosferici). Serve un trattamento nutriente sulle lunghezze, non necessariamente sulla cute.',
  },
  equilibrato: {
    id: 'equilibrato',
    title: 'Cuoio capelluto equilibrato',
    description: 'Nessuna problematica particolare: l’obiettivo è mantenere questo equilibrio con una routine di manutenzione leggera.',
  },
};

export function getSkinBiotype(a: QuizAnswers): Biotype {
  if (a.conditions.includes('dermatite')) return SKIN_BIOTYPES.atopica;
  if (a.sensitiveSkin && (a.skinType === 'secca' || a.conditions.includes('rosacea'))) {
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
  if (a.sensitiveSkin && p.sensitiveSafe === false) return false;
  if (a.pregnant && p.pregnancySafe === false) return false;
  return true;
}

function skincareScore(p: Product, a: QuizAnswers): number {
  let score = 0;
  if (p.skinTypes?.includes(a.skinType)) score += 3;
  if (a.sensitiveSkin && p.skinTypes?.includes('sensibile')) score += 2;
  if (p.concerns?.includes(a.goal)) score += 3;
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
    scalpBiotype: getScalpBiotype(a),
    routine,
    hair,
    beard,
    integratori,
    disclaimerCondizioni: a.conditions.some((c) => c !== 'nessuna'),
  };
}
