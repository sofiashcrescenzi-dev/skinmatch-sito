'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import {
  getRecommendation,
  focusIncludesHair,
  focusIncludesSkin,
  type Biotype,
  type QuizAnswers,
  type QuizFocus,
  type RoutineStep,
} from '@/lib/quiz';

type AnswersState = {
  focus?: QuizFocus;
  gender?: 'donna' | 'uomo';
  pregnant?: 'si' | 'no';
  menopause?: 'si' | 'no';
  skinType?: string;
  oilySubtype?: string;
  sensitiveSkinAnswer?: 'si' | 'no';
  goal?: string;
  pigmentedSkin?: 'si' | 'no';
  conditions: string[];
  sunExposure?: string;
  environment?: string;
  beardConcern?: string;
  hairConcern?: string;
  hairLossPattern?: string;
  dandruffSubtype?: string;
  scalpType?: string;
  scalpSensitiveAnswer?: 'si' | 'no';
  scalpConditions: string[];
  hairTreated: string[];
  washFrequency?: string;
  lifestyle: string[];
  pricePref?: string;
};

const EMPTY_ANSWERS: AnswersState = { conditions: [], scalpConditions: [], hairTreated: [], lifestyle: [] };

type Option = { value: string; label: string; hint?: string };

type StepConfig = {
  key: keyof AnswersState;
  question: string;
  subtitle?: string;
  type: 'single' | 'multi';
  options: Option[];
  exclusiveValue?: string; // per i multi-select: opzione tipo "Nessuna" che esclude le altre
  visible?: (a: AnswersState) => boolean;
};

const FOCUS_OPTIONS: { value: QuizFocus; label: string; description: string; time: string }[] = [
  {
    value: 'viso',
    label: 'Viso',
    description: 'Il tuo biotipo cutaneo e una routine skincare: detergente, siero, crema e protezione solare. Per lui, anche la barba.',
    time: 'circa 2 minuti',
  },
  {
    value: 'capelli',
    label: 'Capelli e cuoio capelluto',
    description: 'Il biotipo del tuo cuoio capelluto, con shampoo e trattamento mirati: caduta, forfora, capelli secchi o crespi.',
    time: 'circa 2 minuti',
  },
  {
    value: 'completa',
    label: 'Routine completa',
    description: 'Viso e capelli insieme, con un integratore quando è davvero pertinente.',
    time: 'circa 4 minuti',
  },
];

// Finché il percorso non è scelto mostriamo tutte le domande (conta del totale provvisoria).
const skinPath = (a: AnswersState) => !a.focus || focusIncludesSkin(a.focus);
const hairPath = (a: AnswersState) => !a.focus || focusIncludesHair(a.focus);

