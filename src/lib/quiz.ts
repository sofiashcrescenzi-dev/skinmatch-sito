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

export type QuizAnswers = {
  gender: Extract<Gender, 'donna' | 'uomo'>;
  pregnant: boolean;
  skinType: SkinType;
  sensitiveSkin: boolean;
  goal: Concern;
  conditions: string[];
  sunExposure: SunExposure;
  lifestyle: string[];
  environment: string;
  hairConcern: HairConcern;
  beardConcern: BeardConcern | null;
  pricePref: Tier | 'nessuna';
};

export type QuizResult = {
  routine: Product[];
  hair: Product[];
  beard: Product[];
  integratori: Product[];
  disclaimerCondizioni: boolean;
};

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
    routine,
    hair,
    beard,
    integratori,
    disclaimerCondizioni: a.conditions.some((c) => c !== 'nessuna'),
  };
}
