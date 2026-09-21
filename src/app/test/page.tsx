'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getRecommendation, type QuizAnswers } from '@/lib/quiz';
import type { Product } from '@/lib/products';

type AnswersState = {
  gender?: 'donna' | 'uomo';
  pregnant?: 'si' | 'no';
  skinType?: string;
  oilySubtype?: string;
  sensitiveSkinAnswer?: 'si' | 'no';
  goal?: string;
  conditions: string[];
  sunExposure?: string;
  lifestyle: string[];
  environment?: string;
  hairConcern?: string;
  dandruffSubtype?: string;
  beardConcern?: string;
  pricePref?: string;
};

type Option = { value: string; label: string };

type StepConfig = {
  key: keyof AnswersState;
  question: string;
  subtitle?: string;
  type: 'single' | 'multi';
  options: Option[];
  exclusiveValue?: string; // per i multi-select: opzione tipo "Nessuna" che esclude le altre
  visible?: (a: AnswersState) => boolean;
};

const STEPS: StepConfig[] = [
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
    subtitle: 'Alcuni ingredienti (es. retinoidi, acidi ad alta concentrazione) sono da evitare in questi periodi.',
    type: 'single',
    options: [
      { value: 'si', label: 'Sì' },
      { value: 'no', label: 'No' },
    ],
    visible: (a) => a.gender === 'donna',
  },
  {
    key: 'skinType',
    question: 'Come definiresti la tua pelle?',
    type: 'single',
    options: [
      { value: 'secca', label: 'Secca' },
      { value: 'grassa', label: 'Grassa' },
      { value: 'mista', label: 'Mista' },
      { value: 'normale', label: 'Normale' },
    ],
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
    visible: (a) => a.skinType === 'grassa' || a.skinType === 'mista',
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
  },
  {
    key: 'goal',
    question: 'Qual è il tuo obiettivo principale?',
    type: 'single',
    options: [
      { value: 'idratazione', label: 'Idratazione' },
      { value: 'anti-age', label: 'Anti-age' },
      { value: 'acne-sebo', label: 'Controllo sebo e imperfezioni' },
      { value: 'macchie-luminosita', label: 'Uniformità e luminosità' },
      { value: 'barriera-cutanea', label: 'Rinforzare la barriera cutanea' },
    ],
  },
  {
    key: 'conditions',
    question: 'Hai una di queste condizioni diagnosticate?',
    type: 'multi',
    exclusiveValue: 'nessuna',
    options: [
      { value: 'dermatite', label: 'Dermatite atopica' },
      { value: 'rosacea', label: 'Rosacea' },
      { value: 'psoriasi', label: 'Psoriasi' },
      { value: 'nessuna', label: 'Nessuna' },
    ],
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
  },
  {
    key: 'hairConcern',
    question: 'Qual è la tua preoccupazione principale per i capelli?',
    type: 'single',
    options: [
      { value: 'caduta', label: 'Caduta / diradamento' },
      { value: 'forfora', label: 'Forfora' },
      { value: 'secchi-crespi', label: 'Capelli secchi o crespi' },
      { value: 'mantenimento', label: 'Nessuna in particolare' },
    ],
  },
  {
    key: 'dandruffSubtype',
    question: 'Come si presenta la forfora?',
    type: 'single',
    options: [
      { value: 'grassa', label: 'A scaglie giallastre e untuose, cuoio capelluto che si unge in fretta' },
      { value: 'secca', label: 'A scagliette bianche e sottili, con prurito e cute secca' },
    ],
    visible: (a) => a.hairConcern === 'forfora',
  },
  {
    key: 'beardConcern',
    question: 'Hai problemi di pelle sotto la barba?',
    type: 'single',
    options: [
      { value: 'irritazione', label: 'Irritazione o rossore' },
      { value: 'mantenimento', label: 'Nessun problema particolare' },
    ],
    visible: (a) => a.gender === 'uomo',
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

const ROUTINE_LABELS: Record<string, string> = {
  detergenti: 'Detergente',
  sieri: 'Siero',
  creme: 'Crema',
};

function routineLabel(p: Product): string {
  if (p.category === 'creme' && p.concerns?.includes('protezione-solare')) return 'Protezione solare';
  return ROUTINE_LABELS[p.category] ?? p.category;
}

export default function TestPage() {
  const [answers, setAnswers] = useState<AnswersState>({ conditions: [], lifestyle: [] });
  const [stepIndex, setStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  function computeVisibleSteps(a: AnswersState) {
    return STEPS.filter((s) => !s.visible || s.visible(a));
  }

  const visibleSteps = useMemo(() => computeVisibleSteps(answers), [answers]);
  const step = visibleSteps[stepIndex];

  function advanceFrom(newVisibleSteps: StepConfig[]) {
    if (stepIndex + 1 < newVisibleSteps.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setShowResults(true);
    }
  }

  function goNext() {
    advanceFrom(visibleSteps);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function selectSingle(key: keyof AnswersState, value: string) {
    const newAnswers: AnswersState =
      key === 'gender'
        // Se cambia il genere, resettiamo eventuali risposte legate al genere precedente
        ? { ...answers, gender: value as 'donna' | 'uomo', pregnant: undefined, beardConcern: undefined }
        : { ...answers, [key]: value };
    setAnswers(newAnswers);
    setTimeout(() => advanceFrom(computeVisibleSteps(newAnswers)), 120);
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

  function restart() {
    setAnswers({ conditions: [], lifestyle: [] });
    setStepIndex(0);
    setShowResults(false);
  }

  if (showResults) {
    const quizAnswers: QuizAnswers = {
      gender: answers.gender ?? 'donna',
      pregnant: answers.pregnant === 'si',
      skinType: (answers.skinType as QuizAnswers['skinType']) ?? 'normale',
      sensitiveSkin: answers.sensitiveSkinAnswer === 'si',
      oilySubtype: (answers.oilySubtype as QuizAnswers['oilySubtype']) ?? null,
      goal: (answers.goal as QuizAnswers['goal']) ?? 'idratazione',
      conditions: answers.conditions,
      sunExposure: (answers.sunExposure as QuizAnswers['sunExposure']) ?? 'media',
      lifestyle: answers.lifestyle,
      environment: answers.environment ?? 'non-so',
      hairConcern: (answers.hairConcern as QuizAnswers['hairConcern']) ?? 'mantenimento',
      dandruffSubtype: (answers.dandruffSubtype as QuizAnswers['dandruffSubtype']) ?? null,
      beardConcern: (answers.beardConcern as QuizAnswers['beardConcern']) ?? null,
      pricePref: (answers.pricePref as QuizAnswers['pricePref']) ?? 'nessuna',
    };
    const result = getRecommendation(quizAnswers);

    return (
      <main className="max-w-4xl mx-auto px-6 pt-4 pb-24">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>
            Il tuo risultato
          </p>
          <h1 className="text-3xl font-semibold mb-3">La tua skincare su misura</h1>
          <p className="opacity-70 max-w-xl mx-auto">
            In base alle tue risposte, ecco il biotipo che più ti somiglia e una proposta di prodotti di partenza.
            Non è una diagnosi medica: se hai dubbi o condizioni della pelle diagnosticate, parlane con un
            dermatologo.
          </p>
        </div>

        {result.disclaimerCondizioni && (
          <div className="mb-10 text-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
            Hai indicato una condizione della pelle diagnosticata: abbiamo escluso i prodotti più aggressivi, ma ti
            consigliamo comunque di parlarne con un dermatologo prima di introdurre nuovi prodotti in routine.
          </div>
        )}

        <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border rounded-xl p-6" style={{ borderColor: 'var(--border)', background: '#fff' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
              Il tuo biotipo cutaneo
            </p>
            <h2 className="text-lg font-semibold mb-2">{result.skinBiotype.title}</h2>
            <p className="text-sm opacity-70 leading-relaxed">{result.skinBiotype.description}</p>
          </div>
          <div className="border rounded-xl p-6" style={{ borderColor: 'var(--border)', background: '#fff' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
              Il tuo cuoio capelluto
            </p>
            <h2 className="text-lg font-semibold mb-2">{result.scalpBiotype.title}</h2>
            <p className="text-sm opacity-70 leading-relaxed">{result.scalpBiotype.description}</p>
          </div>
        </section>

        {result.routine.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5">La tua routine skincare</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.routine.map((p) => (
                <div key={p.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
                    {routineLabel(p)}
                  </p>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {result.hair.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5">Per i tuoi capelli</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.hair.map((p) => <ProductCard key={p.id} product={p} />)}
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

        {result.integratori.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-5">Integratore consigliato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.integratori.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

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
