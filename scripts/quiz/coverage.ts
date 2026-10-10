// Simula le combinazioni di risposte dei tre percorsi (viso, capelli, completa) e conta quante
// volte ciascun prodotto viene consigliato (come principale o come alternativa).
// Uso: npx tsx scripts/quiz/coverage.ts
import { PRODUCTS } from '../../src/lib/products';
import { getRecommendation, type QuizAnswers } from '../../src/lib/quiz';

const main = new Map<string, number>();
const alt = new Map<string, number>();
const bump = (m: Map<string, number>, id: string) => m.set(id, (m.get(id) ?? 0) + 1);
let runs = 0;
const ENVS = ['non-so', 'citta', 'clima-secco', 'clima-umido'];
const LIFESTYLES = [['nessuno'], ['fumo'], ['stress'], ['poco-sonno'], ['stress', 'poco-sonno']];

const genders = ['donna', 'uomo'] as const;
const skinTypes = ['secca', 'grassa', 'mista', 'normale'] as const;
const goals = ['idratazione', 'anti-age', 'acne-sebo', 'macchie-luminosita', 'barriera-cutanea'] as const;
const conditionSets = [['nessuna'], ['dermatite'], ['rosacea'], ['psoriasi']];
const tiers = ['nessuna', 'base', 'top', 'premium'] as const;
// [preoccupazione, sottotipo forfora, tipo di caduta]
const hairs = [
  ['caduta', null, 'acuta'], ['caduta', null, 'progressiva'], ['caduta', null, 'chiazze'],
  ['forfora', 'grassa', null], ['forfora', 'secca', null], ['secchi-crespi', null, null], ['mantenimento', null, null],
] as const;
const scalpTypes = ['grasso', 'normale', 'secco'] as const;
const scalpConditionSets = [['nessuna'], ['dermatite-seborroica'], ['psoriasi']];
const treatedSets = [['nessuno'], ['colore', 'calore']];
const washes = ['quotidiano', 'settimanale', 'raro'] as const;

// Risposte "capelli" neutre per il percorso solo viso, e viceversa.
const HAIR_DEFAULTS: Pick<QuizAnswers, 'hairConcern' | 'dandruffSubtype' | 'hairLossPattern' | 'scalpType' | 'scalpSensitive' | 'scalpConditions' | 'hairTreated' | 'washFrequency'> = {
  hairConcern: 'mantenimento', dandruffSubtype: null, hairLossPattern: null, scalpType: 'normale', scalpSensitive: false,
  scalpConditions: ['nessuna'], hairTreated: ['nessuno'], washFrequency: 'settimanale',
};
const SKIN_DEFAULTS: Pick<QuizAnswers, 'skinType' | 'sensitiveSkin' | 'oilySubtype' | 'goal' | 'pigmentedSkin' | 'conditions' | 'sunExposure' | 'lifestyle' | 'environment' | 'beardConcern'> = {
  skinType: 'normale', sensitiveSkin: false, oilySubtype: null, goal: 'idratazione', pigmentedSkin: false, conditions: ['nessuna'],
  sunExposure: 'media', lifestyle: ['nessuno'], environment: 'non-so', beardConcern: null,
};

function record(a: QuizAnswers) {
  const r = getRecommendation(a);
  for (const s of [...r.routine, ...r.hair]) { bump(main, s.main.id); s.alternatives.forEach((p) => bump(alt, p.id)); }
  [...r.beard, ...r.integratori].forEach((p) => bump(main, p.id));
  runs++;
}

const people = genders.flatMap((gender) =>
  (gender === 'donna' ? [false, true] : [false]).flatMap((pregnant) =>
    (gender === 'donna' ? [false, true] : [false]).map((menopause) => ({ gender, pregnant, menopause }))
  )
);

// Percorsi viso e completo: tutte le combinazioni della pelle (nel completo i capelli ruotano)
for (const focus of ['viso', 'completa'] as const)
  for (const person of people)
    for (const skinType of skinTypes)
      for (const oilySubtype of skinType === 'grassa' || skinType === 'mista' ? (['idratata', 'acneica', 'seborroica-secca'] as const) : [null])
        for (const sensitiveSkin of [false, true])
          for (const goal of goals)
            for (const pigmentedSkin of [false, true])
              for (const conditions of conditionSets)
                for (const sunExposure of ['bassa', 'alta'] as const)
                  for (const pricePref of tiers) {
                    const [hairConcern, dandruffSubtype, hairLossPattern] = hairs[runs % hairs.length];
                    record({
                      ...HAIR_DEFAULTS, ...person, focus, skinType, sensitiveSkin, oilySubtype, goal, pigmentedSkin,
                      conditions, sunExposure, lifestyle: LIFESTYLES[runs % LIFESTYLES.length], environment: ENVS[runs % ENVS.length],
                      beardConcern: person.gender === 'uomo' ? (runs % 2 ? 'irritazione' : 'mantenimento') : null, pricePref,
                      ...(focus === 'completa'
                        ? { hairConcern, dandruffSubtype, hairLossPattern, scalpType: scalpTypes[runs % 3], scalpSensitive: runs % 2 === 0 }
                        : {}),
                    });
                  }

// Percorso capelli: tutte le combinazioni del cuoio capelluto
for (const person of people)
  for (const [hairConcern, dandruffSubtype, hairLossPattern] of hairs)
    for (const scalpType of scalpTypes)
      for (const scalpSensitive of [false, true])
        for (const scalpConditions of scalpConditionSets)
          for (const hairTreated of treatedSets)
            for (const washFrequency of washes)
              for (const pricePref of tiers)
                record({
                  ...SKIN_DEFAULTS, ...person, focus: 'capelli', hairConcern, dandruffSubtype, hairLossPattern, scalpType,
                  scalpSensitive, scalpConditions, hairTreated, washFrequency, pricePref,
                });

const rows = PRODUCTS.map((p) => ({ p, m: main.get(p.id) ?? 0, a: alt.get(p.id) ?? 0 }));
const never = rows.filter((r) => r.m + r.a === 0);
const altOnly = rows.filter((r) => r.m === 0 && r.a > 0);
console.log(`${runs} percorsi simulati, ${PRODUCTS.length} prodotti in catalogo`);
console.log(`- consigliati come principale almeno una volta: ${rows.filter((r) => r.m > 0).length}`);
console.log(`- solo come alternativa: ${altOnly.length}`);
console.log(`- mai consigliati: ${never.length}`);
const fmt = (r: (typeof rows)[number]) =>
  `  ${r.p.id.padEnd(46)} ${r.p.category.padEnd(11)} ${r.p.tier.padEnd(8)} ${r.p.brand} — ${r.p.name}${r.p.affiliateUrl === '#' ? '  [senza link]' : ''}`;
if (never.length) { console.log('\nMAI CONSIGLIATI:'); never.forEach((r) => console.log(fmt(r))); }
if (process.argv.includes('--alt')) { console.log('\nSOLO ALTERNATIVA:'); altOnly.forEach((r) => console.log(fmt(r))); }
console.log('\nPIÙ CONSIGLIATI (principale):');
rows.sort((x, y) => y.m - x.m).slice(0, 12).forEach((r) => console.log(`  ${String(r.m).padStart(6)}  ${r.p.brand} — ${r.p.name}`));
