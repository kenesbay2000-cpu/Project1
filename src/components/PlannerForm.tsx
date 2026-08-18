import { type FormEvent, useState } from 'react';
import {
  analyzeTripRequest, generateTripPlan, summarizeTripRequest,
  type ClarificationQuestion, type GeneratedTrip, type PlannerRequest, type TripSummary,
} from '../lib/aiPlanner';
import { PlannerConfirmation } from './PlannerConfirmation';
import { PlannerConversation } from './PlannerConversation';
import { PlannerInitialForm } from './PlannerInitialForm';

type Props = {
  onPlanCreated: (trip: GeneratedTrip) => void;
  onBeforeGenerate: () => boolean;
};
type Stage = 'idle' | 'analyzing' | 'summarizing' | 'generating';
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function applySummary(request: PlannerRequest, summary: TripSummary): PlannerRequest {
  const dates = isoDate.test(summary.dates.start) && isoDate.test(summary.dates.end) && summary.dates.start <= summary.dates.end
    ? summary.dates : request.dates;
  const travelers = summary.travelers.count >= 1 && summary.travelers.count <= 20 ? summary.travelers.count : request.travelers;
  const countChanged = travelers !== request.travelers;
  const travelerAges = summary.travelers.ages.length && summary.travelers.ages.length <= (travelers ?? 20)
    ? summary.travelers.ages : countChanged ? undefined : request.travelerAges;
  const validBudget = summary.budget.max >= summary.budget.min && summary.budget.max > 0 && /^[A-Z]{3}$/.test(summary.budget.currency);
  return {
    ...request,
    originCity: summary.originCity || request.originCity,
    dates,
    travelers,
    travelerAges,
    priceRange: validBudget ? summary.budget : request.priceRange,
  };
}

export function PlannerForm({ onPlanCreated, onBeforeGenerate }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [draft, setDraft] = useState<PlannerRequest | null>(null);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [answer, setAnswer] = useState('');
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [correction, setCorrection] = useState('');
  const [error, setError] = useState('');

  const showSummary = async (request: PlannerRequest, current?: TripSummary, change?: string) => {
    setError('');
    setStage('summarizing');
    try {
      const corrections = change ? [...(request.summaryCorrections ?? []), change].slice(-5) : request.summaryCorrections;
      const updated = { ...request, summaryCorrections: corrections };
      const nextSummary = await summarizeTripRequest(updated, current, change);
      setDraft(applySummary(updated, nextSummary));
      setSummary(nextSummary);
      setCorrection('');
      setStage('idle');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось подготовить сводку. Попробуйте ещё раз.');
      setStage('idle');
    }
  };

  const continuePlanning = async (request: PlannerRequest) => {
    setError('');
    setStage('analyzing');
    try {
      const analysis = await analyzeTripRequest(request);
      const enriched = analysis.originCity && !request.originCity ? { ...request, originCity: analysis.originCity } : request;
      setDraft(enriched);
      if (analysis.status === 'questions' && analysis.questions.length > 0) {
        setQuestions(analysis.questions);
        setStage('idle');
      } else {
        setQuestions([]);
        await showSummary(enriched);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось продолжить планирование. Попробуйте ещё раз.');
      setStage('idle');
    }
  };

  const start = (request: PlannerRequest) => { setDraft(request); void continuePlanning(request); };
  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || !answer.trim() || questions.length === 0) return;
    const updated = { ...draft, clarifications: [...(draft.clarifications ?? []), { questions, answer: answer.trim() }] };
    setDraft(updated); setQuestions([]); setAnswer(''); void continuePlanning(updated);
  };
  const submitCorrection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft && summary && correction.trim()) void showSummary(draft, summary, correction.trim());
  };
  const confirm = async () => {
    if (!draft || !summary) return;
    if (!onBeforeGenerate()) return;
    const confirmed = { ...applySummary(draft, summary), confirmedSummary: summary };
    setError(''); setStage('generating');
    try {
      const plan = await generateTripPlan(confirmed);
      onPlanCreated({ id: crypto.randomUUID(), request: confirmed, plan });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось создать маршрут. Попробуйте ещё раз.');
      setStage('idle');
    }
  };
  const reset = () => { setDraft(null); setQuestions([]); setAnswer(''); setSummary(null); setCorrection(''); setError(''); setStage('idle'); };

  if (!draft) return <PlannerInitialForm onContinue={start} />;
  if (summary) return <PlannerConfirmation summary={summary} correction={correction} isBusy={stage !== 'idle'} error={error} onCorrectionChange={setCorrection} onCorrection={submitCorrection} onConfirm={() => void confirm()} onReset={reset} />;
  return <PlannerConversation request={draft} questions={questions} answer={answer} stage={stage} error={error} onAnswerChange={setAnswer} onAnswer={submitAnswer} onReset={reset} onRetry={() => void continuePlanning(draft)} />;
}