const STEPS: StepConfig[] = [
  {
    key: 'focus',
    question: 'Su cosa vuoi concentrarti?',
    subtitle: 'Puoi sempre aggiungere l’altra parte alla fine del test.',
    type: 'single',
    options: FOCUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.description })),
  },
  {
    key: 'gender',
    question: 'Sei donna o uomo?',
    subtitle: 'Ci serve per proporti prodotti e formulazioni adatte a te.',
    type: 'single',
    options: [
      { value: 'donna', label: 'Donna' },
      { value: 'uomo', label: 'Uomo' },
    ],
  },
  {
    key: 'pregnant',
    question: 'Sei in gravidanza o allattamento?',
    subtitle:
      'Alcuni ingredienti (es. retinoidi, acidi ad alta concentrazione) sono da evitare in questi periodi, e gli integratori vanno valutati con il medico.',
    type: 'single',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
    ],
    visible: (a) => a.gender === 'donna',
  },
  {
    key: 'menopause',
    question: 'Sei in perimenopausa o menopausa?',
    subtitle: 'Il calo di estrogeni cambia pelle e capelli, anche in modo sensibile: utile saperlo per la routine giusta.',
    type: 'single',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
    ],
    visible: (a) => a.gender === 'donna',
  },

  // ——— Percorso viso ———
  {
    key: 'skinType',
    question: 'Come definiresti la pelle del tuo viso?',
    type: 'single',
    options: [
      { value: 'secca', label: 'Secca' },
      { value: 'grassa', label: 'Grassa' },
      { value: 'mista', label: 'Mista' },
      { value: 'normale', label: 'Normale' },
    ],
    visible: skinPath,
  },
  {
    key: 'oilySubtype',
    question: 'Quale descrizione si avvicina di più alla tua pelle?',
    type: 'single',
    options: [
      { value: 'idratata', label: 'Grassa/lucida, ma senza particolari imperfezioni' },
      { value: 'acneica', label: 'Punti neri, brufoli o comedoni frequenti' },
      { value: 'seborroica-secca', label: 'Grassa a chiazze ma con desquamazione o prurito (naso, sopracciglia)' },
    ],
    visible: (a) => skinPath(a) && (a.skinType === 'grassa' || a.skinType === 'mista'),
  },
  {
    key: 'sensitiveSkinAnswer',
    question: 'La tua pelle è anche sensibile o reattiva?',
    subtitle: 'Si arrossa, tira o pizzica facilmente con nuovi prodotti.',
    type: 'single',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
    ],
    visible: skinPath,
  },
  {
    key: 'goal',
    question: 'Qual è il tuo obiettivo principale per il viso?',
    type: 'single',
    options: [
      { value: 'idratazione', label: 'Idratazione' },
      { value: 'anti-age', label: 'Anti-age' },
      { value: 'acne-sebo', label: 'Controllo sebo e imperfezioni' },
      { value: 'macchie-luminosita', label: 'Uniformità e luminosità' },
      { value: 'barriera-cutanea', label: 'Rinforzare la barriera cutanea' },
    ],
    visible: skinPath,
  },
  {
    key: 'pigmentedSkin',
    question: 'Hai macchie scure, segni post-acne o altre discromie?',
    subtitle: 'Può capitare insieme a qualsiasi tipo di pelle — non è legato solo a pelle secca o grassa.',
    type: 'single',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
    ],
    visible: skinPath,
  },
  {
    key: 'conditions',
    question: 'Hai una di queste condizioni della pelle diagnosticate?',
    type: 'multi',
    exclusiveValue: 'nessuna',
    options: [
      { value: 'dermatite', label: 'Dermatite atopica' },
      { value: 'rosacea', label: 'Rosacea' },
      { value: 'psoriasi', label: 'Psoriasi' },
      { value: 'nessuna', label: 'Nessuna' },
    ],
    visible: skinPath,
  },
  {
    key: 'sunExposure',
    question: 'Quanto tempo passi al sole, in media?',
    type: 'single',
    options: [
      { value: 'bassa', label: 'Poco (soprattutto indoor)' },
      { value: 'media', label: 'Nella media' },
      { value: 'alta', label: 'Molto (outdoor, sport, mare)' },
    ],
    visible: skinPath,
  },
  {
    key: 'environment',
    question: 'In che ambiente vivi principalmente?',
    type: 'single',
    options: [
      { value: 'citta', label: 'Città inquinata' },
      { value: 'clima-secco', label: 'Clima secco o freddo' },
      { value: 'clima-umido', label: 'Clima umido o caldo' },
      { value: 'non-so', label: 'Non saprei' },
    ],
    visible: skinPath,
  },
  {
    key: 'lifestyle',
    question: 'Il tuo stile di vita include...',
    subtitle: 'Puoi selezionare più risposte.',
    type: 'multi',
    exclusiveValue: 'nessuno',
    options: [
      { value: 'stress', label: 'Stress elevato' },
      { value: 'poco-sonno', label: 'Poco sonno' },
      { value: 'fumo', label: 'Fumo' },
      { value: 'alimentazione', label: 'Alimentazione irregolare' },
      { value: 'nessuno', label: 'Nessuno in particolare' },
    ],
    visible: skinPath,
  },
  {
    key: 'beardConcern',
    question: 'Hai problemi di pelle sotto la barba?',
    type: 'single',
    options: [
      { value: 'irritazione', label: 'Irritazione o rossore' },
      { value: 'mantenimento', label: 'Nessun problema particolare' },
    ],
    visible: (a) => skinPath(a) && a.gender === 'uomo',
  },

  // ——— Percorso capelli ———
  {
    key: 'hairConcern',
    question: 'Qual è la tua preoccupazione principale per capelli e cuoio capelluto?',
    type: 'single',
    options: [
      { value: 'caduta', label: 'Caduta o diradamento' },
      { value: 'forfora', label: 'Forfora' },
      { value: 'secchi-crespi', label: 'Capelli secchi, crespi o sfibrati' },
      { value: 'mantenimento', label: 'Nessuna in particolare', hint: 'Voglio solo mantenerli sani' },
    ],
    visible: hairPath,
  },
  {
    key: 'hairLossPattern',
    question: 'Come si presenta la caduta?',
    type: 'single',
    options: [
      {
        value: 'acuta',
        label: 'Perdo più capelli del solito da qualche settimana',
        hint: 'In modo diffuso, magari dopo stress, febbre, parto, una dieta o il cambio di stagione',
      },
      {
        value: 'progressiva',
        label: 'I capelli si sono diradati lentamente nel tempo',
        hint: 'Soprattutto su tempie, attaccatura o sommità della testa',
      },
      {
        value: 'chiazze',
        label: 'Ho zone circoscritte senza capelli',
        hint: 'Chiazze tonde o ovali, lisce, comparse all’improvviso',
      },
    ],
    visible: (a) => hairPath(a) && a.hairConcern === 'caduta',
  },
  {
    key: 'dandruffSubtype',
    question: 'Come si presenta la forfora?',
    type: 'single',
    options: [
      { value: 'grassa', label: 'A scaglie giallastre e untuose', hint: 'Il cuoio capelluto si unge in fretta' },
      { value: 'secca', label: 'A scagliette bianche e sottili', hint: 'Con prurito e cute che tira' },
    ],
    visible: (a) => hairPath(a) && a.hairConcern === 'forfora',
  },
  {
    key: 'scalpType',
    question: 'Com’è il tuo cuoio capelluto tra un lavaggio e l’altro?',
    type: 'single',
    options: [
      { value: 'grasso', label: 'Si unge in fretta', hint: 'Radici grasse già dopo 1–2 giorni' },
      { value: 'normale', label: 'Equilibrato', hint: 'I capelli restano puliti per 3–4 giorni' },
      { value: 'secco', label: 'Secco', hint: 'Tira dopo il lavaggio, i capelli restano puliti a lungo' },
    ],
    visible: hairPath,
  },
  {
    key: 'scalpSensitiveAnswer',
    question: 'Il cuoio capelluto prude, brucia o si arrossa facilmente?',
    subtitle: 'Per esempio con shampoo nuovi, tinte o phon caldo.',
    type: 'single',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
    ],
    visible: hairPath,
  },
  {
    key: 'scalpConditions',
    question: 'Hai una di queste condizioni del cuoio capelluto diagnosticate?',
    type: 'multi',
    exclusiveValue: 'nessuna',
    options: [
      { value: 'dermatite-seborroica', label: 'Dermatite seborroica' },
      { value: 'psoriasi', label: 'Psoriasi del cuoio capelluto' },
      { value: 'nessuna', label: 'Nessuna' },
    ],
    visible: hairPath,
  },
  {
    key: 'hairTreated',
    question: 'I tuoi capelli sono...',
    subtitle: 'Puoi selezionare più risposte.',
    type: 'multi',
    exclusiveValue: 'nessuno',
    options: [
      { value: 'colore', label: 'Colorati o decolorati' },
      { value: 'calore', label: 'Trattati spesso con piastra, ferro o phon caldo' },
      { value: 'nessuno', label: 'Naturali, poco trattati' },
    ],
    visible: hairPath,
  },
  {
    key: 'washFrequency',
    question: 'Ogni quanto lavi i capelli?',
    type: 'single',
    options: [
      { value: 'quotidiano', label: 'Ogni giorno o quasi' },
      { value: 'settimanale', label: '2–3 volte a settimana' },
      { value: 'raro', label: 'Una volta a settimana o meno' },
    ],
    visible: hairPath,
  },

  {
    key: 'pricePref',
    question: 'Hai una fascia di prezzo preferita?',
    type: 'single',
    options: [
      { value: 'base', label: 'Base' },
      { value: 'top', label: 'Top' },
      { value: 'premium', label: 'Premium' },
      { value: 'nessuna', label: 'Nessuna preferenza' },
    ],
  },
];

const RESULT_TITLES: Record<QuizFocus, string> = {
  viso: 'La tua skincare su misura',
  capelli: 'La tua routine per capelli e cuoio capelluto',
  completa: 'La tua routine completa',
};

function computeVisibleSteps(a: AnswersState) {
  return STEPS.filter((s) => !s.visible || s.visible(a));
}

function isAnswered(step: StepConfig, a: AnswersState) {
  const v = a[step.key];
  return Array.isArray(v) ? v.length > 0 : v !== undefined;
}

function StepBlock({ step }: { step: RoutineStep }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
        {step.label}
      </p>
      <ProductCard product={step.main} />
      {step.alternatives.length > 0 && (
        <div className="mt-3">
          <p className="text-xs opacity-60 mb-2">Alternative in altre fasce di prezzo</p>
          <div className="flex flex-col gap-2">
            {step.alternatives.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BiotypeCard({ label, biotype, traits }: { label: string; biotype: Biotype; traits: Biotype[] }) {
  return (
    <div className="border rounded-xl p-6" style={{ borderColor: 'var(--border)', background: '#fff' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
        {label}
      </p>
      <h2 className="text-lg font-semibold mb-2">{biotype.title}</h2>
      <p className="text-sm opacity-70 leading-relaxed mb-4">{biotype.description}</p>
      {traits.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {traits.map((t) => (
            <Link
              key={t.id}
              href={`/biotipi/${t.id}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              + {t.title}
            </Link>
          ))}
        </div>
      )}
      <Link href={`/biotipi/${biotype.id}`} className="text-sm font-medium underline" style={{ color: 'var(--accent)' }}>
        Scopri di più su questo biotipo →
      </Link>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 text-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg leading-relaxed">
      {children}
    </div>
  );
}

export default function TestPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswersState>(EMPTY_ANSWERS);
  const [stepIndex, setStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  // Quando dai risultati si aggiunge viso o capelli, salta le domande a cui si è già risposto.
  const [skipAnswered, setSkipAnswered] = useState(false);

  const visibleSteps = useMemo(() => computeVisibleSteps(answers), [answers]);
  const step = visibleSteps[stepIndex];

  // Dalla homepage si arriva con ?percorso=viso|capelli|completa: si parte dalla seconda domanda.
  useEffect(() => {
    const percorso = new URLSearchParams(window.location.search).get('percorso');
    if (FOCUS_OPTIONS.some((o) => o.value === percorso)) startWith(percorso as QuizFocus);
  }, []);

  function startWith(focus: QuizFocus) {
    setAnswers({ ...EMPTY_ANSWERS, focus });
    setStepIndex(1);
    setShowResults(false);
    setHasStarted(true);
  }

  function advanceFrom(steps: StepConfig[], a: AnswersState) {
    let next = stepIndex + 1;
    if (skipAnswered) while (next < steps.length && isAnswered(steps[next], a)) next++;
    if (next < steps.length) {
      setStepIndex(next);
    } else {
      setSkipAnswered(false);
      setShowResults(true);
      window.scrollTo({ top: 0 });
    }
  }

  function goNext() {
    advanceFrom(visibleSteps, answers);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function selectSingle(key: keyof AnswersState, value: string) {
    const newAnswers: AnswersState =
      key === 'gender'
        // Se cambia il genere, resettiamo eventuali risposte legate al genere precedente
        ? { ...answers, gender: value as 'donna' | 'uomo', pregnant: undefined, menopause: undefined, beardConcern: undefined }
        : { ...answers, [key]: value };
    setAnswers(newAnswers);
    setTimeout(() => advanceFrom(computeVisibleSteps(newAnswers), newAnswers), 120);
  }

  function toggleMulti(key: keyof AnswersState, value: string, exclusiveValue?: string) {
    setAnswers((prev) => {
      const current = (prev[key] as string[] | undefined) ?? [];
      let next: string[];
      if (value === exclusiveValue) {
        next = current.includes(value) ? [] : [value];
      } else if (current.includes(value)) {
        next = current.filter((v) => v !== value);
      } else {
        next = [...current.filter((v) => v !== exclusiveValue), value];
      }
      return { ...prev, [key]: next };
    });
  }

  // Dai risultati di un percorso singolo: passa alla routine completa chiedendo solo le domande mancanti.
  function addOtherPath() {
    const newAnswers: AnswersState = { ...answers, focus: 'completa' };
    const steps = computeVisibleSteps(newAnswers);
    const first = steps.findIndex((s) => !isAnswered(s, newAnswers));
    setAnswers(newAnswers);
    if (first === -1) return;
    setSkipAnswered(true);
    setStepIndex(first);
    setShowResults(false);
    window.scrollTo({ top: 0 });
  }

  function restart() {
    setAnswers(EMPTY_ANSWERS);
    setStepIndex(0);
    setShowResults(false);
    setSkipAnswered(false);
    setHasStarted(false);
    window.scrollTo({ top: 0 });
  }

  if (!hasStarted) {
    return (
      <main className="max-w-3xl mx-auto px-6 pt-4 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
            Trova il tuo SkinMatch
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold mb-5 leading-tight">
            Cosa significa "trovare il tuo SkinMatch"?
          </h1>
          <p className="opacity-70 max-w-xl mx-auto leading-relaxed">
            Non tutte le pelli — e non tutti i cuoi capelluti — sono uguali: due persone con la "pelle grassa"
            possono avere bisogno di prodotti completamente diversi. Questo test ti aiuta a capire prima di tutto
            <strong> di che biotipo è la tua pelle</strong> (es. seborroica idratata, disidratata e sensibile,
            acneica, atopica...) <strong>o il tuo cuoio capelluto</strong> (es. seborroico, secco e desquamante,
            con tendenza al diradamento), spiegandoti cosa significa. Solo dopo ti proponiamo una routine e dei
            prodotti reali coerenti con quel biotipo — non il prodotto più venduto del momento, ma quello giusto
            per te.
          </p>
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50 mb-5 text-center">
          Da dove vuoi partire?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {FOCUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => startWith(o.value)}
              className="text-left border rounded-xl p-6 bg-white flex flex-col gap-2 transition-colors hover:bg-neutral-50"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-lg font-semibold">{o.label}</span>
              <span className="text-sm opacity-70 leading-relaxed flex-1">{o.description}</span>
              <span className="text-xs opacity-50">{o.time}</span>
              <span className="text-sm font-medium mt-2" style={{ color: 'var(--accent)' }}>
                Inizia →
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs opacity-50 text-center">
          Non è una diagnosi medica: in presenza di condizioni della pelle o del cuoio capelluto diagnosticate, parlane
          con un dermatologo.
        </p>
      </main>
    );
  }

  if (showResults) {
    const focus = answers.focus ?? 'completa';
    const quizAnswers: QuizAnswers = {
      focus,
      gender: answers.gender ?? 'donna',
      pregnant: answers.pregnant === 'si',
      menopause: answers.menopause === 'si',
      skinType: (answers.skinType as QuizAnswers['skinType']) ?? 'normale',
      sensitiveSkin: answers.sensitiveSkinAnswer === 'si',
      oilySubtype: (answers.oilySubtype as QuizAnswers['oilySubtype']) ?? null,
      goal: (answers.goal as QuizAnswers['goal']) ?? 'idratazione',
      pigmentedSkin: answers.pigmentedSkin === 'si',
      conditions: answers.conditions,
      sunExposure: (answers.sunExposure as QuizAnswers['sunExposure']) ?? 'media',
      lifestyle: answers.lifestyle,
      environment: answers.environment ?? 'non-so',
      hairConcern: (answers.hairConcern as QuizAnswers['hairConcern']) ?? 'mantenimento',
      dandruffSubtype: (answers.dandruffSubtype as QuizAnswers['dandruffSubtype']) ?? null,
      hairLossPattern: (answers.hairLossPattern as QuizAnswers['hairLossPattern']) ?? null,
      scalpType: (answers.scalpType as QuizAnswers['scalpType']) ?? 'normale',
      scalpSensitive: answers.scalpSensitiveAnswer === 'si',
      scalpConditions: answers.scalpConditions,
      hairTreated: answers.hairTreated,
      washFrequency: (answers.washFrequency as QuizAnswers['washFrequency']) ?? 'settimanale',
      beardConcern: (answers.beardConcern as QuizAnswers['beardConcern']) ?? null,
      pricePref: (answers.pricePref as QuizAnswers['pricePref']) ?? 'nessuna',
    };
    const result = getRecommendation(quizAnswers);
    const biotypeCards = [
      result.skinBiotype && { label: 'Il tuo biotipo cutaneo', biotype: result.skinBiotype, traits: result.skinTraits },
      result.scalpBiotype && { label: 'Il tuo cuoio capelluto', biotype: result.scalpBiotype, traits: result.scalpTraits },
    ].filter((c): c is { label: string; biotype: Biotype; traits: Biotype[] } => !!c);

    return (
      <main className="max-w-4xl mx-auto px-6 pt-4 pb-24">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            Il tuo risultato
          </p>
          <h1 className="text-3xl font-semibold mb-3">{RESULT_TITLES[focus]}</h1>
          <p className="opacity-70 max-w-xl mx-auto">
            In base alle tue risposte, ecco {biotypeCards.length > 1 ? 'i biotipi che più ti somigliano' : 'il biotipo che più ti somiglia'} e
            una proposta di prodotti di partenza. Non è una diagnosi medica: se hai dubbi o condizioni diagnosticate,
            parlane con un dermatologo.
          </p>
        </div>

        {result.hairLossWarning === 'chiazze' && (
          <Notice>
            <strong>Le chiazze senza capelli vanno fatte valutare da un dermatologo.</strong> Zone circoscritte e lisce
            senza capelli possono dipendere da condizioni (come l’alopecia areata) che richiedono una diagnosi e
            terapie mediche: i prodotti cosmetici qui sotto possono accompagnare la cura del cuoio capelluto, ma non
            sono un trattamento.
          </Notice>
        )}
        {result.hairLossWarning === 'progressiva' && (
          <Notice>
            Un diradamento che avanza lentamente, soprattutto su tempie, attaccatura o sommità della testa, ha spesso
            una componente ormonale o genetica: prima si interviene, meglio si conserva. I prodotti qui sotto possono
            sostenere i capelli, ma una visita dermatologica permette di capire la causa e valutare le terapie più
            efficaci.
          </Notice>
        )}
        {result.disclaimerCondizioni && (
          <Notice>
            Hai indicato una condizione diagnosticata: abbiamo escluso i prodotti più aggressivi, ma ti consigliamo
            comunque di parlarne con un dermatologo prima di introdurre nuovi prodotti in routine.
          </Notice>
        )}

        <section className={`mt-10 mb-12 grid grid-cols-1 gap-6 ${biotypeCards.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {biotypeCards.map((c) => (
            <BiotypeCard key={c.biotype.id} {...c} />
          ))}
        </section>

        {result.routine.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5">La tua routine skincare</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.routine.map((s) => (
                <StepBlock key={s.key} step={s} />
              ))}
            </div>
          </section>
        )}

        {result.beard.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5">Per la barba</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.beard.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {result.hair.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5">Per i tuoi capelli</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.hair.map((s) => (
                <StepBlock key={s.key} step={s} />
              ))}
            </div>
          </section>
        )}

        {result.integratori.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5">Integratore consigliato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.integratori.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
        {result.integratoriEsclusiGravidanza && (
          <p className="text-sm opacity-70 mb-12">
            In gravidanza e allattamento non proponiamo integratori: se pensi di averne bisogno, parlane con il tuo
            medico o ginecologo.
          </p>
        )}

        {focus !== 'completa' && (
          <section
            className="mb-12 border rounded-xl p-6 text-center"
            style={{ borderColor: 'var(--border)', background: 'rgba(182,130,90,0.06)' }}
          >
            <h2 className="text-lg font-semibold mb-2">
              {focus === 'viso' ? 'Vuoi pensare anche ai capelli?' : 'Vuoi una routine anche per il viso?'}
            </h2>
            <p className="text-sm opacity-70 mb-5 max-w-md mx-auto">
              {focus === 'viso'
                ? 'Qualche domanda in più su capelli e cuoio capelluto e aggiungiamo shampoo e trattamento alla tua routine.'
                : 'Qualche domanda in più sulla pelle del viso e aggiungiamo detergente, siero, crema e protezione solare.'}
            </p>
            <button
              onClick={addOtherPath}
              className="px-6 py-3 rounded-full text-white font-medium"
              style={{ background: 'var(--accent)' }}
            >
              {focus === 'viso' ? 'Aggiungi i capelli →' : 'Aggiungi il viso →'}
            </button>
          </section>
        )}

        <p className="text-xs opacity-60 text-center max-w-xl mx-auto mb-6">
          Alcuni link sono di affiliazione: se acquisti tramite questi link, SkinMatch può ricevere una
          commissione, senza alcun costo aggiuntivo per te. Non influisce sui prodotti consigliati.
        </p>

        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <button
            onClick={restart}
            className="px-6 py-3 rounded-full border font-medium"
            style={{ borderColor: 'var(--border)' }}
          >
            Rifai il test
          </button>
          <Link
            href="/catalogo"
            className="px-6 py-3 rounded-full text-white font-medium"
            style={{ background: 'var(--accent)' }}
          >
            Vedi tutto il catalogo →
          </Link>
        </div>
      </main>
    );
  }

  const currentValue = step ? answers[step.key] : undefined;
  const canContinueMulti = step?.type === 'multi' && Array.isArray(currentValue) && currentValue.length > 0;

  return (
    <main className="max-w-xl mx-auto px-6 pt-4 pb-24">
      {/* Barra di avanzamento */}
      <div className="mb-10">
        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / visibleSteps.length) * 100}%`, background: 'var(--accent)' }}
          />
        </div>
        <p className="text-xs opacity-50 mt-2">
          Domanda {stepIndex + 1} di {visibleSteps.length}
        </p>
      </div>

      {step && (
        <div>
          <h1 className="text-2xl font-semibold mb-2">{step.question}</h1>
          {step.subtitle && <p className="opacity-60 text-sm mb-6">{step.subtitle}</p>}
          {!step.subtitle && <div className="mb-6" />}

          <div className="flex flex-col gap-3">
            {step.options.map((opt) => {
              const isSelected =
                step.type === 'single'
                  ? currentValue === opt.value
                  : Array.isArray(currentValue) && currentValue.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() =>
                    step.type === 'single'
                      ? selectSingle(step.key, opt.value)
                      : toggleMulti(step.key, opt.value, step.exclusiveValue)
                  }
                  className="text-left px-5 py-4 rounded-xl border font-medium transition-colors"
                  style={{
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    background: isSelected ? 'rgba(182,130,90,0.08)' : '#fff',
                    color: isSelected ? 'var(--accent)' : 'var(--text)',
                  }}
                >
                  {opt.label}
                  {opt.hint && <span className="block text-sm font-normal opacity-60 mt-1">{opt.hint}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="text-sm font-medium opacity-60 disabled:opacity-0"
            >
              ← Indietro
            </button>
            {step.type === 'multi' && (
              <button
                onClick={goNext}
                disabled={!canContinueMulti}
                className="px-6 py-2.5 rounded-full text-white font-medium disabled:opacity-30"
                style={{ background: 'var(--accent)' }}
              >
                Continua
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
